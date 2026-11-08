// Lote 4 das ilustrações quadradas (720×720): os 12 desenhos seguintes na ordem do checklist.
// Cada um reenquadra o desenho original (lote1 a lote5), com rótulos de 38 e 30.
// Uso: node quadradas_lote4.mjs  →  saida/quadradas/*.svg
import { C, texto, seta } from './lib.mjs';
import { cadeira } from './lote1.mjs';
import { T, A, AZUL, ZONA, VERDE, VERMELHO, LARANJA, tt, ta, tb, ret, linha, chamada, vertical, zona, piso, marca, quadro, gerarLote } from './quadradas_comum.mjs';

// ---------------------------------------------------------------------------
function lousaTelaAltura() {
  const S = 270, PISO = 640, y = h => PISO - h * S;
  let s = ret(20, y(2.1), 680, 2.1 * S, C.parede) + piso(20, 700, PISO);
  const alto = (1.95 - 0.9) * S;
  s += `<rect x="40" y="${y(1.95)}" width="310" height="${alto}" fill="#2f5d4a" stroke="${C.linha}" stroke-width="4"/>`;
  s += texto(195, y(1.42) + 10, 'Lousa ou quadro', { tam: A, cor: '#fff', halo: false });
  s += `<rect x="370" y="${y(1.95)}" width="310" height="${alto}" fill="#fff" stroke="${C.linha}" stroke-width="4"/>`;
  s += texto(525, y(1.42) - 8, 'Tela ou imagem', { tam: A, halo: false }) + texto(525, y(1.42) + 28, 'projetada', { tam: A, halo: false });
  for (const x of [80, 410]) {
    s += seta({ x, y: PISO }, { x, y: y(0.9) }, { largura: 3.5, ponta: 14 });
    s += ta(x + 14, y(0.55), 'Borda inferior:') + tt(x + 14, y(0.55) + 42, 'máx. 0,90 m');
  }
  return {
    nome: 'lousa_tela_altura', itens: [100, 102],
    titulo: 'Altura da lousa e da tela',
    descricao: 'Parede de sala com uma lousa e uma tela de projeção. A borda inferior de ambas fica a no máximo 0,90 metro do piso.',
    s,
  };
}

// ---------------------------------------------------------------------------
function estantesCorredor() {
  const S = 180, X0 = 20, X1 = 700, YC = 290, CORR = 0.9 * S, BOL = 1.2 * S, LM = 1.5 * S;
  const yT = YC - CORR / 2, yB = YC + CORR / 2, xm = 290, yMt = YC - BOL / 2, yMb = YC + BOL / 2;
  let s = ta(24, 50, 'Vista de cima, sem escala no comprimento', { halo: false });
  const estante = (x0, x1, y, a) => {
    let t = ret(x0, y, x1 - x0, a, C.piso);
    for (let x = x0 + 50; x < x1 - 10; x += 50) t += linha(x, y, x, y + a, 1.6);
    return t;
  };
  s += estante(X0, xm, yT - 90, 90) + estante(X0, xm, yB, 90);
  s += estante(xm + LM, X1, yT - 90, 90) + estante(xm + LM, X1, yB, 90);
  s += estante(xm, xm + LM, yMt - 63, 63) + estante(xm, xm + LM, yMb, 63);
  s += zona(xm, yMt, LM, BOL) + cadeira(xm + LM / 2, YC, 0, 0.72);
  s += seta({ x: 44, y: yB }, { x: 44, y: yT }, { largura: 3, ponta: 12 });
  s += tb(60, YC + 11, 'mín. 0,90 m');
  s += seta({ x: xm, y: yMb + 84 }, { x: xm + LM, y: yMb + 84 }, { largura: 3, ponta: 12 });
  s += linha(xm, yMb + 63, xm, yMb + 96, 1.6) + linha(xm + LM, yMb + 63, xm + LM, yMb + 96, 1.6);
  s += texto(xm + LM / 2, yMb + 130, '1,50 m', { tam: T });
  s += seta({ x: xm + LM + 26, y: yMb }, { x: xm + LM + 26, y: yMt }, { largura: 3, ponta: 12 });
  s += linha(xm + LM, yMt, xm + LM + 38, yMt, 1.6) + linha(xm + LM, yMb, xm + LM + 38, yMb, 1.6);
  s += vertical(xm + LM + 66, YC, '1,20 m', A);
  s += tb(24, 590, 'Largura livre entre estantes') + ta(24, 626, 'sem livros ou móveis no caminho');
  s += tb(24, 668, 'Manobra a cada 15 m') + ta(24, 704, 'área mínima de 1,20 m x 1,50 m');
  return {
    nome: 'estantes_corredor', itens: [110],
    titulo: 'Corredor entre estantes',
    descricao: 'Vista de cima de um corredor entre estantes, com largura livre mínima de 0,90 metro. A cada 15 metros há um espaço de manobra para cadeira de rodas de no mínimo 1,20 por 1,50 metro.',
    s,
  };
}

// ---------------------------------------------------------------------------
function giro180() {
  const S = 240;
  let s = '';
  const mx = 90, my = 40, ml = 1.2 * S, ma = 0.8 * S;
  s += zona(mx, my, ml, ma) + cadeira(mx + ml / 2 - 6, my + ma / 2, 0, 1.2);
  s += seta({ x: mx, y: my + ma + 24 }, { x: mx + ml, y: my + ma + 24 }, { largura: 3, ponta: 12 });
  s += texto(mx + ml / 2, my + ma + 64, '1,20 m', { tam: T });
  s += seta({ x: mx - 26, y: my + ma }, { x: mx - 26, y: my }, { largura: 3, ponta: 12 });
  s += vertical(mx - 50, my + ma / 2, '0,80 m', A);
  s += tt(410, 110, 'Módulo de') + tt(410, 152, 'referência');
  const ax = 90, ay = 340, al = 1.5 * S, aa = 1.2 * S;
  s += zona(ax, ay, al, aa);
  s += cadeira(ax + 126, ay + 74, 0, 0.86) + cadeira(ax + 126, ay + aa - 74, 180, 0.86, 0.38);
  const r = aa / 2 - 74;
  s += `<path d="M ${ax + 227} ${ay + 74} A ${r + 2} ${r + 2} 0 0 1 ${ax + 227} ${ay + aa - 74}" fill="none" stroke="${AZUL}" stroke-width="5"/>`;
  s += seta({ x: ax + 245, y: ay + aa - 83 }, { x: ax + 227, y: ay + aa - 74 }, { cor: AZUL, dupla: false, largura: 5, ponta: 18 });
  s += seta({ x: ax, y: ay + aa + 22 }, { x: ax + al, y: ay + aa + 22 }, { largura: 3, ponta: 12 });
  s += texto(ax + al / 2, ay + aa + 62, '1,50 m', { tam: T, halo: false });
  s += seta({ x: ax - 26, y: ay + aa }, { x: ax - 26, y: ay }, { largura: 3, ponta: 12 });
  s += vertical(ax - 50, ay + aa / 2, '1,20 m', A);
  s += tt(470, 410, 'Manobra') + tt(470, 452, 'de 180°');
  s += ta(470, 510, 'Área livre de') + ta(470, 546, 'móveis e outros') + ta(470, 582, 'obstáculos');
  return {
    nome: 'giro_180', itens: [113, 133, 137, 142, 181],
    titulo: 'Módulo de referência e manobra de 180 graus',
    descricao: 'Vistas de cima de uma cadeira de rodas. O módulo de referência mede 0,80 por 1,20 metro. A manobra de 180 graus precisa de uma área livre de 1,20 por 1,50 metro.',
    s,
  };
}

// ---------------------------------------------------------------------------
function alcanceManual() {
  const S = 300, PISO = 650, y = h => PISO - h * S;
  let s = piso(20, 700, PISO);
  const x0 = 80, l = 200;
  s += tb(24, 44, 'Estantes e fichários') + ta(24, 82, 'acima: fora do alcance');
  s += ret(x0, y(1.8), l, 1.8 * S, C.branco);
  const prat = [0.2, 0.6, 1.0, 1.4];
  for (const h of prat) s += linha(x0, y(h), x0 + l, y(h), 3);
  for (const h of prat) for (let i = 0; i < 5; i++) {
    const alto = 44 + (i * 13) % 26;
    s += `<rect x="${x0 + 14 + i * 36}" y="${y(h) - alto}" width="24" height="${alto}" fill="${h > 1.1 ? '#c8c8c8' : '#7fa3c7'}" stroke="${C.linha}" stroke-width="1.5"/>`;
  }
  s += zona(x0 - 8, y(1.2), l + 16, 1.2 * S).replace(`fill="${ZONA}"`, 'fill="none"');
  s += seta({ x: 48, y: PISO }, { x: 48, y: y(1.2) }, { largura: 3, ponta: 12 });
  s += linha(36, y(1.2), x0 - 8, y(1.2), 1.6);
  s += vertical(24, (PISO + y(1.2)) / 2, 'máx. 1,20 m', A);
  // Puxadores e fechaduras
  const xz = 300, lz = 124;
  s += `<rect x="${xz}" y="${y(1.1)}" width="${lz}" height="${0.3 * S}" fill="rgba(217,119,6,.18)" stroke="${LARANJA}" stroke-width="3" stroke-dasharray="10 7"/>`;
  s += texto(xz + lz / 2, y(1.1) + 36, '1,10 m', { tam: A, halo: false });
  s += texto(xz + lz / 2, y(0.8) - 10, '0,80 m', { tam: A, halo: false });
  s += tb(xz, y(1.1) - 84, 'Puxadores') + ta(xz, y(1.1) - 48, 'e fechaduras');
  // Balcão de lado
  const bx = 480, yb = y(0.85);
  s += tb(bx - 20, 44, 'Balcão de lado');
  s += ta(bx + 10, 132, 'Alimentos') + ta(bx + 10, 168, 'e bebidas');
  s += ret(bx, yb, 220, 26, C.branco) + ret(bx + 170, yb + 26, 40, PISO - yb - 26, C.parede);
  s += zona(bx, y(1.2), 0.5 * S, yb - y(1.2));
  s += `<rect x="${bx + 22}" y="${yb - 40}" width="40" height="40" rx="4" fill="#7fa3c7" stroke="${C.linha}" stroke-width="2"/><ellipse cx="${bx + 100}" cy="${yb - 18}" rx="22" ry="18" fill="#d9a441" stroke="${C.linha}" stroke-width="2"/>`;
  s += chamada({ x: bx + 60, y: yb - 54 }, bx + 60, 178);
  s += seta({ x: bx, y: yb + 62 }, { x: bx + 0.5 * S, y: yb + 62 }, { largura: 3, ponta: 12 });
  s += texto(bx + 75, yb + 104, 'Profundidade', { tam: A, peso: 500 });
  s += texto(bx + 75, yb + 142, 'máx. 0,50 m', { tam: A });
  s += seta({ x: bx - 24, y: PISO }, { x: bx - 24, y: y(1.2) }, { largura: 3, ponta: 12 });
  s += linha(bx - 36, y(1.2), bx, y(1.2), 1.6);
  s += vertical(bx - 46, (PISO + y(1.2)) / 2 + 30, 'máx. 1,20 m', A);
  return {
    nome: 'alcance_manual', itens: [115, 135],
    titulo: 'Faixa de alcance manual',
    descricao: 'À esquerda, estante com área de uso até 1,20 metro e puxadores e fechaduras entre 0,80 e 1,10 metro. À direita, balcão visto de lado, com alimentos e bebidas até 1,20 metro de altura e 0,50 metro de profundidade.',
    s,
  };
}

// ---------------------------------------------------------------------------
function auditorioPcr() {
  const S = 150, L = 62, GAP = 6;
  let s = '';
  const assento = (x, y, cor = C.branco) => `<rect x="${x}" y="${y}" width="${L}" height="${L}" rx="7" fill="${cor}" stroke="${C.linha}" stroke-width="2.5"/><rect x="${x + 5}" y="${y - 12}" width="${L - 10}" height="12" rx="4" fill="#777" stroke="${C.linha}" stroke-width="2"/>`;
  const fileira = (y, de, ate) => { let t = ''; for (let x = de; x + L <= ate; x += L + GAP) t += assento(x, y); return t; };
  const eL = 0.8 * S, eA = 1.2 * S, x0 = 380, DESL = 0.3 * S;
  const yEnc = 150, yMeio = yEnc + 12, yE = yEnc + DESL, yFimE = yE + eA, yTras = yFimE + DESL + 12;
  const FIM = x0 + eL + GAP + 2 * (L + GAP) + 60;
  const INI = 40;
  s += fileira(46, INI, FIM);
  s += fileira(yMeio, INI, x0 - L - GAP + 8);
  s += assento(x0 - L - GAP, yMeio, 'rgba(217,119,6,.55)');
  s += fileira(yMeio, x0 + eL + GAP, FIM);
  s += fileira(yTras, INI, FIM);
  s += linha(x0 - 6, yEnc, x0 + eL + 6, yEnc, 2, C.cota, 'stroke-dasharray="7 6"');
  s += zona(x0, yE, eL, eA) + cadeira(x0 + eL / 2, yE + eA / 2 - 12, 90, 0.66);
  const xs = x0 + 8, ys = yFimE - 42;
  s += `<rect x="${xs}" y="${ys}" width="34" height="34" rx="4" fill="${AZUL}"/><circle cx="${xs + 17}" cy="${ys + 8}" r="4" fill="#fff"/><path d="M ${xs + 17} ${ys + 13} v 9 h 7 l 3 6 M ${xs + 11} ${ys + 17} a 8 8 0 1 0 9 11" fill="none" stroke="#fff" stroke-width="2.6"/>`;
  const xm = x0 + eL - 22;
  s += seta({ x: xm, y: yEnc }, { x: xm, y: yE }, { ponta: 9, largura: 2.5 });
  s += seta({ x: xm, y: yFimE }, { x: xm, y: yFimE + DESL }, { ponta: 9, largura: 2.5 });
  // Números no desenho e legenda em texto
  s += marca(x0 + eL - 24, yE + 28, 1);
  s += marca(x0 - L / 2 - GAP, yMeio + L / 2, 2);
  s += marca(xm - 34, yEnc + DESL / 2 + 2, 3);
  s += marca(xm - 34, yFimE + DESL / 2 + 2, 4);
  s += marca(xs + 60, ys + 16, 5);
  const legenda = ['Espaço para cadeira: 0,80 m × 1,20 m', 'Assento companheiro', 'Deslocado 0,30 m em relação ao encosto', 'Faixa livre de 0,30 m entre fileiras', 'Símbolo de acesso no piso'];
  legenda.forEach((t, i) => { s += marca(44, 534 + i * 40 - 10, i + 1) + ta(74, 534 + i * 40, t, { halo: false }); });
  return {
    nome: 'auditorio_espaco_pcr', itens: [119, 120, 121, 122],
    titulo: 'Espaço para cadeira de rodas na plateia',
    descricao: 'Vista de cima de fileiras de assentos. O espaço reservado mede 0,80 por 1,20 metro e fica deslocado 0,30 metro em relação ao encosto, com faixa livre de 0,30 metro até a fileira seguinte. Há um assento companheiro ao lado e o Símbolo Internacional de Acesso no piso.',
    s,
  };
}

// ---------------------------------------------------------------------------
function auditorioAssentoPmr() {
  const P = 90, l = 60, a = 76, xA = 330, yB = 180;
  let s = '';
  const assento = (x, y, fill = C.branco) => ret(x + 3, y, l - 6, a, fill, 'rx="6"') + `<rect x="${x + 3}" y="${y + a - 13}" width="${l - 6}" height="13" rx="4" fill="#777" stroke="${C.linha}" stroke-width="2"/>`;
  for (const y of [yB - a - P, yB, yB + a + P]) for (let i = 0; i < 5; i++) s += assento(xA - l * (i + 1), y, y === yB && i === 0 ? '#bcd4ec' : C.branco);
  const xS = xA - l;
  s += `<rect x="${xS + 3}" y="${yB - P}" width="${l - 6}" height="${P}" fill="${ZONA}" stroke="${AZUL}" stroke-width="3" stroke-dasharray="9 7"/>`;
  s += `<rect x="${xA - 5}" y="${yB + 3}" width="10" height="${a - 6}" rx="4" fill="${LARANJA}" stroke="${C.linha}" stroke-width="2"/>`;
  s += seta({ x: xA + 22, y: yB }, { x: xA + 22, y: yB - P }, { largura: 3, ponta: 11 });
  s += linha(xA - 4, yB, xA + 34, yB, 1.6) + linha(xA - 4, yB - P, xA + 34, yB - P, 1.6);
  s += vertical(xA + 52, yB - P / 2 + 30, 'mín. 0,60 m', A);
  s += tb(30, 490, 'Assento para PMR e PO') + ta(30, 526, 'junto ao corredor');
  s += ta(30, 580, '2% dos assentos ou 1,') + ta(30, 616, 'o que for maior');
  // Apoio basculante, visto de lado
  const xd = 410, yP = 370, xE = 452;
  s += ret(xd, 30, 290, yP - 30, C.parede) + ret(xd, yP, 290, 26, C.piso);
  s += texto(xd + 145, 72, 'Visto de lado', { tam: A, halo: false });
  s += `<rect x="${xE + 112}" y="210" width="18" height="${yP - 210 - 20}" rx="5" fill="#777" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += `<rect x="${xE}" y="${yP - 96}" width="130" height="22" rx="5" fill="#fff" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += `<rect x="${xE + 98}" y="${yP - 74}" width="14" height="74" fill="#777" stroke="${C.linha}" stroke-width="2"/>`;
  const xH = xE + 112, yH = yP - 150;
  s += `<rect x="${xE + 6}" y="${yH - 5}" width="${xH - xE - 6}" height="11" rx="5" fill="${LARANJA}" stroke="${C.linha}" stroke-width="2"/>`;
  s += `<rect x="${xH - 5}" y="${yH - 104}" width="11" height="104" rx="5" fill="none" stroke="${LARANJA}" stroke-width="3" stroke-dasharray="9 7"/>`;
  s += `<path d="M ${xE + 36} ${yH - 12} A 76 76 0 0 1 ${xH - 16} ${yH - 82}" fill="none" stroke="${C.cota}" stroke-width="3"/>`;
  s += seta({ x: xH - 28, y: yH - 78 }, { x: xH - 16, y: yH - 82 }, { dupla: false, ponta: 12, largura: 2 });
  s += tb(420, 450, 'Apoio de braço') + ta(420, 486, 'basculante ou') + ta(420, 522, 'removível, no lado') + ta(420, 558, 'do corredor');
  return {
    nome: 'auditorio_assento_pmr', itens: [123],
    titulo: 'Assento para PMR e PO no auditório',
    descricao: 'À esquerda, fileiras de um auditório vistas de cima. O assento para pessoa com mobilidade reduzida e pessoa obesa fica junto ao corredor, com espaço livre frontal mínimo de 0,60 metro, em 2 por cento dos assentos ou 1 assento, o que for maior. À direita, o assento visto de lado, com apoio de braço basculante ou removível no lado do corredor.',
    s,
  };
}

// ---------------------------------------------------------------------------
function plateiaCorrimao() {
  const H = 168;
  const cena = (x0, x1, titulo, comRampa) => {
    let t = texto((x0 + x1) / 2, 118, titulo, { tam: A, halo: false });
    const yB = 530, yA = 400, xa = x0 + 36, xb = x1 - 36, n = 4, px = (xb - xa) / n, py = (yB - yA) / n;
    let pts = `${x0},${yB} ${xa},${yB}`;
    if (comRampa) pts += ` ${xb},${yA}`;
    else for (let i = 0; i < n; i++) pts += ` ${xa + i * px},${yB - (i + 1) * py} ${xa + (i + 1) * px},${yB - (i + 1) * py}`;
    pts += ` ${x1},${yA} ${x1},590 ${x0},590`;
    t += `<polygon points="${pts}" fill="${C.piso}" stroke="${C.linha}" stroke-width="3"/>`;
    const xI = xa, yI = comRampa ? yB : yB - py, xF = comRampa ? xb : xa + (n - 1) * px, yF = yA;
    const ref = xx => yI + (yF - yI) * (xx - xI) / (xF - xI);
    t += `<polyline points="${xI - 24},${yI - H} ${xI},${yI - H} ${xF},${yF - H} ${xF + 24},${yF - H}" fill="none" stroke="${AZUL}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>`;
    for (const xx of comRampa ? [xa + 40, xb - 40] : [xI, xF]) t += linha(xx, ref(xx) - H + 4, xx, ref(xx), 6, '#777');
    const xc = comRampa ? (xa + xb) / 2 - 50 : xa + px;
    t += seta({ x: xc, y: ref(xc) }, { x: xc, y: ref(xc) - H + 6 }, { largura: 3, ponta: 12 });
    t += tb(xc + 12, ref(xc) - H / 2 + 10, '0,70 m');
    t += texto(x1, yF - H - 22, 'Corrimão', { tam: A, anc: 'end' });
    return t;
  };
  let s = texto(360, 56, 'Corredor da plateia', { tam: T });
  s += cena(20, 345, 'Com rampa', true) + cena(375, 700, 'Com degraus', false);
  s += texto(360, 646, 'Ao menos um corrimão,', { tam: A });
  s += texto(360, 684, 'com o corredor livre de obstáculos', { tam: A, peso: 500 });
  return {
    nome: 'plateia_corrimao', itens: [124],
    titulo: 'Corrimão no corredor da plateia',
    descricao: 'Dois cortes de corredores de plateia, um com rampa e outro com degraus. Em ambos há pelo menos um corrimão a 0,70 metro de altura, e o corredor fica livre de obstáculos.',
    s,
  };
}

// ---------------------------------------------------------------------------
const simboloSurdez = (x, y, l) => `<g transform="translate(${x} ${y}) scale(${l / 36})"><rect width="36" height="36" rx="4" fill="${AZUL}"/><path d="M 13 21 C 8 9 27 5 27 16 C 27 22 20 21 20 27 a 4 4 0 0 1 -7 2" fill="none" stroke="#fff" stroke-width="2.6"/><line x1="8" y1="30" x2="29" y2="7" stroke="#fff" stroke-width="2.6"/></g>`;

function interpreteLibras() {
  const pessoa = (cx, yP, cor = '#444') => {
    const yC = yP - 330;
    return `<g transform="translate(${cx} ${yP}) scale(.72) translate(${-cx} ${-yP})"><circle cx="${cx}" cy="${yC}" r="34" fill="${cor}"/>`
      + `<rect x="${cx - 42}" y="${yC + 40}" width="84" height="150" rx="22" fill="${cor}"/>`
      + `<rect x="${cx - 36}" y="${yC + 182}" width="30" height="${yP - yC - 182}" fill="${cor}"/><rect x="${cx + 6}" y="${yC + 182}" width="30" height="${yP - yC - 182}" fill="${cor}"/>`
      + `<path d="M ${cx - 38} ${yC + 62} L ${cx - 92} ${yC + 110} L ${cx - 46} ${yC + 40} M ${cx + 38} ${yC + 62} L ${cx + 92} ${yC + 110} L ${cx + 46} ${yC + 40}" fill="none" stroke="${cor}" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/></g>`;
  };
  const cena = (x, correta) => {
    const yT = 76, yP = 620, xE = x + 10, l = 310, cx = x + 140;
    const id = correta ? 'palco-correto' : 'palco-incorreto';
    let t = quadro(x, 20, 330, 680, correta ? 'Correto' : 'Incorreto', correta ? VERDE : VERMELHO);
    t += `<clipPath id="${id}"><rect x="${xE}" y="${yT}" width="${l}" height="${yP - yT}"/></clipPath>`;
    t += `<rect x="${xE}" y="${yT}" width="${l}" height="${yP - yT}" fill="${C.parede}"/>`;
    t += `<rect x="${xE}" y="${yP}" width="${l}" height="70" fill="${C.piso}" stroke="${C.linha}" stroke-width="2"/>`;
    const yC = yP - 0.72 * 330 - 0.72 * 34, yJ = yP - 58;
    if (correta) {
      t += `<polygon points="${cx - 18},${yT + 10} ${cx + 18},${yT + 10} ${cx + 118},${yP} ${cx - 118},${yP}" fill="#ffe680" opacity=".75" clip-path="url(#${id})"/>`;
      t += `<rect x="${cx - 28}" y="${yT}" width="56" height="12" fill="#333"/>`;
      t += pessoa(cx, yP);
      const xB = x + 296;
      t += seta({ x: xB, y: yC }, { x: xB, y: yJ }, { largura: 3, ponta: 12 });
      t += linha(cx + 30, yC, xB + 12, yC, 1.6) + linha(cx + 30, yJ, xB + 12, yJ, 1.6);
      t += vertical(xB - 22, (yC + yJ) / 2, 'Da cabeça', A);
      t += vertical(xB + 18, (yC + yJ) / 2 , 'aos joelhos', A);
      t += simboloSurdez(x + 18, 90, 56);
      t += tb(x + 84, 116, 'Local') + tb(x + 84, 148, 'identificado');
      t += tb(x + 18, 196, 'Iluminação') + tb(x + 18, 232, 'direcional');
    } else {
      t += `<polygon points="${xE + 16},300 ${xE + 16},326 ${cx},470 ${cx},290" fill="#ffe680" opacity=".75"/>`;
      t += `<rect x="${xE}" y="294" width="16" height="36" fill="#333"/>`;
      t += `<g transform="translate(100 -4) skewX(-4)" opacity=".9">${pessoa(cx, yP, '#8d8d94')}</g>`;
      t += pessoa(cx, yP);
      t += ret(cx - 98, yP - 130, 196, 130, '#b08a5a', 'rx="4"');
      t += tb(x + 16, 118, 'Sem identificação') + tb(x + 16, 158, 'Sombra no fundo');
      t += texto(cx, yP - 74, 'Pernas', { tam: A, cor: '#fff', halo: false });
      t += texto(cx, yP - 38, 'encobertas', { tam: A, cor: '#fff', halo: false });
    }
    return t;
  };
  const s = cena(20, true) + cena(370, false);
  return {
    nome: 'interprete_libras', itens: [125],
    titulo: 'Local do intérprete de Libras',
    descricao: 'Duas cenas com um intérprete de Libras. Na correta, o local é identificado com o símbolo de pessoas com deficiência auditiva, a iluminação é direcional e a pessoa fica visível da cabeça aos joelhos, sem sombra no fundo. Na incorreta, não há identificação, a luz lateral projeta sombra no fundo e um móvel encobre as pernas.',
    s,
  };
}

// ---------------------------------------------------------------------------
function sinalizacaoLuminosaPiso() {
  const LUZ = '#ffd84d';
  let s = `<rect x="20" y="20" width="680" height="385" rx="8" fill="#1f2630" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += texto(360, 58, 'Auditório com luz reduzida', { tam: A, cor: '#fff', halo: false });
  const xc0 = 280, xc1 = 440, y0 = 130;
  for (let f = 0; f < 3; f++) {
    const y = y0 + f * 88;
    for (const x0 of [44, 452]) for (let i = 0; i < 4; i++) s += `<rect x="${x0 + i * 56}" y="${y}" width="48" height="60" rx="6" fill="#49525f" stroke="#111" stroke-width="2"/>`;
  }
  for (let y = 132; y < 396; y += 36) for (const x of [xc0 + 22, xc1 - 22]) s += `<circle cx="${x}" cy="${y}" r="7" fill="${LUZ}"/><circle cx="${x}" cy="${y}" r="14" fill="${LUZ}" opacity=".28"/>`;
  s += seta({ x: 360, y: 392 }, { x: 360, y: 128 }, { dupla: false, cor: '#fff', largura: 5, ponta: 18 });
  s += `<rect x="298" y="72" width="124" height="44" rx="4" fill="${VERDE}" stroke="#fff" stroke-width="2"/>`;
  s += texto(360, 105, 'SAÍDA', { tam: A, cor: '#fff', halo: false });
  // Detalhe, visto de lado
  const PISO = 630;
  s += `<rect x="20" y="415" width="680" height="285" rx="8" fill="#2a313c" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += texto(360, 454, 'Duas formas de sinalizar', { tam: A, cor: '#fff', halo: false });
  s += `<rect x="34" y="${PISO}" width="652" height="24" fill="#6b7280" stroke="#111" stroke-width="2"/>`;
  s += `<rect x="90" y="${PISO - 160}" width="24" height="160" fill="#49525f" stroke="#111" stroke-width="2"/>`;
  s += `<rect x="114" y="${PISO - 76}" width="96" height="20" rx="5" fill="#49525f" stroke="#111" stroke-width="2"/>`;
  s += `<rect x="192" y="${PISO - 56}" width="16" height="56" fill="#49525f" stroke="#111" stroke-width="2"/>`;
  const xB = 216, yB = PISO - 20;
  s += `<rect x="${xB - 4}" y="${yB - 10}" width="12" height="20" fill="${LUZ}" stroke="#111"/><circle cx="${xB + 4}" cy="${yB}" r="24" fill="${LUZ}" opacity=".3"/>`;
  s += linha(xB + 14, yB - 14, 276, 552, 2, '#fff');
  s += tb(262, 512, 'Próxima', { cor: '#fff', halo: false }) + tb(262, 546, 'ao piso', { cor: '#fff', halo: false });
  const xN = 570;
  s += `<rect x="${xN - 40}" y="${PISO - 8}" width="80" height="12" rx="3" fill="${LUZ}" stroke="#111"/><ellipse cx="${xN}" cy="${PISO - 10}" rx="60" ry="20" fill="${LUZ}" opacity=".28"/>`;
  s += linha(xN, PISO - 26, xN, 552, 2, '#fff');
  s += texto(xN, 540, 'No piso', { tam: A, cor: '#fff', halo: false });
  s += texto(360, 688, 'Orienta o caminho no escuro', { tam: A, peso: 600, cor: '#fff', halo: false });
  return {
    nome: 'sinalizacao_luminosa_piso', itens: [128],
    titulo: 'Sinalização luminosa no piso',
    descricao: 'Auditório com luz reduzida, visto de cima, com pontos de luz ao longo do corredor até a saída. No detalhe, as duas formas de sinalizar: próxima ao piso, na lateral do assento, ou no próprio piso.',
    s,
  };
}

// ---------------------------------------------------------------------------
function balcaoAutosservico() {
  const S = 260, PISO = 400, y = h => PISO - h * S;
  let s = piso(20, 700, PISO, 30);
  const xb = 180, lb = 340;
  s += tb(24, 44, 'Balcão visto de frente') + ta(24, 84, 'bandejas, talheres e alimentos');
  s += zona(xb - 20, y(0.85), lb + 40, 0.1 * S);
  s += ret(xb, y(0.8), lb, 16, C.branco) + ret(xb + 20, y(0.8) + 16, lb - 40, PISO - y(0.8) - 16, C.parede);
  const topo = y(0.8);
  s += `<rect x="${xb + 18}" y="${topo - 10}" width="100" height="10" rx="3" fill="#7fa3c7" stroke="${C.linha}" stroke-width="2"/><rect x="${xb + 18}" y="${topo - 20}" width="100" height="10" rx="3" fill="#7fa3c7" stroke="${C.linha}" stroke-width="2"/>`;
  s += `<rect x="${xb + 150}" y="${topo - 40}" width="40" height="40" rx="4" fill="#e6e6e6" stroke="${C.linha}" stroke-width="2"/><path d="M ${xb + 160} ${topo - 40} v -22 M ${xb + 170} ${topo - 40} v -26 M ${xb + 180} ${topo - 40} v -20" stroke="${C.linha}" stroke-width="4" stroke-linecap="round"/>`;
  s += `<ellipse cx="${xb + 256}" cy="${topo - 15}" rx="42" ry="15" fill="#d9a441" stroke="${C.linha}" stroke-width="2"/>`;
  s += seta({ x: 110, y: PISO }, { x: 110, y: y(0.85) }, { largura: 3, ponta: 12 }) + linha(98, y(0.85), xb - 20, y(0.85), 1.6);
  s += vertical(86, y(0.42), '0,85 m', A);
  s += seta({ x: 590, y: PISO }, { x: 590, y: y(0.75) }, { largura: 3, ponta: 12 }) + linha(xb + lb + 20, y(0.75), 602, y(0.75), 1.6);
  s += vertical(620, y(0.42), '0,75 m', A);
  s += texto(xb + lb / 2, y(0.42), 'Superfície entre', { tam: A, peso: 500 });
  s += texto(xb + lb / 2, y(0.42) + 36, 'as duas alturas', { tam: A, peso: 500 });
  // Vista de cima
  const yb = 450, ab = 60, yc = yb + ab, ac = 130;
  s += ret(20, yb, 680, ab, C.branco);
  s += texto(360, yb + 41, 'Balcão', { tam: A, halo: false });
  s += texto(688, yb + 41, 'Vista de cima', { tam: A, peso: 500, cor: C.muted, halo: false, anc: 'end' });
  s += `<rect x="20" y="${yc}" width="680" height="${ac}" fill="${ZONA}"/>`;
  s += ret(20, yc + ac, 680, 20, '#8a8a8a');
  s += cadeira(150, yc + ac / 2, 0, 0.72);
  s += seta({ x: 340, y: yc + ac }, { x: 340, y: yc }, { largura: 3, ponta: 12 });
  s += tt(356, yc + ac / 2 + 13, 'mín. 0,90 m');
  s += texto(360, 702, 'Corredor ao lado, sem móveis', { tam: A, peso: 600 });
  return {
    nome: 'balcao_autosservico', itens: [134],
    titulo: 'Balcão de autosserviço',
    descricao: 'Em cima, balcão visto de frente, com bandejas, talheres e alimentos sobre uma superfície entre 0,75 e 0,85 metro do piso. Embaixo, vista de cima, com corredor de largura mínima de 0,90 metro ao lado do balcão.',
    s,
  };
}

// ---------------------------------------------------------------------------
function iluminacaoBalcao() {
  const cena = (x, correta) => {
    const yT = 76, yB = 520, xE = x + 10, l = 310, cx = x + 165, cy = 300, r = 92;
    const id = correta ? 'rosto-correto' : 'rosto-incorreto';
    let t = quadro(x, 20, 330, 680, correta ? 'Correto' : 'Incorreto', correta ? VERDE : VERMELHO);
    t += `<rect x="${xE}" y="${yT}" width="${l}" height="${yB - yT}" fill="${correta ? '#fbf3d4' : '#5a616e'}"/>`;
    if (!correta) {
      t += `<rect x="${cx - 130}" y="${yT + 86}" width="260" height="230" fill="#fffbe0" stroke="${C.linha}" stroke-width="3"/>` + linha(cx, yT + 86, cx, yT + 316, 3);
    } else {
      t += `<polygon points="${cx - 44},${yT + 12} ${cx + 44},${yT + 12} ${cx + 150},${yB} ${cx - 150},${yB}" fill="#ffe680" opacity=".7"/>`;
      t += `<rect x="${cx - 54}" y="${yT}" width="108" height="12" fill="#fff" stroke="${C.linha}" stroke-width="2"/>`;
    }
    t += `<path d="M ${cx - 145} ${yB} Q ${cx - 145} ${cy + 106} ${cx} ${cy + 106} Q ${cx + 145} ${cy + 106} ${cx + 145} ${yB} Z" fill="#7b8794" stroke="${C.linha}" stroke-width="3"/>`;
    t += `<clipPath id="${id}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath>`;
    t += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#d5d9df" stroke="${C.linha}" stroke-width="3"/>`;
    for (const dx of [-34, 34]) t += `<ellipse cx="${cx + dx}" cy="${cy - 20}" rx="10" ry="12" fill="#222"/>`;
    t += `<path d="M ${cx - 14} ${cy + 2} q 14 16 22 5" fill="none" stroke="#555" stroke-width="3"/>`;
    t += `<ellipse cx="${cx}" cy="${cy + 44}" rx="32" ry="15" fill="#555" stroke="#222" stroke-width="2.5"/>`;
    if (!correta) t += `<rect x="${cx - r}" y="${cy - r}" width="${2 * r}" height="${2 * r}" fill="#20242c" opacity=".78" clip-path="url(#${id})"/>`;
    t += `<rect x="${xE}" y="${yB}" width="${l}" height="28" fill="#fff" stroke="${C.linha}" stroke-width="3"/>`;
    t += `<rect x="${xE + 20}" y="${yB + 28}" width="${l - 40}" height="${690 - yB - 28}" fill="${C.patamar}" stroke="${C.linha}" stroke-width="2.5"/>`;
    t += seta({ x: cx, y: 446 }, { x: cx, y: cy + 62 }, { dupla: false, ponta: 14, largura: 3, cor: correta ? C.cota : '#fff' });
    t += texto(cx, 482, correta ? 'Boca visível' : 'Boca no escuro', { tam: A });
    t += texto(cx, 598, 'Leitura labial', { tam: A, halo: false });
    t += texto(cx, 640, correta ? 'possível' : 'difícil', { tam: T, halo: false });
    if (correta) t += texto(cx, 128, 'Luz sobre a face', { tam: A });
    else t += texto(cx, 124, 'Janela atrás', { tam: A, cor: '#fff', halo: false }) + texto(cx, 154, 'do atendente', { tam: A, cor: '#fff', halo: false });
    return t;
  };
  const s = cena(20, true) + cena(370, false);
  return {
    nome: 'iluminacao_balcao', itens: [145],
    titulo: 'Iluminação no balcão de atendimento',
    descricao: 'Duas cenas com um atendente de frente, atrás do balcão. Na correta, o rosto recebe luz uniforme, a boca fica visível e a leitura labial é possível. Na incorreta, uma janela atrás do atendente deixa o rosto na sombra, e a leitura labial fica difícil.',
    s,
  };
}

// ---------------------------------------------------------------------------
function sanitarioPorta() {
  let s = '';
  const parede = (x, y, l, vao) => `<rect x="${x}" y="${y}" width="${(l - vao) / 2}" height="24" fill="#555"/><rect x="${x + (l + vao) / 2}" y="${y}" width="${(l - vao) / 2}" height="24" fill="#555"/>`;
  const vao = 120, l1 = 260, Y = 190;
  const ax = 40, g0 = ax + (l1 - vao) / 2, g1 = g0 + vao;
  s += texto(ax + l1 / 2, 50, 'Abre para fora', { tam: A });
  s += parede(ax, Y, l1, vao) + linha(g1, Y, g1, Y - vao, 9);
  s += `<path d="M ${g1} ${Y - vao} A ${vao} ${vao} 0 0 0 ${g0} ${Y}" fill="none" stroke="${C.cota}" stroke-width="2.5" stroke-dasharray="8 6"/>`;
  s += seta({ x: g0, y: Y + 44 }, { x: g1, y: Y + 44 }, { largura: 3, ponta: 11 });
  const bx = 400, h0 = bx + (l1 - vao) / 2, h1 = h0 + vao;
  s += texto(bx + l1 / 2, 50, 'Ou de correr', { tam: A });
  s += parede(bx, Y, l1, vao) + `<rect x="${h1 - 8}" y="${Y - 18}" width="${vao}" height="10" fill="${C.linha}"/>`;
  s += seta({ x: h1, y: Y - 40 }, { x: h1 + 90, y: Y - 40 }, { dupla: false, largura: 3, ponta: 12 });
  s += seta({ x: h0, y: Y + 44 }, { x: h1, y: Y + 44 }, { largura: 3, ponta: 11 });
  s += texto(360, 278, 'Vão livre mín. 0,80 m', { tam: T });
  s += texto(360, 318, 'Embaixo: interior do sanitário', { tam: A, peso: 500 });
  // Puxador
  const Sy = 200, PISO = 680, y = h => PISO - h * Sy, px0 = 100, pl = 160;
  s += ret(20, y(1.6), 380, 1.6 * Sy, C.parede) + ret(20, PISO, 380, 24, C.piso);
  s += ret(px0, y(1.6), pl, 1.6 * Sy, C.branco);
  s += zona(px0 - 30, y(1.1), pl + 60, 0.3 * Sy);
  const lp = 80, xp = px0 + 40, yp = y(0.95);
  s += linha(xp, yp, xp + lp, yp, 12, AZUL, 'stroke-linecap="round"');
  s += seta({ x: xp, y: yp + 20 }, { x: xp + lp, y: yp + 20 }, { ponta: 8, largura: 2.5 });
  s += texto(px0 + pl / 2, y(1.1) - 16, 'mín. 0,40 m', { tam: A });
  s += tb(px0 + pl + 38, y(1.1) + 26, '1,10 m') + tb(px0 + pl + 38, y(0.8) + 2, '0,80 m');
  s += tt(420, 400, 'Puxador') + tt(420, 440, 'horizontal');
  s += ta(420, 486, 'do lado oposto') + ta(420, 522, 'ao de abertura');
  s += ta(420, 580, 'Diâmetro:') + tb(420, 616, '25 mm a 35 mm');
  return {
    nome: 'sanitario_porta_puxador', itens: [152, 153],
    titulo: 'Porta e puxador do sanitário',
    descricao: 'Em cima, vistas de cima de uma porta que abre para fora e de uma porta de correr, ambas com vão livre mínimo de 0,80 metro. Embaixo, puxador horizontal do lado oposto ao de abertura, com comprimento mínimo de 0,40 metro, diâmetro de 25 a 35 milímetros, entre 0,80 e 1,10 metro do piso.',
    s,
  };
}

gerarLote([
  lousaTelaAltura, estantesCorredor, giro180, alcanceManual, auditorioPcr, auditorioAssentoPmr,
  plateiaCorrimao, interpreteLibras, sinalizacaoLuminosaPiso, balcaoAutosservico, iluminacaoBalcao, sanitarioPorta,
]);
