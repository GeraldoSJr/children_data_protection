// Código comum a admin.js e validar.js: conexão com a rede, enums que espelham
// contracts/Tipos.sol, o dicionário de nomes de campo e os helpers de DOM.
// Carregar depois de contracts.config.js e antes de admin.js/validar.js.

const RPC_URL = "http://127.0.0.1:8545";

const Papel = { Nenhum: 0, VaraEmissora: 1, PoliciaFederal: 2, CiaAerea: 3, ConselhoTutelar: 4 };
const TipoDocumento = { AlvaraViagem: 0, TermoGuarda: 1 };
const NOME_DO_STATUS = ["Inexistente", "Valido", "Expirado", "Revogado", "Substituido"];
const NOME_DO_PAPEL = { 2: "Polícia Federal", 3: "Companhia aérea", 4: "Conselho Tutelar" };

/**
 * Campos do alvará de viagem. Só o keccak256 do NOME de cada campo vai para a
 * cadeia (DisclosurePolicy); o rótulo em português e o valor ficam só aqui e
 * no cofre (frontend/cofre.mock.js). Mesma lista de scripts/demo.ts.
 */
const CAMPOS_CONHECIDOS = {
  nomeCrianca: "Nome da criança ou adolescente",
  nomeAcompanhante: "Nome do acompanhante autorizado",
  destino: "Destino da viagem",
  periodoValidade: "Período de validade",
  orgaoEmissor: "Órgão emissor",
};

/** hash do nome do campo (o que DisclosurePolicy.camposLiberados devolve) → nome do campo. */
const HASH_PARA_CAMPO = Object.fromEntries(
  Object.keys(CAMPOS_CONHECIDOS).map((nome) => [ethers.id(nome), nome]),
);

/**
 * Chaves privadas de contas de teste PÚBLICAS — nenhuma delas é segredo:
 *   - as 5 primeiras são o mnemônico padrão do Hardhat ("test test test …
 *     junk"), documentado no próprio Hardhat, usado por `npx hardhat node`;
 *   - as 3 últimas são as contas de teste do bc101-dev-env (ver
 *     hardhat.config.ts). Nunca reaproveitar chaves assim fora de um
 *     ambiente de desenvolvimento descartável.
 * Servem só para o frontend assinar transações de demonstração sem exigir
 * MetaMask. carteiraParaEndereco resolve qual delas corresponde a um dado
 * endereço vindo de contracts.config.js, então nada aqui depende de saber
 * de antemão em qual rede o deploy rodou.
 */
const CHAVES_DE_TESTE_CONHECIDAS = [
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
  "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
  "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6",
  "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a",
  "0x8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63",
  "0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3",
  "0xae6ae8e5ccbfb04590405997ee2d52d2b330726137b875053c36d94e974d162f",
];

/** Devolve uma Wallet conectada para `endereco`, ou null se nenhuma chave conhecida corresponde a ele. */
function carteiraParaEndereco(endereco, provider) {
  if (!endereco) return null;
  const alvo = endereco.toLowerCase();
  for (const chave of CHAVES_DE_TESTE_CONHECIDAS) {
    if (ethers.computeAddress(chave).toLowerCase() === alvo) {
      return new ethers.Wallet(chave, provider);
    }
  }
  return null;
}

const $ = (id) => document.getElementById(id);

function mostrar(id, html, classeExtra = "") {
  const el = $(id);
  el.innerHTML = html;
  el.className = "resultado visivel" + (classeExtra ? " " + classeExtra : "");
}

function formatarTx(recibo) {
  return (
    `<div class="linha"><span>tx hash</span><span class="campo-raw">${recibo.hash}</span></div>` +
    `<div class="linha"><span>bloco</span><span>${recibo.blockNumber}</span></div>` +
    `<div class="linha"><span>gas usado</span><span>${recibo.gasUsed}</span></div>` +
    `<p class="ajuda" style="margin-top:8px">Confira este hash no block explorer da rede ou via ` +
    `<code>eth_getTransactionReceipt</code> — é a transação real, não algo que a interface só "diz" ter acontecido.</p>`
  );
}

/**
 * Conecta ao provider RPC e resolve `window.VERIFICAJUS_CONFIG`. Escreve o
 * estado da conexão em `#estadoRede` e devolve `{ provider, config }`, ou
 * `null` se a conexão falhar (o erro já fica visível na tela).
 */
async function conectar() {
  const estado = $("estadoRede");

  if (!window.VERIFICAJUS_CONFIG) {
    estado.textContent = "contracts.config.js não encontrado. Rode `npx hardhat run scripts/deploy.ts` primeiro.";
    estado.className = "erro";
    return null;
  }

  const config = window.VERIFICAJUS_CONFIG;

  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const rede = await provider.getNetwork();
    estado.innerHTML = `conectado a ${RPC_URL} · chainId ${rede.chainId} · rede "${config.network}"`;
    estado.className = "ok";
    return { provider, config };
  } catch (erro) {
    estado.textContent =
      "Não foi possível conectar em " + RPC_URL + ". A rede (hardhat node / besu) está no ar? Detalhe: " + erro.message;
    estado.className = "erro";
    return null;
  }
}

function contrato(config, nome, providerOuSigner) {
  const { endereco, abi } = config.contratos[nome];
  return new ethers.Contract(endereco, abi, providerOuSigner);
}
