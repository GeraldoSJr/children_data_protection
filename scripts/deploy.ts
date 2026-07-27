import { network } from "hardhat";
import { ethers as ethersLib } from "ethers";

const Papel = { VaraEmissora: 1, PoliciaFederal: 2, CiaAerea: 3, ConselhoTutelar: 4 } as const;
const TipoDocumento = { AlvaraViagem: 0, TermoGuarda: 1 } as const;

const campo = (nome: string) => ethersLib.id(nome);

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
}

main().catch((erro) => {
  console.error(erro);
  process.exitCode = 1;
});
