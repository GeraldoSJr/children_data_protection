// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @notice Perfis institucionais reconhecidos pela plataforma.
/// `VaraEmissora` escreve; os demais apenas consultam.
enum Papel {
    Nenhum,
    VaraEmissora,
    PoliciaFederal,
    CiaAerea,
    ConselhoTutelar
}

/// @notice Espécies de documento judicial suportadas.
enum TipoDocumento {
    AlvaraViagem,
    TermoGuarda
}

/// @notice Estado persistido do documento.
/// Note que `Expirado` NÃO aparece aqui: expiração é derivada na leitura,
/// comparando `expiresAt` com o timestamp do bloco.
enum CicloDeVida {
    Inexistente,
    Ativo,
    Revogado,
    Substituido
}

/// @notice Situação retornada ao consulente.
enum Status {
    Inexistente,
    Valido,
    Expirado,
    Revogado,
    Substituido
}
