// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Papel, TipoDocumento} from "./Tipos.sol";
import {AccessRegistry} from "./AccessRegistry.sol";

/// @title DisclosurePolicy
/// @notice Define, de forma pública e auditável, quais campos de cada espécie de
/// documento um dado perfil institucional pode visualizar na página de validação.
/// @dev Aqui ficam apenas os NOMES dos campos liberados. Os valores desses campos
/// permanecem no cofre off-chain do TJPB e nunca tocam a blockchain.
contract DisclosurePolicy {
    AccessRegistry public immutable acessos;

    mapping(bytes32 => bytes32[]) private _camposPorPerfil;

    event PoliticaDefinida(TipoDocumento indexed tipo, Papel indexed papel, uint256 totalCampos);

    modifier apenasAdmin() {
        require(msg.sender == acessos.admin(), "DisclosurePolicy: apenas admin");
        _;
    }

    constructor(AccessRegistry registroDeAcessos) {
        acessos = registroDeAcessos;
    }

    function _chave(TipoDocumento tipo, Papel papel) private pure returns (bytes32) {
        return keccak256(abi.encodePacked(uint8(tipo), uint8(papel)));
    }

    /// @notice Substitui a política de divulgação de um par (tipo, perfil).
    function definirPolitica(
        TipoDocumento tipo,
        Papel papel,
        bytes32[] calldata campos
    ) external apenasAdmin {
        _camposPorPerfil[_chave(tipo, papel)] = campos;
        emit PoliticaDefinida(tipo, papel, campos.length);
    }

    function camposLiberados(TipoDocumento tipo, Papel papel) external view returns (bytes32[] memory) {
        return _camposPorPerfil[_chave(tipo, papel)];
    }

    function podeVerCampo(TipoDocumento tipo, Papel papel, bytes32 campo) external view returns (bool) {
        bytes32[] storage campos = _camposPorPerfil[_chave(tipo, papel)];
        for (uint256 i = 0; i < campos.length; i++) {
            if (campos[i] == campo) {
                return true;
            }
        }
        return false;
    }
}
