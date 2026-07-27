/**
 * Roteiro de demonstração do VerificaJus Sigilo.
 *
 * Executa o ciclo de vida completo de um alvará de viagem contra os contratos
 * reais, narrando cada passo. Funciona tanto na Hardhat Network quanto na
 * Sepolia:
 *
 *   npx hardhat run scripts/demo.ts
 *   npx hardhat run scripts/demo.ts --network sepolia
 *
 * É deliberadamente autocontido — implanta os próprios contratos em vez de
 * depender de um estado anterior — para que a demonstração seja reproduzível
 * do zero diante da banca.
 */
import { network } from "hardhat";
import { ethers as ethersLib } from "ethers";

const Papel = {
  VaraEmissora: 1,
  PoliciaFederal: 2,
  CiaAerea: 3,
  ConselhoTutelar: 4,
} as const;

const TipoDocumento = { AlvaraViagem: 0, TermoGuarda: 1 } as const;

const NOME_DO_STATUS = [
  "Inexistente",
  "Valido",
  "Expirado",
  "Revogado",
  "Substituido",
] as const;

/** Campos do alvará de viagem. Na cadeia vão só os hashes dos NOMES. */
const CAMPOS = {
  nomeCrianca: "nome da criança ou adolescente",
  nomeAcompanhante: "nome do acompanhante autorizado",
  destino: "destino da viagem",
  periodoValidade: "período de validade",
  orgaoEmissor: "órgão emissor",
} as const;

type NomeDeCampo = keyof typeof CAMPOS;

const POLITICAS: ReadonlyArray<{ papel: number; rotulo: string; campos: NomeDeCampo[] }> = [
  {
    papel: Papel.PoliciaFederal,
    rotulo: "Polícia Federal",
    campos: ["nomeCrianca", "nomeAcompanhante", "destino", "periodoValidade", "orgaoEmissor"],
  },
  {
    papel: Papel.CiaAerea,
    rotulo: "Companhia aérea",
    campos: ["nomeCrianca", "nomeAcompanhante", "periodoValidade"],
  },
  {
    papel: Papel.ConselhoTutelar,
    rotulo: "Conselho Tutelar",
    campos: ["nomeCrianca", "orgaoEmissor", "periodoValidade"],
  },
];

const REFERENCIA_DO_ALVARA = "ALVARA-2026-000123";
const ORGAO = "VARA-INFANCIA-JP";

const passo = (n: number, texto: string) => console.log(`\n[${n}] ${texto}`);
const linha = (rotulo: string, valor: string) =>
  console.log(`    ${rotulo.padEnd(24, ".")} ${valor}`);

async function main() {
  const { ethers } = await network.getOrCreate();

  const signers = await ethers.getSigners();
  const tjpb = signers[0];
  // Na Sepolia normalmente há uma única conta configurada; nesse caso o TJPB
  // acumula o papel da vara. Na rede local são contas distintas, que é o que
  // reflete a realidade institucional.
  const vara = signers[1] ?? signers[0];
  const contasSeparadas = vara.address !== tjpb.address;

  console.log("═".repeat(64));
  console.log("  VerificaJus Sigilo — demonstração do ciclo de vida");
  console.log("═".repeat(64));

  passo(0, "Implantando os contratos");
  const acessos = await ethers.deployContract("AccessRegistry");
  const politica = await ethers.deployContract("DisclosurePolicy", [
    await acessos.getAddress(),
  ]);
  const registro = await ethers.deployContract("DocumentRegistry", [
    await acessos.getAddress(),
  ]);
  linha("AccessRegistry", await acessos.getAddress());
  linha("DisclosurePolicy", await politica.getAddress());
  linha("DocumentRegistry", await registro.getAddress());

  passo(1, "TJPB registra a Vara da Infância como única emissora autorizada");
  await (
    await acessos.registrarInstituicao(
      vara.address,
      Papel.VaraEmissora,
      ethersLib.id(ORGAO),
    )
  ).wait();
  linha("conta da vara", vara.address);
  if (!contasSeparadas) {
    console.log("    (rede com uma única conta: TJPB acumula o papel da vara)");
  }

  passo(2, "TJPB publica a política de divulgação de cada perfil consulente");
  for (const { papel, rotulo, campos } of POLITICAS) {
    await (
      await politica.definirPolitica(
        TipoDocumento.AlvaraViagem,
        papel,
        campos.map((c) => ethersLib.id(c)),
      )
    ).wait();
    linha(rotulo, `${campos.length} campos`);
  }
  console.log("    A política está NA CADEIA: é pública e auditável.");

  passo(3, `A vara expede o alvará ${REFERENCIA_DO_ALVARA}`);
  const docId = ethersLib.id(REFERENCIA_DO_ALVARA);
  // O salt fica no cofre do TJPB e nunca é publicado.
  const salt = ethersLib.hexlify(ethersLib.randomBytes(32));
  const contentHash = ethersLib.keccak256(
    ethersLib.concat([ethersLib.toUtf8Bytes("<PDF do alvará>"), salt]),
  );
  const validoAte = BigInt(Math.floor(Date.now() / 1000) + 30 * 86_400);

  await (
    await registro
      .connect(vara)
      .issueDocument(
        docId,
        contentHash,
        ethersLib.id("assinatura-do-magistrado"),
        TipoDocumento.AlvaraViagem,
        ethersLib.id(ORGAO),
        validoAte,
      )
  ).wait();
  linha("docId (vai no QR)", docId.slice(0, 18) + "…");

  passo(4, "A Polícia Federal escaneia o QR Code e consulta o status");
  const statusInicial = await registro.consultStatus(docId);
  linha("status", NOME_DO_STATUS[Number(statusInicial)]);
  console.log("    Nenhum contato com a vara. Nenhum acesso aos autos.");

  passo(5, "O que existe de fato na blockchain sobre este alvará");
  const doc = await registro.consultarDocumento(docId);
  linha("contentHash", doc.contentHash.slice(0, 18) + "…");
  linha("signatureHash", doc.signatureHash.slice(0, 18) + "…");
  linha("orgaoEmissor", ORGAO);
  linha("emitidoPor", doc.emitidoPor);
  linha("expiresAt", new Date(Number(doc.expiresAt) * 1000).toISOString());
  console.log("    Não há nome de criança. Não há acompanhante. Não há destino.");
  console.log("    Não há número de processo. O hash é salgado e irreversível.");

  passo(6, "O que cada perfil pode ver na página de validação");
  for (const { papel, rotulo } of POLITICAS) {
    const liberados = await politica.camposLiberados(TipoDocumento.AlvaraViagem, papel);
    const nomes = (Object.keys(CAMPOS) as NomeDeCampo[]).filter((c) =>
      liberados.includes(ethersLib.id(c)),
    );
    console.log(`    ${rotulo}:`);
    for (const n of nomes) console.log(`      • ${CAMPOS[n]}`);
  }
  console.log("    Os VALORES vêm do cofre do TJPB, campo a campo, só os liberados.");

  passo(7, "Decisão judicial revoga o alvará");
  await (
    await registro.connect(vara).revokeDocument(docId, ethersLib.id("DECISAO_JUDICIAL"))
  ).wait();
  linha("motivo", "DECISAO_JUDICIAL (código, não texto livre)");

  passo(8, "A Polícia Federal consulta de novo, na mesma hora");
  const statusFinal = await registro.consultStatus(docId);
  linha("status", NOME_DO_STATUS[Number(statusFinal)]);

  console.log("\n" + "═".repeat(64));
  console.log(
    `  ${NOME_DO_STATUS[Number(statusInicial)]} → ${NOME_DO_STATUS[Number(statusFinal)]}` +
      "  sem que ninguém abrisse o processo.",
  );
  console.log("═".repeat(64) + "\n");
}

main().catch((erro) => {
  console.error(erro);
  process.exitCode = 1;
});
