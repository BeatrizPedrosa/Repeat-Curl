import fs from "fs";
import axios from "axios";
import { toJsonObject } from "curlconverter";
import dotenv from "dotenv";

dotenv.config();

const config = {
  retryEnable: String(process.env.RETRY_ENABLED).toLocaleLowerCase() === "true",
  retries: parseInt(process.env.MAX_RETRIES, 10) || 2,
  timeout: parseInt(process.env.TIMEOUT_MS, 10) || 0,
  logFile: "erro_log.txt"
}

const num = parseInt(process.argv[2], 10) || 1;
const curlCommand = fs.readFileSync("curl.txt", "utf-8").trim();
const options = toJsonObject(curlCommand);

async function retryCurl(options, index) {
  let attempt = 0;
  while(true){
    try {
      const response = await axios.request(
        config.timeout > 0 ? { ...options, timeout: config.timeout } : options
      );
      return response;
    } catch (error) {
      attempt++;

      if(!config.retryEnable || attempt > config.retries){
        const logMessage = `[${new Date().toISOString()}] Erro: ${error.message}\n`
        fs.appendFileSync(config.logFile, logMessage);
        throw error;
      }

      console.log(`Requisição ${index} - Tentativa ${attempt} falhou, retry...`);
    }
  }
  
}

async function executarParalelo(tries) {
  let success = 0;
  let failure = 0;

  const promises = Array.from({ length: tries }, (_, i) => retryCurl(options, i));
  const results = await Promise.allSettled(promises);
  console.log("\n")

  results.forEach((res, i) => {
    if (res.status === "fulfilled") {
      console.log(`Resposta ${i + 1}: Sucesso`);
      success++;
    } else {
      console.error(`Resposta ${i + 1}: Erro - `, res.reason.message);
      failure++;
    }
  });
  console.log(`\nResumo:`);
  console.log(`Sucesso: ${success} (${((success / tries) * 100).toFixed(1)}%)`);
  console.log(`Erro: ${failure} (${((failure / tries) * 100).toFixed(1)}%)`);
}

async function main() {
  console.log(`\nNúmero de execuções: ${num}`)
  console.log(config.retryEnable ? `Número de retentativas: ${config.retries}` : "Sem retentativas")
  console.log(config.timeout > 0 ? `Timeout: ${config.timeout}\n` : "Sem timeout\n")  
  executarParalelo(num);
}

main()