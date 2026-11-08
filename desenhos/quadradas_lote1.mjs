// Lote 1 das ilustrações quadradas (720×720), para o celular e as telas em pé.
// Os 12 primeiros desenhos na ordem do checklist, sem os 3 pilotos.
// Regras: rótulos de 38 (títulos e medidas) e 30 (apoio); medidas iguais às das perguntas.
// Uso: node quadradas_lote1.mjs  →  saida/quadradas/*.svg
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { C, texto, seta } from './lib.mjs';
// Rebaixamento, sinal visual e rampa mantêm a perspectiva do original
import { rebaixamentoCalcada, escadaSinalVisual, rampaDimensoes } from './quadradas_perspectiva.mjs';

const LADO = 720;
const T = 38; // títulos e medidas
const A = 30; // texto de apoio
const AZUL = C.apoio;
const ZONA = 'rgba(11,87,164,.14)';
const VERDE = '#1e7a3d';
const VERMELHO = '#b42020';
const LARANJA = '#b45309';
const RUA = '#8a8a8a';

function documento({ titulo, descricao, conteudo }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${LADO} ${LADO}" role="img" aria-labelledby="t d" font-family="Inter, Arial, Helvetica, sans-serif">
<title id="t">${titulo}</title><desc id="d">${descricao}</desc>
<rect width="${LADO}" height="${LADO}" fill="#fff"/>
${conteudo}
</svg>
`;
}

// Atalhos de texto: título/medida (38) e apoio (30)
const tt = (x, y, s, o = {}) => texto(x, y, s, { tam: T, anc: 'start', ...o });
const ta = (x, y, s, o = {}) => texto(x, y, s, { tam: A, peso: 500, anc: 'start', ...o });
const ret = (x, y, l, a, fill, extra = '') => `<rect x="${x}" y="${y}" width="${l}" height="${a}" fill="${fill}" stroke="${C.linha}" stroke-width="2.5" ${extra}/>`;
const linha = (x1, y1, x2, y2, l = 2.5, cor = C.linha, extra = '') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${cor}" stroke-width="${l}" ${extra}/>`;
const tracejada = (x1, y1, x2, y2) => linha(x1, y1, x2, y2, 2.5, C.linha, 'stroke-dasharray="10 8"');
// Texto girado (cotas verticais)
const vertical = (x, y, s, tam = T) => `<text x="${x}" y="${y}" font-size="${tam}" font-weight="700" text-anchor="middle" fill="${C.cota}" transform="rotate(-90 ${x} ${y})">${s}</text>`;
// Sinais de certo e errado desenhados (não dependem só da cor)
const certo = (x, y, cor = '#fff') => `<path d="M ${x} ${y} l 9 9 l 17 -19" fill="none" stroke="${cor}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`;
const errado = (x, y, cor = '#fff') => `<path d="M ${x} ${y - 9} l 18 18 M ${x + 18} ${y - 9} l -18 18" fill="none" stroke="${cor}" stroke-width="5" stroke-linecap="round"/>`;

// Piso tátil em vista de cima
function alertaCima(x, y, l, a) {
  let s = ret(x, y, l, a, C.tatil, 'stroke-width="2"');
  for (let i = x + 10; i < x + l - 4; i += 20) for (let j = y + 10; j < y + a - 4; j += 20) s += `<circle cx="${i}" cy="${j}" r="5" fill="${C.relevo}"/>`;
  return s;
}
function direcionalCima(x, y, l, a, horizontal = true) {
  let s = ret(x, y, l, a, C.tatil, 'stroke-width="2"');
  if (horizontal) for (let j = y + 8; j < y + a - 4; j += 12) for (let i = x + 6; i < x + l - 10; i += 44) s += linha(i, j, Math.min(i + 32, x + l - 6), j, 5, C.relevo, 'stroke-linecap="round"');
  else for (let i = x + 8; i < x + l - 4; i += 12) for (let j = y + 6; j < y + a - 10; j += 44) s += linha(i, j, i, Math.min(j + 32, y + a - 6), 5, C.relevo, 'stroke-linecap="round"');
  return s;
}

// ---------------------------------------------------------------------------
function rotaAcessivel() {
  let s = '';
  s += texto(360, 54, 'Rota contínua, sem degraus', { tam: T });
  s += texto(360, 94, 'isolados, até todos os ambientes', { tam: A, peso: 500 });
  s += ret(20, 120, 680, 470, C.parede);
  // Ambientes
  s += ret(40, 140, 200, 130, '#fff') + ret(260, 140, 200, 130, '#fff') + ret(480, 140, 200, 130, '#fff');
  s += texto(140, 215, 'Salas', { tam: A }) + texto(360, 215, 'Biblioteca', { tam: A }) + texto(580, 215, 'Auditório', { tam: A });
  s += ret(40, 290, 640, 70, C.patamar);
  s += ret(40, 380, 260, 190, '#fff') + texto(170, 482, 'Refeitório', { tam: A });
  s += ret(420, 380, 260, 190, ZONA, `style="stroke:${AZUL}"`);
  s += texto(550, 440, 'Sanitário', { tam: A });
  s += texto(550, 482, 'até 50 m de', { tam: A, peso: 500 });
  s += texto(550, 518, 'qualquer ponto', { tam: A, peso: 500 });
  // Rota (azul)
  const r = (x1, y1, x2, y2) => linha(x1, y1, x2, y2, 10, AZUL, 'stroke-linecap="round"');
  s += r(90, 325, 630, 325);
  for (const x of [140, 360, 580]) s += r(x, 325, x, 270);
  s += r(170, 325, 170, 380) + r(550, 325, 550, 380);
  s += r(360, 325, 360, 600);
  // Rua
  s += `<rect x="0" y="600" width="720" height="120" fill="${RUA}"/>`;
  s += ret(330, 588, 60, 16, '#fff');
  s += texto(360, 672, 'Entrada na via de menor fluxo', { tam: A, cor: '#fff', halo: false });
  return {
    nome: 'rota_acessivel', itens: [1, 12, 54, 91, 106, 117, 129, 138, 149, 150, 170, 173],
    titulo: 'Rota acessível até os ambientes',
    descricao: 'Planta simplificada da escola. Uma rota contínua, sem degraus isolados, liga a entrada, na via de menor fluxo de veículos, a salas, biblioteca, auditório, refeitório e sanitário acessível, que fica a até 50 metros de qualquer ponto.',
    s,
  };
}

// ---------------------------------------------------------------------------
function pisoFirmeRegular() {
  let s = '';
  const L = 330, H = 212;
  const paineis = [
    ['Firme e regular', true], ['Buracos', false],
    ['Desníveis', false], ['Tapete solto', false],
    ['Trepidante', false], ['Escorregadio', false],
  ];
  paineis.forEach(([nome, ok], i) => {
    const x = 20 + (i % 2) * (L + 20), y = 20 + Math.floor(i / 2) * (H + 22);
    const cor = ok ? VERDE : VERMELHO;
    const corpoY = y + 58, corpoH = H - 58;
    s += `<rect x="${x}" y="${y}" width="${L}" height="${H}" fill="#fff" stroke="${C.linha}" stroke-width="2.5" rx="8"/>`;
    s += `<path d="M ${x} ${y + 8} a 8 8 0 0 1 8 -8 h ${L - 16} a 8 8 0 0 1 8 8 v 50 h -${L} z" fill="${cor}"/>`;
    s += (ok ? certo(x + 18, y + 30) : errado(x + 18, y + 30)) + texto(x + 52, y + 40, nome, { tam: A, cor: '#fff', halo: false, anc: 'start' });
    if (nome === 'Trepidante') {
      s += `<rect x="${x + 10}" y="${corpoY + 6}" width="${L - 20}" height="${corpoH - 16}" fill="${C.patamar}"/>`;
      for (let cx = x + 30; cx < x + L - 14; cx += 38) for (let cy = corpoY + 26; cy < y + H - 16; cy += 38) s += `<circle cx="${cx}" cy="${cy}" r="16" fill="#9a9a9a" stroke="${C.linha}" stroke-width="2"/>`;
      return;
    }
    s += `<rect x="${x + 10}" y="${corpoY + 6}" width="${L - 20}" height="${corpoH - 16}" fill="${C.patamar}" stroke="${C.linha}" stroke-width="1.5"/>`;
    for (let gx = x + 10 + 62; gx < x + L - 10; gx += 62) s += linha(gx, corpoY + 6, gx, y + H - 10, 1.5);
    for (let gy = corpoY + 6 + 50; gy < y + H - 10; gy += 50) s += linha(x + 10, gy, x + L - 10, gy, 1.5);
    const cx = x + L / 2, cy = corpoY + corpoH / 2;
    if (nome === 'Buracos') s += `<ellipse cx="${cx}" cy="${cy}" rx="62" ry="40" fill="#3a3a3a" stroke="${C.linha}" stroke-width="2.5"/>`;
    if (nome === 'Desníveis') s += `<polygon points="${x + 40},${cy - 6} ${x + L - 40},${cy - 6} ${x + L - 56},${cy + 14} ${x + 56},${cy + 14}" fill="#7a7a7a" stroke="${C.linha}" stroke-width="2.5"/>` + linha(x + 10, cy + 40, x + L - 10, cy + 40, 6, '#3a3a3a');
    if (nome === 'Tapete solto') s += `<polygon points="${cx - 90},${cy - 44} ${cx + 80},${cy - 50} ${cx + 92},${cy + 30} ${cx + 60},${cy + 50} ${cx - 84},${cy + 46}" fill="#a0522d" stroke="${C.linha}" stroke-width="2.5"/><polygon points="${cx + 92},${cy + 30} ${cx + 60},${cy + 50} ${cx + 62},${cy + 22}" fill="#e8b48a" stroke="${C.linha}" stroke-width="2"/>`;
    if (nome === 'Escorregadio') {
      s += `<ellipse cx="${cx}" cy="${cy}" rx="110" ry="46" fill="rgba(70,130,220,.45)" stroke="${AZUL}" stroke-width="2.5"/>`;
      for (const [dx, dy] of [[-50, -8], [10, 14], [60, -12]]) s += `<path d="M ${cx + dx} ${cy + dy - 14} q 9 14 0 20 q -9 -6 0 -20 z" fill="${AZUL}"/>`;
    }
  });
  return {
    nome: 'piso_firme_regular', itens: [3, 20, 34, 44, 55, 65, 96, 108, 136, 148, 154, 171],
    titulo: 'Piso firme, regular e não escorregadio',
    descricao: 'Seis quadros de piso. O adequado é firme e regular. Os inadequados mostram buracos, desníveis, tapete solto, piso trepidante para rodas e piso escorregadio quando molhado.',
    s,
  };
}

// ---------------------------------------------------------------------------
function pisoTatilExterno() {
  let s = '';
  // Edificação com porta, calçada e rua (vista de cima)
  s += `<rect x="0" y="0" width="720" height="200" fill="${C.parede}"/>` + linha(0, 200, 720, 200, 4);
  s += `<rect x="480" y="186" width="80" height="18" fill="#6b6b6b"/>`;
  s += tt(30, 60, 'Alerta');
  s += ta(30, 100, 'porta, rebaixo e');
  s += ta(30, 136, 'mudança de direção');
  s += `<rect x="0" y="204" width="720" height="396" fill="${C.patamar}"/>`;
  s += `<rect x="0" y="600" width="720" height="120" fill="${RUA}"/>`;
  // Rebaixo na guia
  s += `<polygon points="520,600 560,520 660,520 700,600" fill="#bdbdbd" stroke="${C.linha}" stroke-width="2"/>`;
  // Direcional até a porta, com alerta na curva, na porta e no rebaixo
  s += direcionalCima(0, 400, 480, 40, true);
  s += direcionalCima(500, 284, 40, 96, false);
  s += alertaCima(480, 380, 80, 80);
  s += alertaCima(480, 208, 80, 76);
  s += alertaCima(560, 470, 100, 40);
  s += linha(300, 118, 480, 230, 2.5) + `<circle cx="480" cy="230" r="6" fill="${C.linha}"/>`;
  s += tt(30, 500, 'Direcional');
  s += ta(30, 540, 'conduz até a entrada');
  s += ta(30, 300, 'Contínuo e com');
  s += ta(30, 336, 'contraste com o piso');
  s += texto(360, 672, 'Rua', { tam: A, cor: '#fff', halo: false });
  return {
    nome: 'piso_tatil_externo', itens: [8, 11, 40, 41],
    titulo: 'Piso tátil na calçada',
    descricao: 'Vista de cima da calçada. O piso tátil direcional, contínuo e em cor que contrasta com o piso, conduz até a porta da edificação. O piso tátil de alerta marca a porta, a mudança de direção e o rebaixo da calçada.',
    s,
  };
}

// ---------------------------------------------------------------------------
function inclinacaoTransversal({ nome, itens, titulo, descricao, rotulo, linhas, nota }) {
  let s = '';
  s += texto(360, 54, 'Inclinação transversal', { tam: T });
  // Corte: piso com caimento de um lado ao outro (ampliado)
  s += ret(30, 90, 40, 330, C.parede);
  s += `<polygon points="70,250 620,320 620,420 70,420" fill="${C.piso}" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += `<rect x="20" y="420" width="680" height="34" fill="${C.patamar}" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += tracejada(70, 250, 640, 250);
  s += ta(80, 236, 'Linha de nível');
  s += seta({ x: 600, y: 252 }, { x: 600, y: 316 }, { largura: 3, ponta: 13, dupla: false });
  s += texto(580, 300, rotulo, { tam: A, anc: 'end' });
  s += seta({ x: 170, y: 340 }, { x: 520, y: 384 }, { largura: 3.5, ponta: 16 });
  // Limites
  let y = 520;
  for (const [nomeLinha, valor] of linhas) {
    s += linha(20, y - 46, 700, y - 46, 2, '#cccccc');
    s += ta(30, y, nomeLinha);
    s += tt(690, y, valor, { anc: 'end' });
    y += 76;
  }
  s += texto(30, 690, nota, { tam: A, peso: 500, anc: 'start', cor: C.muted, halo: false });
  return { nome, itens, titulo, descricao, s };
}

const calcadaInclinacao = () => inclinacaoTransversal({
  nome: 'calcada_inclinacao_transversal', itens: [4, 22, 48, 67],
  titulo: 'Inclinação transversal do piso',
  descricao: 'Corte do piso com caimento de um lado ao outro, ampliado para ficar visível. Na calçada e na rampa externa, a inclinação transversal é de no máximo 3%. No corredor e na rampa interna, de no máximo 2%.',
  rotulo: 'Caimento',
  linhas: [['Calçada e rampa externa', 'máx. 3%'], ['Corredor e rampa interna', 'máx. 2%']],
  nota: 'Inclinação ampliada para ficar visível',
});

const escadaInclinacao = () => inclinacaoTransversal({
  nome: 'escada_inclinacao', itens: [17, 57],
  titulo: 'Inclinação transversal de degraus e patamares',
  descricao: 'Corte de um degrau visto de frente, com caimento ampliado para ficar visível. Em escadas externas, a inclinação transversal de degraus e patamares é de no máximo 2%. Em escadas internas, de no máximo 1%.',
  rotulo: 'Caimento',
  linhas: [['Escada externa', 'máx. 2%'], ['Escada interna', 'máx. 1%']],
  nota: 'Meça em pelo menos 3 pontos do degrau',
});

// ---------------------------------------------------------------------------
function alturaLivre() {
  const S = 220, CHAO = 600, Y210 = CHAO - 2.10 * S;
  let s = '';
  s += `<rect x="110" y="${Y210}" width="590" height="${CHAO - Y210}" fill="${ZONA}" stroke="${AZUL}" stroke-width="3" stroke-dasharray="11 8"/>`;
  // Árvore com galhos acima do limite
  s += ret(218, 110, 24, CHAO - 110, '#7d5f36');
  s += `<ellipse cx="230" cy="92" rx="130" ry="34" fill="#3f8f4f" stroke="${C.linha}" stroke-width="2.5"/>`;
  // Pessoa
  s += `<circle cx="380" cy="${CHAO - 1.62 * S}" r="20" fill="#4a4a4a"/>`;
  s += `<rect x="360" y="${CHAO - 1.5 * S}" width="40" height="${1.5 * S - 4}" rx="16" fill="#4a4a4a"/>`;
  // Placa que invade a altura livre
  s += ret(620, 110, 14, CHAO - 110, '#9a9a9a');
  s += ret(470, 180, 150, 80, '#f4a6a6', `style="stroke:${VERMELHO}"`);
  s += texto(545, 232, 'Placa', { tam: A });
  s += errado(536, 300, VERMELHO);
  // Cota
  s += seta({ x: 70, y: CHAO }, { x: 70, y: Y210 }, { largura: 3.5, ponta: 15 });
  s += vertical(46, (CHAO + Y210) / 2, '2,10 m');
  s += texto(360, 48, 'Altura livre mín. 2,10 m', { tam: T });
  s += `<rect x="0" y="${CHAO}" width="720" height="120" fill="${C.piso}" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += texto(360, 654, 'Galhos, placas e toldos', { tam: A, peso: 600, halo: false });
  s += texto(360, 694, 'acima da altura livre', { tam: A, peso: 500, halo: false });
  return {
    nome: 'altura_livre', itens: [5, 176],
    titulo: 'Altura livre na circulação',
    descricao: 'Vista lateral de uma calçada. Acima da faixa de circulação há uma altura livre mínima de 2,10 metros. Os galhos da árvore ficam acima desse limite; a placa que invade o espaço livre está incorreta.',
    s,
  };
}

// ---------------------------------------------------------------------------
function desniveisPiso() {
  let s = '';
  const linhas = [
    ['Até 5 mm: sem tratamento', VERDE, 'nada'],
    ['5 mm a 20 mm: chanfro 1:2 (50%)', LARANJA, 'chanfro'],
    ['Acima de 20 mm: degrau', VERMELHO, 'degrau'],
  ];
  linhas.forEach(([rotulo, cor, tipo], i) => {
    const y = 20 + i * 232;
    s += `<rect x="20" y="${y}" width="680" height="212" fill="#fff" stroke="${C.linha}" stroke-width="2.5" rx="8"/>`;
    s += `<path d="M 20 ${y + 8} a 8 8 0 0 1 8 -8 h 664 a 8 8 0 0 1 8 8 v 50 h -680 z" fill="${cor}"/>`;
    s += texto(40, y + 40, rotulo, { tam: A, peso: 700, cor: '#fff', halo: false, anc: 'start' });
    const base = y + 180;
    if (tipo === 'nada') {
      s += `<polygon points="60,${base} 60,${base - 50} 340,${base - 50} 340,${base - 56} 660,${base - 56} 660,${base} " fill="${C.piso}" stroke="${C.linha}" stroke-width="2.5"/>`;
      s += ta(380, base - 80, 'Ideal: sem desnível');
    } else if (tipo === 'chanfro') {
      s += `<polygon points="60,${base} 60,${base - 40} 300,${base - 40} 380,${base - 80} 660,${base - 80} 660,${base}" fill="${C.piso}" stroke="${C.linha}" stroke-width="2.5"/>`;
      s += linha(300, base - 40, 380, base - 40, 2, C.linha, 'stroke-dasharray="6 5"') + linha(380, base - 40, 380, base - 80, 2, C.linha, 'stroke-dasharray="6 5"');
      s += texto(340, base - 8, '2', { tam: A }) + texto(404, base - 50, '1', { tam: A });
    } else {
      s += `<polygon points="60,${base} 60,${base - 30} 440,${base - 30} 440,${base - 100} 660,${base - 100} 660,${base}" fill="${C.piso}" stroke="${C.linha}" stroke-width="2.5"/>`;
      s += `<polygon points="260,${base - 30} 440,${base - 100} 440,${base - 30}" fill="${ZONA}" stroke="${AZUL}" stroke-width="3" stroke-dasharray="9 7"/>`;
      s += ta(80, base - 66, 'Com rampa');
    }
  });
  return {
    nome: 'desniveis_piso', itens: [6, 47],
    titulo: 'Desníveis no piso',
    descricao: 'Três cortes de piso, ampliados. Desnível de até 5 milímetros pode ficar sem tratamento. Entre 5 e 20 milímetros, o desnível tem chanfro com inclinação de no máximo 1 para 2, ou 50%. Acima de 20 milímetros, é tratado como degrau, com rampa associada. O ideal é não haver desnível.',
    s,
  };
}

// ---------------------------------------------------------------------------
function objetosSalientes() {
  const S = 230, CHAO = 640, Y060 = CHAO - 0.60 * S, Y210 = CHAO - 2.10 * S;
  let s = '';
  s += `<rect x="190" y="${Y210}" width="510" height="${Y060 - Y210}" fill="${ZONA}" stroke="${AZUL}" stroke-width="3" stroke-dasharray="11 8"/>`;
  s += ret(150, 40, 40, CHAO - 40, C.parede);
  // Objeto pequeno (até 10 cm) e grande (mais de 10 cm)
  s += ret(190, 200, 22, 60, '#fff');
  s += ret(190, 330, 150, 80, '#e04040');
  s += tt(240, 230, 'Até 10 cm');
  s += ta(240, 266, 'sem sinalização');
  s += tt(360, 360, 'Mais de 10 cm');
  s += ta(360, 396, 'piso tátil de alerta');
  // Piso e alerta sob o objeto
  s += `<rect x="0" y="${CHAO}" width="720" height="80" fill="${C.piso}" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += `<rect x="190" y="${CHAO - 10}" width="150" height="12" fill="${C.tatil}" stroke="${C.linha}" stroke-width="2"/>`;
  for (let x = 200; x < 336; x += 16) s += `<circle cx="${x}" cy="${CHAO - 12}" r="4" fill="${C.relevo}"/>`;
  s += linha(265, 480, 265, CHAO - 18, 2.5, C.linha, 'stroke-dasharray="8 6"');
  // Cotas
  s += seta({ x: 112, y: CHAO }, { x: 112, y: Y060 }, { largura: 3, ponta: 13 });
  s += vertical(92, (CHAO + Y060) / 2, '0,60 m', A);
  s += seta({ x: 50, y: CHAO }, { x: 50, y: Y210 }, { largura: 3.5, ponta: 15 });
  s += vertical(30, (CHAO + Y210) / 2 - 40, '2,10 m');
  return {
    nome: 'objetos_salientes', itens: [7, 50],
    titulo: 'Objetos salientes nas paredes',
    descricao: 'Vista lateral de uma parede. Entre 0,60 metro e 2,10 metros de altura, objetos que avançam até 10 centímetros podem ficar sem sinalização. Os que avançam mais de 10 centímetros precisam de piso tátil de alerta no piso, sob o objeto.',
    s,
  };
}

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
function escadaDegrau() {
  let s = '';
  s += ta(30, 50, 'Piso (p): 0,28 m a 0,32 m');
  s += ta(30, 90, 'Espelho (e): 0,16 m a 0,18 m');
  // Perfil dos degraus
  s += `<polygon points="30,430 30,350 180,350 180,270 330,270 330,190 480,190 480,430" fill="${C.piso}" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += `<rect x="20" y="430" width="480" height="30" fill="${C.patamar}" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += seta({ x: 180, y: 244 }, { x: 330, y: 244 }, { largura: 3, ponta: 13 });
  s += texto(255, 232, 'p', { tam: T });
  s += seta({ x: 152, y: 350 }, { x: 152, y: 270 }, { largura: 3, ponta: 13 });
  s += texto(124, 322, 'e', { tam: T });
  // Bocel ampliado
  s += `<rect x="520" y="200" width="180" height="200" fill="#fff" stroke="${C.linha}" stroke-width="2" rx="8"/>`;
  s += `<rect x="536" y="250" width="164" height="26" fill="${C.piso}" stroke="${C.linha}" stroke-width="2"/>`;
  s += `<rect x="580" y="276" width="120" height="110" fill="${C.piso}" stroke="${C.linha}" stroke-width="2"/>`;
  s += seta({ x: 536, y: 300 }, { x: 580, y: 300 }, { largura: 2.5, ponta: 10 });
  s += ta(536, 236, 'Bocel');
  s += texto(610, 470, 'máx. 1,5 cm', { tam: A, peso: 700 });
  // Fórmula e espelho
  s += `<rect x="20" y="510" width="680" height="190" fill="#fff" stroke="${C.linha}" stroke-width="2" rx="8"/>`;
  s += texto(360, 572, '0,63 m ≤ p + 2e ≤ 0,65 m', { tam: T, halo: false });
  s += texto(360, 640, 'Espelho fechado,', { tam: A, peso: 500, halo: false });
  s += texto(360, 676, 'sem vazados', { tam: A, peso: 500, halo: false });
  return {
    nome: 'escada_degrau_dimensoes', itens: [14, 15, 59, 60],
    titulo: 'Dimensões dos degraus',
    descricao: 'Perfil de degraus. O piso (p) mede de 0,28 a 0,32 metro e o espelho (e), de 0,16 a 0,18 metro, com 0,63 metro ≤ p + 2e ≤ 0,65 metro. O espelho é fechado, sem vazados, e o bocel avança no máximo 1,5 centímetro.',
    s,
  };
}

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
export const LOTE1_QUADRADAS = [
  rotaAcessivel, pisoFirmeRegular, pisoTatilExterno, calcadaInclinacao, alturaLivre, desniveisPiso,
  objetosSalientes, rebaixamentoCalcada, escadaDegrau, escadaSinalVisual, escadaInclinacao, rampaDimensoes,
];

// Gera e confere: cada medida escrita precisa estar nas perguntas dos itens; rótulos de no mínimo 30
const saida = new URL('./saida/quadradas/', import.meta.url);
mkdirSync(saida, { recursive: true });
const checklist = JSON.parse(readFileSync(new URL('../src/dados/checklist.json', import.meta.url)));
const pergunta = id => {
  const item = checklist.itens.find(i => i.id === id);
  if (!item) throw new Error(`Item ${id} não existe`);
  return item.pergunta.replace(/\s+/g, '');
};
let erros = 0;
for (const criar of LOTE1_QUADRADAS) {
  const f = criar();
  const svg = documento({ titulo: f.titulo, descricao: f.descricao, conteudo: f.s });
  const perguntas = f.itens.map(pergunta).join(' ');
  const textos = [...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map(m => m[1]);
  const medidas = textos.flatMap(t => t.match(/\d+(?:,\d+)?\s?(?:cm|mm|m\b|%)/g) || []).map(m => m.replace(/\s+/g, ''));
  const faltando = [...new Set(medidas.filter(m => !perguntas.includes(m)))];
  const tamanhos = [...svg.matchAll(/font-size="([\d.]+)"/g)].map(m => +m[1]);
  if (faltando.length) { erros++; console.log(`✗ ${f.nome}: medidas fora das perguntas: ${faltando.join(', ')}`); }
  if (Math.min(...tamanhos) < A) { erros++; console.log(`✗ ${f.nome}: rótulo menor que ${A}`); }
  writeFileSync(new URL(`${f.nome}.svg`, saida), svg);
  console.log(`${f.nome}.svg  medidas: ${[...new Set(medidas)].join(', ') || '—'}`);
}
if (erros) process.exit(1);
