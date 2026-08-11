import { network } from "hardhat";
import { ethers as ethersLib } from "ethers";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const Papel = { VaraEmissora: 1, PoliciaFederal: 2, CiaAerea: 3, ConselhoTutelar: 4 } as const;
const TipoDocumento = { AlvaraViagem: 0, TermoGuarda: 1 } as const;

const campo = (nome: string) => ethersLib.id(nome);

/**
 * Limite de gas fixo para as transações de configuração abaixo, em vez de
 * depender de estimateGas. Em pelo menos uma rede besu recém-sincronizada, a
 * estimativa automática voltou baixa demais (só o custo intrínseco da tx,
 * sem gas pra rodar o SSTORE) e a transação ficou sem gas no meio da
 * execução. Como BESU_MIN_GAS_PRICE=0 nas redes de teste deste projeto, gas
 * não custa nada — só o que for de fato usado é cobrado, o resto do limite
 * simplesmente não é gasto.
 */
const GAS_CONFIGURACAO = 300_000n;

/** Lê o ABI já compilado por `hardhat compile`. Não recompila nada aqui. */
async function abiDoContrato(nomeDoArquivo: string, nomeDoContrato: string) {
  const caminho = path.join(
    __dirname,
    "..",
    "artifacts",
    "contracts",
    `${nomeDoArquivo}.sol`,
    `${nomeDoContrato}.json`,
  );
  const artefato = JSON.parse(await readFile(caminho, "utf8"));
  return artefato.abi;
}

async function main() {
  const { ethers } = await network.getOrCreate();
  const signers = await ethers.getSigners();
  const [tjpb, vara] = signers;

  // A rede besu da disciplina (bc101-dev-env) publica só 3 contas de teste
  // (as 3 configuradas em hardhat.config.ts); a hardhatOp local tem dezenas.
  // Quando há signers suficientes, registramos identidade real e distinta
  // para os três perfis consulentes. Quando não há, ninguém é registrado
  // com papel de leitor — a tela de validação continua funcionando (a
  // seleção de perfil e a leitura de `camposLiberados` são públicas, sem
  // necessidade de carteira), e a única conta extra vira "leitor genérico"
  // só para assinar `registrarConsulta`. Ver docs/arquitetura.md.
  const temContasDedicadas = signers.length >= 5;
  const leitorGenerico = signers[2] ?? vara;
  const policiaFederal = temContasDedicadas ? signers[2] : undefined;
  const ciaAerea = temContasDedicadas ? signers[3] : undefined;
  const conselhoTutelar = temContasDedicadas ? signers[4] : undefined;

  const acessos = await ethers.deployContract("AccessRegistry");
  const politica = await ethers.deployContract("DisclosurePolicy", [await acessos.getAddress()]);
  const registro = await ethers.deployContract("DocumentRegistry", [await acessos.getAddress()]);

  // A vara passa a ser a única conta autorizada a emitir e revogar.
  //
  // Cada transação de configuração abaixo é confirmada com .wait() antes da
  // próxima ser enviada. Em rede de mineração instantânea (hardhatOp) isso é
  // cosmético, mas em rede real com tempo de bloco (besu, Sepolia) é
  // indispensável: sem o .wait(), o script termina e o processo Node sai
  // antes das transações serem mineradas, e elas nunca chegam a acontecer.
  await (
    await acessos.registrarInstituicao(
      vara.address,
      Papel.VaraEmissora,
      ethersLib.id("VARA-INFANCIA-JP"),
      { gasLimit: GAS_CONFIGURACAO },
    )
  ).wait();

  if (temContasDedicadas && policiaFederal && ciaAerea && conselhoTutelar) {
    await (
      await acessos.registrarInstituicao(policiaFederal.address, Papel.PoliciaFederal, ethersLib.id("PF-PB"), {
        gasLimit: GAS_CONFIGURACAO,
      })
    ).wait();
    await (
      await acessos.registrarInstituicao(ciaAerea.address, Papel.CiaAerea, ethersLib.id("CIA-AEREA-DEMO"), {
        gasLimit: GAS_CONFIGURACAO,
      })
    ).wait();
    await (
      await acessos.registrarInstituicao(
        conselhoTutelar.address,
        Papel.ConselhoTutelar,
        ethersLib.id("CT-JP"),
        { gasLimit: GAS_CONFIGURACAO },
      )
    ).wait();
  } else {
    console.log(
      "  (rede sem contas de teste suficientes para papéis dedicados de PF/CiaAerea/ConselhoTutelar —",
      "leitor genérico:",
      leitorGenerico.address,
      ")",
    );
  }

  // Política de divulgação do alvará de viagem, por perfil consulente.
  // Só os NOMES dos campos vão para a cadeia; os valores ficam no cofre do TJPB.
  await (
    await politica.definirPolitica(
      TipoDocumento.AlvaraViagem,
      Papel.PoliciaFederal,
      [
        campo("nomeCrianca"),
        campo("nomeAcompanhante"),
        campo("destino"),
        campo("periodoValidade"),
        campo("orgaoEmissor"),
      ],
      { gasLimit: GAS_CONFIGURACAO },
    )
  ).wait();
  await (
    await politica.definirPolitica(
      TipoDocumento.AlvaraViagem,
      Papel.CiaAerea,
      [campo("nomeCrianca"), campo("nomeAcompanhante"), campo("periodoValidade")],
      { gasLimit: GAS_CONFIGURACAO },
    )
  ).wait();
  await (
    await politica.definirPolitica(
      TipoDocumento.AlvaraViagem,
      Papel.ConselhoTutelar,
      [campo("nomeCrianca"), campo("orgaoEmissor"), campo("periodoValidade")],
      { gasLimit: GAS_CONFIGURACAO },
    )
  ).wait();

  console.log("VerificaJus Sigilo — contratos implantados");
  console.log("  admin (TJPB)      ", tjpb.address);
  console.log("  vara emissora     ", vara.address);
  console.log("  AccessRegistry    ", await acessos.getAddress());
  console.log("  DisclosurePolicy  ", await politica.getAddress());
  console.log("  DocumentRegistry  ", await registro.getAddress());

  // Exporta endereços + ABI para o frontend estático (frontend/admin.html e
  // frontend/validar.html), que não passa por nenhum bundler e lê esse
  // arquivo direto no navegador.
  const config = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    varaEndereco: vara.address,
    perfis: {
      contasDedicadas: temContasDedicadas,
      leitorGenerico: leitorGenerico.address,
      policiaFederal: policiaFederal?.address ?? null,
      ciaAerea: ciaAerea?.address ?? null,
      conselhoTutelar: conselhoTutelar?.address ?? null,
    },
    contratos: {
      DocumentRegistry: {
        endereco: await registro.getAddress(),
        abi: await abiDoContrato("DocumentRegistry", "DocumentRegistry"),
      },
      AccessRegistry: {
        endereco: await acessos.getAddress(),
        abi: await abiDoContrato("AccessRegistry", "AccessRegistry"),
      },
      DisclosurePolicy: {
        endereco: await politica.getAddress(),
        abi: await abiDoContrato("DisclosurePolicy", "DisclosurePolicy"),
      },
    },
  };

  const destino = path.join(__dirname, "..", "frontend", "contracts.config.js");
  await writeFile(
    destino,
    `// Gerado automaticamente por scripts/deploy.ts — não editar à mão.\n` +
      `// Rode novamente o deploy sempre que os contratos forem reimplantados.\n` +
      `window.VERIFICAJUS_CONFIG = ${JSON.stringify(config, null, 2)};\n`,
  );
  console.log(`\n  frontend/contracts.config.js atualizado (${destino})`);
}

main().catch((erro) => {
  console.error(erro);
  process.exitCode = 1;
});