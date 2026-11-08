// Lote 3 das ilustrações quadradas (720×720): os 12 desenhos seguintes na ordem do checklist.
// Cada um reenquadra o desenho original (lote1 a lote4), com rótulos de 38 e 30.
// Uso: node quadradas_lote3.mjs  →  saida/quadradas/*.svg
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { C, criarVista, texto, seta, tatilAlerta, tatilDirecional, amostraAlerta, amostraDirecional } from './lib.mjs';
import { cadeira } from './lote1.mjs';

const LADO = 720, T = 38, A = 30;
const AZUL = C.apoio;
const ZONA = 'rgba(11,87,164,.14)';
const VERDE = '#15703a', VERMELHO = '#b91c1c', LARANJA = '#d97706';

const documento = ({ titulo, descricao, conteudo }) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${LADO} ${LADO}" role="img" aria-labelledby="t d" font-family="Inter, Arial, Helvetica, sans-serif">
<title id="t">${titulo}</title><desc id="d">${descricao}</desc>
<rect width="${LADO}" height="${LADO}" fill="#fff"/>
${conteudo}
</svg>
`;
const tt = (x, y, s, o = {}) => texto(x, y, s, { tam: T, anc: 'start', ...o });
const ta = (x, y, s, o = {}) => texto(x, y, s, { tam: A, peso: 500, anc: 'start', ...o });
const tb = (x, y, s, o = {}) => texto(x, y, s, { tam: A, peso: 700, anc: 'start', ...o });
const ret = (x, y, l, a, fill, extra = '') => `<rect x="${x}" y="${y}" width="${l}" height="${a}" fill="${fill}" stroke="${C.linha}" stroke-width="2.5" ${extra}/>`;
const linha = (x1, y1, x2, y2, l = 2.5, cor = C.linha, extra = '') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${cor}" stroke-width="${l}" ${extra}/>`;
const chamada = (de, x, y) => linha(de.x.toFixed(1), de.y.toFixed(1), x, y) + `<circle cx="${de.x.toFixed(1)}" cy="${de.y.toFixed(1)}" r="6" fill="${C.linha}"/>`;
const vertical = (x, y, s, tam = T, peso = 700) => `<text x="${x}" y="${y}" font-size="${tam}" font-weight="${peso}" text-anchor="middle" fill="${C.cota}" paint-order="stroke" stroke="#fff" stroke-width="6" stroke-linejoin="round" transform="rotate(-90 ${x} ${y})">${s}</text>`;
const zona = (x, y, l, a) => `<rect x="${x}" y="${y}" width="${l}" height="${a}" fill="${ZONA}" stroke="${AZUL}" stroke-width="3" stroke-dasharray="11 8"/>`;
const piso = (x0, x1, y, a = 50) => ret(x0, y, x1 - x0, a, C.piso);
// Faixa de alerta em corte (vista de lado)
function faixaAlerta(x, y, l, a) {
  let s = ret(x, y, l, a, C.tatil, 'stroke-width="2"');
  for (let i = x + 8; i < x + l - 4; i += 16) s += `<circle cx="${i}" cy="${y + a / 2}" r="4" fill="${C.relevo}"/>`;
  return s;
}
// Alerta visto de cima
function alertaCima(x, y, l, a) {
  let s = ret(x, y, l, a, C.tatil, 'stroke-width="2"');
  for (let i = x + 11; i < x + l - 4; i += 22) for (let j = y + 11; j < y + a - 4; j += 22) s += `<circle cx="${i}" cy="${j}" r="5" fill="${C.relevo}"/>`;
  return s;
}
/**
 * Cela Braille com os pontos numerados (1, 2, 3 na coluna da esquerda; 4, 5, 6 na da direita).
 * Os números conferidos estão no comentário de cada uso.
 */
function cela(x, y, pontos, passo, raio, cor) {
  return pontos.map(p => {
    const col = p > 3 ? 1 : 0, lin = (p - 1) % 3;
    return `<circle cx="${x + col * passo}" cy="${y + lin * passo}" r="${raio}" fill="${cor}"/>`;
  }).join('');
}

// ---------------------------------------------------------------------------
function comandosAlturas() {
  const S = 380, PISO = 640, y = h => PISO - h * S;
  let s = ret(20, y(1.45), 680, 1.45 * S, C.parede) + piso(20, 700, PISO, 60);
  const interruptor = (x, y0) => `<rect x="${x - 30}" y="${y0 - 40}" width="60" height="80" rx="8" fill="#fff" stroke="${C.linha}" stroke-width="3"/><rect x="${x - 12}" y="${y0 - 22}" width="24" height="44" rx="4" fill="${C.patamar}" stroke="${C.linha}" stroke-width="2.5"/>`;
  const tomada = (x, y0) => `<rect x="${x - 30}" y="${y0 - 40}" width="60" height="80" rx="8" fill="#fff" stroke="${C.linha}" stroke-width="3"/><circle cx="${x}" cy="${y0}" r="21" fill="${C.patamar}" stroke="${C.linha}" stroke-width="2.5"/><circle cx="${x - 8}" cy="${y0}" r="4" fill="${C.linha}"/><circle cx="${x + 8}" cy="${y0}" r="4" fill="${C.linha}"/>`;
  const interfone = (x, y0) => `<rect x="${x - 36}" y="${y0 - 50}" width="72" height="100" rx="9" fill="#fff" stroke="${C.linha}" stroke-width="3"/><rect x="${x - 24}" y="${y0 - 38}" width="48" height="30" rx="4" fill="${C.patamar}" stroke="${C.linha}" stroke-width="2"/>${[0, 1, 2].map(i => `<circle cx="${x - 16 + i * 16}" cy="${y0 + 14}" r="4.5" fill="${C.linha}"/><circle cx="${x - 16 + i * 16}" cy="${y0 + 32}" r="4.5" fill="${C.linha}"/>`).join('')}`;
  const coluna = (x, titulos, baixo, alto, rotBaixo, rotAlto, icone) => {
    const l = 170, topo = y(alto), base = y(baixo);
    let c = `<rect x="${x}" y="${topo}" width="${l}" height="${base - topo}" fill="rgba(11,87,164,.18)" stroke="${AZUL}" stroke-width="3" stroke-dasharray="11 8"/>`;
    titulos.forEach((t, i) => { c += texto(x + l / 2 - 10, y(1.45) + 44 + i * 36, t, { tam: A, halo: false }); });
    c += icone(x + l / 2, (topo + base) / 2 + 2);
    c += seta({ x: x - 20, y: PISO }, { x: x - 20, y: topo }, { largura: 2.5, ponta: 11 });
    c += linha(x - 32, base, x, base, 1.6) + linha(x - 32, topo, x, topo, 1.6);
    c += texto(x + l - 8, topo + 32, rotAlto, { tam: A, anc: 'end' });
    c += texto(x + l - 8, base - 10, rotBaixo, { tam: A, anc: 'end' });
    return c;
  };
  s += coluna(60, ['Interruptores'], 0.6, 1.0, '0,60 m', '1,00 m', interruptor);
  s += coluna(290, ['Tomadas'], 0.4, 1.0, '0,40 m', '1,00 m', tomada);
  s += coluna(520, ['Interfones e', 'comandos'], 0.4, 1.2, '0,40 m', '1,20 m', interfone);
  s += texto(360, 682, 'Alturas medidas a partir do piso', { tam: A, peso: 600, halo: false });
  return {
    nome: 'comandos_alturas', itens: [46, 101, 111, 147, 183],
    titulo: 'Alturas de interruptores, tomadas e comandos',
    descricao: 'Parede com as faixas de altura, medidas a partir do piso. Interruptores entre 0,60 e 1,00 metro; tomadas entre 0,40 e 1,00 metro; interfones e comandos entre 0,40 e 1,20 metro.',
    s,
  };
}

// ---------------------------------------------------------------------------
function inclinacaoLongitudinal() {
  let s = `<rect x="20" y="20" width="680" height="220" fill="#fff" stroke="${C.linha}" stroke-width="2.5" rx="8"/>`;
  s += tb(40, 60, 'Inclinação longitudinal', { halo: false });
  s += tt(40, 104, 'Inferior a 5%', { halo: false });
  s += ta(40, 142, 'menos de 2,9° no celular', { halo: false });
  s += ta(40, 178, 'meça em 3 pontos do percurso', { halo: false });
  s += tb(40, 216, 'A partir de 5%: trate como rampa', { halo: false });
  const xa = 20, xb = 700, ya = 600, yb = 520;
  const yEm = x => ya + (yb - ya) * (x - xa) / (xb - xa);
  s += `<polygon points="${xa},${ya} ${xb},${yb} ${xb},700 ${xa},700" fill="${C.piso}" stroke="${C.linha}" stroke-width="3"/>`;
  s += linha(xa, ya, xb, ya, 2.5, C.cota, 'stroke-dasharray="11 8"');
  s += seta({ x: 670, y: ya }, { x: 670, y: yEm(670) }, { largura: 3, ponta: 12 });
  s += texto(650, 572, 'Subida', { tam: A, anc: 'end' });
  // Pessoa caminhando
  const px = 90, py = yEm(px);
  s += `<circle cx="${px}" cy="${py - 216}" r="21" fill="#555"/><rect x="${px - 22}" y="${py - 192}" width="44" height="102" rx="15" fill="#555"/><rect x="${px - 18}" y="${py - 94}" width="15" height="94" fill="#555"/><rect x="${px + 3}" y="${py - 94}" width="15" height="94" fill="#555"/>`;
  s += seta({ x: px + 50, y: py - 120 }, { x: px + 300, y: yEm(px + 300) - 120 }, { dupla: false, largura: 5, ponta: 18, cor: AZUL });
  s += tb(px + 50, py - 160, 'Sentido da caminhada');
  // Celular apoiado no piso
  const xc = 460, yc = yEm(xc), ang = Math.atan2(yb - ya, xb - xa) * 180 / Math.PI;
  s += `<g transform="translate(${xc} ${yc}) rotate(${ang.toFixed(2)})"><rect x="-80" y="-14" width="160" height="14" rx="5" fill="#222"/></g>`;
  s += texto(360, 650, 'Celular apoiado no piso,', { tam: A, peso: 600, halo: false });
  s += texto(360, 686, 'no sentido da caminhada', { tam: A, peso: 600, halo: false });
  return {
    nome: 'inclinacao_longitudinal', itens: [49],
    titulo: 'Inclinação longitudinal do piso',
    descricao: 'Corredor visto de lado, com inclinação ampliada para ficar visível. A inclinação longitudinal deve ser inferior a 5%, menos de 2,9 graus no celular apoiado no piso no sentido da caminhada, medida em 3 pontos do percurso. A partir de 5%, o trecho é tratado como rampa.',
    s,
  };
}

// ---------------------------------------------------------------------------
function pisoTatilInterno() {
  const v = criarVista({ escala: 60, origem: { x: 236, y: 196 } });
  const L = 8.2, Y0 = 2.1, Y1 = 3.9, XB0 = 4.0, XB1 = 5.8, H = 1.0, XE = 6.7;
  let s = '';
  s += v.poli([[0, Y0, 0], [XB0, Y0, 0], [XB0, Y0, H], [0, Y0, H]], C.parede);
  s += v.poli([[XB0, 0, 0], [XB0, Y0, 0], [XB0, Y0, H], [XB0, 0, H]], C.branco);
  s += v.poli([[XB0, 0, 0], [XB1, 0, 0], [XB1, 0, H], [XB0, 0, H]], C.parede);
  s += v.poli([[XB1, Y0, 0], [XE, Y0, 0], [XE, Y0, H], [XB1, Y0, H]], C.parede);
  s += v.poli([[XB0, 0, 0], [XB1, 0, 0], [XB1, Y0, 0], [XB0, Y0, 0]], C.patamar);
  s += v.poli([[0, Y0, 0], [L, Y0, 0], [L, Y1, 0], [0, Y1, 0]], C.patamar);
  s += v.poli([[XB0 + 0.5, 0, 0], [XB1 - 0.5, 0, 0], [XB1 - 0.5, 0, H * 0.95], [XB0 + 0.5, 0, H * 0.95]], '#8a8a8a');
  const yc = (Y0 + Y1) / 2, xc = (XB0 + XB1) / 2, M = 0.3, TT = 0.6;
  s += tatilDirecional(v, 0.05, xc - M, yc - M, yc + M, 0, 0.15, 0.36, 0.1);
  s += tatilDirecional(v, xc + M, 6.9, yc - M, yc + M, 0, 0.15, 0.36, 0.1);
  let ramo = v.poli([[xc - M, TT, 0], [xc + M, TT, 0], [xc + M, yc - M, 0], [xc - M, yc - M, 0]], C.tatil);
  for (let x = xc - M + 0.1; x < xc + M - 0.04; x += 0.15) {
    for (let y = TT + 0.05; y < yc - M - 0.05; y += 0.46) ramo += v.linha([x, y, 0], [x, Math.min(y + 0.36, yc - M - 0.05), 0], 3, C.relevo);
  }
  s += ramo;
  s += tatilAlerta(v, xc - M, xc + M, yc - M, yc + M, 0, 0.15, 0.05);
  s += tatilAlerta(v, xc - 0.42, xc + 0.42, 0.04, TT, 0, 0.15, 0.05);
  s += tatilAlerta(v, 6.9, 7.5, yc - M, yc + M, 0, 0.15, 0.05);
  s += tatilAlerta(v, XE, L, Y0, yc - M, 0, 0.15, 0.05);
  for (let k = 4; k >= 0; k--) s += v.caixa(XE, L, Y0 - 0.32 * (k + 1), Y0 - 0.32 * k, 0, 0.16 * (k + 1), { topo: C.piso, frente: C.branco });
  s += v.poli([[0, Y1, 0], [L, Y1, 0], [L, Y1, 0.07], [0, Y1, 0.07]], C.branco);
  // Legenda
  s += amostraAlerta(20, 20, 56) + tb(88, 58, 'Pontos', { halo: false });
  s += amostraDirecional(20, 90, 56) + tb(88, 128, 'Linhas', { halo: false });
  // Rótulos
  s += texto(700, 50, 'Alerta: porta', { tam: A, anc: 'end' });
  s += texto(700, 86, 'também no elevador', { tam: A, peso: 500, anc: 'end' });
  s += texto(700, 122, 'e em obstáculos', { tam: A, peso: 500, anc: 'end' });
  s += chamada(v.proj(xc + 0.25, 0.3), 560, 132);
  s += tt(20, 590, 'Direcional') + ta(20, 626, 'conduz aos destinos');
  s += chamada(v.proj(1.6, yc + 0.1), 120, 558);
  s += texto(700, 590, 'Alerta: início e fim', { tam: A, anc: 'end' });
  s += texto(700, 626, 'de escadas e rampas', { tam: A, peso: 500, anc: 'end' });
  s += chamada(v.proj(7.75, Y0 + 0.3), 600, 562);
  s += texto(360, 694, 'Alerta: mudança de direção', { tam: A });
  s += chamada(v.proj(xc, yc), 360, 668);
  return {
    nome: 'piso_tatil_interno', itens: [51, 52, 53, 86],
    titulo: 'Piso tátil no interior da edificação',
    descricao: 'Corredor em perspectiva. O piso tátil direcional, em linhas, conduz da entrada aos destinos. O piso tátil de alerta, em pontos, marca a mudança de direção, a porta de acesso e o início e o fim de escadas e rampas; também junto à porta do elevador e sob obstáculos suspensos.',
    s,
  };
}

// ---------------------------------------------------------------------------
function escadaPisoTatil() {
  let s = amostraAlerta(20, 20, 56) + tb(88, 50, 'Piso tátil de alerta', { halo: false }) + ta(88, 84, 'pontos em relevo', { halo: false });
  // Corte (vista de lado)
  const yBase = 560, px = 46, py = 36, x0 = 130, n = 5, yTopo = yBase - n * py, xTopo = x0 + (n - 1) * px;
  let p = `20,${yBase} ${x0},${yBase}`;
  for (let i = 0; i < n; i++) {
    const yi = yBase - (i + 1) * py;
    p += ` ${x0 + i * px},${yi}`;
    if (i < n - 1) p += ` ${x0 + (i + 1) * px},${yi}`;
  }
  p += ` 420,${yTopo} 420,660 20,660`;
  s += `<polygon points="${p}" fill="${C.piso}" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += faixaAlerta(50, yBase - 14, 80, 14) + faixaAlerta(xTopo, yTopo - 14, 80, 14);
  s += tb(20, 470, 'Início');
  s += chamada({ x: 90, y: yBase - 16 }, 70, 480);
  s += tb(230, 290, 'Término');
  s += chamada({ x: xTopo + 40, y: yTopo - 16 }, 300, 300);
  s += ta(20, 700, 'Vista de lado', { cor: C.muted, halo: false });
  // Vista de cima
  const xp = 470, lp = 220, yE0 = 210, yE1 = 550;
  s += ret(xp, 160, lp, 440, C.patamar);
  s += ret(xp, yE0, lp, yE1 - yE0, C.piso);
  for (let y = yE0 + 34; y < yE1; y += 34) s += linha(xp, y, xp + lp, y, 2);
  s += alertaCima(xp, 160, lp, 50) + alertaCima(xp, yE1, lp, 50);
  s += texto(xp + lp / 2, 146, 'Término', { tam: A });
  s += texto(xp + lp / 2, 636, 'Início', { tam: A });
  s += seta({ x: xp + lp / 2, y: yE1 - 16 }, { x: xp + lp / 2, y: yE0 + 16 }, { dupla: false, largura: 4, ponta: 15 });
  s += seta({ x: xp, y: 656 }, { x: xp + lp, y: 656 }, { largura: 3, ponta: 12 });
  s += texto(xp + lp / 2 - 4, 698, 'Toda a largura', { tam: A });
  return {
    nome: 'escada_piso_tatil', itens: [62],
    titulo: 'Piso tátil na escada',
    descricao: 'Escada vista de lado e de cima. Piso tátil de alerta, com pontos em relevo, no início e no término de cada lance, em toda a largura do degrau.',
    s,
  };
}

// ---------------------------------------------------------------------------
function elevadorBotoeira() {
  const S = 280, PISO = 650, y = h => PISO - h * S;
  let s = ret(20, y(2.1), 680, 2.1 * S, C.parede) + piso(20, 700, PISO);
  const painel = (cx, cy, n) => {
    let t = `<rect x="${cx - 26}" y="${cy - (n * 20 + 8)}" width="52" height="${n * 40 + 16}" rx="6" fill="#333" stroke="${C.linha}" stroke-width="2.5"/>`;
    for (let i = 0; i < n; i++) t += `<circle cx="${cx}" cy="${cy - n * 20 + i * 40 + 20}" r="13" fill="#fff" stroke="${C.linha}" stroke-width="2"/>`;
    return t;
  };
  // Externo
  s += texto(180, y(2.1) + 40, 'Painel externo', { tam: A, halo: false });
  s += ret(40, y(1.85), 200, 1.85 * S, '#d9d9d9') + linha(140, y(1.85), 140, PISO, 2.5);
  s += zona(250, y(1.1), 80, 0.2 * S) + painel(290, y(1.0), 1);
  s += seta({ x: 300, y: PISO }, { x: 300, y: y(0.9) }, { largura: 2.5, ponta: 11 });
  s += vertical(280, y(0.45), '0,90 m', A);
  s += seta({ x: 342, y: PISO }, { x: 342, y: y(1.1) }, { largura: 2.5, ponta: 11 });
  s += vertical(326, y(1.1) - 66, '1,10 m', A);
  // Interno
  s += linha(370, y(2.1), 370, PISO, 2.5);
  s += texto(530, y(2.1) + 40, 'Painel interno', { tam: A, halo: false });
  s += zona(410, y(1.3), 90, 0.4 * S) + painel(455, y(1.1), 2);
  s += seta({ x: 420, y: PISO }, { x: 420, y: y(0.9) }, { largura: 2.5, ponta: 11 });
  s += vertical(400, y(0.45), '0,90 m', A);
  s += seta({ x: 516, y: PISO }, { x: 516, y: y(1.3) }, { largura: 2.5, ponta: 11 });
  s += vertical(536, y(0.65), '1,30 m', A);
  // Botão ampliado: "2" em relevo e Braille = sinal de número (3, 4, 5, 6) + b (1, 2)
  const bx = 620, by = 260;
  s += `<circle cx="${bx}" cy="${by}" r="64" fill="#fff" stroke="${C.linha}" stroke-width="3"/>`;
  s += `<text x="${bx}" y="${by + 40}" font-size="52" font-weight="800" text-anchor="middle" fill="${C.cota}">2</text>`;
  s += cela(bx - 26, by - 46, [3, 4, 5, 6], 11, 4.5, C.cota) + cela(bx + 6, by - 46, [1, 2], 11, 4.5, C.cota);
  s += texto(bx, 360, 'Relevo e', { tam: A }) + texto(bx, 396, 'Braille', { tam: A });
  s += texto(bx, 432, 'contraste', { tam: A, peso: 500 });
  return {
    nome: 'elevador_botoeira', itens: [80, 83],
    titulo: 'Botões do elevador',
    descricao: 'Parede com os painéis do elevador. O painel externo de chamada fica entre 0,90 e 1,10 metro do piso; o painel interno da cabina, entre 0,90 e 1,30 metro. No detalhe, o botão do número 2 em relevo e em Braille, com contraste.',
    s,
  };
}

// ---------------------------------------------------------------------------
function elevadorEntrada() {
  let s = texto(360, 50, 'Porta contrasta com a parede', { tam: A, halo: false });
  const parede = (x, corP, corD, ok) => {
    const l = 320, yP = 300;
    let t = ret(x, 70, l, yP - 70, corP);
    t += ret(x, yP, l, 30, C.piso);
    t += ret(x + 60, 110, 160, yP - 110, corD) + linha(x + 140, 110, x + 140, yP, 2);
    t += `<rect x="${x + 244}" y="196" width="32" height="50" rx="5" fill="#333" stroke="${C.linha}" stroke-width="2"/><circle cx="${x + 260}" cy="221" r="8" fill="#fff"/>`;
    t += texto(x + l / 2, 368, ok ? 'Correto' : 'Incorreto', { tam: A, cor: ok ? VERDE : VERMELHO });
    return t;
  };
  s += parede(20, '#f2efe6', '#23476b', true) + parede(380, '#c9c9c9', '#c4c4c4', false);
  // Piso da cabina, visto de cima
  const x0 = 20, l = 440, yC = 400, aC = 130, yS = yC + aC, aS = 20, yP = yS + aS, aP = 150;
  s += `<rect x="${x0}" y="${yC}" width="${l}" height="${aC}" fill="#37465a" stroke="${C.linha}" stroke-width="5"/>`;
  for (let i = 0; i < 13; i++) for (let j = 0; j < 4; j++) {
    const px = x0 + 22 + i * 32 + (j % 2) * 16, py = yC + 20 + j * 30;
    if (px < x0 + l - 12) s += `<path d="M ${px} ${py - 6} l 7 6 l -7 6 l -7 -6 Z" fill="#5d6d82"/>`;
  }
  s += texto(x0 + l / 2, yC + 54, 'Cabina: piso duro', { tam: A, cor: '#fff', halo: false });
  s += texto(x0 + l / 2, yC + 92, 'e antiderrapante', { tam: A, peso: 500, cor: '#fff', halo: false });
  s += ret(x0, yS, l, aS, '#8a8a8a');
  s += ret(x0, yP, l, aP, '#ece8dc');
  for (let i = 1; i < 4; i++) s += linha(x0 + l * i / 4, yP, x0 + l * i / 4, yP + aP, 1.5, '#a8a494');
  s += texto(x0 + l / 2, yP + 50, 'Pavimento', { tam: A });
  s += texto(x0 + l / 2, yP + 88, 'cor que contrasta', { tam: A, peso: 500 });
  s += texto(x0 + l / 2, yP + 124, 'com a cabina', { tam: A, peso: 500 });
  s += tb(480, yS + 10, 'Soleira:') + ta(480, yS + 46, 'não conta');
  s += linha(x0 + l, yS + aS / 2, 472, yS + aS / 2, 2);
  s += ta(480, 440, 'Vista de cima', { cor: C.muted, halo: false });
  return {
    nome: 'elevador_entrada', itens: [81, 85],
    titulo: 'Contraste na entrada do elevador',
    descricao: 'Em cima, duas portas de elevador: correta, em cor que contrasta com a parede, e incorreta, da mesma cor da parede. Embaixo, o piso visto de cima: a cabina tem piso duro e antiderrapante, e o pavimento em frente tem cor que contrasta com o da cabina; a soleira não conta.',
    s,
  };
}

// ---------------------------------------------------------------------------
function bebedouroBica() {
  const cena = (topo, correto) => {
    const x = 20, l = 680, h = 330, cor = correto ? VERDE : VERMELHO;
    let t = `<rect x="${x}" y="${topo}" width="${l}" height="${h}" fill="#fff" stroke="${C.linha}" stroke-width="2.5" rx="8"/>`;
    t += `<path d="M ${x} ${topo + 8} a 8 8 0 0 1 8 -8 h ${l - 16} a 8 8 0 0 1 8 8 v 46 h -${l} z" fill="${cor}"/>`;
    t += texto(x + 22, topo + 38, correto ? 'Correto: jato inclinado, na frente' : 'Incorreto: jato vertical, atrás', { tam: A, cor: '#fff', halo: false, anc: 'start' });
    const yPiso = topo + h - 36, yB = topo + 170, aB = 60, xP = 76, lB = 250;
    t += `<rect x="${x + 12}" y="${yPiso}" width="${l - 24}" height="26" fill="${C.piso}" stroke="${C.linha}" stroke-width="2"/>`;
    t += `<rect x="${x + 12}" y="${topo + 66}" width="44" height="${yPiso - topo - 66}" fill="${C.patamar}" stroke="${C.linha}" stroke-width="2.5"/>`;
    t += `<rect x="${xP}" y="${yB + aB}" width="50" height="${yPiso - yB - aB}" fill="#d0d0d0" stroke="${C.linha}" stroke-width="2.5"/>`;
    t += `<path d="M ${xP} ${yB} H ${xP + lB} V ${yB + aB - 16} Q ${xP + lB} ${yB + aB} ${xP + lB - 16} ${yB + aB} H ${xP} Z" fill="#fff" stroke="${C.linha}" stroke-width="3"/>`;
    const jato = '#2f80d0';
    if (correto) {
      const bx = xP + lB - 22;
      t += `<rect x="${bx - 8}" y="${yB - 28}" width="16" height="28" rx="4" fill="#666" stroke="${C.linha}" stroke-width="2"/>`;
      t += `<path d="M ${bx} ${yB - 30} Q ${bx - 50} ${yB - 120} ${bx - 96} ${yB - 56}" fill="none" stroke="${jato}" stroke-width="6" stroke-linecap="round"/>`;
      t += `<path d="M ${bx - 120} ${yB - 60} H ${bx - 74} L ${bx - 80} ${yB} H ${bx - 114} Z" fill="#fff" stroke="${C.linha}" stroke-width="2.5"/>`;
      t += `<path d="M ${bx - 117} ${yB - 40} H ${bx - 77} L ${bx - 80} ${yB - 1} H ${bx - 114} Z" fill="#9cc6ee"/>`;
      t += tt(380, topo + 108, 'Jato inclinado') + ta(380, topo + 144, 'enche o copo');
      t += tb(380, topo + 196, 'Bica na frente');
    } else {
      const bx = xP + 34;
      t += `<rect x="${bx - 8}" y="${yB - 28}" width="16" height="28" rx="4" fill="#666" stroke="${C.linha}" stroke-width="2"/>`;
      t += `<path d="M ${bx} ${yB - 30} V ${yB - 110}" fill="none" stroke="${jato}" stroke-width="6" stroke-linecap="round"/>`;
      t += `<path d="M ${bx + 60} ${yB - 60} H ${bx + 106} L ${bx + 100} ${yB} H ${bx + 66} Z" fill="#fff" stroke="${C.linha}" stroke-width="2.5"/>`;
      t += `<path d="M ${bx + 66} ${yB - 44} l 34 34 m 0 -34 l -34 34" stroke="${VERMELHO}" stroke-width="5" stroke-linecap="round"/>`;
      t += tt(380, topo + 108, 'Jato vertical') + ta(380, topo + 144, 'não enche o copo');
      t += tb(380, topo + 196, 'Bica longe da frente');
    }
    t += seta({ x: 380, y: topo + 236 }, { x: 480, y: topo + 236 }, { dupla: false, largura: 3.5, ponta: 15 });
    t += ta(492, topo + 246, 'Frente');
    return t;
  };
  const s = cena(20, true) + cena(370, false);
  return {
    nome: 'bebedouro_bica', itens: [87, 184],
    titulo: 'Bica do bebedouro',
    descricao: 'Dois bebedouros vistos de lado. Correto: a bica fica no lado frontal e o jato é inclinado, enchendo o copo. Incorreto: a bica fica longe da frente e o jato é vertical, sem encher o copo.',
    s,
  };
}

// ---------------------------------------------------------------------------
function bebedouroAlturas() {
  const S = 290, PISO = 650, y = h => PISO - h * S;
  let s = ret(20, y(1.5), 680, 1.5 * S, C.parede) + piso(20, 700, PISO);
  s += tb(30, 52, 'Bica a 0,90 m') + ta(30, 88, 'cadeira de rodas e crianças');
  s += tb(30, 136, 'Aproximação frontal:') + tb(30, 172, '0,80 m × 1,20 m');
  // Bica baixa com vão livre
  const xa = 90, la = 190, topoA = y(0.9) - 16, fundo = y(0.73);
  s += `<rect x="${xa}" y="${fundo}" width="${la}" height="${PISO - fundo}" fill="${ZONA}"/>`;
  s += ret(xa, topoA, la, fundo - topoA, C.branco, 'rx="10"');
  s += `<path d="M ${xa + la / 2 - 12} ${topoA} v -24 h 30" fill="none" stroke="${C.linha}" stroke-width="7" stroke-linecap="round"/>`;
  s += seta({ x: 52, y: PISO }, { x: 52, y: y(0.9) }, { largura: 3, ponta: 12 });
  s += vertical(34, (PISO + y(0.9)) / 2, '0,90 m', A);
  s += seta({ x: xa + 36, y: PISO }, { x: xa + 36, y: fundo }, { largura: 3, ponta: 12 });
  s += vertical(xa + 70, (PISO + fundo) / 2, 'mín. 0,73 m', A);
  s += vertical(xa + 104, (PISO + fundo) / 2, 'altura livre', A, 500);
  // Bica alta
  const xb = 320, lb = 160;
  s += ret(xb, y(1.05) - 16, lb, PISO - y(1.05) + 16, C.branco, 'rx="10"');
  s += `<path d="M ${xb + lb / 2 - 12} ${y(1.05) - 16} v -24 h 30" fill="none" stroke="${C.linha}" stroke-width="7" stroke-linecap="round"/>`;
  s += texto(xb + lb / 2, y(0.66), 'Bica:', { tam: A });
  s += texto(xb + lb / 2, y(0.66) + 36, '1,00 m a', { tam: A });
  s += texto(xb + lb / 2, y(0.66) + 72, '1,10 m', { tam: A });
  s += texto(xb + lb / 2, y(0.66) + 108, 'em pé', { tam: A, peso: 500 });
  // Faixa de acionamento
  const xc = 494, lc = 200;
  s += `<rect x="${xc}" y="${y(1.2)}" width="${lc}" height="${y(0.8) - y(1.2)}" fill="rgba(217,119,6,.20)" stroke="${LARANJA}" stroke-width="3" stroke-dasharray="11 8"/>`;
  s += texto(xc + lc / 2, (y(1.2) + y(0.8)) / 2 + 10, 'Acionamento', { tam: A });
  s += texto(xc + lc, y(1.2) - 10, '1,20 m', { tam: A, anc: 'end' });
  s += texto(xc + lc, y(0.8) + 34, '0,80 m', { tam: A, anc: 'end' });
  return {
    nome: 'bebedouro_alturas', itens: [88, 89, 90],
    titulo: 'Alturas do bebedouro',
    descricao: 'Parede com bebedouros. A bica a 0,90 metro, para cadeira de rodas e crianças, tem altura livre mínima de 0,73 metro embaixo. A bica para adultos em pé fica entre 1,00 e 1,10 metro. O acionamento fica entre 0,80 e 1,20 metro, com área de aproximação frontal de 0,80 por 1,20 metro.',
    s,
  };
}

// ---------------------------------------------------------------------------
function sinalizacaoPorta() {
  const S = 170, PISO = 400, y = h => PISO - h * S;
  let s = ret(20, y(2.3), 680, 2.3 * S, C.parede) + piso(20, 700, PISO, 36);
  const x0 = 120, l = 0.85 * S;
  s += ret(x0, y(2.1), l, 2.1 * S, C.branco);
  const hx = x0 + l - 18, hy = y(0.95);
  s += `<circle cx="${hx}" cy="${hy}" r="9" fill="#777" stroke="${C.linha}" stroke-width="2"/>` + linha(hx, hy, hx - 46, hy, 8, C.linha, 'stroke-linecap="round"');
  const zx = x0 + l + 18, zl = 120;
  s += zona(zx, y(1.6), zl, 0.4 * S);
  s += ret(zx + 26, y(1.52), 68, 40, '#333', 'rx="5"');
  s += seta({ x: zx + zl + 40, y: PISO }, { x: zx + zl + 40, y: y(1.2) }, { largura: 3, ponta: 12 });
  s += linha(zx + zl, y(1.2), zx + zl + 54, y(1.2), 1.6);
  s += tt(zx + zl + 54, y(0.55), '1,20 m');
  s += seta({ x: 650, y: PISO }, { x: 650, y: y(1.6) }, { largura: 3, ponta: 12 });
  s += linha(zx + zl, y(1.6), 664, y(1.6), 1.6);
  s += texto(636, y(1.78), '1,60 m', { tam: T, anc: 'end' });
  // Placa ampliada: "SALA 12" em relevo e em Braille
  s += `<rect x="20" y="450" width="680" height="250" fill="#fff" stroke="${C.linha}" stroke-width="2.5" rx="8"/>`;
  const px = 40, py = 476, pl = 360, pa = 200;
  s += `<rect x="${px}" y="${py}" width="${pl}" height="${pa}" rx="12" fill="#333" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += `<text x="${px + pl / 2}" y="${py + 90}" font-size="66" font-weight="800" text-anchor="middle" fill="#fff">SALA 12</text>`;
  // Celas conferidas: maiúscula (4,6) duas vezes para a palavra toda, S (2,3,4), A (1), L (1,2,3), A (1),
  // espaço, sinal de número (3,4,5,6), 1 = a (1), 2 = b (1,2)
  const celas = [[4, 6], [4, 6], [2, 3, 4], [1], [1, 2, 3], [1], null, [3, 4, 5, 6], [1], [1, 2]];
  celas.forEach((pts, i) => { if (pts) s += cela(px + 28 + i * 33, py + 128, pts, 13, 5, '#fff'); });
  s += tb(420, 510, 'Texto em relevo', { halo: false }) + tb(420, 546, 'e em Braille', { halo: false });
  s += ta(420, 600, 'na parede, ao lado', { halo: false }) + ta(420, 636, 'da maçaneta', { halo: false });
  return {
    nome: 'sinalizacao_porta', itens: [93, 167],
    titulo: 'Sinalização tátil da porta',
    descricao: 'Porta com placa na parede, ao lado da maçaneta, instalada entre 1,20 e 1,60 metro do piso. No detalhe, a placa identifica o ambiente com texto em relevo e em Braille: SALA 12.',
    s,
  };
}

// ---------------------------------------------------------------------------
function portaEspacoLateral() {
  const yP = 230, xD = 60, LP = 200, xM = xD + LP, LZ = 120, AZ = 240;
  let s = ta(20, 50, 'Vista de cima', { cor: C.muted, halo: false });
  s += ret(20, yP - 30, xD - 20, 30, '#8a8a8a') + ret(xM, yP - 30, 700 - xM, 30, '#8a8a8a');
  s += zona(xM, yP, LZ, AZ) + cadeira(xM + LZ / 2, yP + 150, -90, 0.7);
  s += `<rect x="${xD}" y="${yP - 20}" width="${LP}" height="10" fill="#fff" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += `<path d="M ${xD} ${yP + LP} A ${LP} ${LP} 0 0 0 ${xM} ${yP - 10}" fill="none" stroke="${C.muted}" stroke-width="2" stroke-dasharray="8 7"/>`;
  s += linha(xD, yP - 10, xD, yP + LP, 5, C.muted, 'stroke-dasharray="12 8"');
  s += `<rect x="${xM - 24}" y="${yP - 8}" width="16" height="16" rx="4" fill="#444"/>`;
  s += texto(xM - 16, 120, 'Maçaneta', { tam: A }) + linha(xM - 16, 130, xM - 16, yP - 24, 2.5);
  s += tb(20, 520, 'A folha abre') + tb(20, 556, 'para este lado');
  s += seta({ x: xM, y: yP + AZ + 34 }, { x: xM + LZ, y: yP + AZ + 34 }, { largura: 3, ponta: 12 });
  s += linha(xM, yP + AZ, xM, yP + AZ + 46, 1.6) + linha(xM + LZ, yP + AZ, xM + LZ, yP + AZ + 46, 1.6);
  s += texto(xM + LZ / 2, yP + AZ + 84, '0,60 m', { tam: T });
  s += tb(410, 280, 'Espaço livre ao') + tb(410, 316, 'lado da maçaneta');
  s += ta(410, 364, 'no sentido de') + ta(410, 400, 'abertura da porta');
  s += ta(410, 448, 'sem móveis nem') + ta(410, 484, 'lixeiras');
  return {
    nome: 'porta_espaco_lateral', itens: [95],
    titulo: 'Espaço ao lado da maçaneta',
    descricao: 'Vista de cima de uma porta. Ao lado da maçaneta, no sentido de abertura da porta, há espaço livre de no mínimo 0,60 metro, sem móveis, lixeiras ou carrinhos.',
    s,
  };
}

// ---------------------------------------------------------------------------
function mesaVaoLivre() {
  const S = 330, PISO = 560, H = 0.73 * S, TAMPO = 26, yBaixo = PISO - H, yTopo = yBaixo - TAMPO;
  let s = piso(20, 700, PISO, 40);
  s += texto(360, 56, 'Espaço livre sob o tampo', { tam: T });
  s += texto(360, 96, 'sem contar pés, travessas e gavetas', { tam: A, peso: 500 });
  // De frente
  const l = 0.8 * S, x0 = 120;
  s += texto(x0 + l / 2, yTopo - 24, 'Vista de frente', { tam: A });
  s += `<rect x="${x0}" y="${yBaixo}" width="${l}" height="${H}" fill="${ZONA}"/>`;
  s += ret(x0 - 40, yTopo, l + 80, TAMPO, C.branco);
  s += ret(x0 - 26, yBaixo, 26, H, C.parede) + ret(x0 + l, yBaixo, 26, H, C.parede);
  s += seta({ x: 70, y: PISO }, { x: 70, y: yBaixo }, { largura: 3, ponta: 12 });
  s += vertical(48, (PISO + yBaixo) / 2, 'mín. 0,73 m', A);
  s += vertical(18, (PISO + yBaixo) / 2, 'altura livre', A, 500);
  s += seta({ x: x0, y: PISO - 40 }, { x: x0 + l, y: PISO - 40 }, { largura: 3, ponta: 12 });
  // De lado
  const xFundo = 490, prof = 0.5 * S;
  s += texto(xFundo + 100, yTopo - 24, 'Vista de lado', { tam: A });
  s += `<rect x="${xFundo}" y="${yBaixo}" width="${prof}" height="${H}" fill="${ZONA}"/>`;
  s += ret(xFundo - 26, yTopo, prof + 70, TAMPO, C.branco) + ret(xFundo - 26, yBaixo, 26, H, C.parede);
  s += seta({ x: xFundo, y: PISO - 40 }, { x: xFundo + prof, y: PISO - 40 }, { largura: 3, ponta: 12 });
  s += tb(30, 644, 'Largura livre') + ta(30, 680, 'mín. 0,80 m', { peso: 700 });
  s += texto(700, 644, 'Profundidade livre', { tam: A, anc: 'end' }) + texto(700, 680, 'mín. 0,50 m', { tam: A, anc: 'end' });
  return {
    nome: 'mesa_vao_livre', itens: [98, 103, 112, 114, 132, 141, 146],
    titulo: 'Vão livre sob mesas e bancadas',
    descricao: 'Mesa vista de frente e de lado. O espaço livre sob o tampo, sem contar pés, travessas e gavetas, tem altura mínima de 0,73 metro, largura mínima de 0,80 metro e profundidade mínima de 0,50 metro.',
    s,
  };
}

// ---------------------------------------------------------------------------
function giro360() {
  const cx = 250, cy = 320, R = 220;
  let s = `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${ZONA}" stroke="${AZUL}" stroke-width="4" stroke-dasharray="14 9"/>`;
  s += cadeira(cx, cy, 0, 1.0);
  const r = 140;
  s += `<path d="M ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx} ${cy - r}" fill="none" stroke="${AZUL}" stroke-width="6"/>`;
  s += seta({ x: cx - 18, y: cy - r - 6 }, { x: cx, y: cy - r }, { cor: AZUL, dupla: false, largura: 6, ponta: 22 });
  s += seta({ x: cx - R, y: 590 }, { x: cx + R, y: 590 }, { largura: 3.5, ponta: 14 });
  s += linha(cx - R, cy, cx - R, 604, 1.6) + linha(cx + R, cy, cx + R, 604, 1.6);
  s += texto(cx, 636, 'Diâmetro mínimo: 1,50 m', { tam: A });
  // Carteira fora do círculo
  const mesa = { x: 520, y: 250, l: 160, a: 140 };
  if (mesa.x < cx + R) throw new Error('Carteira invade a área de giro');
  s += ret(mesa.x, mesa.y, mesa.l, mesa.a, C.branco, 'rx="8"') + texto(mesa.x + mesa.l / 2, mesa.y + mesa.a / 2 + 10, 'Carteira', { tam: A, halo: false });
  s += texto(700, 60, 'Giro de 360°', { tam: T, anc: 'end' });
  s += texto(700, 98, 'junto à carteira,', { tam: A, peso: 500, anc: 'end' });
  s += texto(700, 134, 'sem obstáculos', { tam: A, peso: 500, anc: 'end' });
  s += ta(500, 444, 'Carteira entre') + ta(500, 480, 'as demais,') + ta(500, 516, 'sem segregar');
  return {
    nome: 'giro_360', itens: [99],
    titulo: 'Área de giro de 360 graus',
    descricao: 'Vista de cima de uma sala. Junto à carteira, há área livre de obstáculos para giro de 360 graus da cadeira de rodas, com diâmetro mínimo de 1,50 metro. A carteira fica entre as demais, sem segregar quem usa cadeira de rodas.',
    s,
  };
}

// ---------------------------------------------------------------------------
export const LOTE3_QUADRADAS = [
  comandosAlturas, inclinacaoLongitudinal, pisoTatilInterno, escadaPisoTatil, elevadorBotoeira, elevadorEntrada,
  bebedouroBica, bebedouroAlturas, sinalizacaoPorta, portaEspacoLateral, mesaVaoLivre, giro360,
];

const saida = new URL('./saida/quadradas/', import.meta.url);
mkdirSync(saida, { recursive: true });
const checklist = JSON.parse(readFileSync(new URL('../src/dados/checklist.json', import.meta.url)));
const pergunta = id => {
  const item = checklist.itens.find(i => i.id === id);
  if (!item) throw new Error(`Item ${id} não existe`);
  return item.pergunta.replace(/\s+/g, '');
};
let erros = 0;
for (const criar of LOTE3_QUADRADAS) {
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
