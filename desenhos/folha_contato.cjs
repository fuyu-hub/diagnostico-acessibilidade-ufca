// Folha de contato: junta vários SVGs numa imagem só, para revisar um lote de uma vez.
// Uso: node folha_contato.cjs <saida.png> <largura de cada> <colunas> <arquivo.svg>...
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const [saida, largura, colunas, ...arquivos] = process.argv.slice(2);
(async () => {
  const celulas = arquivos.map(a => {
    const svg = fs.readFileSync(a, 'utf8').replace(/<\?xml[^>]*>/, '');
    return `<figure><div>${svg}</div><figcaption>${path.basename(a)}</figcaption></figure>`;
  }).join('');
  const html = `<html><body style="margin:0;padding:12px;background:#ddd;font:14px Arial">
<div style="display:grid;grid-template-columns:repeat(${colunas},${largura}px);gap:12px">${celulas}</div>
<style>figure{margin:0;background:#fff;border:1px solid #999}figure svg{width:100%;height:auto;display:block}figcaption{padding:4px 6px}</style></body></html>`;
  const navegador = await chromium.launch();
  const pagina = await navegador.newPage({ viewport: { width: colunas * (+largura + 12) + 12, height: 400 } });
  await pagina.setContent(html);
  await pagina.screenshot({ path: saida, fullPage: true });
  await navegador.close();
  console.log(saida);
})();
