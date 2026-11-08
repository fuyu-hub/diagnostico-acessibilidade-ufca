// Publica ilustrações quadradas aprovadas: SVG no app (public/imagens/quadradas) e SVG + PNG em aprovadas/quadradas.
// Depois, acrescente os nomes em src/dados/ilustracoes.js (ILUSTRACOES_QUADRADAS).
// Uso: node publicar_quadradas.cjs <pasta de origem> <nome>...
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const { chromium } = require('../node_modules/@playwright/test');

const [origem, ...nomes] = process.argv.slice(2);
const app = path.join(__dirname, '..', 'public', 'imagens', 'quadradas');
const aprovadas = path.join(__dirname, 'aprovadas', 'quadradas');
fs.mkdirSync(app, { recursive: true });
fs.mkdirSync(aprovadas, { recursive: true });

(async () => {
  const navegador = await chromium.launch();
  const pagina = await navegador.newPage({ viewport: { width: 720, height: 720 } });
  for (const nome of nomes) {
    const svg = path.join(origem, `${nome}.svg`);
    if (!fs.existsSync(svg)) throw new Error(`Não achei ${svg}`);
    fs.copyFileSync(svg, path.join(app, `${nome}.svg`));
    fs.copyFileSync(svg, path.join(aprovadas, `${nome}.svg`));
    await pagina.goto(pathToFileURL(svg).href);
    await pagina.screenshot({ path: path.join(aprovadas, `${nome}.png`) });
    console.log('publicada', nome);
  }
  await navegador.close();
})();
