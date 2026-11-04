// Lote 3: 12 imagens de prioridade 2. As medidas vêm das perguntas em `itens`.
import { C, texto, seta, documento } from './lib.mjs';
import { AZUL, ZONA, linhaFina, ret, piso, cotaV, cotaH, chamada, cadeira } from './lote1.mjs';

const VERDE = '#15703a', VERMELHO = '#b91c1c', LARANJA = '#d97706';
const ZONA_L = 'rgba(217,119,6,.18)';

const zona = (x, y, l, a, fill = ZONA, cor = AZUL) =>
  `<rect x="${x}" y="${y}" width="${l}" height="${a}" fill="${fill}" stroke="${cor}" stroke-width="3" stroke-dasharray="11 8"/>`;

// ---------------------------------------------------------------------------
function rotaAcessivel() {
  let s = '';
  // Rua, terreno e corredor
  s += `<rect x="30" y="30" width="1316" height="620" fill="${C.parede}" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += `<rect x="30" y="650" width="1316" height="90" fill="#8a8a8a" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += texto(760, 704, 'Entrada na via de menor fluxo de veículos', { tam: 25 });
  s += `<rect x="240" y="270" width="900" height="120" fill="${C.patamar}" stroke="${C.linha}" stroke-width="2.5"/>`;

  const sala = (x, y, l, a, linhas, destaque = false) => {
    let t = ret(x, y, l, a, destaque ? 'rgba(11,87,164,.16)' : C.branco, 'rx="6"');
    linhas.forEach((txt, i) => {
      t += texto(x + l / 2, y + a / 2 + 9 + (i - (linhas.length - 1) / 2) * 30, txt, { tam: 23, peso: i === 0 ? 700 : 500, halo: false });
    });
    return t;
  };
  const topo = [[260, ['Salas e', 'laboratórios']], [480, ['Biblioteca']], [700, ['Auditório']], [920, ['Outro pavimento', 'escada + rampa', 'ou elevador']]];
  const baixo = [[260, ['Administração']], [480, ['Refeitório']], [700, ['Sanitário', 'acessível']]];
  for (const [x, l] of topo) s += sala(x, 80, 200, 190, l);
  for (const [x, l] of baixo) s += sala(x, 390, 200, 150, l, l[0] === 'Sanitário');
  s += sala(1160, 150, 170, 360, ['Quadra', 'e pátio']);

  // Rota principal e acessos
  s += `<path d="M 150 650 V 330 H 1160" fill="none" stroke="${AZUL}" stroke-width="10" stroke-linejoin="round"/>`;
  s += seta({ x: 1120, y: 330 }, { x: 1160, y: 330 }, { cor: AZUL, dupla: false, largura: 10, ponta: 24 });
  for (const [x] of topo) s += `<line x1="${x + 100}" y1="330" x2="${x + 100}" y2="270" stroke="${AZUL}" stroke-width="7"/>`;
  for (const [x] of baixo) s += `<line x1="${x + 100}" y1="330" x2="${x + 100}" y2="390" stroke="${AZUL}" stroke-width="7"/>`;

  // Portão e desnível com rampa
  s += `<rect x="108" y="636" width="84" height="28" fill="#fff" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += texto(150, 658, 'Portão', { tam: 19, halo: false });
  s += ret(44, 80, 190, 170, C.branco, 'rx="6"');
  s += `<rect x="146" y="136" width="70" height="54" fill="${C.piso}" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += `<polygon points="62,190 146,190 146,136" fill="rgba(11,87,164,.28)" stroke="${AZUL}" stroke-width="3"/>`;
  s += texto(139, 114, 'Degrau só com', { tam: 20, halo: false });
  s += texto(139, 214, 'rampa ou equipamento', { tam: 17, peso: 500, halo: false });
  s += texto(139, 236, 'ao lado', { tam: 17, peso: 500, halo: false });

  s += chamada({ x: 800, y: 540 }, 930, 586, [['Até 50 m de qualquer ponto', 700]], 924, 578);
  s += texto(245, 118 - 66, 'Rota contínua, sem degraus isolados e sem barreiras, até todos os ambientes', { tam: 23, peso: 600, anc: 'start', halo: false });

  return {
    nome: 'rota_acessivel',
    itens: [1, 12, 54, 91, 106, 117, 129, 138, 149, 150, 170, 173],
    derivados: [],
    svg: documento({
      titulo: 'Rota acessível na escola',
      descricao: 'Planta esquemática de uma escola. A entrada fica na via de menor fluxo de veículos. Uma rota contínua, sem degraus isolados, liga o portão às salas, à biblioteca, ao auditório, à administração, ao refeitório, ao sanitário acessível e à quadra. Degraus precisam de rampa ou equipamento ao lado, e outros pavimentos, de pelo menos duas formas de circulação. O sanitário acessível fica a até 50 metros de qualquer ponto.',
      conteudo: s,
    }),
  };
}

// ---------------------------------------------------------------------------
function pisoFirmeRegular() {
  const L = 420, A = 330, cols = [40, 478, 916], lins = [30, 386];
  const quadro = (x, y, titulo, cor, desenho) => {
    let t = `<rect x="${x}" y="${y}" width="${L}" height="${A}" rx="10" fill="#fff" stroke="${C.linha}" stroke-width="2.5"/>`;
    t += `<rect x="${x + 16}" y="${y + 70}" width="${L - 32}" height="${A - 86}" fill="${C.patamar}" stroke="${C.linha}" stroke-width="2"/>`;
    for (let i = 1; i < 5; i++) t += linhaFina(x + 16 + (L - 32) * i / 5, y + 70, x + 16 + (L - 32) * i / 5, y + A - 16, 1.4, '#9a9a9a');
    for (let i = 1; i < 3; i++) t += linhaFina(x + 16, y + 70 + (A - 86) * i / 3, x + L - 16, y + 70 + (A - 86) * i / 3, 1.4, '#9a9a9a');
    t += desenho(x + 16, y + 70, L - 32, A - 86);
    t += `<rect x="${x}" y="${y}" width="${L}" height="56" rx="10" fill="${cor}"/>`;
    t += texto(x + L / 2, y + 38, titulo, { tam: 25, cor: '#fff', halo: false });
    return t;
  };
  let s = '';
  s += quadro(cols[0], lins[0], 'Adequado: firme e regular', VERDE, () => '');
  s += quadro(cols[1], lins[0], 'Buracos e peças quebradas', VERMELHO, (x, y, l, a) =>
    `<path d="M ${x + 110} ${y + 80} q 50 -40 100 -8 q 56 22 26 66 q -60 52 -120 16 q -40 -40 -6 -74 Z" fill="#555" stroke="${C.linha}" stroke-width="2.5"/>
     <path d="M ${x + 280} ${y + 60} l 30 46 l -24 30 l 40 44" fill="none" stroke="${C.linha}" stroke-width="3"/>`);
  s += quadro(cols[2], lins[0], 'Emendas e desníveis', VERMELHO, (x, y, l, a) =>
    `<polygon points="${x + 77},${y + 81} ${x + 232},${y + 81} ${x + 246},${y + 66} ${x + 91},${y + 66}" fill="#aaa" stroke="${C.linha}" stroke-width="2.5"/>
     <rect x="${x}" y="${y + 150}" width="${l}" height="14" fill="#555"/>`);
  s += quadro(cols[0], lins[1], 'Tapete solto', VERMELHO, (x, y, l, a) =>
    `<path d="M ${x + 70} ${y + 50} H ${x + 310} V ${y + 180} L ${x + 250} ${y + 200} L ${x + 70} ${y + 180} Z" fill="#b5651d" stroke="${C.linha}" stroke-width="2.5"/>
     <path d="M ${x + 310} ${y + 180} L ${x + 250} ${y + 200} L ${x + 276} ${y + 150} Z" fill="#e0a56a" stroke="${C.linha}" stroke-width="2.5"/>`);
  s += quadro(cols[1], lins[1], 'Trepidante para rodas', VERMELHO, (x, y, l, a) => {
    let t = `<rect x="${x}" y="${y}" width="${l}" height="${a}" fill="#c4c4c4"/>`;
    for (let i = 0; i < 9; i++) for (let j = 0; j < 5; j++) {
      t += `<ellipse cx="${x + 24 + i * 41 + (j % 2) * 12}" cy="${y + 28 + j * 46}" rx="19" ry="20" fill="#8d8d8d" stroke="${C.linha}" stroke-width="2"/>`;
    }
    return t;
  });
  s += quadro(cols[2], lins[1], 'Escorregadio quando molhado', VERMELHO, (x, y, l, a) => {
    let t = `<path d="M ${x + 60} ${y + 90} q 70 -60 170 -22 q 110 10 90 80 q -60 80 -190 56 q -110 -30 -70 -114 Z" fill="rgba(11,87,164,.34)" stroke="${AZUL}" stroke-width="2.5"/>`;
    for (const [dx, dy] of [[130, 100], [240, 80], [200, 160], [90, 150]]) {
      t += `<path d="M ${x + dx} ${y + dy - 18} q 16 24 0 34 q -16 -10 0 -34 Z" fill="${AZUL}"/>`;
    }
    return t;
  });

  return {
    nome: 'piso_firme_regular',
    itens: [3, 20, 34, 44, 55, 65, 96, 108, 136, 148, 154, 171],
    derivados: [],
    svg: documento({
      titulo: 'Piso firme e regular',
      descricao: 'Seis quadros de piso visto de cima. O piso adequado é firme e regular. Os problemas são buracos e peças quebradas, emendas e desníveis, tapete solto, superfície trepidante para rodas e piso escorregadio quando molhado.',
      conteudo: s,
    }),
  };
}

// ---------------------------------------------------------------------------
function corrimaoIntermediario() {
  const S = 150, X0 = 150, Y0 = 110, LARG = 2.4 * S, SEG = 420, PAT = 240;
  const X1 = X0 + SEG, X2 = X1 + PAT, X3 = X2 + SEG, YC = Y0 + LARG / 2, GAP = 0.8 * S;
  let s = texto(40, 60, 'Vista de cima: rampa ou escada com 2,40 m ou mais de largura', { tam: 25, anc: 'start', halo: false });
  s += `<rect x="${X0}" y="${Y0}" width="${SEG}" height="${LARG}" fill="${C.piso}" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += `<rect x="${X1}" y="${Y0}" width="${PAT}" height="${LARG}" fill="${C.patamar}" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += `<rect x="${X2}" y="${Y0}" width="${SEG}" height="${LARG}" fill="${C.piso}" stroke="${C.linha}" stroke-width="2.5"/>`;

  const barra = (x1, y, x2) => `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${AZUL}" stroke-width="9" stroke-linecap="round"/>`;
  s += barra(X0, Y0 + 7, X3) + barra(X0, Y0 + LARG - 7, X3);
  const meio = (X1 + X2) / 2;
  s += barra(X0, YC, meio - GAP / 2) + barra(meio + GAP / 2, YC, X3);

  // Largura total e faixas
  s += cotaV(X0 - 40, Y0 + LARG, Y0, '2,40 m', { ext: 30 });
  s += cotaV(X0 + 150, YC - 8, Y0 + 14, 'mín. 1,20 m', { lado: 'dir', tam: 25 });
  s += cotaV(X0 + 150, Y0 + LARG - 14, YC + 8, 'mín. 1,20 m', { lado: 'dir', tam: 25 });

  // Interrupção no patamar
  s += seta({ x: meio - GAP / 2, y: YC + 34 }, { x: meio + GAP / 2, y: YC + 34 }, { ponta: 10, largura: 2.5 });
  s += texto(meio, YC + 72, 'mín. 0,80 m', { tam: 24 });
  s += seta({ x: X1, y: Y0 + LARG + 30 }, { x: X2, y: Y0 + LARG + 30 }, { ponta: 10, largura: 2.5 });
  s += linhaFina(X1, Y0 + LARG, X1, Y0 + LARG + 42) + linhaFina(X2, Y0 + LARG, X2, Y0 + LARG + 42);
  s += texto(meio, Y0 + LARG + 66, 'Patamar acima de 1,40 m', { tam: 24 });
  s += texto(meio, Y0 + LARG + 96, 'Corrimão intermediário interrompido', { tam: 21, peso: 500 });

  // Altura do corrimão duplo
  s += `<rect x="100" y="600" width="1180" height="120" rx="8" fill="#fff" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += texto(690, 648, 'Corrimão intermediário duplo, nas alturas de 0,92 m e 0,70 m', { tam: 25, halo: false });
  s += texto(690, 688, 'Alternativa: corrimãos em ambos os lados, mantendo a faixa de passagem', { tam: 21, peso: 500, halo: false });

  return {
    nome: 'corrimao_intermediario',
    itens: [25, 26, 74, 75],
    derivados: [],
    svg: documento({
      titulo: 'Corrimão intermediário',
      descricao: 'Vista de cima de rampa ou escada com 2,40 metros ou mais de largura. Um corrimão intermediário duplo, nas alturas de 0,92 e 0,70 metro, deixa faixa mínima de 1,20 metro de cada lado. Em patamares com mais de 1,40 metro, o corrimão é interrompido, com espaçamento mínimo de 0,80 metro.',
      conteudo: s,
    }),
  };
}

// ---------------------------------------------------------------------------
function sanitarioAcessorios() {
  const S = 340, PISO = 690, y = h => PISO - h * S;
  let s = `<rect x="30" y="${y(1.95)}" width="1316" height="${1.95 * S}" fill="${C.parede}" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += piso(30, 1346, PISO);

  // Alarme junto à bacia
  s += `<rect x="150" y="${y(0.78)}" width="56" height="${0.35 * S}" rx="5" fill="#fff" stroke="${C.linha}" stroke-width="3"/>`;
  s += `<path d="M 206 ${y(0.43)} H 328 Q 330 ${y(0.2)} 268 ${y(0.17)} L 262 ${PISO} H 206 Z" fill="#fff" stroke="${C.linha}" stroke-width="3"/>`;
  s += `<rect x="202" y="${y(0.43) - 10}" width="130" height="10" rx="4" fill="#d8d8d8" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += texto(268, y(0.43) - 22, 'Bacia', { tam: 21, peso: 600, halo: false });
  s += `<circle cx="80" cy="${y(0.4)}" r="17" fill="#dc2626" stroke="${C.linha}" stroke-width="3"/>`;
  s += seta({ x: 80, y: PISO }, { x: 80, y: y(0.4) + 17 }, { largura: 2.5, ponta: 10 });
  s += texto(50, y(0.98), 'Alarme', { tam: 25, anc: 'start' });
  s += texto(50, y(0.98) + 28, 'a 40 cm do piso', { tam: 21, peso: 500, anc: 'start' });

  // Espelho
  const xe = 470, le = 250;
  s += `<rect x="${xe}" y="${y(1.8)}" width="${le}" height="${0.9 * S}" fill="#dbe7f3" stroke="${C.linha}" stroke-width="3"/>`;
  s += `<path d="M ${xe + 40} ${y(1.2)} L ${xe + 110} ${y(1.6)} M ${xe + 86} ${y(1.2)} L ${xe + 156} ${y(1.6)}" stroke="#fff" stroke-width="10"/>`;
  s += texto(xe + le / 2, y(1.8) - 12, 'Espelho', { tam: 25, halo: false });
  s += seta({ x: xe - 30, y: PISO }, { x: xe - 30, y: y(0.9) }, { largura: 2.5, ponta: 11 });
  s += linhaFina(xe - 44, y(0.9), xe, y(0.9));
  s += texto(xe - 42, y(0.45), 'máx.', { tam: 20, peso: 500, anc: 'end' });
  s += texto(xe - 42, y(0.45) + 28, '0,90 m', { tam: 24, anc: 'end' });
  s += seta({ x: xe + le + 30, y: PISO }, { x: xe + le + 30, y: y(1.8) }, { largura: 2.5, ponta: 11 });
  s += linhaFina(xe + le, y(1.8), xe + le + 44, y(1.8));
  s += texto(xe + le + 44, y(0.95), 'mín.', { tam: 20, peso: 500, anc: 'start' });
  s += texto(xe + le + 44, y(0.95) + 28, '1,80 m', { tam: 24, anc: 'start' });
  s += texto(xe + le / 2, y(0.55), 'Ou cobrindo a faixa', { tam: 20, peso: 500, halo: false });
  s += texto(xe + le / 2, y(0.55) + 28, 'de 0,50 m a 1,80 m', { tam: 21, halo: false });

  // Acessórios
  const xa = 930, la = 390;
  s += zona(xa, y(1.2), la, 0.4 * S);
  s += texto(xa + la / 2, y(1.2) - 78, 'Acessórios', { tam: 25, halo: false });
  s += texto(xa + la / 2, y(1.2) - 46, 'Entre 0,80 m e 1,20 m do piso', { tam: 23, halo: false });
  s += texto(xa + la / 2, y(1.2) - 16, 'Fora das áreas de transferência e manobra', { tam: 19, peso: 500, halo: false });
  const my = (y(1.2) + y(0.8)) / 2;
  s += `<rect x="${xa + 28}" y="${my - 26}" width="52" height="52" rx="6" fill="#fff" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += `<circle cx="${xa + 148}" cy="${my}" r="26" fill="#fff" stroke="${C.linha}" stroke-width="2.5"/><circle cx="${xa + 148}" cy="${my}" r="9" fill="${C.patamar}" stroke="${C.linha}" stroke-width="2"/>`;
  s += `<rect x="${xa + 206}" y="${my - 8}" width="80" height="10" fill="#fff" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += `<path d="M ${xa + 342} ${my - 20} v 22 q 0 14 -16 12" fill="none" stroke="${C.linha}" stroke-width="5"/>`;
  s += texto(xa + la / 2, y(0.8) + 36, 'Saboneteira, papeleira, toalheiro, cabide', { tam: 19, peso: 500, halo: false });

  return {
    nome: 'sanitario_acessorios',
    itens: [164, 165, 166],
    derivados: [],
    svg: documento({
      titulo: 'Alarme, espelho e acessórios',
      descricao: 'Parede de sanitário. O alarme de emergência fica a 40 centímetros do piso, próximo à bacia. O espelho tem borda inferior a no máximo 0,90 metro e superior a pelo menos 1,80 metro, ou cobre a faixa de 0,50 a 1,80 metro. Saboneteira, papeleira, toalheiro e cabide ficam entre 0,80 e 1,20 metro, fora das áreas de transferência e manobra.',
      conteudo: s,
    }),
  };
}

// ---------------------------------------------------------------------------
function escadaLarguraPatamar() {
  const S = 170, W = 1.2 * S;
  const degraus = (x, y, l, a, vertical = false) => {
    let t = `<rect x="${x}" y="${y}" width="${l}" height="${a}" fill="${C.piso}" stroke="${C.linha}" stroke-width="2.5"/>`;
    if (vertical) for (let d = 36; d < a; d += 36) t += linhaFina(x, y + d, x + l, y + d, 2);
    else for (let d = 36; d < l; d += 36) t += linhaFina(x + d, y, x + d, y + a, 2);
    return t;
  };
  let s = '';

  // Lances em linha
  const y1 = 270;
  s += texto(40, 62, 'Vistas de cima', { tam: 25, anc: 'start', halo: false });
  s += texto(332, y1 - 88, 'Lances em linha', { tam: 26, halo: false });
  s += degraus(50, y1, 180, W) + `<rect x="230" y="${y1}" width="${W}" height="${W}" fill="${ZONA}" stroke="${AZUL}" stroke-width="3" stroke-dasharray="11 8"/>` + degraus(230 + W, y1, 180, W);
  s += seta({ x: 230, y: y1 - 22 }, { x: 230 + W, y: y1 - 22 }, { largura: 3 });
  s += texto(230 + W / 2, y1 - 34, 'Patamar: mín. 1,20 m', { tam: 23 });
  s += seta({ x: 636, y: y1 + W }, { x: 636, y: y1 }, { largura: 3 });
  s += texto(650, y1 + W / 2 - 20, 'Largura', { tam: 22, anc: 'start' });
  s += texto(650, y1 + W / 2 + 8, 'mín.', { tam: 20, peso: 500, anc: 'start' });
  s += texto(650, y1 + W / 2 + 36, '1,20 m', { tam: 24, anc: 'start' });
  s += seta({ x: 90, y: y1 + W / 2 }, { x: 196, y: y1 + W / 2 }, { dupla: false, largura: 4, ponta: 15 });
  s += seta({ x: 448, y: y1 + W / 2 }, { x: 588, y: y1 + W / 2 }, { dupla: false, largura: 4, ponta: 15 });

  // Mudança de direção
  const px = 980, py = 170;
  s += texto(1000, py - 48, 'Mudança de direção', { tam: 26, halo: false });
  s += degraus(px - 216, py, 216, W);
  s += `<rect x="${px}" y="${py}" width="${W}" height="${W}" fill="${ZONA}" stroke="${AZUL}" stroke-width="3" stroke-dasharray="11 8"/>`;
  s += degraus(px, py + W, W, 216, true);
  s += seta({ x: px - 190, y: py + W / 2 }, { x: px - 40, y: py + W / 2 }, { dupla: false, largura: 4, ponta: 15 });
  s += seta({ x: px + W / 2, y: py + W + 30 }, { x: px + W / 2, y: py + W + 180 }, { dupla: false, largura: 4, ponta: 15 });
  s += texto(px + W / 2, py + W / 2 - 8, 'Patamar', { tam: 24, halo: false });
  s += texto(px + W / 2, py + W / 2 + 22, 'igual à largura', { tam: 19, peso: 500, halo: false });
  s += seta({ x: px + W + 26, y: py + W }, { x: px + W + 26, y: py }, { largura: 3 });
  s += texto(px + W + 40, py + W / 2 + 8, 'Largura', { tam: 22, anc: 'start' });
  s += seta({ x: px, y: py + W + 240 }, { x: px + W, y: py + W + 240 }, { largura: 3 });
  s += texto(px + W / 2, py + W + 278, 'Largura: mín. 1,20 m', { tam: 24 });

  return {
    nome: 'escada_largura_patamar',
    itens: [13, 56, 58],
    derivados: [],
    svg: documento({
      titulo: 'Largura da escada e patamares',
      descricao: 'Vistas de cima de escadas. A largura mínima é de 1,20 metro. Entre lances em linha, o patamar tem comprimento mínimo de 1,20 metro. Na mudança de direção, o patamar tem dimensões iguais à largura da escada.',
      conteudo: s,
    }),
  };
}

// ---------------------------------------------------------------------------
function alturaLivre() {
  const S = 260, PISO = 680, y = h => PISO - h * S;
  let s = piso(30, 1346, PISO);
  s += zona(180, y(2.1), 1000, 2.1 * S);
  s += cotaV(130, PISO, y(2.1), '2,10 m', { tam: 27, ext: 50 });
  s += texto(400, y(2.1) + 44, 'Altura livre mínima', { tam: 25, halo: false });
  s += texto(400, y(2.1) + 76, 'em todo o caminho', { tam: 25, halo: false });

  // Pessoa e cadeira, em escala aproximada
  const px = 290;
  s += `<circle cx="${px}" cy="${y(1.58)}" r="23" fill="#555"/><rect x="${px - 24}" y="${y(1.42)}" width="48" height="${0.68 * S}" rx="16" fill="#555"/><rect x="${px - 20}" y="${y(0.78)}" width="17" height="${0.78 * S}" fill="#555"/><rect x="${px + 3}" y="${y(0.78)}" width="17" height="${0.78 * S}" fill="#555"/>`;

  // Correto: galho acima da linha
  const xt = 590;
  s += `<rect x="${xt - 13}" y="${y(2.3)}" width="26" height="${2.3 * S}" fill="#7d5f36" stroke="${C.linha}" stroke-width="2"/>`;
  s += `<ellipse cx="${xt}" cy="${y(2.42)}" rx="170" ry="40" fill="#3f8f4f" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += texto(xt + 26, y(1.3), 'Correto', { tam: 27, cor: VERDE, anc: 'start' });
  s += texto(xt + 26, y(1.3) + 30, 'Galhos acima do limite', { tam: 21, peso: 500, anc: 'start' });

  // Incorreto: placa abaixo da linha
  const xp = 1000;
  s += `<rect x="${xp + 90}" y="${y(2.2)}" width="16" height="${2.2 * S}" fill="#888" stroke="${C.linha}" stroke-width="2"/>`;
  s += `<rect x="${xp - 80}" y="${y(1.92)}" width="170" height="${0.42 * S}" fill="#fca5a5" stroke="${VERMELHO}" stroke-width="3"/>`;
  s += texto(xp + 4, y(1.92) + 66, 'Placa', { tam: 24, halo: false });
  s += texto(xp + 80, y(1.2), 'Incorreto', { tam: 27, cor: VERMELHO, anc: 'end' });
  s += texto(xp + 80, y(1.2) + 30, 'Invade o espaço livre', { tam: 21, peso: 500, anc: 'end' });

  s += texto(1198, y(1.5), 'Confira:', { tam: 23, anc: 'start' });
  for (const [i, t] of ['galhos', 'placas', 'toldos', 'ar-condicionado'].entries()) {
    s += texto(1198, y(1.5) + 32 + i * 28, t, { tam: 19, peso: 500, anc: 'start' });
  }

  return {
    nome: 'altura_livre',
    itens: [5, 176],
    derivados: [],
    svg: documento({
      titulo: 'Altura livre sobre o caminho',
      descricao: 'Vista lateral de um caminho com altura livre mínima de 2,10 metros. Galhos acima desse limite estão corretos. Uma placa abaixo dele invade o espaço livre e está incorreta. Também devem ser conferidos toldos e aparelhos de ar-condicionado.',
      conteudo: s,
    }),
  };
}

// ---------------------------------------------------------------------------
function rampaGuardaCorpo() {
  const S = 380, PISO = 630, y = h => PISO - h * S;
  let s = '';
  const secao = (x0, x1) => `<rect x="${x0}" y="${PISO}" width="${x1 - x0}" height="90" fill="${C.piso}" stroke="${C.linha}" stroke-width="2.5"/>`;

  // Sem parede lateral
  const a0 = 90, a1 = 620;
  s += texto((a0 + a1) / 2, 60, 'Sem parede lateral', { tam: 27, halo: false });
  s += texto((a0 + a1) / 2, 92, 'Corte da rampa', { tam: 21, peso: 500, halo: false });
  s += secao(a0, a1);
  const G = 34;
  s += `<rect x="${a0}" y="${PISO - G}" width="26" height="${G}" fill="${LARANJA}" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += `<rect x="${a1 - 26}" y="${PISO - G}" width="26" height="${G}" fill="${LARANJA}" stroke="${C.linha}" stroke-width="2.5"/>`;
  for (const x of [a0 + 13, a1 - 13]) {
    s += `<line x1="${x}" y1="${PISO - G}" x2="${x}" y2="${y(1.1)}" stroke="${C.linha}" stroke-width="6"/>`;
    s += `<line x1="${x - 14}" y1="${y(1.1)}" x2="${x + 14}" y2="${y(1.1)}" stroke="${C.linha}" stroke-width="10" stroke-linecap="round"/>`;
  }
  s += chamada({ x: a0 + 26, y: PISO - G / 2 }, 180, 520, [['Guia de balizamento', 700], ['mín. 5 cm, nos dois lados', 500], ['(altura ampliada)', 500]], 176, 525);
  s += texto((a0 + a1) / 2, y(1.1) + 60, 'Guarda-corpo', { tam: 25 });
  s += seta({ x: (a0 + a1) / 2 - 90, y: y(1.1) + 52 }, { x: a0 + 18, y: y(1.1) + 30 }, { dupla: false, ponta: 11, largura: 2 });
  s += seta({ x: (a0 + a1) / 2 + 90, y: y(1.1) + 52 }, { x: a1 - 18, y: y(1.1) + 30 }, { dupla: false, ponta: 11, largura: 2 });

  // Com vedação lateral
  const b0 = 760, b1 = 1290;
  s += texto((b0 + b1) / 2, 60, 'Com vedação lateral', { tam: 27, halo: false });
  s += texto((b0 + b1) / 2, 92, 'Corte da rampa', { tam: 21, peso: 500, halo: false });
  s += secao(b0, b1);
  for (const x of [b0, b1 - 40]) s += `<rect x="${x}" y="${y(1.1)}" width="40" height="${1.1 * S}" fill="#d8d8d8" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += seta({ x: b0 + 74, y: PISO }, { x: b0 + 74, y: y(1.1) }, { largura: 3 });
  s += linhaFina(b0 + 40, y(1.1), b0 + 88, y(1.1));
  s += texto(b0 + 92, y(0.62), 'mín. 1,10 m', { tam: 26, anc: 'start' });
  s += texto((b0 + b1) / 2 + 30, y(0.3), 'Dispensa guarda-corpo', { tam: 23, peso: 600 });
  s += texto((b0 + b1) / 2 + 30, y(0.3) + 30, 'e guia de balizamento', { tam: 23, peso: 600 });

  return {
    nome: 'rampa_guarda_corpo',
    itens: [23, 72],
    derivados: [],
    svg: documento({
      titulo: 'Guarda-corpo e guia de balizamento',
      descricao: 'Dois cortes de rampa. Sem paredes laterais, há guarda-corpo e guia de balizamento com altura mínima de 5 centímetros nos dois lados. Com vedação lateral de pelo menos 1,10 metro, o guarda-corpo e a guia são dispensados.',
      conteudo: s,
    }),
  };
}

// ---------------------------------------------------------------------------
function elevadorBotoeira() {
  const S = 300, PISO = 690, y = h => PISO - h * S;
  let s = `<rect x="30" y="${y(2.1)}" width="1316" height="${2.1 * S}" fill="${C.parede}" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += piso(30, 1346, PISO);

  const painel = (cx, cy, n) => {
    let t = `<rect x="${cx - 30}" y="${cy - (n * 22 + 10)}" width="60" height="${n * 44 + 20}" rx="6" fill="#333" stroke="${C.linha}" stroke-width="2.5"/>`;
    for (let i = 0; i < n; i++) t += `<circle cx="${cx}" cy="${cy - n * 22 + i * 44 + 22}" r="14" fill="#fff" stroke="${C.linha}" stroke-width="2"/>`;
    return t;
  };

  // Externo: porta fechada e painel de chamada
  s += texto(400, y(2.1) + 42, 'Painel externo (chamada)', { tam: 26, halo: false });
  const xp = 100;
  s += ret(xp, y(1.85), 290, 1.85 * S, '#d9d9d9') + linhaFina(xp + 145, y(1.85), xp + 145, PISO, 2.5);
  const zx = 470;
  s += zona(zx, y(1.1), 110, 0.2 * S);
  s += painel(zx + 55, y(1.0), 1);
  s += seta({ x: zx + 134, y: PISO }, { x: zx + 134, y: y(1.1) }, { largura: 2.5, ponta: 11 });
  s += linhaFina(zx + 110, y(1.1), zx + 148, y(1.1));
  s += texto(zx + 146, y(0.7), '1,10 m', { tam: 24, anc: 'start' });
  s += seta({ x: zx + 40, y: PISO }, { x: zx + 40, y: y(0.9) }, { largura: 2.5, ponta: 11 });
  s += texto(zx + 30, y(0.45), '0,90 m', { tam: 24, anc: 'end' });

  // Interno
  const xi = 800;
  s += linhaFina(xi - 30, y(2.1), xi - 30, PISO, 2.5);
  s += texto(1070, y(2.1) + 42, 'Painel interno (cabina)', { tam: 26, halo: false });
  s += zona(xi + 40, y(1.3), 130, 0.4 * S);
  s += painel(xi + 105, y(1.1), 2);
  s += seta({ x: xi + 200, y: PISO }, { x: xi + 200, y: y(1.3) }, { largura: 2.5, ponta: 11 });
  s += linhaFina(xi + 170, y(1.3), xi + 214, y(1.3));
  s += texto(xi + 214, y(0.75), '1,30 m', { tam: 24, anc: 'start' });
  s += seta({ x: xi + 10, y: PISO }, { x: xi + 10, y: y(0.9) }, { largura: 2.5, ponta: 11 });
  s += linhaFina(xi - 4, y(0.9), xi + 40, y(0.9));
  s += texto(xi + 22, y(0.45), '0,90 m', { tam: 24, anc: 'start' });

  // Botão ampliado
  const bx = 1200, by = y(1.35);
  s += `<circle cx="${bx}" cy="${by}" r="66" fill="#fff" stroke="${C.linha}" stroke-width="3"/>`;
  s += `<text x="${bx}" y="${by + 16}" font-size="48" font-weight="800" text-anchor="middle" fill="${C.cota}">2</text>`;
  // Braille do número 2: sinal de número (pontos 3, 4, 5 e 6) seguido de b (pontos 1 e 2)
  for (const [dx, dy] of [[-24, -30], [-13, -52], [-13, -41], [-13, -30], [8, -52], [8, -41]]) s += `<circle cx="${bx + dx}" cy="${by + dy}" r="4" fill="${C.cota}"/>`;
  s += texto(bx, by + 104, 'Relevo e Braille,', { tam: 22, peso: 600 });
  s += texto(bx, by + 134, 'com contraste', { tam: 22, peso: 600 });

  return {
    nome: 'elevador_botoeira',
    itens: [80, 83],
    derivados: [],
    svg: documento({
      titulo: 'Botões do elevador',
      descricao: 'Vista de frente de um elevador. O painel de chamada externo fica entre 0,90 e 1,10 metro do piso. O painel interno da cabina fica entre 0,90 e 1,30 metro. Os botões têm relevo, Braille e contraste com a superfície ao redor.',
      conteudo: s,
    }),
  };
}

// ---------------------------------------------------------------------------
function lousaTelaAltura() {
  const S = 300, PISO = 690, y = h => PISO - h * S;
  let s = `<rect x="30" y="${y(2.1)}" width="1316" height="${2.1 * S}" fill="${C.parede}" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += piso(30, 1346, PISO);

  // Lousa
  const xl = 190, ll = 480;
  s += `<rect x="${xl}" y="${y(1.95)}" width="${ll}" height="${(1.95 - 0.9) * S}" fill="#2f5d4a" stroke="${C.linha}" stroke-width="4"/>`;
  s += texto(xl + ll / 2, y(1.42) + 8, 'Lousa ou quadro', { tam: 28, cor: '#fff', halo: false });
  s += seta({ x: xl + ll / 2, y: PISO }, { x: xl + ll / 2, y: y(0.9) }, { largura: 3.5 });
  s += texto(xl + ll / 2 - 16, y(0.47), 'Borda inferior:', { tam: 23, peso: 500, anc: 'end' });
  s += texto(xl + ll / 2 - 16, y(0.47) + 32, 'máx. 0,90 m', { tam: 27, anc: 'end' });

  // Tela
  const xt = 800, lt = 450;
  s += `<rect x="${xt}" y="${y(1.95)}" width="${lt}" height="${(1.95 - 0.9) * S}" fill="#fff" stroke="${C.linha}" stroke-width="4"/>`;
  s += texto(xt + lt / 2, y(1.42) + 8, 'Tela ou imagem projetada', { tam: 26, halo: false });
  s += seta({ x: xt + lt / 2, y: PISO }, { x: xt + lt / 2, y: y(0.9) }, { largura: 3.5 });
  s += texto(xt + lt / 2 + 16, y(0.47), 'Borda inferior:', { tam: 23, peso: 500, anc: 'start' });
  s += texto(xt + lt / 2 + 16, y(0.47) + 32, 'máx. 0,90 m', { tam: 27, anc: 'start' });

  return {
    nome: 'lousa_tela_altura',
    itens: [100, 102],
    derivados: [],
    svg: documento({
      titulo: 'Altura da lousa e da tela',
      descricao: 'Parede de sala com uma lousa e uma tela de projeção. A borda inferior de ambas fica a no máximo 0,90 metro do piso.',
      conteudo: s,
    }),
  };
}

// ---------------------------------------------------------------------------
function alcanceManual() {
  const S = 330, PISO = 690, y = h => PISO - h * S;
  let s = piso(30, 1346, PISO);

  // Estante
  const x0 = 170, l = 360;
  s += texto(x0 + l / 2, 50, 'Estantes e fichários', { tam: 26, halo: false });
  s += ret(x0, y(1.8), l, 1.8 * S, C.branco);
  const prat = [0.2, 0.6, 1.0, 1.4];
  for (const h of prat) s += linhaFina(x0, y(h), x0 + l, y(h), 3);
  for (const h of prat) {
    for (let i = 0; i < 7; i++) {
      const alto = 48 + (i * 13) % 26;
      s += `<rect x="${x0 + 26 + i * 46}" y="${y(h) - alto}" width="28" height="${alto}" fill="${h > 1.1 ? '#c8c8c8' : '#7fa3c7'}" stroke="${C.linha}" stroke-width="1.5"/>`;
    }
  }
  s += zona(x0 - 10, y(1.2), l + 20, 1.2 * S, 'none');
  s += texto(x0 + l / 2, y(1.65), 'Acima: fora do alcance', { tam: 21, peso: 600 });
  s += seta({ x: x0 - 50, y: PISO }, { x: x0 - 50, y: y(1.2) }, { largura: 3 });
  s += linhaFina(x0 - 64, y(1.2), x0 - 10, y(1.2));
  s += texto(x0 - 62, y(0.66), 'Máx.', { tam: 20, peso: 500, anc: 'end' });
  s += texto(x0 - 62, y(0.66) + 28, '1,20 m', { tam: 24, anc: 'end' });
  s += `<rect x="${x0 + l + 40}" y="${y(1.1)}" width="170" height="${0.3 * S}" fill="${ZONA_L}" stroke="${LARANJA}" stroke-width="3" stroke-dasharray="10 7"/>`;
  s += texto(x0 + l + 125, y(1.1) + 36, 'Puxadores', { tam: 22, halo: false });
  s += texto(x0 + l + 125, y(1.1) + 66, 'e fechaduras', { tam: 19, peso: 500, halo: false });
  s += texto(x0 + l + 125, y(1.1) - 12, '1,10 m', { tam: 23 });
  s += texto(x0 + l + 125, y(0.8) + 30, '0,80 m', { tam: 23 });

  // Balcão, de lado
  const bx = 880, bl = 300;
  s += texto(1090, 50, 'Balcão, visto de lado', { tam: 26, halo: false });
  const yb = y(0.85);
  s += ret(bx, yb, 400, 26, C.branco) + ret(bx + 320, yb + 26, 60, PISO - yb - 26, C.parede);
  s += zona(bx, y(1.2), 0.5 * S, yb - y(1.2));
  s += `<rect x="${bx + 30}" y="${yb - 40}" width="44" height="40" rx="4" fill="#7fa3c7" stroke="${C.linha}" stroke-width="2"/><ellipse cx="${bx + 116}" cy="${yb - 18}" rx="22" ry="18" fill="#d9a441" stroke="${C.linha}" stroke-width="2"/>`;
  s += seta({ x: bx, y: yb + 70 }, { x: bx + 0.5 * S, y: yb + 70 }, { largura: 3 });
  s += texto(bx + 0.25 * S, yb + 108, 'Profundidade', { tam: 22, peso: 500 });
  s += texto(bx + 0.25 * S, yb + 138, 'máx. 0,50 m', { tam: 24 });
  s += seta({ x: bx - 30, y: PISO }, { x: bx - 30, y: y(1.2) }, { largura: 3 });
  s += linhaFina(bx - 44, y(1.2), bx, y(1.2));
  s += texto(bx - 44, y(0.42), 'Altura', { tam: 22, peso: 500, anc: 'end' });
  s += texto(bx - 44, y(0.42) + 30, 'máx. 1,20 m', { tam: 24, anc: 'end' });
  s += texto(bx, y(1.2) - 12, 'Alimentos e bebidas', { tam: 22, peso: 600, anc: 'start' });
  void bl;

  return {
    nome: 'alcance_manual',
    itens: [115, 135],
    derivados: [],
    svg: documento({
      titulo: 'Faixa de alcance manual',
      descricao: 'À esquerda, estante com área de uso até 1,20 metro e puxadores e fechaduras entre 0,80 e 1,10 metro. À direita, balcão visto de lado, com alimentos e bebidas até 1,20 metro de altura e 0,50 metro de profundidade.',
      conteudo: s,
    }),
  };
}

// ---------------------------------------------------------------------------
function boxChuveiro() {
  let s = '';
  // Planta
  const S = 380, x0 = 215, y0 = 170, L = 0.9 * S, A = 0.95 * S;
  s += texto(40, 60, 'Vista de cima', { tam: 26, anc: 'start', halo: false });
  s += `<rect x="${x0}" y="${y0}" width="${L}" height="${A}" fill="${C.patamar}" stroke="${C.linha}" stroke-width="6"/>`;
  s += `<rect x="${x0}" y="${y0 + 40}" width="${0.45 * S}" height="${0.7 * S}" fill="#fff" stroke="${C.linha}" stroke-width="3"/>`;
  s += texto(x0 + 0.225 * S, y0 + 40 + 0.35 * S, 'Banco', { tam: 23, halo: false });
  const rx = x0 + L - 60, ry = y0 + A - 60;
  s += `<circle cx="${rx}" cy="${ry}" r="20" fill="#888" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += seta({ x: x0 + L - 150, y: y0 + 60 }, { x: rx - 12, y: ry - 22 }, { dupla: false, largura: 3, ponta: 13, cor: AZUL });
  s += cotaH(x0, x0 + L, y0 - 24, 'mín. 0,90 m', { tam: 25 });
  s += cotaV(x0 - 30, y0 + A, y0, 'mín. 0,95 m', { tam: 25 });
  s += texto(x0 + L + 22, ry - 8, 'Até 2% para', { tam: 22, peso: 600, anc: 'start' });
  s += texto(x0 + L + 22, ry + 22, 'o ralo', { tam: 22, peso: 600, anc: 'start' });
  s += texto(x0, y0 + A + 44, 'Piso em nível, sem soleira', { tam: 24, anc: 'start' });

  // Vista da parede
  const T = 380, PISO = 660, xw = 800, y = h => PISO - h * T;
  s += `<rect x="${xw}" y="40" width="540" height="${PISO - 40}" fill="${C.parede}" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += piso(xw, 1340, PISO);
  s += texto(xw + 18, 78, 'Parede do banco', { tam: 25, anc: 'start', halo: false });
  const bx = xw + 130, bl = 0.7 * T, yb = y(0.46);
  s += `<rect x="${bx}" y="${yb}" width="${bl}" height="24" rx="4" fill="#fff" stroke="${C.linha}" stroke-width="3"/>`;
  s += `<path d="M ${bx + 26} ${yb + 24} v 20 M ${bx + bl - 26} ${yb + 24} v 20" stroke="${C.linha}" stroke-width="6"/>`;
  s += seta({ x: bx + bl + 30, y: PISO }, { x: bx + bl + 30, y: yb }, { largura: 3 });
  s += linhaFina(bx + bl, yb, bx + bl + 44, yb);
  s += texto(bx + bl + 42, y(0.2), '0,46 m', { tam: 25, anc: 'start' });
  s += texto(bx + bl / 2, yb + 82, 'Banco articulado ou removível', { tam: 20, peso: 500 });
  s += seta({ x: bx, y: yb - 20 }, { x: bx + bl, y: yb - 20 }, { largura: 3 });
  s += texto(bx + bl / 2, yb - 34, 'Comprimento: mín. 0,70 m', { tam: 22 });
  s += `<line x1="${xw + 60}" y1="${yb - 40}" x2="${xw + 60}" y2="${y(1.5)}" stroke="${AZUL}" stroke-width="11" stroke-linecap="round"/>`;
  s += texto(xw + 80, y(1.32), 'Barra vertical', { tam: 22, anc: 'start' });
  s += texto(xw + 80, y(1.32) + 30, 'na parede do banco', { tam: 19, peso: 500, anc: 'start' });
  s += texto(xw + 280, y(1.0), 'Profundidade do banco:', { tam: 21, peso: 500, anc: 'start' });
  s += texto(xw + 280, y(1.0) + 30, 'mín. 0,45 m', { tam: 24, anc: 'start' });
  s += texto(xw + 280, y(0.8) + 34, 'Barras a 90° na parede', { tam: 21, peso: 500, anc: 'start' });
  s += texto(xw + 280, y(0.8) + 62, 'lateral ao banco', { tam: 21, peso: 500, anc: 'start' });

  return {
    nome: 'box_chuveiro',
    itens: [168, 169],
    derivados: ['90°'],
    svg: documento({
      titulo: 'Box de chuveiro',
      descricao: 'À esquerda, box visto de cima, com no mínimo 0,90 por 0,95 metro, piso em nível, sem soleira, e inclinação de até 2 por cento para o ralo. À direita, banco articulado ou removível a 0,46 metro do piso, com comprimento mínimo de 0,70 metro e profundidade mínima de 0,45 metro, barra vertical na parede do banco e barras a 90 graus na parede lateral.',
      conteudo: s,
    }),
  };
}

// ---------------------------------------------------------------------------
function estantesCorredor() {
  const S = 180, X0 = 60, X1 = 1320, YC = 340, CORR = 0.9 * S, BOL = 1.2 * S, LM = 1.5 * S;
  const yT = YC - CORR / 2, yB = YC + CORR / 2, xm = 730;
  let s = texto(40, 56, 'Vista de cima, sem escala no comprimento', { tam: 24, anc: 'start', halo: false });

  // Estantes dos dois lados, recuadas no bolsão de manobra
  const estante = (x0, x1, y, a) => {
    let t = `<rect x="${x0}" y="${y}" width="${x1 - x0}" height="${a}" fill="${C.piso}" stroke="${C.linha}" stroke-width="2.5"/>`;
    for (let x = x0 + 56; x < x1 - 10; x += 56) t += linhaFina(x, y, x, y + a, 1.6);
    return t;
  };
  const yMt = YC - BOL / 2, yMb = YC + BOL / 2;
  s += estante(X0, xm, yT - 100, 100) + estante(X0, xm, yB, 100);
  s += estante(xm + LM, X1, yT - 100, 100) + estante(xm + LM, X1, yB, 100);
  s += estante(xm, xm + LM, yMt - 60, 60 - (yT - 100 > yMt - 60 ? 0 : 0)) + estante(xm, xm + LM, yMb, 60);

  s += `<rect x="${xm}" y="${yMt}" width="${LM}" height="${BOL}" fill="${ZONA}" stroke="${AZUL}" stroke-width="3" stroke-dasharray="11 8"/>`;
  s += cadeira(440, YC, 0, 0.72);
  s += cadeira(xm + LM / 2, YC, 0, 0.72);

  s += seta({ x: 140, y: yB }, { x: 140, y: yT }, { largura: 3 });
  s += texto(160, YC + 9, 'mín. 0,90 m', { tam: 25, anc: 'start' });
  s += cotaH(xm, xm + LM, yMb + 96, '1,50 m', { acima: false, ext: 10 });
  s += seta({ x: xm + LM + 40, y: yMb }, { x: xm + LM + 40, y: yMt }, { largura: 3 });
  s += linhaFina(xm + LM, yMt, xm + LM + 54, yMt) + linhaFina(xm + LM, yMb, xm + LM + 54, yMb);
  s += texto(xm + LM + 56, YC + 9, '1,20 m', { tam: 25, anc: 'start' });

  s += texto(100, 610, 'Largura livre entre estantes', { tam: 25, anc: 'start' });
  s += texto(100, 644, 'Sem contar livros ou móveis no caminho', { tam: 21, peso: 500, anc: 'start' });
  s += texto(1000, 610, 'Manobra a cada 15 m', { tam: 25, anc: 'start' });
  s += texto(1000, 644, 'Área mínima de 1,20 m x 1,50 m', { tam: 21, peso: 500, anc: 'start' });

  return {
    nome: 'estantes_corredor',
    itens: [110],
    derivados: [],
    svg: documento({
      titulo: 'Corredor entre estantes',
      descricao: 'Vista de cima de um corredor entre estantes, com largura livre mínima de 0,90 metro. A cada 15 metros há um espaço de manobra para cadeira de rodas de no mínimo 1,20 por 1,50 metro.',
      conteudo: s,
    }),
  };
}

export const LOTE3 = [rotaAcessivel, pisoFirmeRegular, corrimaoIntermediario, sanitarioAcessorios, escadaLarguraPatamar, alturaLivre, rampaGuardaCorpo, elevadorBotoeira, lousaTelaAltura, alcanceManual, boxChuveiro, estantesCorredor];
