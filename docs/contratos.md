# Diagrama de Classes dos Contratos — VerificaJus Sigilo

> Versão preliminar (Entrega 1). Este diagrama é ferramenta de trabalho e deve
> evoluir ao longo do projeto.

Três contratos. `AccessRegistry` é a única fonte de identidade; os outros dois leem dele
e não guardam endereços próprios.

```mermaid
classDiagram
    class AccessRegistry {
        +address admin
        -mapping~address, Papel~ _papelDe
        -mapping~address, bytes32~ _orgDe
        +registrarInstituicao(address conta, Papel papel, bytes32 orgId)
        +revogarInstituicao(address conta)
        +papelDaConta(address conta) Papel
        +orgDaConta(address conta) bytes32
        +temPapel(address conta, Papel papel) bool
    }

    class DisclosurePolicy {
        +AccessRegistry acessos
        -mapping~bytes32, bytes32[]~ _camposPorPerfil
        +definirPolitica(TipoDocumento tipo, Papel papel, bytes32[] campos)
        +camposLiberados(TipoDocumento tipo, Papel papel) bytes32[]
        +podeVerCampo(TipoDocumento tipo, Papel papel, bytes32 campo) bool
    }

    class DocumentRegistry {
        +AccessRegistry acessos
        -mapping~bytes32, Documento~ _documentos
        +issueDocument(bytes32 docId, bytes32 contentHash, bytes32 signatureHash, TipoDocumento tipo, bytes32 orgaoEmissor, uint64 expiresAt)
        +revokeDocument(bytes32 docId, bytes32 reasonCode)
        +supersedeDocument(bytes32 docIdAntigo, bytes32 docIdNovo)
        +consultStatus(bytes32 docId) Status
        +consultarDocumento(bytes32 docId) Documento
        +registrarConsulta(bytes32 docId)
    }

    class Documento {
        <<struct>>
        bytes32 contentHash
        bytes32 signatureHash
        TipoDocumento tipo
        bytes32 orgaoEmissor
        address emitidoPor
        uint64 issuedAt
        uint64 expiresAt
        CicloDeVida ciclo
        bytes32 substituidoPor
        bytes32 reasonCode
    }

    class Papel {
        <<enumeration>>
        Nenhum
        VaraEmissora
        PoliciaFederal
        CiaAerea
        ConselhoTutelar
    }

    class TipoDocumento {
        <<enumeration>>
        AlvaraViagem
        TermoGuarda
    }

    class CicloDeVida {
        <<enumeration>>
        Inexistente
        Ativo
        Revogado
        Substituido
    }

    class Status {
        <<enumeration>>
        Inexistente
        Valido
        Expirado
        Revogado
        Substituido
    }

    DocumentRegistry --> AccessRegistry : autoriza escrita
    DisclosurePolicy --> AccessRegistry : autoriza escrita
    DocumentRegistry "1" *-- "N" Documento : armazena
    Documento --> TipoDocumento
    Documento --> CicloDeVida
    DisclosurePolicy --> Papel
    AccessRegistry --> Papel
    DocumentRegistry ..> Status : deriva
```

## Eventos

| Contrato | Evento |
|---|---|
| `AccessRegistry` | `InstituicaoRegistrada(address, Papel, bytes32)` |
| `AccessRegistry` | `InstituicaoRevogada(address)` |
| `DisclosurePolicy` | `PoliticaDefinida(TipoDocumento, Papel, uint256)` |
| `DocumentRegistry` | `DocumentoEmitido(bytes32, TipoDocumento, bytes32, uint64)` |
| `DocumentRegistry` | `DocumentoRevogado(bytes32, bytes32, uint64)` |
| `DocumentRegistry` | `DocumentoSubstituido(bytes32, bytes32, uint64)` |
| `DocumentRegistry` | `ConsultaRegistrada(bytes32, bytes32, uint64)` |

## `CicloDeVida` versus `Status`

A assimetria entre os dois enums é intencional e é o ponto mais importante do modelo.

`CicloDeVida` tem quatro valores e é **persistido**. `Status` tem cinco e é
**retornado**. A diferença é `Expirado`, que não existe como estado gravado:
`consultStatus` lê o ciclo e, se ele for `Ativo` e `block.timestamp > expiresAt`,
responde `Expirado`.

Revogação e substituição têm precedência sobre expiração. Um alvará revogado que também
venceu reporta `Revogado` — é esse o fato que importa a quem confere o documento no
balcão.

## Função central desta entrega

`issueDocument` → `consultStatus` → `revokeDocument` → `consultStatus`

Uma conta autorizada da vara registra o documento; um terceiro lê o status real; a vara
revoga; a leitura seguinte do terceiro retorna `Revogado`. Nenhuma das partes acessou os
autos. É o núcleo do problema executando de ponta a ponta — coberto pela suíte em
`test/DocumentRegistry.test.ts`.

## Convenção de nomes

Substantivos de domínio em português: `Papel`, `TipoDocumento`, `CicloDeVida`,
`camposLiberados`, `orgaoEmissor`. *Alvará*, *vara* e *termo de guarda* são termos
técnicos jurídicos que perdem precisão traduzidos, e o Núcleo Jurídico precisa reconhecer
o vocabulário no código.

Verbos genéricos de ciclo de vida em inglês: `issueDocument`, `revokeDocument`,
`supersedeDocument`, `consultStatus`. Não carregam carga jurídica e seguem a convenção
de Solidity.

## Estado desta entrega

Os contratos implementam **toda** a superfície descrita acima. Um diagrama que descreve
funções inexistentes é documentação falsa, e o enunciado avisa que os diagramas serão
cobrados de novo na Entrega 3.

A suíte de testes, essa sim, é deliberadamente enxuta: cobre o caminho central e o
controle de acesso de cada contrato — `test/DocumentRegistry.test.ts`,
`test/AccessRegistry.test.ts` e `test/DisclosurePolicy.test.ts` —, nada mais. O
enunciado adia validações, tratamento de erros e casos de borda para as entregas
seguintes.
