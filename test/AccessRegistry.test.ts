import { expect } from "chai";
import { network } from "hardhat";
import { ethers as ethersLib } from "ethers";

// Espelha os enums de contracts/Tipos.sol
const Papel = { Nenhum: 0, VaraEmissora: 1, PoliciaFederal: 2 } as const;

const ORG_ID = ethersLib.id("PF-PB");

describe("AccessRegistry — fonte única de identidade institucional", () => {
  async function implantar() {
    const { ethers } = await network.getOrCreate();
    const [tjpb, policiaFederal, estranho] = await ethers.getSigners();

    const acessos = await ethers.deployContract("AccessRegistry");

    return { ethers, tjpb, policiaFederal, estranho, acessos };
  }

  it("admin registra uma instituição e o papel/org ficam consultáveis por qualquer um", async () => {
    const { policiaFederal, estranho, acessos } = await implantar();

    await acessos.registrarInstituicao(policiaFederal.address, Papel.PoliciaFederal, ORG_ID);

    expect(await acessos.connect(estranho).papelDaConta(policiaFederal.address)).to.equal(
      Papel.PoliciaFederal,
    );
    expect(await acessos.orgDaConta(policiaFederal.address)).to.equal(ORG_ID);
    expect(await acessos.temPapel(policiaFederal.address, Papel.PoliciaFederal)).to.equal(true);
    expect(await acessos.temPapel(policiaFederal.address, Papel.VaraEmissora)).to.equal(false);
  });

  it("admin revoga uma instituição e o papel volta a Nenhum", async () => {
    const { policiaFederal, acessos } = await implantar();

    await acessos.registrarInstituicao(policiaFederal.address, Papel.PoliciaFederal, ORG_ID);
    await acessos.revogarInstituicao(policiaFederal.address);

    expect(await acessos.papelDaConta(policiaFederal.address)).to.equal(Papel.Nenhum);
    expect(await acessos.orgDaConta(policiaFederal.address)).to.equal(ethersLib.ZeroHash);
  });

  it("recusa registro e revogação por conta que não é admin", async () => {
    const { ethers, policiaFederal, estranho, acessos } = await implantar();

    await expect(
      acessos.connect(estranho).registrarInstituicao(policiaFederal.address, Papel.PoliciaFederal, ORG_ID),
    ).to.be.revert(ethers);

    await acessos.registrarInstituicao(policiaFederal.address, Papel.PoliciaFederal, ORG_ID);
    await expect(acessos.connect(estranho).revogarInstituicao(policiaFederal.address)).to.be.revert(
      ethers,
    );

    expect(await acessos.papelDaConta(policiaFederal.address)).to.equal(Papel.PoliciaFederal);
  });
});
