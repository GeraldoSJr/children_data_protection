// Gerado automaticamente por scripts/deploy.ts — não editar à mão.
// Rode novamente o deploy sempre que os contratos forem reimplantados.
window.VERIFICAJUS_CONFIG = {
  "network": "besu",
  "chainId": 1337,
  "varaEndereco": "0x627306090abaB3A6e1400e9345bC60c78a8BEf57",
  "perfis": {
    "contasDedicadas": false,
    "leitorGenerico": "0xf17f52151EbEF6C7334FAD080c5704D77216b732",
    "policiaFederal": null,
    "ciaAerea": null,
    "conselhoTutelar": null
  },
  "contratos": {
    "DocumentRegistry": {
      "endereco": "0x3Ace09BBA3b8507681146252d3Dd33cD4E2d4F63",
      "abi": [
        {
          "inputs": [
            {
              "internalType": "contract AccessRegistry",
              "name": "registroDeAcessos",
              "type": "address"
            }
          ],
          "stateMutability": "nonpayable",
          "type": "constructor"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "bytes32",
              "name": "docId",
              "type": "bytes32"
            },
            {
              "indexed": true,
              "internalType": "bytes32",
              "name": "orgConsulente",
              "type": "bytes32"
            },
            {
              "indexed": false,
              "internalType": "uint64",
              "name": "quando",
              "type": "uint64"
            }
          ],
          "name": "ConsultaRegistrada",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "bytes32",
              "name": "docId",
              "type": "bytes32"
            },
            {
              "indexed": false,
              "internalType": "enum TipoDocumento",
              "name": "tipo",
              "type": "uint8"
            },
            {
              "indexed": false,
              "internalType": "bytes32",
              "name": "orgaoEmissor",
              "type": "bytes32"
            },
            {
              "indexed": false,
              "internalType": "uint64",
              "name": "expiresAt",
              "type": "uint64"
            }
          ],
          "name": "DocumentoEmitido",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "bytes32",
              "name": "docId",
              "type": "bytes32"
            },
            {
              "indexed": false,
              "internalType": "bytes32",
              "name": "reasonCode",
              "type": "bytes32"
            },
            {
              "indexed": false,
              "internalType": "uint64",
              "name": "quando",
              "type": "uint64"
            }
          ],
          "name": "DocumentoRevogado",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "bytes32",
              "name": "docIdAntigo",
              "type": "bytes32"
            },
            {
              "indexed": true,
              "internalType": "bytes32",
              "name": "docIdNovo",
              "type": "bytes32"
            },
            {
              "indexed": false,
              "internalType": "uint64",
              "name": "quando",
              "type": "uint64"
            }
          ],
          "name": "DocumentoSubstituido",
          "type": "event"
        },
        {
          "inputs": [],
          "name": "acessos",
          "outputs": [
            {
              "internalType": "contract AccessRegistry",
              "name": "",
              "type": "address"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "bytes32",
              "name": "docId",
              "type": "bytes32"
            }
          ],
          "name": "consultStatus",
          "outputs": [
            {
              "internalType": "enum Status",
              "name": "",
              "type": "uint8"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "bytes32",
              "name": "docId",
              "type": "bytes32"
            }
          ],
          "name": "consultarDocumento",
          "outputs": [
            {
              "components": [
                {
                  "internalType": "bytes32",
                  "name": "contentHash",
                  "type": "bytes32"
                },
                {
                  "internalType": "bytes32",
                  "name": "signatureHash",
                  "type": "bytes32"
                },
                {
                  "internalType": "enum TipoDocumento",
                  "name": "tipo",
                  "type": "uint8"
                },
                {
                  "internalType": "bytes32",
                  "name": "orgaoEmissor",
                  "type": "bytes32"
                },
                {
                  "internalType": "address",
                  "name": "emitidoPor",
                  "type": "address"
                },
                {
                  "internalType": "uint64",
                  "name": "issuedAt",
                  "type": "uint64"
                },
                {
                  "internalType": "uint64",
                  "name": "expiresAt",
                  "type": "uint64"
                },
                {
                  "internalType": "enum CicloDeVida",
                  "name": "ciclo",
                  "type": "uint8"
                },
                {
                  "internalType": "bytes32",
                  "name": "substituidoPor",
                  "type": "bytes32"
                },
                {
                  "internalType": "bytes32",
                  "name": "reasonCode",
                  "type": "bytes32"
                }
              ],
              "internalType": "struct DocumentRegistry.Documento",
              "name": "",
              "type": "tuple"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "bytes32",
              "name": "docId",
              "type": "bytes32"
            },
            {
              "internalType": "bytes32",
              "name": "contentHash",
              "type": "bytes32"
            },
            {
              "internalType": "bytes32",
              "name": "signatureHash",
              "type": "bytes32"
            },
            {
              "internalType": "enum TipoDocumento",
              "name": "tipo",
              "type": "uint8"
            },
            {
              "internalType": "bytes32",
              "name": "orgaoEmissor",
              "type": "bytes32"
            },
            {
              "internalType": "uint64",
              "name": "expiresAt",
              "type": "uint64"
            }
          ],
          "name": "issueDocument",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "bytes32",
              "name": "docId",
              "type": "bytes32"
            }
          ],
          "name": "registrarConsulta",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "bytes32",
              "name": "docId",
              "type": "bytes32"
            },
            {
              "internalType": "bytes32",
              "name": "reasonCode",
              "type": "bytes32"
            }
          ],
          "name": "revokeDocument",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "bytes32",
              "name": "docIdAntigo",
              "type": "bytes32"
            },
            {
              "internalType": "bytes32",
              "name": "docIdNovo",
              "type": "bytes32"
            }
          ],
          "name": "supersedeDocument",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        }
      ]
    },
    "AccessRegistry": {
      "endereco": "0xBF921f94Fd9eF1738bE25D8CeCFDFE2C822c81B0",
      "abi": [
        {
          "inputs": [],
          "stateMutability": "nonpayable",
          "type": "constructor"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "address",
              "name": "conta",
              "type": "address"
            },
            {
              "indexed": false,
              "internalType": "enum Papel",
              "name": "papel",
              "type": "uint8"
            },
            {
              "indexed": false,
              "internalType": "bytes32",
              "name": "orgId",
              "type": "bytes32"
            }
          ],
          "name": "InstituicaoRegistrada",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "address",
              "name": "conta",
              "type": "address"
            }
          ],
          "name": "InstituicaoRevogada",
          "type": "event"
        },
        {
          "inputs": [],
          "name": "admin",
          "outputs": [
            {
              "internalType": "address",
              "name": "",
              "type": "address"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "conta",
              "type": "address"
            }
          ],
          "name": "orgDaConta",
          "outputs": [
            {
              "internalType": "bytes32",
              "name": "",
              "type": "bytes32"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "conta",
              "type": "address"
            }
          ],
          "name": "papelDaConta",
          "outputs": [
            {
              "internalType": "enum Papel",
              "name": "",
              "type": "uint8"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "conta",
              "type": "address"
            },
            {
              "internalType": "enum Papel",
              "name": "papel",
              "type": "uint8"
            },
            {
              "internalType": "bytes32",
              "name": "orgId",
              "type": "bytes32"
            }
          ],
          "name": "registrarInstituicao",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "conta",
              "type": "address"
            }
          ],
          "name": "revogarInstituicao",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "conta",
              "type": "address"
            },
            {
              "internalType": "enum Papel",
              "name": "papel",
              "type": "uint8"
            }
          ],
          "name": "temPapel",
          "outputs": [
            {
              "internalType": "bool",
              "name": "",
              "type": "bool"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        }
      ]
    },
    "DisclosurePolicy": {
      "endereco": "0xBeC8a9e485a4B75d3b14249de7CA6D124fE94795",
      "abi": [
        {
          "inputs": [
            {
              "internalType": "contract AccessRegistry",
              "name": "registroDeAcessos",
              "type": "address"
            }
          ],
          "stateMutability": "nonpayable",
          "type": "constructor"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "enum TipoDocumento",
              "name": "tipo",
              "type": "uint8"
            },
            {
              "indexed": true,
              "internalType": "enum Papel",
              "name": "papel",
              "type": "uint8"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "totalCampos",
              "type": "uint256"
            }
          ],
          "name": "PoliticaDefinida",
          "type": "event"
        },
        {
          "inputs": [],
          "name": "acessos",
          "outputs": [
            {
              "internalType": "contract AccessRegistry",
              "name": "",
              "type": "address"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "enum TipoDocumento",
              "name": "tipo",
              "type": "uint8"
            },
            {
              "internalType": "enum Papel",
              "name": "papel",
              "type": "uint8"
            }
          ],
          "name": "camposLiberados",
          "outputs": [
            {
              "internalType": "bytes32[]",
              "name": "",
              "type": "bytes32[]"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "enum TipoDocumento",
              "name": "tipo",
              "type": "uint8"
            },
            {
              "internalType": "enum Papel",
              "name": "papel",
              "type": "uint8"
            },
            {
              "internalType": "bytes32[]",
              "name": "campos",
              "type": "bytes32[]"
            }
          ],
          "name": "definirPolitica",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "enum TipoDocumento",
              "name": "tipo",
              "type": "uint8"
            },
            {
              "internalType": "enum Papel",
              "name": "papel",
              "type": "uint8"
            },
            {
              "internalType": "bytes32",
              "name": "campo",
              "type": "bytes32"
            }
          ],
          "name": "podeVerCampo",
          "outputs": [
            {
              "internalType": "bool",
              "name": "",
              "type": "bool"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        }
      ]
    }
  }
};
