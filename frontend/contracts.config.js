// Gerado automaticamente por scripts/deploy.ts — não editar à mão.
// Rode novamente o deploy sempre que os contratos forem reimplantados.
window.VERIFICAJUS_CONFIG = {
  "network": "besu",
  "chainId": 1337,
  "varaEndereco": "0x627306090abaB3A6e1400e9345bC60c78a8BEf57",
  "contratos": {
    "DocumentRegistry": {
      "endereco": "0x9a3DBCa554e9f6b9257aAa24010DA8377C57c17e",
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
      "endereco": "0x42699A7612A82f1d9C36148af9C77354759b210b",
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
    }
  }
};
