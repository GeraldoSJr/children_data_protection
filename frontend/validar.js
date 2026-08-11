// Tela de validação: qualquer um pode ler status e política (chamadas
// gratuitas); só registrarConsulta exige uma conta assinando. Depende de
// contracts.config.js, shared.js e cofre.mock.js — carregados antes deste
// arquivo em validar.html.

let provider, config, registroLeitura, politicaLeitura;

function carteiraDoConsulente(papel) {
  const enderecoPorPapel = {
    [Papel.PoliciaFederal]: config.perfis.policiaFederal,
    [Papel.CiaAerea]: config.perfis.ciaAerea,
    [Papel.ConselhoTutelar]: config.perfis.conselhoTutelar,
  };
  // Quando a rede não tem contas dedicadas para os três perfis (ver
  // scripts/deploy.ts), todos assinam registrarConsulta como leitor genérico
  // — a leitura de status e de campos liberados continua correta de qualquer
  // forma, porque camposLiberados é indexado pelo PAPEL escolhido no
  // formulário, não pela conta que assina.
  const endereco = enderecoPorPapel[papel] ?? config.perfis.leitorGenerico;
  return carteiraParaEndereco(endereco, provider);
}

async function iniciar() {
  const params = new URLSearchParams(window.location.search);
  const docIdDaUrl = params.get("doc");
  if (docIdDaUrl) $("docId").value = docIdDaUrl;

  const resultado = await conectar();
  if (!resultado) return;
  ({ provider, config } = resultado);

  registroLeitura = contrato(config, "DocumentRegistry", provider);
  politicaLeitura = contrato(config, "DisclosurePolicy", provider);

  if (docIdDaUrl) $("btnValidar").click();
}

$("btnValidar").addEventListener("click", async () => {
  const btn = $("btnValidar");
  btn.disabled = true;
  try {
    const docId = $("docId").value.trim();
    const papel = Number($("perfil").value);

    if (!/^0x[0-9a-fA-F]{64}$/.test(docId)) {
      mostrar("resultadoValidar", "docId inválido — esperado um bytes32 (0x seguido de 64 dígitos hex).", "erro");
      return;
    }

    mostrar("resultadoValidar", "Consultando…");

    const status = await registroLeitura.consultStatus(docId);
    const nomeStatus = NOME_DO_STATUS[Number(status)];

    const hashesLiberados = await politicaLeitura.camposLiberados(TipoDocumento.AlvaraViagem, papel);
    const nomesLiberados = hashesLiberados.map((h) => HASH_PARA_CAMPO[h]).filter(Boolean);

    const valores = Cofre.ler(docId, nomesLiberados);

    const linhasCampos =
      valores === null
        ? `<p class="ajuda">Este docId não está no cofre desta máquina — emita-o primeiro pelo <a href="./admin.html">painel da Vara</a>, ou copie o docId exibido lá.</p>`
        : nomesLiberados.length === 0
          ? `<p class="ajuda">Nenhum campo liberado para este perfil neste tipo de documento.</p>`
          : `<ul class="campos-liberados">` +
            nomesLiberados
              .map(
                (nome) =>
                  `<li><span class="rotulo">${CAMPOS_CONHECIDOS[nome]}</span><span class="valor">${valores[nome] ?? "—"}</span></li>`,
              )
              .join("") +
            `</ul>`;

    mostrar(
      "resultadoValidar",
      `<div class="linha"><span>status</span><span class="status-badge status-${nomeStatus}">${nomeStatus}</span></div>` +
        `<div class="linha"><span>consultando como</span><span>${NOME_DO_PAPEL[papel]}</span></div>` +
        `<p class="ajuda" style="margin-top:8px">Campos liberados a este perfil:</p>` +
        linhasCampos,
    );

    const carteira = carteiraDoConsulente(papel);
    if (carteira) {
      const registroEscrita = registroLeitura.connect(carteira);
      await (await registroEscrita.registrarConsulta(docId)).wait();
    }
  } catch (erro) {
    mostrar("resultadoValidar", "Erro: " + (erro.shortMessage || erro.message));
  } finally {
    btn.disabled = false;
  }
});

iniciar();
