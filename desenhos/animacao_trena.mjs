// Exemplo de animação leve: medir a largura no ponto mais estreito. Feita para caber na tela do celular.
// O estado sem animação é o quadro final, usado por quem prefere movimento reduzido.
// Uso: node animacao_trena.mjs
import { writeFileSync } from 'node:fs';
import { C, criarVista } from './lib.mjs';

const v = criarVista({ escala: 92, origem: { x: 232, y: 112 } });
const COMPR = 6.2, LARG = 1.7, H = 1.05;
const X1 = 1.5, X2 = 4.1, RECUO = 0.22;
const pt = (x, y, z = 0) => { const p = v.proj(x, y, z); return `${p.x.toFixed(1)} ${p.y.toFixed(1)}`; };

const ini1 = v.proj(X1, LARG), ini2 = v.proj(X2, LARG);
const desloca = { x: (ini2.x - ini1.x).toFixed(1), y: (ini2.y - ini1.y).toFixed(1) };

const corpo = `
  <rect x="-22" y="-22" width="44" height="34" rx="7" fill="#d97706" stroke="${C.linha}" stroke-width="2.5"/>
  <circle cx="0" cy="-5" r="9" fill="#fff" stroke="${C.linha}" stroke-width="2"/>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" role="img" aria-labelledby="t d" font-family="Inter, Arial, Helvetica, sans-serif">
<title id="t">Como medir a largura de um corredor</title>
<desc id="d">Uma trena mede 1,70 metro em um trecho livre do corredor. Depois, ela é levada até um extintor na parede e mede 1,48 metro. Vale o ponto mais estreito: 1,48 metro fica abaixo do mínimo de 1,50 metro.</desc>
<style>
  .t1 { animation: t1 6.5s both ease-out; }
  .t2 { animation: t2 6.5s both ease-out; }
  .fantasma { animation: fantasma 6.5s both; }
  .corpo { animation: corpo 6.5s both ease-in-out; }
  .r1 { animation: r1 6.5s both; }
  .r2 { animation: r2 6.5s both; }
  .msg1 { animation: msg1 6.5s both; }
  .msg2 { animation: msg2 6.5s both; }
  .msg3 { animation: msg3 6.5s both; }
  .alvo { animation: alvo 6.5s both; transform-box: fill-box; transform-origin: center; }
  @keyframes t1 { 0%, 5% { stroke-dashoffset: 1; opacity: 1; } 24%, 38% { stroke-dashoffset: 0; opacity: 1; } 44%, 100% { stroke-dashoffset: 0; opacity: 0; } }
  @keyframes fantasma { 0%, 42% { opacity: 0; } 50%, 100% { opacity: 1; } }
  @keyframes t2 { 0%, 54% { stroke-dashoffset: 1; } 72%, 100% { stroke-dashoffset: 0; } }
  @keyframes corpo { 0%, 40% { transform: translate(0, 0); } 54%, 100% { transform: translate(${desloca.x}px, ${desloca.y}px); } }
  @keyframes r1 { 0%, 20% { opacity: 0; } 26%, 40% { opacity: 1; } 46%, 100% { opacity: 0; } }
  @keyframes r2 { 0%, 70% { opacity: 0; } 76%, 100% { opacity: 1; } }
  @keyframes msg1 { 0%, 2% { opacity: 0; } 6%, 40% { opacity: 1; } 45%, 100% { opacity: 0; } }
  @keyframes msg2 { 0%, 44% { opacity: 0; } 49%, 76% { opacity: 1; } 80%, 100% { opacity: 0; } }
  @keyframes msg3 { 0%, 79% { opacity: 0; } 84%, 100% { opacity: 1; } }
  @keyframes alvo { 0%, 50% { opacity: 0; transform: scale(.6); } 58%, 100% { opacity: 1; transform: scale(1); } }
  @media (prefers-reduced-motion: reduce) { * { animation: none !important; } .t1, .r1, .msg1, .msg2 { opacity: 0; } }
</style>
<rect width="800" height="600" fill="#fff"/>

${v.poli([[0, 0, 0], [COMPR, 0, 0], [COMPR, 0, H], [0, 0, H]], C.parede)}
${v.poli([[0, 0, 0], [0, LARG, 0], [0, LARG, H], [0, 0, H]], C.branco)}
${v.poli([[0, 0, 0], [COMPR, 0, 0], [COMPR, LARG, 0], [0, LARG, 0]], C.patamar)}

<g class="alvo">${v.circuloPiso(X2, RECUO / 2, 0, 0.52, `fill="rgba(217,119,6,.20)" stroke="#d97706" stroke-width="3" stroke-dasharray="9 7"`)}</g>
${v.caixa(X2 - 0.2, X2 + 0.2, 0, RECUO, 0.1, 0.95, { topo: '#fca5a5', frente: '#dc2626', lado: '#b91c1c' })}

<path class="fantasma" d="M ${pt(X1, LARG)} L ${pt(X1, 0)}" stroke="#8a8a8a" stroke-width="4" stroke-dasharray="10 8" fill="none"/>
<path class="t1" d="M ${pt(X1, LARG)} L ${pt(X1, 0)}" pathLength="1" stroke="#d97706" stroke-width="7" stroke-dasharray="1" fill="none"/>
<path class="t2" d="M ${pt(X2, LARG)} L ${pt(X2, RECUO)}" pathLength="1" stroke="#d97706" stroke-width="7" stroke-dasharray="1" fill="none"/>

${v.poli([[0, LARG, 0], [COMPR, LARG, 0], [COMPR, LARG, 0.08], [0, LARG, 0.08]], C.branco)}
${v.poli([[COMPR, 0, 0], [COMPR, LARG, 0], [COMPR, LARG, 0.08], [COMPR, 0, 0.08]], C.branco)}

<g transform="translate(${ini1.x.toFixed(1)} ${ini1.y.toFixed(1)})"><g class="corpo">${corpo}</g></g>

<g class="r1">
  <rect x="26" y="388" width="218" height="82" rx="14" fill="#fff" stroke="${C.linha}" stroke-width="3"/>
  <text x="135" y="447" font-size="50" font-weight="800" text-anchor="middle" fill="${C.cota}">1,70 m</text>
</g>
<g class="r2">
  <rect x="26" y="388" width="218" height="82" rx="14" fill="#fee2e2" stroke="#b91c1c" stroke-width="3"/>
  <text x="135" y="447" font-size="50" font-weight="800" text-anchor="middle" fill="#991b1b">1,48 m</text>
</g>

<rect x="0" y="498" width="800" height="102" fill="#14171c"/>
<g font-size="33" font-weight="700" fill="#fff" text-anchor="middle">
  <text class="msg1" x="400" y="561">Em um trecho livre, parece suficiente</text>
  <text class="msg2" x="400" y="561">Agora meça onde o corredor estreita</text>
  <text class="msg3" x="400" y="561">Vale o menor valor: abaixo de 1,50 m</text>
</g>
</svg>
`;

writeFileSync(new URL('./saida/animacao_trena_largura.svg', import.meta.url), svg);
console.log(`animacao_trena_largura.svg: ${(svg.length / 1024).toFixed(1)} KB`);
