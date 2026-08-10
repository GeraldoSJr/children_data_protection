const RPC_URL = "http://127.0.0.1:8545";
const CHAVE_PRIVADA_VARA =
  "0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3";

const ORGAO_EMISSOR = "VARA-INFANCIA-JP";

const NOME_DO_STATUS = ["Inexistente", "Valido", "Expirado", "Revogado", "Substituido"];

const $ = (id) => document.getElementById(id);

let provider, varaWallet, contratoLeitura, contratoEscrita;

function formatarTx(recibo) {
  return (
    `<div class="linha"><span>tx hash</span><span class="campo-raw">${recibo.hash}</span></div>` +
    `<div class="linha"><span>bloco</span><span>${recibo.blockNumber}</span></div>` +
    `<div class="linha"><span>gas usado</span><span>${recibo.gasUsed}</span></div>` +
    `<p class="ajuda" style="margin-top:8px">Confira este hash no block explorer da rede (http://localhost:5000) ou via ` +
    `<code>eth_getTransactionReceipt</code> — é a transação real, não algo que a interface só "diz" ter acontecido.</p>`
  );
}

function mostrar(id, html, classeExtra = "") {
  const el = $(id);
  el.innerHTML = html;
  el.className = "resultado visivel" + (classeExtra ? " " + classeExtra : "");
}

async function iniciar() {
  const estado = $("estadoRede");

  if (!window.VERIFICAJUS_CONFIG) {
    estado.textContent =
      "contracts.config.js não encontrado. Rode `npx hardhat run scripts/deploy.ts --network besu` primeiro.";
    estado.className = "erro";
    return;
  }

  const config = window.VERIFICAJUS_CONFIG;

  try {
    provider = new ethers.JsonRpcProvider(RPC_URL);
    const rede = await provider.getNetwork();

    varaWallet = new ethers.Wallet(CHAVE_PRIVADA_VARA, provider);

    const { endereco, abi } = config.contratos.DocumentRegistry;
    contratoLeitura = new ethers.Contract(endereco, abi, provider);
    contratoEscrita = contratoLeitura.connect(varaWallet);

    estado.innerHTML =
      `conectado a ${RPC_URL} · chainId ${rede.chainId} · ` +
      `DocumentRegistry em <span class="campo-raw">${endereco}</span> · ` +
      `assinando como vara (<span class="campo-raw">${varaWallet.address}</span>)`;
    estado.className = "ok";
  } catch (erro) {
    estado.textContent =
      "Não foi possível conectar em " + RPC_URL + ". A rede Besu (docker compose) está no ar? Detalhe: " + erro.message;
    estado.className = "erro";
  }
}

$("btnEmitir").addEventListener("click", async () => {
  const btn = $("btnEmitir");
  btn.disabled = true;
  try {
    const referencia = $("docRef").value.trim();
    const tipo = Number($("docTipo").value);
    const dias = Number($("docValidadeDias").value);

    const docId = ethers.id(referencia);
    // Em produção o contentHash é salgado com um salt guardado no cofre do
    // TJPB (ver docs/arquitetura.md). Aqui simulamos o mesmo formato.
    const salt = ethers.hexlify(ethers.randomBytes(16));
    const contentHash = ethers.keccak256(ethers.concat([ethers.toUtf8Bytes(referencia), salt]));
    const signatureHash = ethers.id("assinatura-" + referencia);
    const orgaoEmissor = ethers.id(ORGAO_EMISSOR);
    const expiresAt = dias > 0 ? BigInt(Math.floor(Date.now() / 1000) + dias * 86400) : 0n;

    mostrar("resultadoEmitir", "Enviando transação…");
    const tx = await contratoEscrita.issueDocument(
      docId,
      contentHash,
      signatureHash,
      tipo,
      orgaoEmissor,
      expiresAt,
    );
    const recibo = await tx.wait();

    mostrar(
      "resultadoEmitir",
      `<div class="linha"><span>docId</span><span class="campo-raw">${docId}</span></div>` + formatarTx(recibo),
    );

    $("docConsultaId").value = referencia;
    $("docRevogaId").value = referencia;
  } catch (erro) {
    mostrar("resultadoEmitir", "Erro: " + (erro.shortMessage || erro.message));
  } finally {
    btn.disabled = false;
  }
});

$("btnConsultar").addEventListener("click", async () => {
  const btn = $("btnConsultar");
  btn.disabled = true;
  try {
    const referencia = $("docConsultaId").value.trim();
    const docId = ethers.id(referencia);

    const status = await contratoLeitura.consultStatus(docId);
    const doc = await contratoLeitura.consultarDocumento(docId);
    const nomeStatus = NOME_DO_STATUS[Number(status)];

    const expiraTexto =
      doc.expiresAt === 0n ? "sem prazo" : new Date(Number(doc.expiresAt) * 1000).toLocaleString("pt-BR");

    mostrar(
      "resultadoConsultar",
      `<div class="linha"><span>status</span><span class="status-badge status-${nomeStatus}">${nomeStatus}</span></div>` +
        `<div class="linha"><span>emitido por</span><span class="campo-raw">${doc.emitidoPor}</span></div>` +
        `<div class="linha"><span>contentHash</span><span class="campo-raw">${doc.contentHash}</span></div>` +
        `<div class="linha"><span>validade</span><span>${expiraTexto}</span></div>` +
        `<p class="ajuda" style="margin-top:8px">Isso é tudo o que existe on-chain sobre este documento — sem nome de criança, sem acompanhante, sem destino.</p>`,
    );
  } catch (erro) {
    mostrar("resultadoConsultar", "Erro: " + (erro.shortMessage || erro.message));
  } finally {
    btn.disabled = false;
  }
});

$("btnRevogar").addEventListener("click", async () => {
  const btn = $("btnRevogar");
  btn.disabled = true;
  try {
    const referencia = $("docRevogaId").value.trim();
    const motivo = $("docMotivo").value;
    const docId = ethers.id(referencia);
    const reasonCode = ethers.id(motivo);

    mostrar("resultadoRevogar", "Enviando transação…");
    const tx = await contratoEscrita.revokeDocument(docId, reasonCode);
    const recibo = await tx.wait();

    mostrar("resultadoRevogar", formatarTx(recibo));
  } catch (erro) {
    mostrar("resultadoRevogar", "Erro: " + (erro.shortMessage || erro.message));
  } finally {
    btn.disabled = false;
  }
});

iniciar();