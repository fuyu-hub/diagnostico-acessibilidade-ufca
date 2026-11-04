// Gera prévias em PNG dos SVGs. Uso: node renderizar.cjs
const path = require('node:path');
const fs = require('node:fs');
const { chromium } = require('../node_modules/@playwright/test');

(async () => {
  const pasta = path.join(__dirname, 'saida');
  const navegador = await chromium.launch();
  const pagina = await navegador.newPage({ viewport: { width: 1376, height: 768 } });
  for (const arquivo of fs.readdirSync(pasta).filter(f => f.endsWith('.svg'))) {
    await pagina.goto('file:///' + path.join(pasta, arquivo).replace(/\\/g, '/'));
    await pagina.screenshot({ path: path.join(pasta, arquivo.replace('.svg', '.png')) });
  }
  await navegador.close();
})();
