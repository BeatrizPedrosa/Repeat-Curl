import fs from "fs";
import axios from "axios";
import { toJsonObject } from "curlconverter";

const quantidade = parseInt(process.argv[2], 10) || 1;
const curlCommand = fs.readFileSync("curl.txt", "utf-8").trim();
const options = toJsonObject(curlCommand);

async function executarParalelo(vezes) {
  let sucesso = 0;
  let erro = 0;

  const promises = Array.from({ length: vezes }, () => axios.request(options));

  const resultados = await Promise.allSettled(promises);

  resultados.forEach((res, i) => {
    if (res.status === "fulfilled") {
      console.log(`Resposta ${i + 1}: Sucesso`);
      sucesso++;
    } else {
      console.error(`Resposta ${i + 1}: Erro - `, res.reason.message);
      erro++;
    }
  });
  console.log(`\nResumo:`);
  console.log(`Sucesso: ${sucesso} (${((sucesso / vezes) * 100).toFixed(1)}%)`);
  console.log(`Erro: ${erro} (${((erro / vezes) * 100).toFixed(1)}%)`);
}

executarParalelo(quantidade);