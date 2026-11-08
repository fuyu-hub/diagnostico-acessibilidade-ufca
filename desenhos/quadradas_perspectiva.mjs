// Versões quadradas que mantêm o desenho em perspectiva do original (só reenquadrado e com rótulos maiores):
// rebaixamento (lote1.mjs), sinal visual da escada (lote2.mjs) e rampa (figuras.mjs).
import { C, criarVista, texto, seta, tatilAlerta, tatilDirecional, amostraAlerta, amostraDirecional } from './lib.mjs';

const T = 38, A = 30;
const LARANJA = '#d97706';

// Linha de chamada com ponto no alvo
const chamada = (de, x, y) => `<line x1="${de.x.toFixed(1)}" y1="${de.y.toFixed(1)}" x2="${x}" y2="${y}" stroke="${C.linha}" stroke-width="2.5"/><circle cx="${de.x.toFixed(1)}" cy="${de.y.toFixed(1)}" r="6" fill="${C.linha}"/>`;
const tt = (x, y, s, o = {}) => texto(x, y, s, { tam: T, anc: 'start', ...o });
const ta = (x, y, s, o = {}) => texto(x, y, s, { tam: A, peso: 500, anc: 'start', ...o });

// ---------------------------------------------------------------------------
export function rebaixamentoCalcada() {
  const v = criarVista({ escala: 84, origem: { x: 330, y: 150 } });
  const L = 5.2, D0 = 1.9, D1 = 3.0, Z = 0.2, X0 = 1.7, X1 = 3.5, ASA = 0.7, RUA = 4.0;
  let s = '';
  s += v.poli([[0, 0, Z], [L, 0, Z], [L, D1, Z], [X1 + ASA, D1, Z], [X1, D0, Z], [X0, D0, Z], [X0 - ASA, D1, Z], [0, D1, Z]], C.patamar);
  s += v.poli([[0, D1, 0], [L, D1, 0], [L, RUA, 0], [0, RUA, 0]], '#8a8a8a');
  s += v.poli([[0, D1, 0], [X0 - ASA, D1, 0], [X0 - ASA, D1, Z], [0, D1, Z]], C.branco);
  s += v.poli([[X1 + ASA, D1, 0], [L, D1, 0], [L, D1, Z], [X1 + ASA, D1, Z]], C.branco);
  s += v.poli([[X0 - ASA, D1, Z], [X0, D0, Z], [X0, D1, 0]], C.piso);
  s += v.poli([[X1, D0, Z], [X1 + ASA, D1, Z], [X1, D1, 0]], C.piso);
  s += v.poli([[X0, D0, Z], [X1, D0, Z], [X1, D1, 0], [X0, D1, 0]], '#bdbdbd');
  s += tatilAlerta(v, X0, X1, D0 - 0.6, D0, Z, 0.2, 0.066);
  const zEm = y => Z * (D1 - y) / (D1 - D0);
  const yT = D1 - 0.45;
  s += v.poli([[X0, yT, zEm(yT)], [X1, yT, zEm(yT)], [X1, D1, 0], [X0, D1, 0]], C.tatil);
  for (let x = X0 + 0.1; x < X1 - 0.05; x += 0.2) for (let y = yT + 0.1; y < D1 - 0.05; y += 0.2) {
    s += v.circuloPiso(x, y, zEm(y), 0.066, `fill="${C.relevo}" stroke="none"`);
  }
  // Cotas
  const a = v.proj(X0, D1 + 0.34), b = v.proj(X1, D1 + 0.34);
  s += v.linha([X0, D1, 0], [X0, D1 + 0.46, 0], 1.6) + v.linha([X1, D1, 0], [X1, D1 + 0.46, 0], 1.6);
  s += seta(a, b, { largura: 3.5, ponta: 15 });
  const p = v.proj(X0 + 0.55, D1 - 0.55, zEm(D1 - 0.55)), q = v.proj(X0 + 0.55, D0 + 0.08, zEm(D0 + 0.08));
  s += seta(p, q, { dupla: false, largura: 4.5, ponta: 18 });
  // Rótulos nos cantos livres do quadro
  s += tt(24, 56, 'Declividade máx. 8,33%') + ta(24, 96, 'ideal 5%');
  s += chamada(q, 210, 108);
  s += tt(500, 56, 'Alerta') + ta(500, 94, 'no início e') + ta(500, 130, 'no término');
  s += chamada(v.proj(X1 - 0.3, D0 - 0.3, Z), 560, 142);
  s += texto(700, 630, 'Largura mín. 1,20 m', { tam: T, anc: 'end' }) + texto(700, 668, 'ideal 1,50 m', { tam: A, peso: 500, anc: 'end' });
  s += chamada({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, 520, 596);
  s += texto(24, 650, 'Sem desnível', { tam: A, anc: 'start' }) + texto(24, 686, 'até a rua', { tam: A, anc: 'start' });
  s += chamada(v.proj(X0 + 0.2, D1), 110, 620);
  return {
    nome: 'rebaixamento_calcada', itens: [9, 10, 11],
    titulo: 'Rebaixamento de calçada',
    descricao: 'Calçada rebaixada até o nível da rua. O rebaixo tem largura mínima de 1,20 metro, ideal de 1,50 metro, e declividade máxima de 8,33 por cento, ideal de 5 por cento, sem desnível até a rua. Há piso tátil de alerta no início e no término do rebaixamento.',
    s,
  };
}

// ---------------------------------------------------------------------------
export function escadaSinalVisual() {
  const v = criarVista({ escala: 100, origem: { x: 196, y: 152 } });
  const L = 2.6, N = 4, P = 0.5, E = 0.32, Y = N * P;
  let s = '';
  const faixaPiso = (x0, x1, y, z) => v.poli([[x0, y - 0.1, z], [x1, y - 0.1, z], [x1, y, z], [x0, y, z]], LARANJA);
  const faixaEsp = (x0, x1, y, z) => v.poli([[x0, y, z - 0.1], [x1, y, z - 0.1], [x1, y, z], [x0, y, z]], LARANJA);
  for (let k = N - 1; k >= 0; k--) {
    const y0 = Y - P * (k + 1), y1 = Y - P * k, z = E * (k + 1);
    s += v.caixa(0, L, y0, y1, 0, z, { topo: C.patamar, frente: C.branco, lado: C.parede });
    for (const [a, b] of [[0.08, 0.68], [L - 0.68, L - 0.08]]) s += faixaPiso(a, b, y1, z) + faixaEsp(a, b, y1, z);
  }
  s += ta(440, 196, 'Nos pisos e nos', { peso: 700 }) + ta(440, 232, 'espelhos, em cor', { peso: 700 });
  s += ta(440, 268, 'que contrasta') + ta(440, 304, 'com o degrau');
  s += chamada(v.proj(L - 0.3, Y, E - 0.05), 450, 316);
  // Detalhe ampliado
  s += `<rect x="20" y="470" width="680" height="230" fill="#fff" stroke="${C.linha}" stroke-width="2.5" rx="8"/>`;
  s += ta(40, 512, 'Faixa (ampliada)', { cor: C.muted, halo: false });
  s += texto(80, 562, 'Largura: 3 cm', { tam: A, anc: 'start', halo: false });
  s += `<rect x="80" y="578" width="300" height="56" fill="${LARANJA}" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += seta({ x: 56, y: 634 }, { x: 56, y: 578 }, { ponta: 10, largura: 2.5 });
  s += seta({ x: 80, y: 652 }, { x: 380, y: 652 }, { ponta: 10, largura: 2.5 });
  s += texto(230, 690, 'Comprimento: mín. 7 cm', { tam: A, halo: false });
  s += ta(430, 590, 'De preferência,', { halo: false }) + ta(430, 626, 'fotoluminescente', { halo: false });
  return {
    nome: 'escada_sinal_visual', itens: [16, 61],
    titulo: 'Sinalização visual dos degraus',
    descricao: 'Escada com faixas contrastantes no piso e no espelho de cada degrau. Cada faixa tem 3 centímetros de largura e no mínimo 7 centímetros de comprimento, de preferência fotoluminescente.',
    s,
  };
}

// ---------------------------------------------------------------------------
export function rampaDimensoes() {
  const v = criarVista({ escala: 58, origem: { x: 160, y: 226 } });
  const LARG = 2.4, PAT = 1.6, LANCE = 2.2, ALT = 0.8, FAIXA = 0.5;
  const COMPR = 3 * PAT + 2 * LANCE;
  const trechos = [
    { x0: 0, x1: PAT, z0: 2 * ALT, z1: 2 * ALT, tipo: 'patamar' },
    { x0: PAT, x1: PAT + LANCE, z0: 2 * ALT, z1: ALT, tipo: 'lance' },
    { x0: PAT + LANCE, x1: 2 * PAT + LANCE, z0: ALT, z1: ALT, tipo: 'patamar' },
    { x0: 2 * PAT + LANCE, x1: 2 * PAT + 2 * LANCE, z0: ALT, z1: 0, tipo: 'lance' },
    { x0: 2 * PAT + 2 * LANCE, x1: COMPR, z0: 0, z1: 0, tipo: 'patamar' },
  ];
  const altura = x => {
    const t = trechos.find(s => x >= s.x0 && x <= s.x1);
    return t.z0 + (t.z1 - t.z0) * ((x - t.x0) / (t.x1 - t.x0));
  };
  const corrimao = y => {
    let s = '';
    const marcos = [0.05, PAT, PAT + LANCE, 2 * PAT + LANCE, 2 * PAT + 2 * LANCE, COMPR - 0.05];
    for (const h of [0.92, 0.7]) for (let i = 0; i < marcos.length - 1; i++) {
      s += v.linha([marcos[i], y, altura(marcos[i]) + h], [marcos[i + 1], y, altura(marcos[i + 1]) + h], 3);
    }
    for (const x of [0.1, PAT, PAT + LANCE / 2, PAT + LANCE, 2 * PAT + LANCE, 2 * PAT + 1.5 * LANCE, 2 * PAT + 2 * LANCE, COMPR - 0.1]) {
      s += v.linha([x, y, altura(x)], [x, y, altura(x) + 0.92], 2.2);
    }
    return s;
  };
  let s = corrimao(0);
  for (const t of trechos) {
    s += v.poli([[t.x0, LARG, 0], [t.x1, LARG, 0], [t.x1, LARG, t.z1], [t.x0, LARG, t.z0]], C.branco);
    s += v.poli([[t.x0, 0, t.z0], [t.x1, 0, t.z1], [t.x1, LARG, t.z1], [t.x0, LARG, t.z0]], t.tipo === 'patamar' ? C.patamar : C.piso);
  }
  const CENTRO = LARG / 2, META = 0.42;
  s += tatilDirecional(v, 0.05, PAT - FAIXA, CENTRO - META, CENTRO + META, 2 * ALT, 0.2, 0.42, 0.12);
  s += tatilAlerta(v, PAT - FAIXA, PAT, 0, LARG, 2 * ALT, 0.2, 0.066);
  s += tatilAlerta(v, PAT + LANCE, PAT + LANCE + FAIXA, 0, LARG, ALT, 0.2, 0.066);
  s += tatilAlerta(v, 2 * PAT + LANCE - FAIXA, 2 * PAT + LANCE, 0, LARG, ALT, 0.2, 0.066);
  s += tatilAlerta(v, 2 * PAT + 2 * LANCE, 2 * PAT + 2 * LANCE + FAIXA, 0, LARG, 0, 0.2, 0.066);
  s += tatilDirecional(v, 2 * PAT + 2 * LANCE + FAIXA, COMPR - 0.05, CENTRO - META, CENTRO + META, 0, 0.2, 0.42, 0.12);
  s += corrimao(LARG);

  // Patamar do meio
  const O = 0.6;
  const pa = v.proj(PAT + LANCE, LARG + O), pb = v.proj(2 * PAT + LANCE, LARG + O);
  s += v.linha([PAT + LANCE, LARG, ALT], [PAT + LANCE, LARG + O + 0.14, ALT], 1.5) + v.linha([2 * PAT + LANCE, LARG, ALT], [2 * PAT + LANCE, LARG + O + 0.14, ALT], 1.5);
  const pa2 = { x: pa.x, y: pa.y - ALT * v.escala }, pb2 = { x: pb.x, y: pb.y - ALT * v.escala };
  s += seta(pa2, pb2, { largura: 3, ponta: 13 });
  s += chamada({ x: (pa2.x + pb2.x) / 2, y: (pa2.y + pb2.y) / 2 }, 190, 470);
  s += tt(24, 500, 'Patamar') + tt(24, 542, 'mín. 1,20 m');
  // Largura no patamar final
  const l0 = v.proj(COMPR + 0.4, 0), l1 = v.proj(COMPR + 0.4, LARG);
  s += v.linha([COMPR, 0, 0], [COMPR + 0.55, 0, 0], 1.5) + v.linha([COMPR, LARG, 0], [COMPR + 0.55, LARG, 0], 1.5);
  s += seta(l0, l1, { largura: 3, ponta: 13 });
  s += texto(700, 640, 'Largura mín. 1,20 m', { tam: T, anc: 'end' });
  s += texto(700, 678, 'recomendável 1,50 m', { tam: A, peso: 500, anc: 'end' });
  // Declividade
  const decl = 2 * PAT + 1.5 * LANCE, ponto = v.proj(decl, LARG * 0.5, altura(decl));
  const alvo = v.proj(decl - 0.9, LARG * 0.5, altura(decl - 0.9));
  s += seta(ponto, alvo, { largura: 4, dupla: false, ponta: 17 });
  s += tt(380, 60, 'i ≤ 8,33%');
  s += ta(380, 100, 'máx. 80 cm de');
  s += ta(380, 136, 'desnível por lance');
  s += chamada({ x: (ponto.x + alvo.x) / 2, y: (ponto.y + alvo.y) / 2 }, 470, 150);
  // Legenda do piso tátil
  s += amostraAlerta(24, 590, 56) + ta(92, 628, 'Alerta', { peso: 700, halo: false });
  s += amostraDirecional(24, 656, 56) + ta(92, 694, 'Direcional', { peso: 700, halo: false });
  return {
    nome: 'rampa_dimensoes', itens: [18, 19, 21, 63, 64, 66],
    titulo: 'Rampa com dois lances e três patamares',
    descricao: 'Rampa em perspectiva, com patamares no início, entre os lances e no fim, cada um com no mínimo 1,20 metro de comprimento. A largura mínima é de 1,20 metro, recomendável 1,50 metro. A inclinação máxima é de 8,33 por cento, com desnível máximo de 80 centímetros por lance. Há corrimãos nos dois lados. Piso tátil de alerta marca o início e o fim de cada lance, e o direcional conduz até a rampa.',
    s,
  };
}
