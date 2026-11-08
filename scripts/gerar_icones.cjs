// Gera o ícone do app (prédio branco em fundo azul, a marca do Início) em SVG e PNG.
// Uso: node scripts/gerar_icones.cjs
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const AZUL = '#1d4ed8';
const PREDIO = 'M3 21l18 0M9 8l1 0M9 12l1 0M9 16l1 0M14 8l1 0M14 12l1 0M14 16l1 0M5 21v-16a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v16';

// escala: quanto do quadro o desenho ocupa (o maskable precisa de margem de segurança)
function svg({ cantos, escala }) {
  const lado = 512;
  const tam = lado * escala;
  const desloc = (lado - tam) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${lado} ${lado}">
<rect width="${lado}" height="${lado}" rx="${cantos}" fill="${AZUL}"/>
<g transform="translate(${desloc} ${desloc}) scale(${tam / 24})" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
<path d="${PREDIO}"/>
</g>
</svg>
`;
}

const publico = path.join(__dirname, '..', 'public');
const comum = svg({ cantos: 112, escala: 0.62 });
const mascara = svg({ cantos: 0, escala: 0.5 });
fs.writeFileSync(path.join(publico, 'favicon.svg'), comum);

(async () => {
  const navegador = await chromium.launch();
  const pagina = await navegador.newPage();
  const gerar = async (conteudo, lado, nome) => {
    await pagina.setViewportSize({ width: lado, height: lado });
    await pagina.setContent(`<html><body style="margin:0;background:transparent">${conteudo.replace('<svg ', `<svg width="${lado}" height="${lado}" `)}</body></html>`);
    await pagina.screenshot({ path: path.join(publico, nome), omitBackground: true });
  };
  await gerar(comum, 192, 'icone-192.png');
  await gerar(comum, 512, 'icone-512.png');
  await gerar(mascara, 512, 'icone-maskable-512.png');
  await gerar(comum, 180, 'apple-touch-icon.png');
  await navegador.close();
  console.log('ícones gerados em public/');
})();
