import { configVariable, type HardhatUserConfig } from "hardhat/config";
import hardhatToolboxMochaEthers from "@nomicfoundation/hardhat-toolbox-mocha-ethers";

const config: HardhatUserConfig = {
  plugins: [hardhatToolboxMochaEthers],
  solidity: {
  version: "0.8.28",
  settings: {
    optimizer: { enabled: true, runs: 200 },
    evmVersion: "london",
  },
},
  networks: {
    // Rede local usada nesta entrega. O enunciado lista a Hardhat Network
    // explicitamente como rede de testes aceita.
    hardhatOp: {
      type: "edr-simulated",
      chainType: "l1",
    },
    // Rede da disciplina (bc101-dev-env, Hyperledger Besu).
    // As chaves abaixo são as contas de teste publicadas no README do próprio
    // ambiente (github.com/ccufcg/bc101-dev-env) — não são segredo, servem só
    // para a rede local da turma. NUNCA reaproveitar chaves assim fora de um
    // ambiente de desenvolvimento descartável.
    besu: {
      type: "http",
      chainType: "l1",
      url: "http://127.0.0.1:8545",
      accounts: [
        // conta 0 — assume o papel de admin (TJPB) no deploy.ts
        "0x8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63",
        // conta 1 — assume o papel de vara emissora no deploy.ts
        "0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3",
      ],
    },
    sepolia: {
      type: "http",
      chainType: "l1",
      url: configVariable("SEPOLIA_RPC_URL"),
      accounts: [configVariable("PRIVATE_KEY")],
    },
  },
};

export default config;
