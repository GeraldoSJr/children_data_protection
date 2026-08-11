/**
 * Lista todos os eventos já emitidos pelo DocumentRegistry atualmente
 * implantado (endereço lido de frontend/contracts.config.js).
 *
 *   npx hardhat run scripts/eventos.ts --network besu
 *   npx hardhat run scripts/eventos.ts --network localhost
 *
 * Não lê nada por chamada de função (os contratos não expõem getter de
 * histórico — ver docs/arquitetura.md, "Trilha de consultas"); em vez disso
 * varre os logs da rede com eth_getLogs, que é como esse tipo de dado
 * append-only é consultado on-chain.
 */
import { network } from "hardhat";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function lerConfig() {
  const caminho = path.join(__dirname, "..", "frontend", "contracts.config.js");
  const bruto = await readFile(caminho, "utf8");
  const json = bruto
    .replace(/^\/\/.*$/gm, "")
    .replace(/window\.VERIFICAJUS_CONFIG\s*=\s*/, "")
    .replace(/;\s*$/, "");
  return JSON.parse(json);
}

async function main() {
  const { ethers } = await network.getOrCreate();
  const config = await lerConfig();

  const { endereco, abi } = config.contratos.DocumentRegistry;
  const contrato = new ethers.Contract(endereco, abi, ethers.provider);

  console.log(`DocumentRegistry em ${endereco} (rede "${config.network}", chainId ${config.chainId})\n`);

  const logs = await ethers.provider.getLogs({
    address: endereco,
    fromBlock: 0,
    toBlock: "latest",
  });

  if (logs.length === 0) {
    console.log("Nenhum evento emitido ainda.");
    return;
  }

  console.log(`${logs.length} evento(s):\n`);

  for (const log of logs) {
    const evento = contrato.interface.parseLog(log);
    if (!evento) {
      console.log(`[bloco ${log.blockNumber}] evento desconhecido — tx ${log.transactionHash}`);
      continue;
    }

    const args = evento.fragment.inputs
      .map((entrada, i) => {
        let valor = evento.args[i];
        if (entrada.name === "quando" || (entrada.type === "uint64" && /^\d+$/.test(String(valor)))) {
          const numero = Number(valor);
          valor = `${valor} (${numero > 0 ? new Date(numero * 1000).toLocaleString("pt-BR") : "0"})`;
        }
        return `${entrada.name}=${valor}`;
      })
      .join(", ");

    console.log(`[bloco ${log.blockNumber}] ${evento.name}(${args})`);
    console.log(`    tx: ${log.transactionHash}\n`);
  }
}

main().catch((erro) => {
  console.error(erro);
  process.exitCode = 1;
});
