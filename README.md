# VerificaJus Sigilo

Validação de documentos judiciais sigilosos da Vara da Infância e da Juventude via
blockchain.

**Projeto 2** — Aplicações e Tecnologias de Registro Distribuído, UFCG 2026.1
**Núcleo Jurídico:** Ana Talita Ferreira Marinho (TJPB)
**Prova de conceito completa** — três contratos, painel administrativo, tela de
validação com exibição seletiva por perfil e cofre de PII (mock)

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

## Frontend

Duas telas estáticas, ligadas por `frontend/shared.js` (conexão com a rede, enums e
dicionário de campos) e por `frontend/cofre.mock.js` (o mock do cofre de PII — ver
[docs/arquitetura.md](docs/arquitetura.md#limitações-conhecidas)):

- **`frontend/admin.html`** — painel da Vara: emite (`issueDocument` + gera o QR Code que
  aponta para a tela de validação) e revoga (`revokeDocument`) documentos reais, e lista
  o que foi emitido nesta máquina.
- **`frontend/validar.html`** — tela pública: lê o docId do QR Code (ou colado à mão),
  deixa escolher o perfil consulente, mostra `consultStatus` e só os campos que
  `DisclosurePolicy.camposLiberados` libera àquele perfil, e assina `registrarConsulta`.

## Como executar

Requer Node.js 22+.

```bash
npm install
npx hardhat compile
npx hardhat test mocha
```

Rodar a demonstração narrada do ciclo de vida completo (implanta os contratos do zero,
expede um alvará, consulta como Polícia Federal, **mostra o conteúdo bruto do registro
on-chain** — para evidenciar que não há dado pessoal algum lá —, exibe o que cada perfil
pode ver, revoga por decisão judicial e consulta de novo):

```bash
npx hardhat run scripts/demo.ts
```

### Opção A — rede Besu da disciplina (a usada na demonstração em sala)

Requer o [`bc101-dev-env`](https://github.com/ccufcg/bc101-dev-env) rodando localmente:

```bash
docker compose --profile blockchain up -d   # dentro de bc101-dev-env
```

Depois, na pasta deste projeto:

```bash
npx hardhat run scripts/deploy.ts --network besu   # também gera frontend/contracts.config.js
npx serve frontend                                 # não abrir com file://, o fetch do config é bloqueado
```

Abra a URL impressa (ex.: `http://localhost:3000/admin.html`) e rode o fluxo: **emitir
(gera QR Code) → abrir a tela de validação pelo link do QR → consultar (Valido) →
revogar no painel → consultar de novo (Revogado)**. Cada ação mostra o hash real da
transação — confira no block explorer da rede (`http://localhost:5000`).

A conta que assina como vara emissora é uma das contas de teste públicas do
`bc101-dev-env`, configurada em `hardhat.config.ts`. Só serve para essa rede local da
disciplina; nunca reaproveitar chaves assim em produção.

### Opção B — nó local, sem depender do Besu

```bash
npx hardhat node                                       # janela 1 — nó local persistente
npx hardhat run scripts/deploy.ts --network localhost   # janela 2
npx serve frontend                                      # janela 2
```

Mesmo fluxo de antes, assinando com as contas do mnemônico padrão do Hardhat.

### Sepolia (opcional)

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

## Escopo e limitações

Entregue: os três contratos com toda a superfície do diagrama de classes; suíte de testes
cobrindo o caminho central e o controle de acesso de cada contrato; scripts de
implantação e demonstração; os dois diagramas atualizados; e o frontend completo —
painel administrativo, tela de validação com exibição seletiva por perfil, geração de QR
Code e cofre de PII (mock).

O que a solução deliberadamente **não** resolve, e por quê, está detalhado em
[docs/arquitetura.md § Limitações conhecidas](docs/arquitetura.md#limitações-conhecidas):
integração real com SEI/PJe, cofre de PII definitivo, autenticação dos consulentes
externos, gestão de chave de produção e tratamento exaustivo de casos de borda.