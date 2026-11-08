// Prévias do piloto quadrado: tamanho real (720) e como fica no celular (320 px de lado, tela 2x).
// Uso: node renderizar_piloto.cjs
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const { chromium } = require('../node_modules/@playwright/test');

(async () => {
  const pasta = path.join(__dirname, 'saida', 'piloto');
  const navegador = await chromium.launch();
  for (const arquivo of fs.readdirSync(pasta).filter(f => f.endsWith('.svg'))) {
    const url = pathToFileURL(path.join(pasta, arquivo)).href;
    const real = await navegador.newPage({ viewport: { width: 720, height: 720 } });
    await real.goto(url);
    await real.screenshot({ path: path.join(pasta, arquivo.replace('.svg', '.png')) });
    const celular = await navegador.newPage({ viewport: { width: 320, height: 320 }, deviceScaleFactor: 2 });
    await celular.goto(url);
    await celular.screenshot({ path: path.join(pasta, arquivo.replace('.svg', '_celular.png')) });
  }
  await navegador.close();
})();
