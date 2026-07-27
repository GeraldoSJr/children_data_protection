import { configVariable, type HardhatUserConfig } from "hardhat/config";
import hardhatToolboxMochaEthers from "@nomicfoundation/hardhat-toolbox-mocha-ethers";

const config: HardhatUserConfig = {
  plugins: [hardhatToolboxMochaEthers],
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    // Rede local usada nesta entrega. O enunciado lista a Hardhat Network
    // explicitamente como rede de testes aceita.
    hardhatOp: {
      type: "edr-simulated",
      chainType: "l1",
    },
    // Pronta para a Entrega 3: basta preencher o .env e financiar a conta.
    sepolia: {
      type: "http",
      chainType: "l1",
      url: configVariable("SEPOLIA_RPC_URL"),
      accounts: [configVariable("PRIVATE_KEY")],
    },
  },
};

export default config;
