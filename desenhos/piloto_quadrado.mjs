// Piloto: desenho quadrado (720×720) com rótulos grandes, para ler no celular sem ampliar.
// Na tela de perguntas a ilustração aparece com ~320 px de lado (escala 0,44):
// rótulos de 38 e 30 unidades viram ~17 e ~13 px. No formato deitado atual, 21 unidades viram ~5 px.
// Uso: node piloto_quadrado.mjs  →  saida/piloto/*.svg
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { C, criarVista, texto, seta } from './lib.mjs';

const LADO = 720;
const TAM = { titulo: 38, apoio: 30 }; // menores tamanhos permitidos no formato quadrado
const AZUL = C.apoio;
const ZONA = 'rgba(11,87,164,.14)';

function documentoQuadrado({ titulo, descricao, conteudo }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${LADO} ${LADO}" role="img" aria-labelledby="t d" font-family="Inter, Arial, Helvetica, sans-serif">
<title id="t">${titulo}</title><desc id="d">${descricao}</desc>
<rect width="${LADO}" height="${LADO}" fill="#fff"/>
${conteudo}
</svg>
`;
}

/** Bloco de rótulos com linha de chamada até o ponto do desenho. */
function rotulos(x, y, linhas, alvo, fimLinha) {
  let s = `<line x1="${alvo.x.toFixed(1)}" y1="${alvo.y.toFixed(1)}" x2="${fimLinha.x}" y2="${fimLinha.y}" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += `<circle cx="${alvo.x.toFixed(1)}" cy="${alvo.y.toFixed(1)}" r="6" fill="${C.linha}"/>`;
  let yy = y;
  for (const [t, tam, peso] of linhas) {
    s += texto(x, yy, t, { tam, peso, anc: 'start' });
    yy += Math.round(tam * 1.18);
  }
  return s;
}

function calcadaFaixaLivreQuadrada() {
  // Trecho de calçada mais curto e parede mais baixa que no desenho deitado, para caber no quadrado
  const v = criarVista({ escala: 84, origem: { x: 320, y: 351 } });
  const L = 4.6, F0 = 0.15, F1 = 1.75, S1 = 2.6, RUA = 3.5, Z = 0.14, H = 1.0;
  let s = '';
  s += v.poli([[0, 0, Z], [L, 0, Z], [L, 0, Z + H], [0, 0, Z + H]], C.parede);
  s += v.poli([[0, S1, 0], [L, S1, 0], [L, RUA, 0], [0, RUA, 0]], '#8a8a8a');
  s += v.poli([[0, 0, Z], [L, 0, Z], [L, S1, Z], [0, S1, Z]], C.patamar);
  s += v.poli([[0, F1, Z], [L, F1, Z], [L, S1, Z], [0, S1, Z]], '#a9a9a9');
  s += v.poli([[0, F0, Z], [L, F0, Z], [L, F1, Z], [0, F1, Z]], ZONA, `style="stroke:${AZUL}" stroke-dasharray="11 8"`);
  s += v.poli([[0, S1, 0], [L, S1, 0], [L, S1, Z], [0, S1, Z]], C.branco);

  // Obstáculos na faixa de serviço, fora da faixa livre
  const YO = 2.15;
  s += v.caixa(0.8, 1.0, YO - 0.1, YO + 0.1, Z, Z + 1.6, { topo: '#999', frente: '#bbb', lado: '#999' });
  s += v.caixa(1.95, 2.31, YO - 0.18, YO + 0.18, Z, Z + 0.72, { topo: '#555', frente: '#777', lado: '#666' });
  s += v.caixa(3.05, 3.39, YO - 0.17, YO + 0.17, Z, Z + 0.22, { topo: '#6b4f2b', frente: '#7d5f36', lado: '#6b4f2b' });
  const copa = v.proj(3.22, YO, Z + 0.46);
  s += `<circle cx="${copa.x.toFixed(1)}" cy="${copa.y.toFixed(1)}" r="28" fill="#3f8f4f" stroke="${C.linha}" stroke-width="2.5"/>`;

  // Largura da faixa livre
  const xc = 4.05, a = v.proj(xc, F0, Z), b = v.proj(xc, F1, Z);
  s += seta(a, b, { cor: AZUL, largura: 7, ponta: 20 });

  // Rótulos no topo, em duas colunas, com chamada até o desenho
  s += rotulos(392, 62, [
    ['Faixa livre', TAM.titulo, 700],
    ['mín. 1,20 m', TAM.titulo, 700],
    ['Recomendável:', TAM.apoio, 500],
    ['1,50 m', TAM.apoio, 500],
  ], { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, { x: 470, y: 222 });

  s += rotulos(28, 62, [
    ['Poste, lixeira', TAM.titulo, 700],
    ['e vegetação', TAM.titulo, 700],
    ['sempre fora da', TAM.apoio, 500],
    ['faixa livre', TAM.apoio, 500],
  ], v.proj(0.9, YO, Z + 0.9), { x: 120, y: 222 });

  return {
    nome: 'calcada_faixa_livre_quadrada',
    svg: documentoQuadrado({
      titulo: 'Faixa livre da calçada',
      descricao: 'Calçada em perspectiva. A faixa livre, contínua e sem buracos nem obstáculos, tem largura mínima de 1,20 metro, recomendável 1,50 metro. Poste, lixeira e vegetação ficam fora dela.',
      conteudo: s,
    }),
  };
}

// ---------------------------------------------------------------------------
// Menor pergunta (itens 13, 56 e 58): largura da escada e patamares, em duas vistas empilhadas
// ---------------------------------------------------------------------------
function escadaLarguraPatamarQuadrada() {
  const W = 170; // 1,20 m
  const degraus = (x, y, l, a, vertical = false) => {
    let t = `<rect x="${x}" y="${y}" width="${l}" height="${a}" fill="${C.piso}" stroke="${C.linha}" stroke-width="2.5"/>`;
    if (vertical) for (let d = 36; d < a; d += 36) t += `<line x1="${x}" y1="${y + d}" x2="${x + l}" y2="${y + d}" stroke="${C.linha}" stroke-width="2"/>`;
    else for (let d = 36; d < l; d += 36) t += `<line x1="${x + d}" y1="${y}" x2="${x + d}" y2="${y + a}" stroke="${C.linha}" stroke-width="2"/>`;
    return t;
  };
  const patamar = (x, y, l, a) => `<rect x="${x}" y="${y}" width="${l}" height="${a}" fill="${ZONA}" stroke="${AZUL}" stroke-width="3" stroke-dasharray="11 8"/>`;
  const sentido = (p, q) => seta(p, q, { dupla: false, largura: 4, ponta: 16 });
  let s = '';

  // Vista 1: lances em linha
  const y1 = 150;
  s += texto(30, 50, 'Lances em linha · vista de cima', { tam: TAM.apoio, peso: 500, anc: 'start', halo: false });
  s += degraus(40, y1, 160, W) + patamar(200, y1, W, W) + degraus(200 + W, y1, 140, W);
  s += seta({ x: 200, y: y1 - 18 }, { x: 200 + W, y: y1 - 18 }, { largura: 3.5, ponta: 15 });
  s += texto(200 + W / 2, y1 - 34, 'Patamar mín. 1,20 m', { tam: TAM.titulo });
  s += sentido({ x: 70, y: y1 + W / 2 }, { x: 180, y: y1 + W / 2 });
  s += sentido({ x: 390, y: y1 + W / 2 }, { x: 490, y: y1 + W / 2 });
  s += seta({ x: 536, y: y1 + W }, { x: 536, y: y1 }, { largura: 3.5, ponta: 15 });
  s += texto(552, y1 + 52, 'Largura', { tam: TAM.titulo, anc: 'start' });
  s += texto(552, y1 + 94, 'mín.', { tam: TAM.apoio, peso: 500, anc: 'start' });
  s += texto(552, y1 + 140, '1,20 m', { tam: TAM.titulo, anc: 'start' });

  // Vista 2: mudança de direção
  const y2 = 470;
  s += `<line x1="30" y1="398" x2="690" y2="398" stroke="#cccccc" stroke-width="2"/>`;
  s += texto(30, 446, 'Mudança de direção', { tam: TAM.apoio, peso: 500, anc: 'start', halo: false });
  s += degraus(40, y2, 200, W) + patamar(240, y2, W, W) + degraus(240, y2 + W, W, 72, true);
  s += sentido({ x: 70, y: y2 + W / 2 }, { x: 220, y: y2 + W / 2 });
  s += sentido({ x: 240 + W / 2, y: y2 + W + 6 }, { x: 240 + W / 2, y: y2 + W + 66 });
  s += `<line x1="${240 + W}" y1="${y2 + W / 2}" x2="440" y2="${y2 + W / 2}" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += `<circle cx="${240 + W - 30}" cy="${y2 + W / 2}" r="6" fill="${C.linha}"/>`;
  s += texto(450, y2 + 60, 'Patamar', { tam: TAM.titulo, anc: 'start' });
  s += texto(450, y2 + 100, 'igual à largura', { tam: TAM.apoio, peso: 500, anc: 'start' });
  s += texto(450, y2 + 138, 'da escada', { tam: TAM.apoio, peso: 500, anc: 'start' });

  return {
    nome: 'escada_largura_patamar_quadrada',
    itens: [13, 56, 58],
    svg: documentoQuadrado({
      titulo: 'Largura da escada e patamares',
      descricao: 'Vistas de cima de escadas. A largura mínima é de 1,20 metro. Entre lances em linha, o patamar tem comprimento mínimo de 1,20 metro. Na mudança de direção, o patamar tem dimensões iguais à largura da escada.',
      conteudo: s,
    }),
  };
}

// ---------------------------------------------------------------------------
// Maior pergunta (itens 24, 27 e 28): corrimão duplo e seção, em dois painéis empilhados
// ---------------------------------------------------------------------------
function corrimaoAlturasQuadrada() {
  const S = 150; // px por metro na vista lateral
  const piso = x => (x <= 110 ? 330 : x >= 500 ? 380 : 330 + (x - 110) * 50 / 390);
  let s = '';

  // Vista lateral: rampa com corrimão duplo
  s += `<polygon points="30,330 110,330 500,380 700,380 700,410 30,410" fill="${C.piso}" stroke="${C.linha}" stroke-width="2.5"/>`;
  for (const x of [110, 300, 500, 545]) s += `<line x1="${x}" y1="${piso(x)}" x2="${x}" y2="${piso(x) - 0.92 * S}" stroke="${C.linha}" stroke-width="4"/>`;
  for (const h of [0.92, 0.70]) {
    const y0 = 330 - h * S, y1 = 380 - h * S, ext = 0.30 * S;
    s += `<path d="M ${110 - ext} ${y0 + 28} Q ${110 - ext} ${y0} ${110 - ext + 22} ${y0} L 110 ${y0} L 500 ${y1} L ${500 + ext} ${y1} Q ${500 + ext + 22} ${y1} ${500 + ext + 22} ${y1 + 28}" fill="none" stroke="${C.linha}" stroke-width="9" stroke-linecap="round"/>`;
  }
  // Alturas
  const xa = 230, xb = 470;
  s += seta({ x: xa, y: piso(xa) }, { x: xa, y: piso(xa) - 0.92 * S }, { largura: 3, ponta: 14 });
  s += texto(xa - 14, 296, '0,92 m', { tam: TAM.titulo, anc: 'end' });
  s += seta({ x: xb, y: piso(xb) }, { x: xb, y: piso(xb) - 0.70 * S }, { largura: 3, ponta: 14 });
  s += texto(xb - 14, 336, '0,70 m', { tam: TAM.titulo, anc: 'end' });
  s += texto(30, 56, 'Alturas: do topo', { tam: TAM.apoio, peso: 500, anc: 'start' });
  s += texto(30, 92, 'do corrimão ao piso', { tam: TAM.apoio, peso: 500, anc: 'start' });
  // Prolongamento
  const yp = 380 - 0.92 * S - 28;
  s += seta({ x: 500, y: yp }, { x: 545, y: yp }, { largura: 3, ponta: 10 });
  s += `<line x1="522" y1="${yp}" x2="560" y2="168" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += texto(430, 56, 'Prolonga', { tam: TAM.titulo, anc: 'start' });
  s += texto(430, 100, 'mín. 0,30 m', { tam: TAM.titulo, anc: 'start' });
  s += texto(430, 138, 'ponta recurvada', { tam: TAM.apoio, peso: 500, anc: 'start' });

  // Seção ampliada
  s += `<rect x="20" y="430" width="680" height="270" fill="#fff" stroke="${C.linha}" stroke-width="2" rx="8"/>`;
  s += `<defs><pattern id="hachura" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="10" stroke="${C.linha}" stroke-width="1.5"/></pattern></defs>`;
  const px = 50, cy = 590, r = 64, gap = 60, cx = px + 44 + gap + r;
  s += `<rect x="${px}" y="460" width="44" height="220" fill="url(#hachura)" stroke="${C.linha}" stroke-width="2"/>`;
  s += `<rect x="${px + 44}" y="${cy - 7}" width="${gap}" height="14" fill="${C.parede}" stroke="${C.linha}" stroke-width="1.5"/>`;
  s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.patamar}" stroke="${C.linha}" stroke-width="5"/>`;
  s += seta({ x: cx - r, y: cy - r - 18 }, { x: cx + r, y: cy - r - 18 }, { largura: 3, ponta: 12 });
  s += seta({ x: px + 44, y: cy + r + 22 }, { x: px + 44 + gap, y: cy + r + 22 }, { largura: 3, ponta: 10 });
  s += texto(330, 476, 'Seção (ampliada)', { tam: TAM.apoio, peso: 500, anc: 'start', cor: C.muted, halo: false });
  s += texto(330, 522, 'Diâmetro:', { tam: TAM.apoio, peso: 500, anc: 'start', halo: false });
  s += texto(330, 564, '3 cm a 4,5 cm', { tam: TAM.titulo, anc: 'start', halo: false });
  s += texto(330, 624, 'Afastamento:', { tam: TAM.apoio, peso: 500, anc: 'start', halo: false });
  s += texto(330, 666, 'mín. 4 cm', { tam: TAM.titulo, anc: 'start', halo: false });

  return {
    nome: 'corrimao_alturas_quadrada',
    itens: [24, 27, 28],
    svg: documentoQuadrado({
      titulo: 'Alturas, prolongamento e seção do corrimão',
      descricao: 'Vista lateral de rampa com corrimão duplo. O corrimão superior fica a 0,92 metro e o inferior a 0,70 metro, medidos do topo do corrimão até o piso. Os corrimãos se prolongam pelo menos 0,30 metro além do início e do término, com ponta recurvada. No detalhe, a seção circular tem diâmetro entre 3 e 4,5 centímetros e fica afastada no mínimo 4 centímetros da parede.',
      conteudo: s,
    }),
  };
}

const saida = new URL('./saida/piloto/', import.meta.url);
mkdirSync(saida, { recursive: true });

// Confere as medidas escritas contra as perguntas dos itens, como o gerar.mjs faz nos lotes
const checklist = JSON.parse(readFileSync(new URL('../src/dados/checklist.json', import.meta.url)));
const pergunta = id => checklist.itens.find(i => i.id === id).pergunta.replace(/\s+/g, '');
for (const figura of [{ itens: [2], ...calcadaFaixaLivreQuadrada() }, escadaLarguraPatamarQuadrada(), corrimaoAlturasQuadrada()]) {
  const perguntas = figura.itens.map(pergunta).join(' ');
  const textos = [...figura.svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map(m => m[1]);
  const medidas = textos.flatMap(t => t.match(/\d+(?:,\d+)?\s?(?:cm|m\b|%)/g) || []).map(m => m.replace(/\s+/g, ''));
  const faltando = medidas.filter(m => !perguntas.includes(m));
  if (faltando.length) throw new Error(`${figura.nome}: medidas que não estão nas perguntas: ${faltando.join(', ')}`);
  const tamanhos = [...figura.svg.matchAll(/font-size="([\d.]+)"/g)].map(m => +m[1]);
  writeFileSync(new URL(`${figura.nome}.svg`, saida), figura.svg);
  console.log(`${figura.nome}.svg: medidas ${[...new Set(medidas)].join(', ')} conferidas; menor rótulo ${Math.min(...tamanhos)} → ${(Math.min(...tamanhos) * 320 / LADO).toFixed(1)} px a 320 px de lado`);
}
