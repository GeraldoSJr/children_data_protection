# Diagrama de Arquitetura — VerificaJus Sigilo

> Versão preliminar (Entrega 1). Este diagrama é ferramenta de trabalho e deve
> evoluir ao longo do projeto.

## Visão geral

A plataforma permite que terceiros — Polícia Federal, companhias aéreas, Conselho
Tutelar — confiram a autenticidade e a vigência de alvarás de viagem e termos de guarda
expedidos sob segredo de justiça, **sem qualquer acesso aos autos**.

O princípio que organiza a arquitetura: vai para a blockchain apenas aquilo que precisa
ser inegável e verificável por quem não confia no Tribunal. Tudo que identifica uma
criança fica fora dela.

As setas grossas são as que cruzam a fronteira: é exatamente aí que se decide o que a
rede vê e o que ela nunca verá.

```mermaid
flowchart LR
    subgraph Fora["FORA DA BLOCKCHAIN"]
        direction TB
        PJe["PJe / SEI<br/>(sistema de origem)"]
        Painel["Painel da Vara<br/>emissão e revogação"]
        Emissor["Serviço Emissor<br/>hash + QR Code"]
        Cofre[("Cofre de Dados TJPB<br/>PII: nome, destino,<br/>guardião, salt")]
        Leitor["Terceiro<br/>PF / cia aérea / C. Tutelar"]
        Validacao["Página de Validação<br/>exibição seletiva"]
    end

    subgraph Cadeia["NA BLOCKCHAIN"]
        direction TB
        DR["DocumentRegistry"]
        DP["DisclosurePolicy"]
        AR["AccessRegistry"]
    end

    PJe -->|"documento assinado"| Emissor
    Painel --> Emissor
    Emissor -->|"PII + salt"| Cofre
    Leitor -->|"escaneia QR"| Validacao
    Validacao -->|"campos liberados"| Cofre

    Emissor ==>|"issueDocument"| DR
    Painel ==>|"revokeDocument"| DR
    Validacao ==>|"consultStatus"| DR
    Validacao ==>|"camposLiberados"| DP

    DR -.->|"consulta papéis"| AR
    DP -.->|"consulta papéis"| AR
```

## O que fica na blockchain

| Dado | Contrato | Por quê |
|---|---|---|
| Hash salgado do documento | `DocumentRegistry` | Prova de integridade sem revelar conteúdo |
| Hash da assinatura eletrônica | `DocumentRegistry` | Vincula o ato ao magistrado signatário |
| Tipo, órgão emissor, timestamps | `DocumentRegistry` | Conferir competência e vigência |
| Estado do ciclo de vida | `DocumentRegistry` | Impedir que revogado apareça como válido |
| Código do motivo da revogação | `DocumentRegistry` | Auditoria sem narrativa |
| Papéis institucionais | `AccessRegistry` | Definir quem emite e quem consulta |
| Campos divulgáveis por perfil | `DisclosurePolicy` | Tornar a política de sigilo auditável |
| Trilha de consultas | evento `ConsultaRegistrada` | Registro append-only de quem conferiu |

## O que fica fora da blockchain

Nome da criança ou adolescente, nome do guardião ou acompanhante, destino da viagem,
número do processo, peças processuais, e o `salt` do hash. Tudo isso permanece no cofre
do TJPB e só é exibido na página de validação, campo a campo, conforme a política que o
`DisclosurePolicy` publica.

## Fluxo de validação

1. O terceiro escaneia o QR Code impresso no documento. O QR carrega apenas o `docId`
   opaco — não leva a lugar nenhum dentro do processo.
2. A página de validação chama `consultStatus(docId)` e obtém `Valido`, `Expirado`,
   `Revogado`, `Substituido` ou `Inexistente`.
3. A página chama `camposLiberados(tipo, papel)` para saber o que o perfil daquele
   consulente pode ver.
4. Só então busca no cofre os valores desses campos — e apenas deles.
5. `registrarConsulta(docId)` emite o evento que compõe a trilha de auditoria.

A vara não é contatada em nenhum momento. É esse o ganho operacional.

## Três decisões de projeto

**O hash é salgado.** `contentHash = keccak256(documento ‖ salt)`, com o salt no cofre.
Um alvará de viagem é um documento de baixa entropia: modelo fixo, poucos destinos
plausíveis, faixa estreita de datas. Um hash não-salgado permitiria a qualquer leitor da
rede testar hipóteses até casar o hash e descobrir o conteúdo. O salt custa nada e fecha
o vazamento.

**O motivo da revogação é código, não texto livre.** `bytes32 reasonCode`, resolvido
para texto fora da cadeia. Gravar *"revogado por suspeita de subtração de incapaz"* em
ledger imutável violaria exatamente o segredo de justiça que o sistema existe para
proteger — e seria irreversível.

**`Expirado` é derivado na leitura, nunca armazenado.** Persistir a expiração exigiria
alguém pagando gas para virar o estado de cada documento no seu vencimento. Esse alguém
não existe, e enquanto ele não passa o documento vencido continua se declarando válido.
`consultStatus` compara `expiresAt` com `block.timestamp` e responde a verdade sempre.

## Rede

A proposta do Núcleo Jurídico indica **blockchain permissionada**, pela natureza sigilosa
dos processos da infância e juventude. O protótipo roda em Hardhat Network — listada no
enunciado como rede de testes aceita — com a configuração de Sepolia já pronta em
`hardhat.config.ts`.

Nada no código depende de rede permissionada: o modelo de privacidade não pressupõe que
a cadeia seja privada. Hash salgado, motivo codificado e ausência de PII fazem os
registros serem seguros mesmo em rede pública. A rede permissionada é defesa em
profundidade, não a defesa principal.

## Onde cada peça mora no código

| Componente do diagrama | Arquivo |
|---|---|
| Painel da Vara | `frontend/admin.html` + `frontend/admin.js` |
| Serviço Emissor (hash + QR Code) | `frontend/admin.js` (gera o hash salgado e o QR ao emitir) |
| Cofre de Dados TJPB | `frontend/cofre.mock.js` — mock em localStorage, não o cofre definitivo |
| Página de Validação | `frontend/validar.html` + `frontend/validar.js` |
| Código comum (rede, contratos, campos) | `frontend/shared.js` |

## Fora do escopo desta entrega

A integração real com PJe/SEI e o cofre de PII definitivo do TJPB seguem fora do
escopo: o protótipo usa `frontend/cofre.mock.js`, um mock em localStorage do navegador,
no lugar do serviço com controle de acesso próprio que o TJPB operaria em produção. O
mock é suficiente para demonstrar a fronteira do modelo — o que sai da blockchain e como
a página de validação exibe só os campos liberados —, mas não é código de produção.
