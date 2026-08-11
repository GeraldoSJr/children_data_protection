# VerificaJus Sigilo

Validação de documentos judiciais sigilosos da Vara da Infância e da Juventude via
blockchain.

**Projeto 2** — Aplicações e Tecnologias de Registro Distribuído, UFCG 2026.1
**Núcleo Jurídico:** Ana Talita Ferreira Marinho (TJPB)
**Entrega 3** — painel administrativo, tela de validação e cofre de PII (mock)

## O problema

Alvarás de viagem e termos de guarda expedidos em processos sob segredo de justiça não
podem ser validados por terceiros — Polícia Federal, companhias aéreas, cartórios,
Conselho Tutelar — sem expor dados sensíveis de crianças e adolescentes.

O QR Code atual confirma a assinatura eletrônica, mas não responde à pergunta prática de
quem está no balcão: *este alvará ainda vale? foi revogado? é esta a criança autorizada?*
Responder isso hoje exige contatar a vara.

## A solução

A blockchain guarda o que precisa ser inegável: o hash salgado do documento, quem o
emitiu, quando vence, e em que estado está. O que identifica uma criança nunca chega
até ela.

Ao escanear o QR Code, o terceiro cai numa página de validação que consulta o status na
cadeia e exibe **apenas** os campos que o perfil dele pode ver — política essa que
também está publicada na cadeia, e portanto é auditável. A vara não é contatada.

## Diagramas

- [Arquitetura da solução](docs/arquitetura.md) — componentes, comunicação, e a fronteira
  entre o que fica na blockchain e o que fica fora dela.
- [Classes dos contratos](docs/contratos.md) — contratos, atributos, funções e relações.

## Contratos

| Contrato | Papel |
|---|---|
| `AccessRegistry` | Fonte única de identidade institucional: quem emite, quem consulta |
| `DisclosurePolicy` | Quais campos cada perfil pode ver, por espécie de documento |
| `DocumentRegistry` | Núcleo: hash, integridade e ciclo de vida do documento |

### Função central

```
issueDocument → consultStatus → revokeDocument → consultStatus
```

A vara registra o alvará; a Polícia Federal lê `Valido`; a vara revoga por decisão
judicial; a leitura seguinte da Polícia Federal retorna `Revogado`. Ninguém acessou os
autos em nenhum momento.

## Como executar

Requer Node.js 22+.

```bash
npm install
```

Compilar os contratos:

```bash
npx hardhat compile
```

Rodar os testes:

```bash
npx hardhat test mocha
```

Rodar a demonstração narrada do ciclo de vida completo:

```bash
npx hardhat run scripts/demo.ts
```

O roteiro implanta os contratos do zero, expede um alvará, consulta o status como
Polícia Federal, **mostra o conteúdo bruto do registro on-chain** — para evidenciar que
não há dado pessoal algum lá —, exibe o que cada perfil pode ver, revoga por decisão
judicial e consulta de novo. É reproduzível diante da banca e funciona igual na Sepolia.

Implantar na Hardhat Network e registrar a vara e as políticas de divulgação:

```bash
npx hardhat run scripts/deploy.ts
```

Saída esperada:

```
VerificaJus Sigilo — contratos implantados
  admin (TJPB)       0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
  vara emissora      0x70997970C51812dc3A010C7d01b50e0d17dc79C8
  AccessRegistry     0x5FbDB2315678afecb367f032d93F642f64180aa3
  DisclosurePolicy   0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
  DocumentRegistry   0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
```

### Sepolia

A rede está configurada em `hardhat.config.ts` e precisa de duas variáveis:

```bash
npx hardhat keystore set SEPOLIA_RPC_URL
npx hardhat keystore set PRIVATE_KEY
npx hardhat run scripts/deploy.ts --network sepolia
```

## Estrutura

```
contracts/               Tipos.sol, AccessRegistry, DisclosurePolicy, DocumentRegistry
test/                    Suíte de cada contrato (ciclo de vida, identidade, política)
scripts/deploy.ts        Implantação e configuração inicial (+ exporta config pro frontend)
scripts/demo.ts          Roteiro narrado de demonstração
frontend/admin.html/.js  Painel da Vara — emissão, revogação, QR Code
frontend/validar.html/.js Tela de validação — status + campos liberados por perfil
frontend/cofre.mock.js   Cofre de PII (mock em localStorage) — ver docs/arquitetura.md
frontend/shared.js       Conexão com a rede, enums e dicionário de campos, comuns às duas telas
docs/                    Diagramas de arquitetura e de classes
docs/initial_info/       Enunciado e proposta original do Núcleo Jurídico
```

## Entrega 2 — tela conectada à rede Besu da disciplina

Requer a rede [`bc101-dev-env`](https://github.com/ccufcg/bc101-dev-env) rodando localmente
(`docker compose --profile blockchain up -d`).

1. Implantar os contratos na rede Besu — isso também gera `frontend/contracts.config.js`
   com os endereços e o ABI atuais:

   ```bash
   npx hardhat run scripts/deploy.ts --network besu
   ```

2. Servir a pasta `frontend/` como estático (não abrir os arquivos direto com `file://`,
   o navegador bloqueia o `fetch` do script de config):

   ```bash
   npx serve frontend
   # ou: python3 -m http.server 8080 --directory frontend
   ```

3. Abrir a URL impressa (ex.: `http://localhost:3000/admin.html`) e rodar o fluxo:
   **emitir (gera QR Code) → abrir a tela de validação pelo link do QR → consultar
   (Valido) → revogar no painel → consultar de novo (Revogado)**. Cada ação mostra o
   hash real da transação — confira no block explorer da rede (`http://localhost:5000`)
   durante a apresentação.

A conta que assina como vara emissora é a mesma configurada em `hardhat.config.ts` para a
rede `besu` — uma das contas de teste públicas do `bc101-dev-env`. É só para esta rede
local da disciplina; nunca reaproveitar chaves assim em produção.

## Entrega 3 — painel administrativo, tela de validação e QR Code

O frontend agora tem duas telas, ligadas por `frontend/shared.js` (conexão com a rede,
enums e dicionário de campos) e por `frontend/cofre.mock.js` (o mock do cofre de PII —
ver [docs/arquitetura.md](docs/arquitetura.md#onde-cada-peça-mora-no-código)):

- **`frontend/admin.html`** — painel da Vara: emite (`issueDocument` + gera o QR Code que
  aponta para a tela de validação) e revoga (`revokeDocument`) documentos reais, e lista
  o que foi emitido nesta máquina.
- **`frontend/validar.html`** — tela pública: lê o docId do QR Code (ou colado à mão),
  deixa escolher o perfil consulente, mostra `consultStatus` e só os campos que
  `DisclosurePolicy.camposLiberados` libera àquele perfil, e assina `registrarConsulta`.

Para rodar localmente (sem depender da rede Besu da disciplina):

```bash
npx hardhat node                                        # janela 1 — nó local persistente
npx hardhat run scripts/deploy.ts --network localhost    # janela 2
npx serve frontend                                       # janela 2 — ou http-server/http.server
```

Abra `admin.html`, emita um alvará (preenchendo os campos de PII, que vão só para o
`localStorage` desta máquina) e siga o link "abrir tela de validação" gerado junto do QR
Code. `frontend/shared.js` assina as transações com as chaves de teste públicas do
mnemônico padrão do Hardhat (contas 0–4) ou, na rede `besu`, com as contas do
`bc101-dev-env` — nunca chaves de produção.

## Escopo desta entrega

Entregue: os três contratos com toda a superfície do diagrama de classes; suíte de testes
cobrindo o caminho central e o controle de acesso de cada contrato; script de
implantação; os dois diagramas; e o frontend completo — painel administrativo, tela de
validação com exibição seletiva por perfil, geração de QR Code e cofre de PII (mock).

Ainda não entregue, por decisão de escopo: a integração real com SEI/PJe e o cofre de PII
definitivo do TJPB (o mock em `frontend/cofre.mock.js` cobre a demonstração, não é código
de produção). Validações exaustivas e tratamento de erros de borda também ficam uma possível integração real.