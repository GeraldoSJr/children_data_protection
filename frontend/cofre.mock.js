// Simula o "Cofre de Dados TJPB" descrito em docs/arquitetura.md: guarda a PII
// (nome da criança, acompanhante, destino, salt do hash…) que NUNCA vai para a
// blockchain, indexada pelo docId opaco que o QR Code carrega.
//
// Um cofre de verdade seria um serviço próprio do TJPB, com seu próprio
// controle de acesso. Aqui é só localStorage do navegador — o bastante para
// admin.html gravar e validar.html ler na mesma máquina, sem exigir backend
// para a demonstração acadêmica. Trocar por uma API real não muda nada fora
// deste arquivo: admin.js e validar.js só conhecem os métodos abaixo.

const CHAVE_STORAGE = "verificajus:cofre";

function lerTudo() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_STORAGE)) ?? {};
  } catch {
    return {};
  }
}

function salvarTudo(registro) {
  localStorage.setItem(CHAVE_STORAGE, JSON.stringify(registro));
}

const Cofre = {
  /**
   * Grava os dados de um documento recém-emitido.
   * @param {string} docId
   * @param {Record<string, string>} campos nomeCrianca, nomeAcompanhante, destino, periodoValidade, orgaoEmissor…
   * @param {string} salt mesmo salt usado para compor o contentHash gravado on-chain
   */
  gravar(docId, campos, salt) {
    const registro = lerTudo();
    registro[docId] = { campos, salt, gravadoEm: Date.now() };
    salvarTudo(registro);
  },

  remover(docId) {
    const registro = lerTudo();
    delete registro[docId];
    salvarTudo(registro);
  },

  existe(docId) {
    return docId in lerTudo();
  },

  /** Salt guardado para este docId, ou null se o documento não foi emitido nesta máquina. */
  salt(docId) {
    return lerTudo()[docId]?.salt ?? null;
  },

  /**
   * Retorna só os campos liberados para o perfil consulente — nunca o registro
   * inteiro. `nomesCampos` já vem decodificado de bytes32 para string (ver
   * shared.js: CAMPOS_CONHECIDOS), tipicamente a partir de
   * DisclosurePolicy.camposLiberados.
   * @param {string} docId
   * @param {string[]} nomesCampos
   * @returns {Record<string, string> | null}
   */
  ler(docId, nomesCampos) {
    const entrada = lerTudo()[docId];
    if (!entrada) return null;
    const liberado = {};
    for (const nome of nomesCampos) {
      if (nome in entrada.campos) liberado[nome] = entrada.campos[nome];
    }
    return liberado;
  },

  /** Lista tudo o que foi emitido nesta máquina — usado pelo painel administrativo. */
  listar() {
    return Object.entries(lerTudo())
      .map(([docId, v]) => ({ docId, ...v }))
      .sort((a, b) => b.gravadoEm - a.gravadoEm);
  },
};

window.Cofre = Cofre;
