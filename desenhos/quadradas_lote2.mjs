// Lote 2 das ilustrações quadradas (720×720): os 12 desenhos seguintes na ordem do checklist.
// Cada um reenquadra o desenho original (lote1 a lote5, figuras.mjs), com rótulos de 38 e 30.
// Uso: node quadradas_lote2.mjs  →  saida/quadradas/*.svg
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { C, criarVista, texto, seta } from './lib.mjs';
import { cadeira } from './lote1.mjs';
import { simboloAcesso } from './lote2.mjs';

const LADO = 720, T = 38, A = 30;
const AZUL = C.apoio;
const ZONA = 'rgba(11,87,164,.14)';
const VERDE = '#15703a', VERMELHO = '#b91c1c', LARANJA = '#d97706';
const ASFALTO = '#8a8a8a';

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
const vertical = (x, y, s, tam = T) => `<text x="${x}" y="${y}" font-size="${tam}" font-weight="700" text-anchor="middle" fill="${C.cota}" paint-order="stroke" stroke="#fff" stroke-width="6" stroke-linejoin="round" transform="rotate(-90 ${x} ${y})">${s}</text>`;
const xis = (x, y, cor = VERMELHO) => `<path d="M ${x - 16} ${y - 16} L ${x + 16} ${y + 16} M ${x + 16} ${y - 16} L ${x - 16} ${y + 16}" stroke="${cor}" stroke-width="6" stroke-linecap="round"/>`;

// ---------------------------------------------------------------------------
function rampaGuardaCorpo() {
  const S = 330, PISO = 620, y = h => PISO - h * S;
  let s = '';
  const secao = (x0, x1) => `<rect x="${x0}" y="${PISO}" width="${x1 - x0}" height="80" fill="${C.piso}" stroke="${C.linha}" stroke-width="2.5"/>`;
  // Sem parede lateral
  const a0 = 30, a1 = 340, G = 34;
  s += texto((a0 + a1) / 2, 50, 'Sem parede', { tam: T }) + texto((a0 + a1) / 2, 90, 'lateral', { tam: T });
  s += secao(a0, a1);
  s += `<rect x="${a0}" y="${PISO - G}" width="26" height="${G}" fill="${LARANJA}" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += `<rect x="${a1 - 26}" y="${PISO - G}" width="26" height="${G}" fill="${LARANJA}" stroke="${C.linha}" stroke-width="2.5"/>`;
  for (const x of [a0 + 13, a1 - 13]) {
    s += linha(x, PISO - G, x, y(1.1), 6);
    s += linha(x - 14, y(1.1), x + 14, y(1.1), 10, C.linha, 'stroke-linecap="round"');
  }
  s += texto((a0 + a1) / 2, y(1.1) + 54, 'Guarda-corpo', { tam: A });
  s += seta({ x: (a0 + a1) / 2 - 98, y: y(1.1) + 44 }, { x: a0 + 20, y: y(1.1) + 22 }, { dupla: false, ponta: 12, largura: 2.5 });
  s += seta({ x: (a0 + a1) / 2 + 98, y: y(1.1) + 44 }, { x: a1 - 20, y: y(1.1) + 22 }, { dupla: false, ponta: 12, largura: 2.5 });
  s += tb(70, 470, 'Guia de') + tb(70, 506, 'balizamento') + ta(70, 542, 'mín. 5 cm');
  s += chamada({ x: a0 + 26, y: PISO - G / 2 }, 64, 552);
  // Com vedação lateral
  const b0 = 380, b1 = 690;
  s += texto((b0 + b1) / 2, 50, 'Com vedação', { tam: T }) + texto((b0 + b1) / 2, 90, 'lateral', { tam: T });
  s += secao(b0, b1);
  for (const x of [b0, b1 - 36]) s += ret(x, y(1.1), 36, 1.1 * S, '#d8d8d8');
  s += seta({ x: b0 + 64, y: PISO }, { x: b0 + 64, y: y(1.1) }, { largura: 3, ponta: 13 });
  s += tb(b0 + 82, y(0.78), 'mín.') + tt(b0 + 82, y(0.78) + 40, '1,10 m');
  s += texto((b0 + b1) / 2 + 8, 470, 'Dispensa', { tam: A, peso: 600 });
  s += texto((b0 + b1) / 2 + 8, 506, 'guarda-corpo', { tam: A, peso: 600 });
  s += texto((b0 + b1) / 2 + 8, 542, 'e guia', { tam: A, peso: 600 });
  return {
    nome: 'rampa_guarda_corpo', itens: [23, 72],
    titulo: 'Guarda-corpo e guia de balizamento',
    descricao: 'Dois cortes de rampa. Sem parede lateral, a rampa tem guarda-corpo e guia de balizamento de no mínimo 5 centímetros nos dois lados. Com vedação lateral de no mínimo 1,10 metro, dispensa guarda-corpo e guia de balizamento.',
    s,
  };
}

// ---------------------------------------------------------------------------
function corrimaoIntermediario() {
  const S = 120, X0 = 90, Y0 = 100, LARG = 2.4 * S, SEG = 230, PAT = 150;
  const X1 = X0 + SEG, X2 = X1 + PAT, X3 = X2 + SEG, YC = Y0 + LARG / 2, GAP = 0.8 * S;
  let s = ta(24, 56, 'Vista de cima: 2,40 m ou mais de largura');
  s += ret(X0, Y0, SEG, LARG, C.piso) + ret(X1, Y0, PAT, LARG, C.patamar) + ret(X2, Y0, SEG, LARG, C.piso);
  const barra = (x1, y, x2) => linha(x1, y, x2, y, 9, AZUL, 'stroke-linecap="round"');
  s += barra(X0, Y0 + 7, X3) + barra(X0, Y0 + LARG - 7, X3);
  const meio = (X1 + X2) / 2;
  s += barra(X0, YC, meio - GAP / 2) + barra(meio + GAP / 2, YC, X3);
  s += seta({ x: 50, y: Y0 + LARG }, { x: 50, y: Y0 }, { largura: 3, ponta: 13 });
  s += vertical(30, YC, '2,40 m', A);
  s += seta({ x: X0 + 22, y: YC - 8 }, { x: X0 + 22, y: Y0 + 14 }, { largura: 2.5, ponta: 11 });
  s += seta({ x: X0 + 22, y: Y0 + LARG - 14 }, { x: X0 + 22, y: YC + 8 }, { largura: 2.5, ponta: 11 });
  s += tb(X0 + 36, YC - 54, 'mín. 1,20 m') + tb(X0 + 36, YC + 120, 'mín. 1,20 m');
  s += seta({ x: meio - GAP / 2, y: YC + 30 }, { x: meio + GAP / 2, y: YC + 30 }, { ponta: 10, largura: 2.5 });
  s += texto(meio, YC + 70, 'mín. 0,80 m', { tam: A });
  s += seta({ x: X1, y: Y0 + LARG + 26 }, { x: X2, y: Y0 + LARG + 26 }, { ponta: 10, largura: 2.5 });
  s += texto(meio, Y0 + LARG + 66, 'Patamar acima de 1,40 m', { tam: A });
  s += texto(meio, Y0 + LARG + 102, 'Corrimão intermediário interrompido', { tam: A, peso: 500 });
  s += `<rect x="20" y="540" width="680" height="160" rx="8" fill="#fff" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += texto(360, 584, 'Corrimão intermediário duplo,', { tam: A, halo: false });
  s += texto(360, 622, 'nas alturas de 0,92 m e 0,70 m', { tam: A, halo: false });
  s += texto(360, 674, 'Ou corrimãos dos dois lados', { tam: A, peso: 500, halo: false });
  return {
    nome: 'corrimao_intermediario', itens: [25, 26, 74, 75],
    titulo: 'Corrimão intermediário',
    descricao: 'Vista de cima de rampa ou escada com 2,40 metros ou mais de largura. Um corrimão intermediário divide a largura em faixas de no mínimo 1,20 metro. No patamar com mais de 1,40 metro, ele é interrompido, deixando passagem de no mínimo 0,80 metro. O corrimão intermediário é duplo, nas alturas de 0,92 metro e 0,70 metro; a alternativa é ter corrimãos dos dois lados.',
    s,
  };
}

// ---------------------------------------------------------------------------
function corrimaoBraille() {
  let s = ta(24, 50, 'Corrimão visto de lado', { halo: false });
  const yT = 420, D = 44, cx = 240;
  s += ret(20, 640, 440, 60, C.piso);
  for (const x of [44, 436]) s += `<rect x="${x - 8}" y="${yT + D}" width="16" height="${640 - yT - D}" fill="#777" stroke="${C.linha}" stroke-width="2"/>`;
  s += `<rect x="20" y="${yT}" width="440" height="${D}" rx="22" fill="#b5bcc4" stroke="${C.linha}" stroke-width="3"/>`;
  s += `<rect x="32" y="${yT + 8}" width="416" height="8" rx="4" fill="#e3e7ea"/>`;
  s += `<rect x="${cx - 40}" y="${yT - 7}" width="80" height="10" rx="3" fill="${AZUL}" stroke="${C.linha}" stroke-width="1.5"/>`;
  // Detalhe ampliado: número 3 em relevo e em Braille (sinal de número + c)
  const yZ = 210, r = 120;
  s += linha(cx - 40, yT - 7, cx - 90, yZ + r - 40, 1.8) + linha(cx + 40, yT - 7, cx + 90, yZ + r - 40, 1.8);
  s += `<circle cx="${cx}" cy="${yZ}" r="${r}" fill="#fff" stroke="${C.linha}" stroke-width="3"/>`;
  s += `<text x="${cx - 52}" y="${yZ + 36}" font-size="104" font-weight="800" text-anchor="middle" fill="${C.cota}">3</text>`;
  const celula = (x0, pontos) => pontos.map(p => {
    const col = p > 3 ? 1 : 0, lin = (p - 1) % 3;
    return `<circle cx="${x0 + col * 22}" cy="${yZ - 22 + lin * 22}" r="8" fill="${C.cota}"/>`;
  }).join('');
  s += celula(cx + 4, [3, 4, 5, 6]) + celula(cx + 58, [1, 4]);
  s += texto(cx, 530, 'Número do pavimento', { tam: A });
  s += texto(cx, 566, 'em relevo e em Braille', { tam: A, peso: 500 });
  // Corte do tubo
  const xc = 590, yc = 420, rc = 80;
  s += ta(480, 50, 'Corte do', { halo: false }) + ta(480, 84, 'corrimão', { halo: false });
  s += `<rect x="${xc - 14}" y="${yc + rc - 4}" width="28" height="${640 - yc - rc + 4}" fill="#777" stroke="${C.linha}" stroke-width="2"/>`;
  s += ret(470, 640, 230, 60, C.piso);
  s += `<circle cx="${xc}" cy="${yc}" r="${rc}" fill="#b5bcc4" stroke="${C.linha}" stroke-width="3"/>`;
  const a = 0.5, dx = rc * Math.sin(a), dy = rc * Math.cos(a);
  s += `<path d="M ${(xc - dx).toFixed(1)} ${(yc - dy).toFixed(1)} A ${rc} ${rc} 0 0 1 ${(xc + dx).toFixed(1)} ${(yc - dy).toFixed(1)}" fill="none" stroke="${AZUL}" stroke-width="12" stroke-linecap="round"/>`;
  s += seta({ x: xc, y: 296 }, { x: xc, y: yc - rc - 12 }, { dupla: false, largura: 3, ponta: 13 });
  s += tt(480, 150, 'Geratriz') + tt(480, 190, 'superior');
  s += ta(480, 228, 'onde a mão') + ta(480, 262, 'passa');
  return {
    nome: 'corrimao_braille', itens: [29, 78],
    titulo: 'Braille no corrimão',
    descricao: 'Corrimão visto de lado, com o número do pavimento em relevo e em Braille. No detalhe ampliado, o número 3 em relevo e a cela Braille correspondente. No corte do tubo, a sinalização fica na geratriz superior, a parte de cima do tubo, onde a mão passa.',
    s,
  };
}

// ---------------------------------------------------------------------------
function portaVaoLivre() {
  const v = criarVista({ escala: 104, origem: { x: 236, y: 300 } });
  const COMPR = 4.2, FUNDO = 2.2, H = 2.45, P0 = 1.6, P1 = 2.62, ALT = 2.1, ESP = 0.05;
  let s = '';
  s += v.poli([[0, 0, 0], [COMPR, 0, 0], [COMPR, FUNDO, 0], [0, FUNDO, 0]], C.patamar);
  s += v.poli([[0, 0, 0], [P0, 0, 0], [P0, 0, H], [0, 0, H]], C.parede);
  s += v.poli([[P1, 0, 0], [COMPR, 0, 0], [COMPR, 0, H], [P1, 0, H]], C.parede);
  s += v.poli([[P0, 0, ALT], [P1, 0, ALT], [P1, 0, H], [P0, 0, H]], C.parede);
  s += v.poli([[P0, 0, 0], [P1, 0, 0], [P1, 0, ALT], [P0, 0, ALT]], '#5a5a5a');
  const a = v.proj(P0 + ESP, 0.14), b = v.proj(P1, 0.14);
  s += seta(a, b, { cor: AZUL, largura: 6, ponta: 18 });
  const c = v.proj(P1 - 0.1, 0, 0), d = v.proj(P1 - 0.1, 0, ALT);
  s += seta(c, d, { cor: '#ffffff', largura: 5, ponta: 16 });
  s += v.poli([[P0, 0, 0], [P0, 0.92, 0], [P0, 0.92, ALT], [P0, 0, ALT]], C.branco);
  s += v.linha([P0, 0.8, 0.95], [P0 + 0.14, 0.8, 0.95], 6);
  // Rótulos nos cantos livres
  s += texto(700, 52, 'Altura livre', { tam: T, anc: 'end' }) + texto(700, 92, 'mín. 2,10 m', { tam: T, anc: 'end' });
  s += chamada(v.proj(P1 - 0.1, 0, ALT * 0.8), 560, 102);
  s += tb(24, 170, 'Folha aberta') + tb(24, 206, 'a 90°');
  s += chamada(v.proj(P0, 0.6, 1.5), 120, 216);
  s += tt(24, 600, 'Largura livre') + tt(24, 640, 'mín. 0,80 m');
  s += ta(24, 680, 'da folha a 90° ao batente');
  s += chamada(v.proj((P0 + P1) / 2 + 0.05, 0.14), 230, 568);
  s += texto(700, 600, 'Esporte ou', { tam: A, peso: 500, anc: 'end' });
  s += texto(700, 636, 'equipamentos:', { tam: A, peso: 500, anc: 'end' });
  s += texto(700, 676, 'mín. 1,00 m', { tam: A, anc: 'end' });
  return {
    nome: 'porta_vao_livre', itens: [30, 92, 107, 139, 174],
    titulo: 'Vão livre da porta',
    descricao: 'Porta em perspectiva, com a folha aberta a 90 graus. A largura livre, da folha aberta até o batente oposto, é de no mínimo 0,80 metro, e a altura livre, de no mínimo 2,10 metros. Em locais de prática esportiva ou com equipamentos grandes, a largura mínima é de 1,00 metro.',
    s,
  };
}

// ---------------------------------------------------------------------------
function macanetaAlavanca() {
  const S = 250, PISO = 650, y = h => PISO - h * S;
  let s = '';
  s += ret(20, y(2.3), 310, 2.3 * S, C.parede);
  s += ret(20, PISO, 310, 50, C.piso);
  const x0 = 130, l = 0.8 * S;
  s += ret(x0, y(2.1), l, 2.1 * S, C.branco);
  s += `<rect x="${x0 - 30}" y="${y(1.1)}" width="${l + 30}" height="${0.3 * S}" fill="${ZONA}" stroke="${AZUL}" stroke-width="2.5" stroke-dasharray="11 8"/>`;
  const hx = x0 + l - 26, hy = y(0.95);
  s += `<circle cx="${hx}" cy="${hy}" r="12" fill="#777" stroke="${C.linha}" stroke-width="2"/>` + linha(hx, hy, hx - 66, hy, 10, C.linha, 'stroke-linecap="round"');
  s += seta({ x: 104, y: PISO }, { x: 104, y: y(0.8) }, { largura: 2.5, ponta: 11 });
  s += vertical(86, (PISO + y(0.8)) / 2, '0,80 m', A);
  s += seta({ x: 58, y: PISO }, { x: 58, y: y(1.1) }, { largura: 3, ponta: 13 });
  s += vertical(40, (PISO + y(1.1)) / 2 - 30, '1,10 m', T);
  s += tb(30, 50, 'Faixa de instalação');
  s += chamada({ x: x0 + 20, y: y(1.1) + 10 }, 120, 60);
  // Detalhe visto de cima
  s += `<rect x="350" y="20" width="350" height="680" fill="#fff" stroke="${C.linha}" stroke-width="2.5" rx="8"/>`;
  s += ta(370, 62, 'Vista de cima', { cor: C.muted, halo: false });
  const fy = 380, ex = 650, topo = 262;
  s += `<rect x="370" y="${fy}" width="310" height="48" fill="${C.patamar}" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += texto(525, fy + 36, 'Porta', { tam: A, halo: false });
  s += `<path d="M ${ex} ${fy} V ${topo} H ${ex - 230} q -24 0 -24 28" fill="none" stroke="${C.linha}" stroke-width="20" stroke-linejoin="round" stroke-linecap="round"/>`;
  s += seta({ x: ex, y: topo - 36 }, { x: ex - 254, y: topo - 36 }, { ponta: 10, largura: 2.5 });
  s += texto(525, 150, 'Comprimento:', { tam: A, halo: false }) + texto(525, 190, 'mín. 10 cm', { tam: T, halo: false });
  s += seta({ x: 600, y: fy }, { x: 600, y: topo + 12 }, { ponta: 10, largura: 2.5 });
  s += ta(370, 474, 'Da porta:', { halo: false }) + tb(370, 510, 'mín. 4 cm', { halo: false });
  s += tb(370, 590, 'Tipo alavanca,', { halo: false });
  s += ta(370, 626, 'sem arestas e com', { halo: false });
  s += ta(370, 662, 'a ponta recurvada', { halo: false });
  return {
    nome: 'macaneta_alavanca', itens: [31, 94],
    titulo: 'Maçaneta do tipo alavanca',
    descricao: 'Porta vista de frente, com a maçaneta na faixa de instalação, entre 0,80 metro e 1,10 metro do piso. No detalhe, visto de cima, a maçaneta é do tipo alavanca, sem arestas e com a ponta recurvada, com comprimento mínimo de 10 centímetros e afastada no mínimo 4 centímetros da porta.',
    s,
  };
}

// ---------------------------------------------------------------------------
function portaGiratoria() {
  const yP = 330, ep = 30;
  let s = '';
  const parede = (x0, x1) => `<rect x="${x0}" y="${yP}" width="${x1 - x0}" height="${ep}" fill="${ASFALTO}" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += parede(20, 90) + parede(350, 430) + parede(620, 700);
  const cx = 220, cy = yP + ep / 2, r = 126;
  s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff" stroke="${C.linha}" stroke-width="4"/>`;
  const d = r * Math.SQRT1_2;
  s += `<path d="M ${cx - d} ${cy - d} L ${cx + d} ${cy + d} M ${cx + d} ${cy - d} L ${cx - d} ${cy + d}" stroke="${C.linha}" stroke-width="6"/>`;
  s += texto(cx, 60, 'Porta giratória', { tam: T });
  s += texto(cx, 100, 'não dá passagem à', { tam: A, peso: 500 });
  s += texto(cx, 136, 'cadeira de rodas', { tam: A, peso: 500 });
  s += seta({ x: cx, y: 660 }, { x: cx, y: 540 }, { dupla: false, cor: VERMELHO, largura: 7, ponta: 20 });
  s += xis(cx, 512);
  const xD = 430, LD = 190;
  s += `<rect x="${xD}" y="${yP + ep}" width="8" height="${LD}" fill="#fff" stroke="${C.linha}" stroke-width="2"/>`;
  s += `<path d="M ${xD + 4} ${yP + ep + LD} A ${LD} ${LD} 0 0 0 ${xD + LD} ${yP + ep}" fill="none" stroke="${C.muted}" stroke-width="2" stroke-dasharray="8 7"/>`;
  s += linha(xD + LD / 2 + 4, 580, xD + LD / 2 + 4, 236, 8, AZUL);
  s += seta({ x: xD + LD / 2 + 4, y: 250 }, { x: xD + LD / 2 + 4, y: 196 }, { dupla: false, cor: AZUL, largura: 8, ponta: 22 });
  s += cadeira(xD + LD / 2 + 4, 636, -90, 0.72);
  s += texto(700, 60, 'Entrada', { tam: T, anc: 'end' }) + texto(700, 96, 'acessível ao lado', { tam: A, anc: 'end' });
  s += texto(700, 132, 'aberta no horário', { tam: A, peso: 500, anc: 'end' });
  s += texto(700, 168, 'de funcionamento', { tam: A, peso: 500, anc: 'end' });
  s += ta(24, 700, 'Vista de cima', { cor: C.muted, halo: false });
  return {
    nome: 'porta_giratoria', itens: [32],
    titulo: 'Entrada ao lado da porta giratória',
    descricao: 'Vista de cima de uma entrada. A porta giratória não dá passagem à cadeira de rodas. Ao lado dela há uma entrada acessível, aberta durante o horário de funcionamento.',
    s,
  };
}

// ---------------------------------------------------------------------------
function catracaVao() {
  const LV = 180, yC = 270, aC = 150, xV = 440;
  let s = '';
  s += `<rect x="${xV - 70}" y="${yC + aC}" width="${LV + 140}" height="240" fill="${ZONA}" stroke="${AZUL}" stroke-width="3" stroke-dasharray="11 8"/>`;
  s += `<rect x="${xV - 70}" y="40" width="${LV + 140}" height="${yC - 40}" fill="${ZONA}" stroke="${AZUL}" stroke-width="3" stroke-dasharray="11 8"/>`;
  const pedestal = x => ret(x, yC, 34, aC, C.piso, 'rx="6"');
  for (const x of [24, 184]) {
    s += pedestal(x);
    const cy = yC + aC / 2, x0 = x + 34;
    s += `<circle cx="${x0}" cy="${cy}" r="9" fill="#444"/>`;
    s += linha(x0, cy, x0 + 110, cy, 7, C.linha, 'stroke-linecap="round"') + linha(x0, cy, x0 - 20, cy - 44, 7, C.linha, 'stroke-linecap="round"');
  }
  s += pedestal(xV - 34) + pedestal(xV + LV);
  s += tb(24, 236, 'Catracas comuns');
  s += ta(24, 470, 'A cadeira de rodas') + ta(24, 506, 'não passa');
  const xm = xV + LV / 2;
  s += linha(xm, 590, xm, yC + aC / 2 + 12, 8, AZUL);
  s += linha(xm, yC + aC / 2 - 46, xm, 110, 8, AZUL);
  s += seta({ x: xm, y: 120 }, { x: xm, y: 70 }, { dupla: false, cor: AZUL, largura: 8, ponta: 22 });
  s += cadeira(xm, 636, -90, 0.72);
  s += seta({ x: xV, y: yC + aC / 2 }, { x: xV + LV, y: yC + aC / 2 }, { largura: 3, ponta: 12 });
  s += texto(xm, yC + aC / 2 - 14, 'mín. 0,80 m', { tam: A });
  s += tb(24, 60, 'Ao menos uma') + ta(24, 96, 'passagem com') + ta(24, 132, 'este vão livre');
  s += tb(24, 600, 'Espaço de manobra') + ta(24, 636, 'antes e depois');
  return {
    nome: 'catraca_vao', itens: [33],
    titulo: 'Passagem acessível na catraca',
    descricao: 'Vista de cima de uma linha de catracas. A cadeira de rodas não passa pelas catracas comuns. Ao menos uma passagem tem vão livre de no mínimo 0,80 metro, com espaço de manobra antes e depois.',
    s,
  };
}

// ---------------------------------------------------------------------------
function vagaPcd() {
  let s = `<rect x="20" y="20" width="680" height="680" fill="${ASFALTO}" stroke="${C.linha}" stroke-width="2.5"/>`;
  const topo = 50, alt = 380, l = 150, extra = 100;
  const x1 = 40, x2 = x1 + l, x3 = x2 + extra, x4 = x3 + l;
  s += `<rect x="${x2}" y="${topo}" width="${extra}" height="${alt}" fill="#d9d9d9"/>`;
  for (let i = 0; i < 8; i++) {
    const ya = topo + 14 + i * 46;
    s += linha(x2 + 4, ya + 30, x2 + extra - 4, ya, 5, AZUL);
  }
  s += `<rect x="${x1}" y="${topo}" width="${l}" height="${alt}" fill="${ZONA}" stroke="#fff" stroke-width="5"/>`;
  s += `<rect x="${x3}" y="${topo}" width="${l}" height="${alt}" fill="${ZONA}" stroke="#fff" stroke-width="5"/>`;
  s += simboloAcesso(x1 + 25, topo + 150, 100) + simboloAcesso(x3 + 25, topo + 150, 100);
  s += simboloAcesso(x1 + 50, topo + 10, 50);
  // Faixa até a entrada
  s += `<rect x="20" y="${topo + alt + 50}" width="680" height="110" fill="#d9d9d9" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += texto(360, topo + alt + 92, 'Rota acessível até a entrada', { tam: A, halo: false });
  s += seta({ x: 50, y: topo + alt + 132 }, { x: 670, y: topo + alt + 132 }, { dupla: false, largura: 5, ponta: 18, cor: AZUL });
  s += linha(x2 + extra / 2, topo + alt, x2 + extra / 2, topo + alt + 50, 5, AZUL);
  s += seta({ x: x2, y: topo + alt - 34 }, { x: x3, y: topo + alt - 34 }, { largura: 3.5, ponta: 12 });
  // Rótulos à direita
  const xr = x4 + 24;
  s += tb(xr, 82, 'Placa vertical') + ta(xr, 116, 'com o símbolo');
  s += chamada({ x: x1 + 100, y: topo + 34 }, xr - 6, 96);
  s += tb(xr, 220, 'Símbolo') + ta(xr, 254, 'no piso');
  s += chamada({ x: x3 + 125, y: topo + 200 }, xr - 6, 236);
  s += tb(xr, 340, 'Espaço ao lado') + ta(xr, 376, 'mín. 1,20 m', { peso: 700 });
  s += chamada({ x: x3, y: topo + alt - 34 }, xr - 6, 356);
  s += tb(40, 632, 'Reservar 2% das vagas,');
  s += ta(40, 670, 'ou 1 vaga, o que for maior');
  return {
    nome: 'vaga_pcd', itens: [35, 38],
    titulo: 'Vaga reservada para pessoa com deficiência',
    descricao: 'Vista de cima de duas vagas reservadas, com o símbolo de acesso no piso e em placa vertical, e espaço adicional ao lado, de no mínimo 1,20 metro de largura, ligado à rota acessível até a entrada. Reservar 2% das vagas, ou 1 vaga, o que for maior.',
    s,
  };
}

// ---------------------------------------------------------------------------
function vagaIdoso() {
  let s = `<rect x="20" y="20" width="680" height="680" fill="${ASFALTO}" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += ret(420, 40, 260, 150, C.branco);
  s += texto(550, 116, 'Edificação', { tam: A, halo: false });
  s += `<rect x="500" y="178" width="100" height="24" fill="#fff" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += `<path d="M 40 300 H 505 V 202 H 595 V 300 H 680 V 380 H 40 Z" fill="#ededed" stroke="${C.linha}" stroke-width="2.5"/>`;
  const yV = 380, aV = 300, lv = 160, x0 = 40;
  for (const i of [2, 3]) s += `<rect x="${x0 + i * lv}" y="${yV}" width="${lv}" height="${aV}" fill="#cfe0f2"/>`;
  for (let i = 0; i <= 4; i++) s += linha(x0 + i * lv, yV, x0 + i * lv, yV + aV, 6, '#fff');
  for (const i of [2, 3]) {
    s += simboloAcesso(x0 + i * lv + 30, yV + 110, 100);
    s += linha(x0 + i * lv + 80, 372, x0 + i * lv + 80, 350, 5);
    s += simboloAcesso(x0 + i * lv + 55, 312, 50);
  }
  s += texto(x0 + lv, yV + 168, 'Outras vagas', { tam: A });
  s += tt(40, 70, '5% das vagas');
  s += ta(40, 108, 'para idosos,');
  s += ta(40, 144, 'perto da entrada');
  s += tb(40, 220, 'No piso e em');
  s += tb(40, 256, 'placa vertical');
  return {
    nome: 'vaga_idoso', itens: [36],
    titulo: 'Vaga reservada para idosos',
    descricao: 'Vista de cima de um estacionamento. 5% das vagas são reservadas para idosos, perto da entrada da edificação, sinalizadas no piso e em placa vertical.',
    s,
  };
}

// ---------------------------------------------------------------------------
function estacionamentoPercurso() {
  let s = `<rect x="20" y="20" width="680" height="680" fill="${ASFALTO}" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += ret(420, 40, 260, 160, C.branco);
  s += texto(550, 116, 'Edificação', { tam: A, halo: false });
  s += `<rect x="500" y="188" width="100" height="24" fill="#fff" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += texto(550, 172, 'Acesso', { tam: A, peso: 500, halo: false });
  const yF = 330, aF = 100, xV = 500, lV = 100;
  s += `<path d="M 40 ${yF} H ${xV} V 212 H ${xV + lV} V ${yF + aF} H 40 Z" fill="#ededed" stroke="${C.linha}" stroke-width="2.5"/>`;
  const lv = 128, yV = yF + aF, aV = 240;
  s += `<rect x="40" y="${yV}" width="${lv}" height="${aV}" fill="#cfe0f2"/>`;
  for (let i = 0; i <= 5; i++) s += linha(40 + i * lv, yV, 40 + i * lv, yV + aV, 6, '#fff');
  s += simboloAcesso(40 + lv / 2 - 42, yV + 80, 84);
  s += texto(40 + 3 * lv, yV + 130, 'Outras vagas', { tam: A });
  const yM = yF + aF / 2, xM = xV + lV / 2;
  s += `<polyline points="${40 + lv / 2},${yV + 70} ${40 + lv / 2},${yM} ${xM},${yM} ${xM},236" fill="none" stroke="${AZUL}" stroke-width="8" stroke-linejoin="round"/>`;
  s += seta({ x: xM, y: 252 }, { x: xM, y: 214 }, { dupla: false, largura: 8, cor: AZUL, ponta: 22 });
  s += seta({ x: 330, y: yF + aF }, { x: 330, y: yF }, { largura: 3, ponta: 12 });
  s += texto(250, yF - 16, 'Faixa: mín. 1,20 m', { tam: A });
  s += tb(40, 70, 'Da vaga ao acesso');
  s += tt(40, 114, 'máx. 50 m');
  return {
    nome: 'estacionamento_percurso', itens: [37, 39],
    titulo: 'Percurso da vaga ao acesso',
    descricao: 'Vista de cima de um estacionamento. O percurso da vaga reservada até o acesso da edificação tem no máximo 50 metros, por uma faixa de no mínimo 1,20 metro de largura.',
    s,
  };
}

// ---------------------------------------------------------------------------
function corredorLargura() {
  const v = criarVista({ escala: 108, origem: { x: 226, y: 196 } });
  const COMPR = 4.6, LARG = 1.9, H = 1.3, CURB = 0.08, XLIVRE = 1.0, XEXT = 3.0, RECUO = 0.24;
  let s = '';
  s += v.poli([[0, 0, 0], [COMPR, 0, 0], [COMPR, 0, H], [0, 0, H]], C.parede);
  s += v.poli([[0, 0, 0], [0, LARG, 0], [0, LARG, H], [0, 0, H]], C.branco);
  s += v.poli([[0, 0, 0], [COMPR, 0, 0], [COMPR, LARG, 0], [0, LARG, 0]], C.patamar);
  s += v.linha([XLIVRE, LARG, 0], [XLIVRE, 0, 0], 3.5, '#6b6b6b', 'stroke-dasharray="11 9"');
  s += v.circuloPiso(XEXT, RECUO / 2, 0, 0.5, `fill="rgba(217,119,6,.18)" stroke="${LARANJA}" stroke-width="3" stroke-dasharray="10 7"`);
  s += v.caixa(XEXT - 0.2, XEXT + 0.2, 0, RECUO, 0.1, 1.05, { topo: '#fca5a5', frente: '#dc2626', lado: '#b91c1c' });
  const a = v.proj(XEXT, LARG), b = v.proj(XEXT, RECUO);
  s += seta(a, b, { cor: LARANJA, largura: 6, ponta: 18 });
  s += v.poli([[0, LARG, 0], [COMPR, LARG, 0], [COMPR, LARG, CURB], [0, LARG, CURB]], C.branco);
  s += v.poli([[COMPR, 0, 0], [COMPR, LARG, 0], [COMPR, LARG, CURB], [COMPR, 0, CURB]], C.branco);
  s += `<g transform="translate(${a.x.toFixed(1)} ${a.y.toFixed(1)})"><rect x="-27" y="-24" width="54" height="42" rx="8" fill="${LARANJA}" stroke="${C.linha}" stroke-width="2.5"/><circle cx="0" cy="-3" r="11" fill="#fff" stroke="${C.linha}" stroke-width="2"/></g>`;
  s += tt(24, 600, 'Largura livre') + tt(24, 640, 'mín. 1,50 m');
  s += ta(24, 680, 'no ponto mais estreito');
  s += chamada(v.proj(XEXT, (LARG + RECUO) / 2), 220, 568);
  s += tb(24, 380, 'Sem obstáculo:') + ta(24, 416, 'não define') + ta(24, 452, 'a largura');
  s += chamada(v.proj(XLIVRE, LARG * 0.75), 120, 350);
  s += texto(700, 56, 'Obstáculo', { tam: T, anc: 'end' });
  s += texto(700, 94, 'reduz a largura', { tam: A, anc: 'end' });
  s += texto(700, 130, 'extintor, mural, móvel', { tam: A, peso: 500, anc: 'end' });
  s += chamada(v.proj(XEXT + 0.2, RECUO, 0.8), 600, 142);
  return {
    nome: 'corredor_largura', itens: [42, 43],
    titulo: 'Largura livre do corredor',
    descricao: 'Corredor em perspectiva com um obstáculo junto à parede, como extintor, mural ou móvel, que reduz a largura. A largura livre mínima de 1,50 metro é medida no ponto mais estreito; o trecho sem obstáculo não define a largura.',
    s,
  };
}

// ---------------------------------------------------------------------------
function iluminacaoUniforme() {
  const cena = (topo, correta) => {
    const x = 20, l = 680, h = 330, yTeto = topo + 56, yPiso = topo + h - 44;
    const cor = correta ? VERDE : VERMELHO;
    let t = `<rect x="${x}" y="${topo}" width="${l}" height="${h}" fill="#fff" stroke="${C.linha}" stroke-width="2.5" rx="8"/>`;
    t += `<path d="M ${x} ${topo + 8} a 8 8 0 0 1 8 -8 h ${l - 16} a 8 8 0 0 1 8 8 v 46 h -${l} z" fill="${cor}"/>`;
    t += texto(x + 22, topo + 38, correta ? 'Correto: luz uniforme' : 'Incorreto: sombra e ofuscamento', { tam: A, cor: '#fff', halo: false, anc: 'start' });
    const clip = correta ? 'sala-correta' : 'sala-incorreta';
    const xE = x + 12, lE = l - 24;
    t += `<clipPath id="${clip}"><rect x="${xE}" y="${yTeto}" width="${lE}" height="${yPiso - yTeto}"/></clipPath>`;
    t += `<rect x="${xE}" y="${yTeto}" width="${lE}" height="${yPiso - yTeto}" fill="${correta ? '#fff6cf' : '#454b58'}"/>`;
    const cone = (cx, abre, c) => `<polygon points="${cx - 22},${yTeto + 10} ${cx + 22},${yTeto + 10} ${cx + abre},${yPiso} ${cx - abre},${yPiso}" fill="${c}" clip-path="url(#${clip})"/>`;
    const lamp = cx => `<rect x="${cx - 30}" y="${yTeto}" width="60" height="10" fill="#fff" stroke="${C.linha}" stroke-width="2"/>`;
    if (correta) {
      for (const cx of [140, 360, 580]) t += cone(cx, 130, 'rgba(255,214,84,.32)');
      for (const cx of [140, 360, 580]) t += lamp(cx);
    } else {
      t += cone(570, 100, '#fff3b0') + lamp(570);
    }
    // Janela à direita
    t += `<rect x="${x + l - 30}" y="${yTeto + 30}" width="18" height="130" fill="${correta ? '#dbe7f3' : '#fffbe0'}" stroke="${C.linha}" stroke-width="2.5"/>`;
    if (correta) {
      t += `<rect x="${x + l - 62}" y="${yTeto + 20}" width="32" height="150" fill="#b9c8d8" stroke="${C.linha}" stroke-width="2.5"/>`;
    } else {
      for (const [dy, fim] of [[-30, -10], [0, 2], [30, 14]]) t += linha(x + l - 32, yTeto + 95 + dy, 136, yPiso - 96 + fim, 7, '#ffd84d');
    }
    // Pessoa sentada à mesa
    t += `<rect x="${xE}" y="${yPiso}" width="${lE}" height="32" fill="${C.piso}" stroke="${C.linha}" stroke-width="2"/>`;
    const pc = correta ? 'none' : '#fff';
    t += `<circle cx="110" cy="${yPiso - 132}" r="20" fill="#555" stroke="${pc}" stroke-width="2"/>`;
    t += `<rect x="92" y="${yPiso - 110}" width="36" height="70" rx="12" fill="#555" stroke="${pc}" stroke-width="2"/>`;
    t += `<rect x="82" y="${yPiso - 40}" width="54" height="10" fill="#777"/><rect x="104" y="${yPiso - 30}" width="10" height="30" fill="#777"/>`;
    t += `<rect x="150" y="${yPiso - 66}" width="230" height="12" fill="#fff" stroke="${C.linha}" stroke-width="2.5"/>`;
    t += `<rect x="164" y="${yPiso - 54}" width="10" height="54" fill="#777"/><rect x="356" y="${yPiso - 54}" width="10" height="54" fill="#777"/>`;
    if (correta) {
      t += texto(360, yTeto + 56, 'Luminárias bem distribuídas', { tam: A });
      t += texto(300, yPiso - 84, 'Sem sombra na mesa', { tam: A, peso: 600 });
      t += texto(x + l - 72, yTeto + 210, 'Cortina', { tam: A, peso: 600, anc: 'end' });
    } else {
      t += texto(160, yTeto + 40, 'Ofuscamento', { tam: A, cor: '#fff', anc: 'start', halo: false });
      t += texto(160, yTeto + 74, 'janela sem proteção', { tam: A, peso: 500, cor: '#fff', anc: 'start', halo: false });
      t += texto(184, yPiso - 14, 'Sombra na mesa', { tam: A, cor: '#fff', anc: 'start', halo: false });
    }
    return t;
  };
  const s = cena(20, false) + cena(370, true);
  return {
    nome: 'iluminacao_uniforme', itens: [45, 97, 109, 130, 140, 172],
    titulo: 'Iluminação uniforme',
    descricao: 'Duas salas vistas de lado. Incorreto: uma só luminária e a janela sem proteção causam sombra na mesa e ofuscamento. Correto: luminárias bem distribuídas dão luz uniforme, sem sombra na mesa, e a janela tem cortina.',
    s,
  };
}

// ---------------------------------------------------------------------------
export const LOTE2_QUADRADAS = [
  rampaGuardaCorpo, corrimaoIntermediario, corrimaoBraille, portaVaoLivre, macanetaAlavanca, portaGiratoria,
  catracaVao, vagaPcd, vagaIdoso, estacionamentoPercurso, corredorLargura, iluminacaoUniforme,
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
for (const criar of LOTE2_QUADRADAS) {
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
