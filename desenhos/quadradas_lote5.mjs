// Lote 5 das ilustrações quadradas (720×720): os 12 últimos desenhos na ordem do checklist.
// Cada um reenquadra o desenho original (figuras.mjs e lote1 a lote5), com rótulos de 38 e 30.
// Uso: node quadradas_lote5.mjs  →  saida/quadradas/*.svg
import { C, criarVista, texto, seta } from './lib.mjs';
import { cadeira } from './lote1.mjs';
import { simboloAcesso } from './lote2.mjs';
import { T, A, AZUL, ZONA, VERDE, VERMELHO, tt, ta, tb, ret, linha, chamada, vertical, zona, piso, quadro, gerarLote } from './quadradas_comum.mjs';

const xis = (x, y, r = 18, cor = VERMELHO) => `<path d="M ${x - r} ${y - r} L ${x + r} ${y + r} M ${x + r} ${y - r} L ${x - r} ${y + r}" stroke="${cor}" stroke-width="6" stroke-linecap="round"/>`;
// Cela Braille numerada: 1, 2, 3 à esquerda; 4, 5, 6 à direita
const cela = (x, y, pontos, passo, raio, cor) => pontos.map(p => `<circle cx="${x + (p > 3 ? passo : 0)}" cy="${y + ((p - 1) % 3) * passo}" r="${raio}" fill="${cor}"/>`).join('');

// ---------------------------------------------------------------------------
function sanitarioAreaManobra() {
  const v = criarVista({ escala: 125, origem: { x: 336, y: 180 } });
  const W = 2.2, D = 2.1, H = 0.95;
  const CIRC = { x: 1.34, y: 1.27, r: 0.75 };
  let s = '';
  s += v.poli([[0, 0, 0], [W, 0, 0], [W, 0, H], [0, 0, H]], C.parede);
  s += v.poli([[0, 0, 0], [0, D, 0], [0, D, H], [0, 0, H]], C.branco);
  s += v.poli([[0, 0, 0], [W, 0, 0], [W, D, 0], [0, D, 0]], '#e5e5e5');
  s += v.poli([[0.62, 0, 0], [1.42, 0, 0], [1.42, 1.2, 0], [0.62, 1.2, 0]], ZONA, `stroke-dasharray="9 7" style="stroke:${AZUL}"`);
  s += v.circuloPiso(CIRC.x, CIRC.y, 0, CIRC.r, `fill="rgba(11,87,164,0.10)" stroke="${AZUL}" stroke-width="3" stroke-dasharray="12 8"`);
  s += seta(v.proj(CIRC.x - CIRC.r, CIRC.y), v.proj(CIRC.x + CIRC.r, CIRC.y), { cor: AZUL, largura: 3 });
  s += v.linha([0.04, 0.2, 0.75], [0.04, 1.0, 0.75], 7, '#555') + v.linha([0.2, 0.04, 0.75], [1.0, 0.04, 0.75], 7, '#555');
  s += v.caixa(0.22, 0.58, 0, 0.17, 0, 0.72) + v.caixa(0.27, 0.53, 0.17, 0.52, 0, 0.45);
  s += v.circuloPiso(0.4, 0.42, 0.45, 0.2, `fill="#fff" stroke="${C.linha}" stroke-width="2.5"`);
  s += v.circuloPiso(0.4, 0.42, 0.45, 0.12, `fill="#d9d9d9" stroke="${C.linha}" stroke-width="2"`);
  s += v.caixa(1.62, 2.12, 0, 0.44, 0.7, 0.8) + v.circuloPiso(1.87, 0.22, 0.8, 0.13, `fill="#d9d9d9" stroke="${C.linha}" stroke-width="2"`);
  const CURB = 0.1, P0 = 0.72, P1 = P0 + 0.8;
  s += v.poli([[0, D, 0], [P0, D, 0], [P0, D, CURB], [0, D, CURB]], C.branco);
  s += v.poli([[P1, D, 0], [W, D, 0], [W, D, CURB], [P1, D, CURB]], C.branco);
  s += v.poli([[W, 0, 0], [W, D, 0], [W, D, CURB], [W, 0, CURB]], C.branco);
  const arco = [];
  for (let a = 0; a <= 90; a += 6) arco.push(v.proj(P1 - 0.8 * Math.cos(a * Math.PI / 180), D + 0.8 * Math.sin(a * Math.PI / 180)));
  s += `<polyline points="${arco.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}" fill="none" stroke="${C.cota}" stroke-width="2" stroke-dasharray="7 6"/>`;
  s += v.linha([P1, D, 0], [P1, D + 0.8, 0], 6, C.cota);
  s += tb(24, 44, 'Bacia com assento') + ta(24, 80, '0,43 m a 0,46 m');
  s += chamada(v.proj(0.4, 0.42, 0.45), 110, 90);
  s += texto(700, 44, 'Transferência', { tam: A, anc: 'end' }) + texto(700, 80, 'lateral', { tam: A, anc: 'end' }) + texto(700, 116, '0,80 m × 1,20 m', { tam: A, peso: 500, anc: 'end' });
  s += chamada(v.proj(0.95, 0.5), 590, 126);
  s += texto(700, 566, 'Giro de 360° livre', { tam: A, anc: 'end' }) + texto(700, 602, 'diâmetro mín. 1,50 m', { tam: A, peso: 500, anc: 'end' });
  s += chamada(v.proj(CIRC.x + 0.45, CIRC.y + 0.3), 560, 538);
  s += tb(24, 650, 'Porta abre para fora') + ta(24, 686, 'vão livre mín. 0,80 m');
  s += chamada(v.proj((P0 + P1) / 2, D + 0.05), 150, 622);
  return {
    nome: 'sanitario_area_manobra', itens: [155, 156, 152], aConfirmar: ['1,20m'],
    titulo: 'Sanitário acessível: giro e transferência',
    descricao: 'Sanitário acessível em perspectiva. Um círculo de 1,50 metro de diâmetro, livre de peças, permite o giro de 360 graus. Ao lado da bacia, uma área de transferência lateral de 0,80 por 1,20 metro. A bacia com assento tem altura entre 0,43 e 0,46 metro. A porta abre para fora e tem vão livre mínimo de 0,80 metro.',
    s,
  };
}

// ---------------------------------------------------------------------------
function baciaAlturaAssento() {
  const S = 440, PISO = 370, y = h => PISO - h * S;
  let s = ret(20, 24, 680, PISO - 24, C.parede) + piso(20, 700, PISO, 26);
  const fr = 280, yA = y(0.45);
  s += `<path d="M 20 ${yA - 110} H 100 V ${yA} H ${fr - 6} Q ${fr} ${yA} ${fr} ${yA + 6} V ${yA + 64} Q ${fr - 36} ${PISO - 44} ${fr - 64} ${PISO} H 20 Z" fill="#fff" stroke="${C.linha}" stroke-width="3"/>`;
  s += `<rect x="100" y="${yA - 14}" width="${fr - 92}" height="14" rx="6" fill="#777" stroke="${C.linha}" stroke-width="2.5"/>`;
  const xc = fr + 56;
  s += seta({ x: xc, y: PISO }, { x: xc, y: yA - 14 }, { largura: 3.5, ponta: 13 });
  s += linha(fr + 12, yA - 14, xc + 12, yA - 14, 1.6);
  s += tb(xc + 18, 200, 'Com assento') + tb(xc + 18, 236, '0,43 m a 0,46 m');
  s += tb(xc + 18, 286, 'Sem assento') + ta(xc + 18, 322, '0,43 m a 0,45 m');
  s += ta(120, 66, 'Altura da bacia', { halo: false });
  const assento = (cx, aberto) => {
    const cy = 515, rx = 78, ry = 100;
    let a = `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#777" stroke="${C.linha}" stroke-width="3"/><ellipse cx="${cx}" cy="${cy}" rx="${rx - 30}" ry="${ry - 32}" fill="#d9d9d9" stroke="${C.linha}" stroke-width="2.5"/>`;
    if (aberto) a += `<rect x="${cx - 22}" y="${cy + 58}" width="44" height="50" fill="#fff"/><path d="M ${cx - 22} ${cy + 60} V ${cy + 96} M ${cx + 22} ${cy + 60} V ${cy + 96}" stroke="${C.linha}" stroke-width="3"/>`;
    return a;
  };
  s += assento(170, false) + assento(550, true);
  s += texto(360, 500, 'Assento', { tam: A, peso: 500 }) + texto(360, 536, 'visto de cima', { tam: A, peso: 500 });
  s += texto(170, 660, 'Correto', { tam: A, cor: VERDE }) + texto(170, 696, 'sem abertura', { tam: A, peso: 500 });
  s += texto(550, 660, 'Incorreto', { tam: A, cor: VERMELHO }) + texto(550, 696, 'com abertura', { tam: A, peso: 500 });
  return {
    nome: 'bacia_altura_assento', itens: [156, 157],
    titulo: 'Altura da bacia e assento',
    descricao: 'Em cima, bacia sanitária vista de lado, com altura entre 0,43 e 0,46 metro com assento, e entre 0,43 e 0,45 metro sem assento. Embaixo, dois assentos vistos de cima: o correto não tem abertura frontal, e o incorreto tem.',
    s,
  };
}

// ---------------------------------------------------------------------------
function baciaBarras() {
  const S = 190, AZ = 9;
  let s = '';
  // Parede lateral
  {
    const PISO = 340, y = h => PISO - h * S, w0 = 40, frente = w0 + 0.66 * S;
    s += ret(20, 14, 680, PISO - 14, C.parede) + piso(20, 700, PISO, 20);
    s += texto(690, 46, 'Parede lateral', { tam: A, peso: 500, anc: 'end', halo: false });
    s += `<path d="M 20 ${y(0.82)} H ${w0 + 0.2 * S} V ${y(0.45)} H ${frente - 4} Q ${frente} ${y(0.45)} ${frente} ${y(0.4)} V ${y(0.22)} Q ${frente - 26} ${y(0.08)} ${frente - 44} ${PISO} H 20 Z" fill="#fff" stroke="${C.linha}" stroke-width="3"/>`;
    const fim = frente + 0.5 * S, ini = fim - 0.8 * S, xV = frente + 0.3 * S, baseV = y(0.85), topoV = baseV - 0.7 * S;
    s += linha(ini, y(0.75), fim, y(0.75), AZ, AZUL, 'stroke-linecap="round"') + linha(xV, baseV, xV, topoV, AZ, AZUL, 'stroke-linecap="round"');
    s += seta({ x: fim + 34, y: PISO }, { x: fim + 34, y: y(0.75) }, { largura: 2.5, ponta: 11 }) + linha(fim + 6, y(0.75), fim + 46, y(0.75), 1.6);
    s += vertical(fim + 60, (PISO + y(0.75)) / 2 - 4, '0,75 m', A);
    s += seta({ x: frente, y: y(0.75) + 30 }, { x: fim, y: y(0.75) + 30 }, { ponta: 9, largura: 2 });
    s += texto((frente + fim) / 2, y(0.75) + 66, '0,50 m', { tam: A });
    s += seta({ x: frente, y: topoV - 4 }, { x: xV, y: topoV - 4 }, { ponta: 8, largura: 2 });
    s += texto(frente - 8, topoV + 10, '0,30 m', { tam: A, anc: 'end' });
    s += tb(xV + 18, 92, 'Barra vertical') + tb(xV + 18, 128, 'mín. 0,70 m');
    s += tb(xV + 18, baseV + 2, '0,10 m');
    s += tb(fim + 84, y(0.75) + 10, 'Barra horizontal') + tb(fim + 84, y(0.75) + 46, 'mín. 0,80 m');
  }
  // Parede do fundo
  {
    const PISO = 650, y = h => PISO - h * S, wall = 44, eixo = wall + 0.4 * S, lb = 0.19 * S;
    s += ret(20, 372, 680, PISO - 372, C.branco) + ret(20, 372, wall - 20, PISO - 372, '#d8d8d8') + piso(20, 700, PISO, 22);
    s += texto(690, 404, 'Parede do fundo', { tam: A, peso: 500, anc: 'end', halo: false });
    s += linha(eixo, 390, eixo, PISO, 2, C.cota, 'stroke-dasharray="14 7 3 7"');
    s += `<rect x="${eixo - lb}" y="${y(0.82)}" width="${2 * lb}" height="${0.37 * S}" rx="6" fill="#fff" stroke="${C.linha}" stroke-width="3"/>`;
    s += `<path d="M ${eixo - lb + 3} ${y(0.45)} H ${eixo + lb - 3} L ${eixo + lb - 16} ${PISO} H ${eixo - lb + 16} Z" fill="#fff" stroke="${C.linha}" stroke-width="3"/>`;
    const xb0 = eixo - 0.3 * S, xb1 = xb0 + 0.8 * S;
    s += linha(xb0, y(0.75), xb1, y(0.75), AZ, AZUL, 'stroke-linecap="round"');
    s += seta({ x: wall, y: PISO - 18 }, { x: eixo, y: PISO - 18 }, { ponta: 8, largura: 2.5 });
    s += tb(eixo + 46, PISO - 8, '0,40 m');
    s += seta({ x: xb0, y: y(0.75) - 20 }, { x: eixo, y: y(0.75) - 20 }, { ponta: 7, largura: 2 });
    s += tb(wall + 4, y(0.75) - 34, '0,30 m');
    const xv = eixo + 0.34 * S, yv = y(1.0);
    s += `<circle cx="${xv}" cy="${yv}" r="13" fill="#fff" stroke="${C.linha}" stroke-width="3"/>` + linha(xv, yv, xv + 20, yv, 4);
    s += tb(244, 444, 'Válvula de descarga') + ta(244, 480, 'máx. 1,00 m');
    s += linha(xv + 22, yv, 238, 450, 2);
    s += tb(244, 524, 'Barra de fundo') + tb(244, 560, 'mín. 0,80 m a 0,75 m');
    s += linha(xb1 + 8, y(0.75), 238, 524, 2);
    s += ta(300, 606, 'Barras: 30 mm a 45 mm,') + ta(300, 640, 'afastadas mín. 40 mm');
  }
  return {
    nome: 'bacia_barras', itens: [158, 159, 160, 161],
    titulo: 'Barras de apoio da bacia sanitária',
    descricao: 'Duas vistas da bacia sanitária. Na parede lateral, barra horizontal de no mínimo 0,80 metro a 0,75 metro do piso, avançando 0,50 metro além da borda frontal, e barra vertical de no mínimo 0,70 metro, começando 0,10 metro acima da horizontal, a 0,30 metro da borda frontal. Na parede do fundo, barra de no mínimo 0,80 metro a 0,75 metro do piso, estendendo-se 0,30 metro além do eixo da bacia, que fica a 0,40 metro da parede lateral. A válvula de descarga fica a no máximo 1,00 metro. As barras têm diâmetro de 30 a 45 milímetros e afastamento mínimo de 40 milímetros.',
    s,
  };
}

// ---------------------------------------------------------------------------
function lavatorio() {
  const S = 330, PISO = 640, y = h => PISO - h * S;
  let s = ret(20, 80, 380, PISO - 80, C.parede) + piso(20, 400, PISO);
  s += ta(30, 56, 'Vista de frente', { halo: false });
  const x0 = 170, l = 210, topo = y(0.79);
  s += `<path d="M ${x0} ${topo} H ${x0 + l} V ${topo + 18} Q ${x0 + l} ${topo + 76} ${x0 + l / 2} ${topo + 76} Q ${x0} ${topo + 76} ${x0} ${topo + 18} Z" fill="#fff" stroke="${C.linha}" stroke-width="3"/>`;
  s += `<path d="M ${x0 + l / 2} ${topo} v -42 h 42" fill="none" stroke="${C.linha}" stroke-width="8" stroke-linecap="round"/>` + linha(x0 + l / 2 - 5, topo - 42, x0 + l / 2 - 42, topo - 54, 8, AZUL, 'stroke-linecap="round"');
  s += seta({ x: 128, y: PISO }, { x: 128, y: topo }, { largura: 3.5, ponta: 13 }) + linha(116, topo, x0 + 4, topo, 1.6);
  s += vertical(104, (PISO + topo) / 2, '0,78 m a 0,80 m', A);
  s += vertical(70, (PISO + topo) / 2, 'Superfície', A, 500);
  s += tb(210, 180, 'Alavanca') + tb(210, 216, 'ou sensor');
  s += chamada({ x: x0 + l / 2 - 30, y: topo - 50 }, 262, 226);
  s += ta(150, 510, 'Sem coluna, com') + ta(150, 546, 'coluna suspensa') + ta(150, 582, 'ou sobre tampo');
  // Área de aproximação
  const cx = 556, cy = 290, R = 140;
  s += texto(cx, 44, 'Vista de cima', { tam: A, peso: 500, halo: false });
  s += `<rect x="${cx - 90}" y="${cy - R - 84}" width="180" height="84" rx="10" fill="#fff" stroke="${C.linha}" stroke-width="3"/><ellipse cx="${cx}" cy="${cy - R - 42}" rx="56" ry="26" fill="#d9d9d9" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${ZONA}" stroke="${AZUL}" stroke-width="3.5" stroke-dasharray="12 8"/>`;
  s += cadeira(cx, cy, 270, 0.8);
  s += texto(cx, 480, 'Aproximação', { tam: A }) + texto(cx, 516, 'frontal: círculo', { tam: A }) + texto(cx, 552, 'de 1,50 m', { tam: T });
  return {
    nome: 'lavatorio', itens: [162, 163],
    titulo: 'Lavatório acessível',
    descricao: 'À esquerda, lavatório sem coluna visto de frente, com superfície entre 0,78 e 0,80 metro do piso e torneira de alavanca ou sensor. À direita, vista de cima da área de aproximação frontal para pessoa em cadeira de rodas, um círculo de 1,50 metro de diâmetro.',
    s,
  };
}

// ---------------------------------------------------------------------------
function sanitarioAcessorios() {
  const S = 250, PISO = 640, y = h => PISO - h * S;
  let s = ta(24, 56, 'Saboneteira, papeleira, toalheiro, cabide', { halo: false });
  s += ret(20, 80, 680, PISO - 80, C.parede) + piso(20, 700, PISO);
  // Alarme junto à bacia
  s += `<rect x="108" y="${y(0.78)}" width="38" height="${0.35 * S}" rx="5" fill="#fff" stroke="${C.linha}" stroke-width="3"/>`;
  s += `<path d="M 146 ${y(0.43)} H 220 Q 222 ${y(0.2)} 184 ${y(0.17)} L 180 ${PISO} H 146 Z" fill="#fff" stroke="${C.linha}" stroke-width="3"/>`;
  s += `<rect x="142" y="${y(0.43) - 9}" width="82" height="9" rx="4" fill="#d8d8d8" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += `<circle cx="60" cy="${y(0.4)}" r="15" fill="#dc2626" stroke="${C.linha}" stroke-width="3"/>`;
  s += seta({ x: 60, y: PISO }, { x: 60, y: y(0.4) + 15 }, { largura: 2.5, ponta: 10 });
  s += tb(30, 344, 'Alarme') + tb(30, 380, 'a 40 cm') + ta(30, 416, 'do piso');
  // Espelho
  const xe = 278, le = 150;
  s += `<rect x="${xe}" y="${y(1.8)}" width="${le}" height="${0.9 * S}" fill="#dbe7f3" stroke="${C.linha}" stroke-width="3"/>`;
  s += `<path d="M ${xe + 26} ${y(1.2)} L ${xe + 70} ${y(1.6)} M ${xe + 56} ${y(1.2)} L ${xe + 100} ${y(1.6)}" stroke="#fff" stroke-width="8"/>`;
  s += texto(xe + le / 2, y(1.8) - 12, 'Espelho', { tam: A, halo: false });
  s += seta({ x: xe - 18, y: PISO }, { x: xe - 18, y: y(0.9) }, { largura: 2.5, ponta: 11 }) + linha(xe - 28, y(0.9), xe, y(0.9), 1.6);
  s += vertical(xe - 36, y(0.45), 'máx. 0,90 m', A);
  s += seta({ x: xe + le + 18, y: PISO }, { x: xe + le + 18, y: y(1.8) }, { largura: 2.5, ponta: 11 }) + linha(xe + le, y(1.8), xe + le + 30, y(1.8), 1.6);
  s += vertical(xe + le + 38, y(0.95), 'mín. 1,80 m', A);
  s += texto(xe + le / 2, 470, 'Ou cobrindo', { tam: A, peso: 500, halo: false }) + texto(xe + le / 2, 506, 'de 0,50 m', { tam: A, halo: false }) + texto(xe + le / 2, 542, 'a 1,80 m', { tam: A, halo: false });
  // Acessórios
  const xa = 486, la = 200;
  s += tb(xa, 196, 'Acessórios') + tb(xa, 232, '0,80 m a') + tb(xa, 268, '1,20 m do piso');
  s += zona(xa, y(1.2), la, 0.4 * S);
  const my = (y(1.2) + y(0.8)) / 2;
  s += `<rect x="${xa + 12}" y="${my - 18}" width="36" height="36" rx="5" fill="#fff" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += `<circle cx="${xa + 74}" cy="${my}" r="18" fill="#fff" stroke="${C.linha}" stroke-width="2.5"/><circle cx="${xa + 74}" cy="${my}" r="6" fill="${C.patamar}" stroke="${C.linha}" stroke-width="2"/>`;
  s += `<rect x="${xa + 100}" y="${my - 6}" width="48" height="9" fill="#fff" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += `<path d="M ${xa + 172} ${my - 16} v 18 q 0 11 -12 9" fill="none" stroke="${C.linha}" stroke-width="4"/>`;
  s += ta(xa, 482, 'fora das áreas') + ta(xa, 518, 'de transferência') + ta(xa, 554, 'e manobra');
  return {
    nome: 'sanitario_acessorios', itens: [164, 165, 166],
    titulo: 'Alarme, espelho e acessórios',
    descricao: 'Parede de sanitário. O alarme de emergência fica a 40 centímetros do piso, próximo à bacia. O espelho tem borda inferior a no máximo 0,90 metro e superior a pelo menos 1,80 metro, ou cobre a faixa de 0,50 a 1,80 metro. Saboneteira, papeleira, toalheiro e cabide ficam entre 0,80 e 1,20 metro, fora das áreas de transferência e manobra.',
    s,
  };
}

// ---------------------------------------------------------------------------
function boxChuveiro() {
  let s = '';
  const S = 260, x0 = 100, y0 = 72, L = 0.9 * S, Al = 0.95 * S;
  s += ret(x0, y0, L, Al, C.patamar, 'style="stroke-width:6"');
  s += ret(x0, y0 + 28, 0.45 * S, 0.7 * S, '#fff') + texto(x0 + 0.225 * S, y0 + 28 + 0.35 * S + 10, 'Banco', { tam: A, halo: false });
  const rx = x0 + L - 40, ry = y0 + Al - 40;
  s += `<circle cx="${rx}" cy="${ry}" r="15" fill="#888" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += seta({ x: x0 + L - 80, y: y0 + 40 }, { x: rx - 8, y: ry - 17 }, { dupla: false, largura: 3, ponta: 13, cor: AZUL });
  s += seta({ x: x0, y: y0 - 14 }, { x: x0 + L, y: y0 - 14 }, { largura: 3, ponta: 12 });
  s += texto(x0 + L / 2, y0 - 26, 'mín. 0,90 m', { tam: A });
  s += seta({ x: x0 - 20, y: y0 + Al }, { x: x0 - 20, y: y0 }, { largura: 3, ponta: 12 });
  s += vertical(x0 - 44, y0 + Al / 2, 'mín. 0,95 m', A);
  s += tt(x0 + L + 26, 150, 'Até 2%') + ta(x0 + L + 26, 188, 'de inclinação') + ta(x0 + L + 26, 224, 'para o ralo');
  s += tb(x0 + L + 26, 276, 'Piso em nível,') + tb(x0 + L + 26, 312, 'sem soleira');
  // Parede do banco
  const T2 = 300, PISO = 670, y = h => PISO - h * T2;
  s += ret(20, 340, 680, PISO - 340, C.parede) + piso(20, 700, PISO, 30);
  const bx = 180, bl = 0.7 * T2, yb = y(0.46);
  s += ret(bx, yb, bl, 20, '#fff', 'rx="4"') + `<path d="M ${bx + 22} ${yb + 20} v 16 M ${bx + bl - 22} ${yb + 20} v 16" stroke="${C.linha}" stroke-width="6"/>`;
  s += linha(90, yb - 30, 90, 356, 10, AZUL, 'stroke-linecap="round"');
  s += tb(110, 392, 'Barra vertical') + ta(110, 428, 'na parede do banco');
  s += seta({ x: bx, y: yb - 14 }, { x: bx + bl, y: yb - 14 }, { largura: 3, ponta: 12 });
  s += texto(bx + bl / 2 + 26, yb - 26, 'Comprimento: mín. 0,70 m', { tam: A });
  s += seta({ x: bx + bl + 24, y: PISO }, { x: bx + bl + 24, y: yb }, { largura: 3, ponta: 12 }) + linha(bx + bl, yb, bx + bl + 36, yb, 1.6);
  s += tb(bx + bl + 38, 656, '0,46 m');
  s += texto(bx + bl / 2, 606, 'Banco articulado', { tam: A, peso: 500 }) + texto(bx + bl / 2, 642, 'ou removível', { tam: A, peso: 500 });
  s += texto(690, 384, 'Profundidade:', { tam: A, peso: 500, anc: 'end', halo: false }) + texto(690, 420, 'mín. 0,45 m', { tam: A, anc: 'end', halo: false });
  s += tb(516, 530, 'Barras a 90°') + ta(516, 566, 'na parede') + ta(516, 602, 'lateral');
  return {
    nome: 'box_chuveiro', itens: [168, 169],
    titulo: 'Box de chuveiro',
    descricao: 'Em cima, box visto de cima, com no mínimo 0,90 por 0,95 metro, piso em nível, sem soleira, e inclinação de até 2 por cento para o ralo. Embaixo, banco articulado ou removível a 0,46 metro do piso, com comprimento mínimo de 0,70 metro e profundidade mínima de 0,45 metro, barra vertical na parede do banco e barras a 90 graus na parede lateral.',
    s,
  };
}

// ---------------------------------------------------------------------------
function arquibancadaPcr() {
  let s = '';
  const x0 = 20, x1 = 700, y0 = 76, y1 = 276, n = 5, passo = (y1 - y0) / n;
  s += ret(x0, y0, x1 - x0, y1 - y0, C.patamar);
  for (let i = 1; i < n; i++) s += linha(x0, y0 + i * passo, x1, y0 + i * passo, 2);
  const lS = (x1 - x0) / 3;
  for (let j = 0; j < 3; j++) {
    const xs = x0 + j * lS, cx = xs + lS / 2;
    if (j) s += linha(xs, y0, xs, y1, 5);
    s += texto(cx, y0 - 16, `Setor ${j + 1}`, { tam: A, halo: false });
    s += `<rect x="${cx - 46}" y="${y1 - passo}" width="92" height="${passo}" fill="#bcd4ec" stroke="${AZUL}" stroke-width="3"/>`;
    s += simboloAcesso(cx - 17, y1 - passo + 3, 34);
    s += linha(cx, y1, cx, 306, 7, AZUL);
  }
  s += ta(x0 + 14, y0 + passo * 2 - 8, 'Assentos', { halo: false });
  const xr = x0 + lS / 2;
  s += linha(xr, 306, 590, 306, 7, AZUL);
  s += seta({ x: 590, y: 303 }, { x: 590, y: 392 }, { dupla: false, cor: AZUL, largura: 7, ponta: 20 });
  s += tb(150, 346, 'Rota acessível');
  s += ret(470, 394, 230, 150, C.branco);
  s += texto(585, 462, 'Vestiários', { tam: A, halo: false }) + texto(585, 498, 'e sanitários', { tam: A, halo: false });
  s += ret(20, 362, 430, 338, '#e4eee4');
  s += tt(44, 418, '2% do total', { halo: false }) + tt(44, 460, 'de assentos', { halo: false });
  s += tb(44, 510, 'ou 1 espaço, o que', { halo: false }) + tb(44, 546, 'for maior', { halo: false });
  s += ta(44, 596, 'em diferentes setores,', { halo: false }) + ta(44, 632, 'sinalizados com o SIA', { halo: false });
  s += ta(44, 684, 'Quadra', { cor: C.muted, halo: false });
  s += ta(470, 600, 'Vista de cima,', { cor: C.muted, halo: false }) + ta(470, 636, 'sem escala', { cor: C.muted, halo: false });
  return {
    nome: 'arquibancada_pcr', itens: [175],
    titulo: 'Espaços reservados na arquibancada',
    descricao: 'Arquibancada vista de cima, dividida em setores. Cada setor tem um espaço reservado para pessoa em cadeira de rodas, sinalizado com o Símbolo Internacional de Acesso, em 2 por cento do total de assentos ou 1 espaço, o que for maior. Uma rota acessível liga esses espaços aos vestiários e sanitários.',
    s,
  };
}

// ---------------------------------------------------------------------------
function bancoPatio() {
  const S = 330, PISO = 430, y = h => PISO - h * S;
  let s = piso(20, 700, PISO, 26);
  const x0 = 170, lA = 165, lB = 330;
  s += tb(24, 40, 'Largura de cada assento') + tt(24, 82, 'Entre 0,45 m e 0,50 m');
  s += zona(x0 - 16, y(0.45), lB + 32, 0.05 * S);
  s += ret(x0 + 6, y(0.88), lB - 12, 0.3 * S, '#d8d8d8', 'rx="8"') + texto(x0 + lB / 2, y(0.73) + 10, 'Encosto', { tam: A, halo: false });
  for (const dx of [0.14, 0.86]) s += `<rect x="${x0 + lB * dx - 8}" y="${y(0.58)}" width="16" height="${y(0.42) - y(0.58)}" fill="#777" stroke="${C.linha}" stroke-width="2"/>`;
  s += ret(x0, y(0.425), lB, 18, C.branco, 'rx="5"');
  for (const dx of [0.14, 0.86]) s += `<rect x="${x0 + lB * dx - 10}" y="${y(0.425) + 18}" width="20" height="${PISO - y(0.425) - 18}" fill="#777" stroke="${C.linha}" stroke-width="2"/>`;
  s += linha(x0 + lA, y(0.425), x0 + lA, y(0.425) + 18, 2);
  s += seta({ x: 112, y: PISO }, { x: 112, y: y(0.45) }, { largura: 3, ponta: 12 }) + linha(100, y(0.45), x0 - 16, y(0.45), 1.6);
  s += vertical(88, y(0.22), '0,45 m', A);
  s += seta({ x: 566, y: PISO }, { x: 566, y: y(0.4) }, { largura: 3, ponta: 12 }) + linha(x0 + lB + 16, y(0.4), 578, y(0.4), 1.6);
  s += vertical(592, y(0.2), '0,40 m', A);
  const yL = y(0.88) - 18;
  s += seta({ x: x0, y: yL }, { x: x0 + lA, y: yL }, { largura: 3, ponta: 12 });
  s += ta(24, 494, 'Altura do assento entre as duas medidas', { halo: false });
  // Módulo de referência, visto de cima
  const yb = 552, lm = 96, am = 144, xb = 30, xm = xb + 216;
  s += ret(xb, yb, 200, 76, C.branco, 'rx="6"') + `<rect x="${xb}" y="${yb}" width="200" height="14" rx="4" fill="#d8d8d8" stroke="${C.linha}" stroke-width="2"/>`;
  s += texto(xb + 100, yb + 56, 'Banco', { tam: A, halo: false });
  s += zona(xm, yb, lm, am) + cadeira(xm + lm / 2, yb + am / 2, 90, 0.56);
  s += seta({ x: xm, y: yb - 12 }, { x: xm + lm, y: yb - 12 }, { largura: 3, ponta: 10 });
  s += tb(xm + lm + 12, yb + 2, '0,80 m');
  s += seta({ x: xm + lm + 18, y: yb + am }, { x: xm + lm + 18, y: yb + 14 }, { largura: 3, ponta: 11 });
  s += tb(xm + lm + 30, yb + 86, '1,20 m');
  s += tb(490, 572, 'Módulo de') + tb(490, 608, 'referência') + ta(490, 652, 'ao lado de cada') + ta(490, 688, 'assento fixo');
  return {
    nome: 'banco_patio', itens: [177],
    titulo: 'Banco do pátio',
    descricao: 'Em cima, banco com encosto visto de frente, com altura do assento entre 0,40 e 0,45 metro e largura de cada assento entre 0,45 e 0,50 metro. Embaixo, vista de cima, com módulo de referência de 0,80 por 1,20 metro ao lado de cada assento fixo, para pessoa em cadeira de rodas.',
    s,
  };
}

// ---------------------------------------------------------------------------
function luminariaRota() {
  const PISO = 560, LUZ = '#ffd84d';
  let s = `<rect x="20" y="20" width="680" height="${PISO - 20}" fill="#3e4552" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += ret(20, PISO, 680, 140, C.piso);
  const lum = (x, ok, cone = true) => {
    let t = '';
    if (ok && cone) t += `<polygon points="${x - 34},94 ${x + 34},94 ${x + 118},${PISO} ${x - 118},${PISO}" fill="#fff3b0" opacity=".85"/>`;
    t += `<rect x="${x - 46}" y="64" width="92" height="30" rx="5" fill="${ok ? '#fff' : '#7a7a7a'}" stroke="${C.linha}" stroke-width="2.5"/>`;
    for (const dx of [-22, 22]) t += `<circle cx="${x + dx}" cy="79" r="10" fill="${ok ? LUZ : '#555'}" stroke="${C.linha}" stroke-width="2"/>`;
    return t;
  };
  s += lum(145, true) + lum(365, false) + xis(365, 79, 24);
  const xD = 505;
  s += ret(xD - 10, 220, 186, PISO - 220, '#8a8a8a') + ret(xD, 232, 166, PISO - 232, C.branco);
  s += `<rect x="${xD + 12}" y="400" width="142" height="15" rx="6" fill="#444"/>`;
  s += `<rect x="${xD - 10}" y="164" width="186" height="46" rx="4" fill="${VERDE}" stroke="${C.linha}" stroke-width="2"/>`;
  s += texto(xD + 83, 198, 'SAÍDA', { tam: A, cor: '#fff', halo: false });
  s += lum(xD + 83, true, false);
  s += texto(145, 300, 'Acesa,', { tam: A }) + texto(145, 336, 'visível e em', { tam: A }) + texto(145, 372, 'bom estado', { tam: A });
  s += texto(365, 150, 'Apagada ou', { tam: A, cor: '#fff', halo: false }) + texto(365, 186, 'com vidro', { tam: A, cor: '#fff', halo: false }) + texto(365, 222, 'quebrado', { tam: A, cor: '#fff', halo: false });
  s += texto(365, 270, 'Anote como', { tam: A, peso: 500, cor: '#fff', halo: false }) + texto(365, 306, 'problema', { tam: A, peso: 500, cor: '#fff', halo: false });
  s += texto(360, 602, 'Iluminar o caminho até a saída', { tam: A, halo: false });
  s += seta({ x: 50, y: 632 }, { x: 670, y: 632 }, { dupla: false, cor: AZUL, largura: 8, ponta: 24 });
  s += texto(360, 682, 'Confira corredores, escadas e saídas', { tam: A, peso: 500, halo: false });
  return {
    nome: 'luminaria_rota', itens: [178],
    titulo: 'Luminárias na rota de fuga',
    descricao: 'Corredor no escuro, visto de lado, até uma porta de saída. As luminárias de emergência estão acesas, visíveis e em bom estado, e iluminam o caminho até a saída. Uma delas está apagada ou com vidro quebrado, o que deve ser anotado como problema. A conferência vale para corredores, escadas e saídas.',
    s,
  };
}

// ---------------------------------------------------------------------------
function saidaAntipanico() {
  const S = 220, PISO = 650, y = h => PISO - h * S;
  let s = ret(20, 100, 280, PISO - 100, C.parede) + piso(20, 300, PISO);
  const x0 = 72, l = 176, yT = y(2.1);
  s += ret(x0 - 12, yT - 12, l + 24, PISO - yT + 12, '#8a8a8a') + ret(x0, yT, l, PISO - yT, C.branco);
  s += `<rect x="${x0 + 12}" y="${y(1.0) - 8}" width="${l - 24}" height="16" rx="6" fill="#444" stroke="${C.linha}" stroke-width="2"/>`;
  s += `<rect x="${x0 - 2}" y="${yT - 62}" width="${l + 4}" height="44" rx="4" fill="${VERDE}" stroke="${C.linha}" stroke-width="2"/>`;
  s += texto(x0 + l / 2, yT - 30, 'SAÍDA', { tam: A, cor: '#fff', halo: false });
  s += tb(24, 44, 'Barra antipânico') + ta(24, 80, 'abre empurrando');
  s += chamada({ x: x0 + 150, y: y(1.0) }, 268, 92);
  s += texto(x0 + l / 2, PISO - 76, 'Vão livre', { tam: A, peso: 500, halo: false }) + texto(x0 + l / 2, PISO - 40, 'mín. 0,80 m', { tam: A, halo: false });
  s += seta({ x: x0, y: PISO - 20 }, { x: x0 + l, y: PISO - 20 }, { largura: 3, ponta: 12 });
  const secao = (y0, correto) => {
    const yF = y0 + 262, yA = yF - 58, xE = 336, xD = 510, xS = 684;
    let t = quadro(320, y0, 380, 330, correto ? 'Correto' : 'Incorreto', correto ? VERDE : VERMELHO);
    const xR = correto ? xD + 110 : xD;
    t += `<polygon points="${xE},${yA} ${xD},${yA} ${xR},${yF} ${xS},${yF} ${xS},${yF + 46} ${xE},${yF + 46}" fill="${C.piso}" stroke="${C.linha}" stroke-width="2.5"/>`;
    t += `<rect x="${xD - 70}" y="${y0 + 120}" width="10" height="${yA - y0 - 120}" fill="#8a8a8a" stroke="${C.linha}" stroke-width="2"/>`;
    t += ta(xE + 2, y0 + 170, 'Porta');
    if (correto) {
      t += `<polyline points="${xE + 14},${yA - 22} ${xD},${yA - 22} ${xR},${yF - 22} ${xS - 20},${yF - 22}" fill="none" stroke="${AZUL}" stroke-width="7"/>`;
      t += seta({ x: xS - 50, y: yF - 22 }, { x: xS - 12, y: yF - 22 }, { dupla: false, largura: 7, cor: AZUL, ponta: 20 });
      t += tb(xE + 2, y0 + 96, 'Rampa junto ao degrau');
    } else {
      t += linha(xE + 14, yA - 22, xD - 22, yA - 22, 7, AZUL) + xis(xD - 10, yA - 22, 17);
      t += tb(xE + 2, y0 + 96, 'Degrau sem rampa');
    }
    return t;
  };
  s += secao(20, false) + secao(370, true);
  return {
    nome: 'saida_antipanico', itens: [179],
    titulo: 'Saída de emergência acessível',
    descricao: 'À esquerda, porta de saída de emergência vista de frente, com barra antipânico e vão livre mínimo de 0,80 metro. À direita, dois cortes: um degrau isolado sem rampa bloqueia a saída, o que é incorreto; com rampa junto ao degrau, o percurso fica contínuo, o que é correto.',
    s,
  };
}

// ---------------------------------------------------------------------------
function areaResgate() {
  let s = '';
  s += ret(20, 370, 680, 100, C.patamar);
  s += texto(360, 408, 'Fluxo principal de circulação', { tam: A });
  s += seta({ x: 50, y: 446 }, { x: 670, y: 446 }, { dupla: false, cor: AZUL, largura: 7, ponta: 20 });
  s += ret(450, 60, 250, 310, C.piso);
  for (let y = 92; y < 370; y += 32) s += linha(450, y, 700, y, 2);
  s += texto(575, 200, 'Escada de', { tam: A }) + texto(575, 236, 'emergência', { tam: A });
  s += zona(60, 130, 390, 240);
  s += texto(255, 176, 'Área de resgate', { tam: T, halo: false }) + texto(255, 212, 'fora do fluxo principal', { tam: A, peso: 500, halo: false });
  s += `<rect x="150" y="226" width="210" height="136" fill="#fff" stroke="${C.linha}" stroke-width="2.5" rx="6"/>`;
  s += cadeira(255, 280, 90, 0.5) + texto(255, 352, 'Espaço PCR', { tam: A, halo: false });
  s += `<rect x="90" y="122" width="34" height="16" fill="#333" stroke="${C.linha}" stroke-width="2"/>`;
  s += tb(24, 50, 'Intercomunicador');
  s += chamada({ x: 107, y: 122 }, 107, 60);
  s += tb(24, 534, 'Ao menos 1 espaço') + ta(24, 570, 'por escada ou elevador') + ta(24, 606, 'de emergência');
  s += ta(24, 680, 'Vista de cima', { cor: C.muted, halo: false });
  // Altura do intercomunicador
  const S = 150, PISO = 680, y = h => PISO - h * S;
  s += ret(420, 484, 280, PISO - 484, C.parede) + ret(420, PISO, 280, 20, C.piso);
  const zx = 500, zl = 110;
  s += zona(zx, y(1.2), zl, 0.4 * S);
  s += `<rect x="${zx + 34}" y="${y(1.0) - 26}" width="42" height="52" rx="5" fill="#333" stroke="${C.linha}" stroke-width="2"/><circle cx="${zx + 55}" cy="${y(1.0) + 12}" r="7" fill="#fff"/>`;
  for (let i = 0; i < 3; i++) s += linha(zx + 42, y(1.0) - 18 + i * 7, zx + 68, y(1.0) - 18 + i * 7, 2, '#fff');
  s += seta({ x: zx - 20, y: PISO }, { x: zx - 20, y: y(0.8) }, { largura: 3, ponta: 11 }) + linha(zx - 32, y(0.8), zx, y(0.8), 1.6);
  s += vertical(zx - 44, (PISO + y(0.8)) / 2, '0,80 m', A);
  s += seta({ x: zx + zl + 22, y: PISO }, { x: zx + zl + 22, y: y(1.2) }, { largura: 3, ponta: 11 }) + linha(zx + zl, y(1.2), zx + zl + 34, y(1.2), 1.6);
  s += vertical(zx + zl + 52, (PISO + y(1.2)) / 2, '1,20 m', A);
  return {
    nome: 'area_resgate', itens: [180],
    titulo: 'Área de resgate',
    descricao: 'Em cima, vista de cima de uma área de resgate ao lado da escada de emergência, fora do fluxo principal de circulação, com ao menos um espaço para pessoa em cadeira de rodas. Embaixo, o intercomunicador na parede, entre 0,80 e 1,20 metro do piso.',
    s,
  };
}

// ---------------------------------------------------------------------------
function mapaTatil() {
  const PISO = 400;
  let s = ret(20, 30, 200, PISO - 30, C.parede) + piso(20, 220, PISO, 22);
  s += ret(36, 150, 100, PISO - 150, C.branco) + `<circle cx="122" cy="290" r="7" fill="#444"/>`;
  const xm = 150, ym = 230, lm = 62, am = 46;
  s += `<rect x="${xm}" y="${ym}" width="${lm}" height="${am}" rx="3" fill="#fff" stroke="${C.linha}" stroke-width="3"/><path d="M ${xm + 12} ${ym + 34} H ${xm + 36} V ${ym + 12} H ${xm + 52}" fill="none" stroke="${AZUL}" stroke-width="3"/>`;
  s += texto(120, 72, 'Parede', { tam: A, halo: false }) + texto(120, 108, 'da sala', { tam: A, halo: false });
  const xP = 244, yP = 30, lP = 456, aP = 370, k = 0.92;
  s += linha(xm + lm, ym, xP, yP + 40, 1.8) + linha(xm + lm, ym + am, xP, yP + aP - 40, 1.8);
  s += `<rect x="${xP}" y="${yP}" width="${lP}" height="${aP}" fill="#eef1f4" stroke="${C.linha}" stroke-width="7"/>`;
  const parede = d => `<path d="${d}" fill="none" stroke="${C.linha}" stroke-width="7"/>`;
  const px = v => xP + v * k, py = v => yP + v * k;
  s += parede(`M ${xP} ${py(150)} H ${px(190)} M ${px(280)} ${py(150)} H ${xP + lP}`);
  s += parede(`M ${xP} ${py(260)} H ${px(330)} M ${px(420)} ${py(260)} H ${xP + lP}`);
  s += parede(`M ${px(170)} ${yP} V ${py(150)} M ${px(340)} ${yP} V ${py(150)}`);
  s += parede(`M ${px(250)} ${py(260)} V ${yP + aP}`);
  const rota = [[85, 80], [235, 80], [235, 205], [375, 205], [375, 330], [470, 330]].map(([a, b]) => `${px(a)},${py(b)}`).join(' ');
  s += `<polyline points="${rota}" fill="none" stroke="${AZUL}" stroke-width="8" stroke-dasharray="2 16" stroke-linecap="round"/>`;
  s += seta({ x: px(440), y: py(330) }, { x: xP + lP - 4, y: py(330) }, { dupla: false, cor: AZUL, largura: 6, ponta: 20 });
  s += `<circle cx="${px(85)}" cy="${py(80)}" r="17" fill="${VERMELHO}" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += `<rect x="${xP + lP - 104}" y="${yP + aP - 50}" width="96" height="42" rx="4" fill="${VERDE}"/>` + texto(xP + lP - 56, yP + aP - 18, 'Saída', { tam: A, cor: '#fff', halo: false });
  // Legenda
  s += `<circle cx="42" cy="454" r="15" fill="${VERMELHO}" stroke="${C.linha}" stroke-width="2.5"/>` + tb(70, 465, 'Você está aqui');
  s += tb(24, 516, 'Visual:') + ta(140, 516, 'cores e textos de leitura fácil');
  s += tb(24, 562, 'Tátil:') + ta(140, 562, 'paredes e rota em relevo');
  // Braille da palavra "saída": s (2,3,4), a (1), í (3,4), d (1,4,5), a (1)
  s += tb(24, 612, 'Braille:');
  [[2, 3, 4], [1], [3, 4], [1, 4, 5], [1]].forEach((p, i) => { s += cela(150 + i * 40, 584, p, 15, 5.5, C.cota); });
  s += ta(370, 612, '"saída"');
  s += tb(24, 664, 'Em salas, laboratórios e auditório');
  s += ta(24, 702, 'Planta ilustrativa', { cor: C.muted, halo: false });
  return {
    nome: 'mapa_tatil', itens: [182],
    titulo: 'Mapa tátil da rota de fuga',
    descricao: 'À esquerda, parede de uma sala com um mapa ao lado da porta. À direita, o mapa ampliado mostra a rota de fuga até a saída, em formato visual, com cores e textos, e tátil, com paredes e rota em relevo e Braille. O mapa deve existir em salas de aula, laboratórios e auditório.',
    s,
  };
}

gerarLote([
  sanitarioAreaManobra, baciaAlturaAssento, baciaBarras, lavatorio, sanitarioAcessorios, boxChuveiro,
  arquibancadaPcr, bancoPatio, luminariaRota, saidaAntipanico, areaResgate, mapaTatil,
]);
