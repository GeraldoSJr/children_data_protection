import { expect } from "chai";
import { network } from "hardhat";
import { ethers as ethersLib } from "ethers";

// Espelham os enums de contracts/Tipos.sol
const Papel = { Nenhum: 0, VaraEmissora: 1, PoliciaFederal: 2 } as const;
const TipoDocumento = { AlvaraViagem: 0, TermoGuarda: 1 } as const;
const Status = { Inexistente: 0, Valido: 1, Expirado: 2, Revogado: 3, Substituido: 4 } as const;

const DOC_ID = ethersLib.id("ALVARA-2026-000123");
const CONTENT_HASH = ethersLib.id("documento||salt-do-cofre");
const SIGNATURE_HASH = ethersLib.id("assinatura-do-magistrado");
const ORGAO = ethersLib.id("VARA-INFANCIA-JP");
const MOTIVO = ethersLib.id("DECISAO_JUDICIAL");

const SEM_PRAZO = 0n;

describe("DocumentRegistry — ciclo de vida do documento sigiloso", () => {
  async function implantar() {
    const { ethers } = await network.getOrCreate();
    const [tjpb, vara, policiaFederal] = await ethers.getSigners();

    const acessos = await ethers.deployContract("AccessRegistry");
    const registro = await ethers.deployContract("DocumentRegistry", [
      await acessos.getAddress(),
    ]);

    await acessos.registrarInstituicao(vara.address, Papel.VaraEmissora, ORGAO);
    await acessos.registrarInstituicao(
      policiaFederal.address,
      Papel.PoliciaFederal,
      ethersLib.id("PF-PB"),
    );

    return { ethers, tjpb, vara, policiaFederal, acessos, registro };
  }

  it("emite um alvará e o terceiro lê status Valido", async () => {
    const { vara, policiaFederal, registro } = await implantar();

    await registro
      .connect(vara)
      .issueDocument(
        DOC_ID,
        CONTENT_HASH,
        SIGNATURE_HASH,
        TipoDocumento.AlvaraViagem,
        ORGAO,
        SEM_PRAZO,
      );

    const doc = await registro.consultarDocumento(DOC_ID);
    expect(doc.contentHash).to.equal(CONTENT_HASH);
    expect(doc.emitidoPor).to.equal(vara.address);

    // A leitura é feita pela Polícia Federal, sem qualquer acesso aos autos.
    expect(await registro.connect(policiaFederal).consultStatus(DOC_ID)).to.equal(Status.Valido);
  });

  it("revoga o alvará e a leitura seguinte do terceiro passa a Revogado", async () => {
    const { vara, policiaFederal, registro } = await implantar();

    await registro
      .connect(vara)
      .issueDocument(
        DOC_ID,
        CONTENT_HASH,
        SIGNATURE_HASH,
        TipoDocumento.AlvaraViagem,
        ORGAO,
        SEM_PRAZO,
      );
    expect(await registro.connect(policiaFederal).consultStatus(DOC_ID)).to.equal(Status.Valido);

    await registro.connect(vara).revokeDocument(DOC_ID, MOTIVO);

    expect(await registro.connect(policiaFederal).consultStatus(DOC_ID)).to.equal(Status.Revogado);
  });

  it("deriva Expirado a partir do prazo, sem nenhuma escrita", async () => {
    const { vara, registro } = await implantar();

    const ontem = BigInt(Math.floor(Date.now() / 1000) - 86_400);
    await registro
      .connect(vara)
      .issueDocument(
        DOC_ID,
        CONTENT_HASH,
        SIGNATURE_HASH,
        TipoDocumento.AlvaraViagem,
        ORGAO,
        ontem,
      );

    expect(await registro.consultStatus(DOC_ID)).to.equal(Status.Expirado);
  });

  it("recusa emissão por conta sem o papel VaraEmissora", async () => {
    const { ethers, policiaFederal, registro } = await implantar();

    await expect(
      registro
        .connect(policiaFederal)
        .issueDocument(
          DOC_ID,
          CONTENT_HASH,
          SIGNATURE_HASH,
          TipoDocumento.AlvaraViagem,
          ORGAO,
          SEM_PRAZO,
        ),
    ).to.be.revert(ethers);

    expect(await registro.consultStatus(DOC_ID)).to.equal(Status.Inexistente);
  });
});
