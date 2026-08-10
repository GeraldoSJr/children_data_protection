import { network } from "hardhat";
import { ethers as ethersLib } from "ethers";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const Papel = { VaraEmissora: 1, PoliciaFederal: 2, CiaAerea: 3, ConselhoTutelar: 4 } as const;
const TipoDocumento = { AlvaraViagem: 0, TermoGuarda: 1 } as const;

const campo = (nome: string) => ethersLib.id(nome);

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
  const [tjpb, vara] = await ethers.getSigners();

  const acessos = await ethers.deployContract("AccessRegistry");
  const politica = await ethers.deployContract("DisclosurePolicy", [await acessos.getAddress()]);
  const registro = await ethers.deployContract("DocumentRegistry", [await acessos.getAddress()]);

  // A vara passa a ser a única conta autorizada a emitir e revogar.
  await acessos.registrarInstituicao(
    vara.address,
    Papel.VaraEmissora,
    ethersLib.id("VARA-INFANCIA-JP"),
  );

  // Política de divulgação do alvará de viagem, por perfil consulente.
  // Só os NOMES dos campos vão para a cadeia; os valores ficam no cofre do TJPB.
  await politica.definirPolitica(TipoDocumento.AlvaraViagem, Papel.PoliciaFederal, [
    campo("nomeCrianca"),
    campo("nomeAcompanhante"),
    campo("destino"),
    campo("periodoValidade"),
    campo("orgaoEmissor"),
  ]);
  await politica.definirPolitica(TipoDocumento.AlvaraViagem, Papel.CiaAerea, [
    campo("nomeCrianca"),
    campo("nomeAcompanhante"),
    campo("periodoValidade"),
  ]);
  await politica.definirPolitica(TipoDocumento.AlvaraViagem, Papel.ConselhoTutelar, [
    campo("nomeCrianca"),
    campo("orgaoEmissor"),
    campo("periodoValidade"),
  ]);

  console.log("VerificaJus Sigilo — contratos implantados");
  console.log("  admin (TJPB)      ", tjpb.address);
  console.log("  vara emissora     ", vara.address);
  console.log("  AccessRegistry    ", await acessos.getAddress());
  console.log("  DisclosurePolicy  ", await politica.getAddress());
  console.log("  DocumentRegistry  ", await registro.getAddress());

  // Exporta endereços + ABI para o frontend estático (frontend/index.html),
  // que não passa por nenhum bundler e lê esse arquivo direto no navegador.
  const config = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    varaEndereco: vara.address,
    contratos: {
      DocumentRegistry: {
        endereco: await registro.getAddress(),
        abi: await abiDoContrato("DocumentRegistry", "DocumentRegistry"),
      },
      AccessRegistry: {
        endereco: await acessos.getAddress(),
        abi: await abiDoContrato("AccessRegistry", "AccessRegistry"),
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