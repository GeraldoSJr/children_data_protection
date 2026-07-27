// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Papel} from "./Tipos.sol";

/// @title AccessRegistry
/// @notice Fonte única de identidade institucional da plataforma.
/// @dev Os demais contratos não guardam endereços próprios: perguntam aqui.
contract AccessRegistry {
    address public admin;

    mapping(address => Papel) private _papelDe;
    mapping(address => bytes32) private _orgDe;

    event InstituicaoRegistrada(address indexed conta, Papel papel, bytes32 orgId);
    event InstituicaoRevogada(address indexed conta);

    modifier apenasAdmin() {
        require(msg.sender == admin, "AccessRegistry: apenas admin");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    /// @notice Vincula uma conta a um perfil institucional.
    /// @param orgId Identificador da instituição (ex.: keccak256("PF-PB")).
    function registrarInstituicao(address conta, Papel papel, bytes32 orgId) external apenasAdmin {
        _papelDe[conta] = papel;
        _orgDe[conta] = orgId;
        emit InstituicaoRegistrada(conta, papel, orgId);
    }

    function revogarInstituicao(address conta) external apenasAdmin {
        _papelDe[conta] = Papel.Nenhum;
        _orgDe[conta] = bytes32(0);
        emit InstituicaoRevogada(conta);
    }

    function papelDaConta(address conta) external view returns (Papel) {
        return _papelDe[conta];
    }

    function orgDaConta(address conta) external view returns (bytes32) {
        return _orgDe[conta];
    }

    function temPapel(address conta, Papel papel) external view returns (bool) {
        return _papelDe[conta] == papel;
    }
}
