// Painel da Vara: emite e revoga documentos nos contratos reais, e grava a
// PII correspondente no cofre mock (frontend/cofre.mock.js). Depende de
// contracts.config.js, shared.js e cofre.mock.js — carregados antes deste
// arquivo em admin.html.

const ORGAO_EMISSOR = "VARA-INFANCIA-JP";

let provider, config, varaWallet, registroEscrita;

function baseUrlValidacao() {
  return new URL("./validar.html", window.location.href).toString();
}

function renderQrCode(docId) {
  const alvo = $("qrcode");
  alvo.innerHTML = "";
  const url = `${baseUrlValidacao()}?doc=${docId}`;
  // eslint-disable-next-line no-undef
  new QRCode(alvo, { text: url, width: 168, height: 168 });
  const link = document.createElement("a");
  link.href = url;
  link.textContent = "abrir tela de validação";
  link.target = "_blank";
  link.rel = "noopener";
  link.style.fontSize = "0.8rem";
  alvo.appendChild(link);
}

function renderListaEmissoes() {
  const alvo = $("listaEmissoes");
  const itens = Cofre.listar();
  if (itens.length === 0) {
    alvo.textContent = "Nenhum documento emitido ainda.";
    return;
  }
  const linhas = itens
    .map(
      (item) =>
        `<tr>` +
        `<td>${item.campos.referencia ?? "—"}</td>` +
        `<td class="campo-raw">${item.docId.slice(0, 14)}…</td>` +
        `<td>${item.campos.nomeCrianca ?? "—"}</td>` +
        `<td>${item.campos.destino ?? "—"}</td>` +
        `<td><a href="${baseUrlValidacao()}?doc=${item.docId}" target="_blank" rel="noopener">validar</a></td>` +
        `</tr>`,
    )
    .join("");
  alvo.innerHTML =
    `<table class="tabela-emissoes"><thead><tr>` +
    `<th>Referência</th><th>docId</th><th>Criança</th><th>Destino</th><th></th>` +
    `</tr></thead><tbody>${linhas}</tbody></table>`;
}

async function iniciar() {
  const resultado = await conectar();
  if (!resultado) return;
  ({ provider, config } = resultado);

  varaWallet = carteiraParaEndereco(config.varaEndereco, provider);
  if (!varaWallet) {
    const estado = $("estadoRede");
    estado.textContent = "Nenhuma chave de teste conhecida corresponde à conta da vara (" + config.varaEndereco + ").";
    estado.className = "erro";
    return;
  }
  registroEscrita = contrato(config, "DocumentRegistry", varaWallet);

  renderListaEmissoes();
}

$("btnEmitir").addEventListener("click", async () => {
  const btn = $("btnEmitir");
  btn.disabled = true;
  try {
    const referencia = $("docRef").value.trim();
    const dias = Number($("docValidadeDias").value);

    const campos = {
      referencia,
      nomeCrianca: $("campoNomeCrianca").value.trim(),
      nomeAcompanhante: $("campoNomeAcompanhante").value.trim(),
      destino: $("campoDestino").value.trim(),
      periodoValidade: $("campoPeriodoValidade").value.trim(),
      orgaoEmissor: ORGAO_EMISSOR,
    };

    const docId = ethers.id(referencia);
    // O salt fica só no cofre (ver docs/arquitetura.md — "O hash é salgado").
    const salt = ethers.hexlify(ethers.randomBytes(16));
    const contentHash = ethers.keccak256(ethers.concat([ethers.toUtf8Bytes(referencia), salt]));
    const signatureHash = ethers.id("assinatura-" + referencia);
    const orgaoEmissorHash = ethers.id(ORGAO_EMISSOR);
    const expiresAt = dias > 0 ? BigInt(Math.floor(Date.now() / 1000) + dias * 86400) : 0n;

    mostrar("resultadoEmitir", "Enviando transação…");
    const tx = await registroEscrita.issueDocument(
      docId,
      contentHash,
      signatureHash,
      TipoDocumento.AlvaraViagem,
      orgaoEmissorHash,
      expiresAt,
    );
    const recibo = await tx.wait();

    Cofre.gravar(docId, campos, salt);

    mostrar(
      "resultadoEmitir",
      `<div class="linha"><span>docId</span><span class="campo-raw">${docId}</span></div>` + formatarTx(recibo),
    );
    renderQrCode(docId);
    renderListaEmissoes();

    $("docRevogaId").value = referencia;
  } catch (erro) {
    mostrar("resultadoEmitir", "Erro: " + (erro.shortMessage || erro.message));
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
    const tx = await registroEscrita.revokeDocument(docId, reasonCode);
    const recibo = await tx.wait();

    mostrar("resultadoRevogar", formatarTx(recibo));
  } catch (erro) {
    mostrar("resultadoRevogar", "Erro: " + (erro.shortMessage || erro.message));
  } finally {
    btn.disabled = false;
  }
});

iniciar();
