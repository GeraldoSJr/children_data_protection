// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Papel, TipoDocumento, CicloDeVida, Status} from "./Tipos.sol";
import {AccessRegistry} from "./AccessRegistry.sol";

/// @title DocumentRegistry
/// @notice Núcleo do VerificaJus Sigilo: registra a existência, a integridade e o
/// ciclo de vida de alvarás de viagem e termos de guarda expedidos sob segredo de
/// justiça, sem gravar qualquer dado pessoal.
contract DocumentRegistry {
    /// @dev `contentHash` é SALGADO: keccak256(documento ‖ salt), com o salt
    /// guardado no cofre off-chain. Um hash não-salgado de documento de baixa
    /// entropia seria vulnerável a ataque de dicionário por qualquer leitor da rede.
    struct Documento {
        bytes32 contentHash;
        bytes32 signatureHash;
        TipoDocumento tipo;
        bytes32 orgaoEmissor;
        address emitidoPor;
        uint64 issuedAt;
        uint64 expiresAt;
        CicloDeVida ciclo;
        bytes32 substituidoPor;
        bytes32 reasonCode;
    }

    AccessRegistry public immutable acessos;

    mapping(bytes32 => Documento) private _documentos;

    event DocumentoEmitido(bytes32 indexed docId, TipoDocumento tipo, bytes32 orgaoEmissor, uint64 expiresAt);
    event DocumentoRevogado(bytes32 indexed docId, bytes32 reasonCode, uint64 quando);
    event DocumentoSubstituido(bytes32 indexed docIdAntigo, bytes32 indexed docIdNovo, uint64 quando);
    event ConsultaRegistrada(bytes32 indexed docId, bytes32 indexed orgConsulente, uint64 quando);

    modifier apenasVaraEmissora() {
        require(
            acessos.temPapel(msg.sender, Papel.VaraEmissora),
            "DocumentRegistry: apenas vara emissora"
        );
        _;
    }

    constructor(AccessRegistry registroDeAcessos) {
        acessos = registroDeAcessos;
    }

    /// @notice Registra a emissão de um documento judicial.
    /// @param docId Identificador opaco impresso no QR Code.
    /// @param contentHash keccak256(documento ‖ salt).
    /// @param signatureHash Hash da assinatura eletrônica do magistrado.
    /// @param expiresAt Fim da validade em unix time; 0 significa sem prazo.
    function issueDocument(
        bytes32 docId,
        bytes32 contentHash,
        bytes32 signatureHash,
        TipoDocumento tipo,
        bytes32 orgaoEmissor,
        uint64 expiresAt
    ) external apenasVaraEmissora {
        _documentos[docId] = Documento({
            contentHash: contentHash,
            signatureHash: signatureHash,
            tipo: tipo,
            orgaoEmissor: orgaoEmissor,
            emitidoPor: msg.sender,
            issuedAt: uint64(block.timestamp),
            expiresAt: expiresAt,
            ciclo: CicloDeVida.Ativo,
            substituidoPor: bytes32(0),
            reasonCode: bytes32(0)
        });

        emit DocumentoEmitido(docId, tipo, orgaoEmissor, expiresAt);
    }

    /// @notice Revoga um documento por determinação judicial.
    /// @param reasonCode Motivo como CÓDIGO, jamais texto livre: gravar a razão de
    /// uma revogação em ledger imutável violaria o segredo de justiça que o sistema
    /// existe para proteger.
    function revokeDocument(bytes32 docId, bytes32 reasonCode) external apenasVaraEmissora {
        Documento storage doc = _documentos[docId];
        doc.ciclo = CicloDeVida.Revogado;
        doc.reasonCode = reasonCode;

        emit DocumentoRevogado(docId, reasonCode, uint64(block.timestamp));
    }

    /// @notice Marca um documento como substituído por outro já emitido.
    function supersedeDocument(bytes32 docIdAntigo, bytes32 docIdNovo) external apenasVaraEmissora {
        Documento storage doc = _documentos[docIdAntigo];
        doc.ciclo = CicloDeVida.Substituido;
        doc.substituidoPor = docIdNovo;

        emit DocumentoSubstituido(docIdAntigo, docIdNovo, uint64(block.timestamp));
    }

    /// @notice Situação atual do documento, do ponto de vista do consulente.
    /// @dev `Expirado` é DERIVADO aqui, nunca persistido: dispensa um keeper que
    /// ninguém operaria e elimina a janela em que um alvará vencido ainda se
    /// declararia válido. Revogação e substituição têm precedência sobre expiração,
    /// porque é esse o fato que importa a quem confere o documento no balcão.
    function consultStatus(bytes32 docId) public view returns (Status) {
        Documento storage doc = _documentos[docId];

        if (doc.ciclo == CicloDeVida.Inexistente) {
            return Status.Inexistente;
        }
        if (doc.ciclo == CicloDeVida.Revogado) {
            return Status.Revogado;
        }
        if (doc.ciclo == CicloDeVida.Substituido) {
            return Status.Substituido;
        }
        if (doc.expiresAt != 0 && block.timestamp > doc.expiresAt) {
            return Status.Expirado;
        }
        return Status.Valido;
    }

    function consultarDocumento(bytes32 docId) external view returns (Documento memory) {
        return _documentos[docId];
    }

    /// @notice Registra que uma instituição consultou o documento via QR Code.
    /// @dev Evento, não escrita em storage: a trilha de consultas é append-only e
    /// nunca precisa ser lida on-chain, então pagar por SSTORE seria desperdício.
    function registrarConsulta(bytes32 docId) external {
        emit ConsultaRegistrada(docId, acessos.orgDaConta(msg.sender), uint64(block.timestamp));
    }
}
