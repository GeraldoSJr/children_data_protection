import { expect } from "chai";
import { network } from "hardhat";
import { ethers as ethersLib } from "ethers";

// Espelha os enums de contracts/Tipos.sol
const Papel = { Nenhum: 0, VaraEmissora: 1, PoliciaFederal: 2, CiaAerea: 3 } as const;
const TipoDocumento = { AlvaraViagem: 0, TermoGuarda: 1 } as const;

const campo = (nome: string) => ethersLib.id(nome);
const CAMPOS_PF = [campo("nomeCrianca"), campo("destino")];

describe("DisclosurePolicy — o que cada perfil pode ver, publicado e auditável", () => {
  async function implantar() {
    const { ethers } = await network.getOrCreate();
    const [tjpb, , estranho] = await ethers.getSigners();

    const acessos = await ethers.deployContract("AccessRegistry");
    const politica = await ethers.deployContract("DisclosurePolicy", [await acessos.getAddress()]);

    return { ethers, tjpb, estranho, acessos, politica };
  }

  it("admin define a política e qualquer um lê os campos liberados a um perfil", async () => {
    const { estranho, politica } = await implantar();

    await politica.definirPolitica(TipoDocumento.AlvaraViagem, Papel.PoliciaFederal, CAMPOS_PF);

    const liberados = await politica
      .connect(estranho)
      .camposLiberados(TipoDocumento.AlvaraViagem, Papel.PoliciaFederal);
    expect([...liberados]).to.deep.equal(CAMPOS_PF);

    // Um perfil sem política definida não vê nada.
    expect(
      await politica.camposLiberados(TipoDocumento.AlvaraViagem, Papel.CiaAerea),
    ).to.deep.equal([]);
  });

  it("podeVerCampo confere corretamente campo liberado e campo fora da política", async () => {
    const { politica } = await implantar();

    await politica.definirPolitica(TipoDocumento.AlvaraViagem, Papel.PoliciaFederal, CAMPOS_PF);

    expect(
      await politica.podeVerCampo(TipoDocumento.AlvaraViagem, Papel.PoliciaFederal, campo("nomeCrianca")),
    ).to.equal(true);
    expect(
      await politica.podeVerCampo(
        TipoDocumento.AlvaraViagem,
        Papel.PoliciaFederal,
        campo("nomeAcompanhante"),
      ),
    ).to.equal(false);
  });

  it("definirPolitica substitui a política anterior do mesmo par (tipo, papel)", async () => {
    const { politica } = await implantar();

    await politica.definirPolitica(TipoDocumento.AlvaraViagem, Papel.PoliciaFederal, CAMPOS_PF);
    await politica.definirPolitica(TipoDocumento.AlvaraViagem, Papel.PoliciaFederal, [
      campo("periodoValidade"),
    ]);

    expect(
      await politica.camposLiberados(TipoDocumento.AlvaraViagem, Papel.PoliciaFederal),
    ).to.deep.equal([campo("periodoValidade")]);
  });

  it("recusa definirPolitica por conta que não é admin", async () => {
    const { ethers, estranho, politica } = await implantar();

    await expect(
      politica.connect(estranho).definirPolitica(TipoDocumento.AlvaraViagem, Papel.PoliciaFederal, CAMPOS_PF),
    ).to.be.revert(ethers);
  });
});
