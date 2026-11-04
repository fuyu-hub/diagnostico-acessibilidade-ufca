// Lote 5: as últimas imagens do plano. As medidas vêm das perguntas em `itens`.
import { C, texto, seta, documento } from './lib.mjs';
import { AZUL, ZONA, linhaFina, ret, piso, cotaH, chamada, cadeira } from './lote1.mjs';
import { simboloAcesso } from './lote2.mjs';
import { quadro } from './lote4.mjs';

const VERDE = '#15703a', VERMELHO = '#b91c1c', LARANJA = '#d97706', LUZ = '#ffd84d';

const xis = (cx, cy, r = 20, cor = VERMELHO) =>
  `<path d="M ${cx - r} ${cy - r} L ${cx + r} ${cy + r} M ${cx + r} ${cy - r} L ${cx - r} ${cy + r}" stroke="${cor}" stroke-width="7" stroke-linecap="round"/>`;

/** Símbolo internacional de pessoas com deficiência auditiva, simplificado. */
function simboloSurdez(x, y, l) {
  const e = l / 36;
  return `<g transform="translate(${x} ${y}) scale(${e})"><rect width="36" height="36" rx="4" fill="${AZUL}"/><path d="M 13 21 C 8 9 27 5 27 16 C 27 22 20 21 20 27 a 4 4 0 0 1 -7 2" fill="none" stroke="#fff" stroke-width="2.6"/><line x1="8" y1="30" x2="29" y2="7" stroke="#fff" stroke-width="2.6"/></g>`;
}

// ---------------------------------------------------------------------------
function portaGiratoria() {
  const yP = 300, ep = 30;
  let s = texto(40, 60, 'Vista de cima', { tam: 26, anc: 'start', halo: false });

  // Parede com as duas passagens
  const parede = (x0, x1) => `<rect x="${x0}" y="${yP}" width="${x1 - x0}" height="${ep}" fill="#8a8a8a" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += parede(60, 300) + parede(580, 780) + parede(980, 1320);

  // Porta giratória
  const cx = 440, cy = yP + ep / 2, r = 140;
  s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff" stroke="${C.linha}" stroke-width="4"/>`;
  const d = (r * Math.SQRT1_2).toFixed(1);
  s += `<path d="M ${cx - d} ${cy - d} L ${Number(cx) + Number(d)} ${cy + Number(d)} M ${Number(cx) + Number(d)} ${cy - d} L ${cx - d} ${cy + Number(d)}" stroke="${C.linha}" stroke-width="6"/>`;
  s += texto(cx, 110, 'Porta giratória', { tam: 26 });
  s += texto(cx, 142, 'Não dá passagem à cadeira de rodas', { tam: 21, peso: 500 });
  s += seta({ x: cx, y: 650 }, { x: cx, y: 520 }, { dupla: false, cor: VERMELHO, largura: 7, ponta: 20 });
  s += xis(cx, 490);

  // Entrada acessível
  const xD = 780, LD = 200;
  s += `<rect x="${xD}" y="${yP + ep}" width="8" height="${LD}" fill="#fff" stroke="${C.linha}" stroke-width="2"/>`;
  s += `<path d="M ${xD + 4} ${yP + ep + LD} A ${LD} ${LD} 0 0 0 ${xD + LD} ${yP + ep}" fill="none" stroke="${C.muted}" stroke-width="2" stroke-dasharray="8 7"/>`;
  s += `<line x1="${xD + LD / 2}" y1="556" x2="${xD + LD / 2}" y2="210" stroke="${AZUL}" stroke-width="8"/>`;
  s += seta({ x: xD + LD / 2, y: 230 }, { x: xD + LD / 2, y: 180 }, { dupla: false, cor: AZUL, largura: 8, ponta: 22 });
  s += cadeira(xD + LD / 2, 610, -90, 0.72);
  s += texto(xD + LD / 2, 110, 'Entrada acessível ao lado', { tam: 26 });
  s += texto(xD + LD / 2, 142, 'Aberta durante o funcionamento', { tam: 21, peso: 500 });

  return {
    nome: 'porta_giratoria',
    itens: [32],
    derivados: [],
    svg: documento({
      titulo: 'Entrada ao lado da porta giratória',
      descricao: 'Vista de cima de uma fachada. A porta giratória não dá passagem à cadeira de rodas. Ao lado dela há uma entrada acessível, que fica aberta durante o funcionamento e por onde a cadeira passa.',
      conteudo: s,
    }),
  };
}

// ---------------------------------------------------------------------------
function catracaVao() {
  const S = 300, LV = 0.8 * S, yC = 240, aC = 170, xV = 680;
  let s = texto(40, 60, 'Vista de cima', { tam: 26, anc: 'start', halo: false });

  // Espaço de manobra antes e depois da passagem
  s += `<rect x="${xV - 80}" y="${yC + aC}" width="${LV + 160}" height="270" fill="${ZONA}" stroke="${AZUL}" stroke-width="3" stroke-dasharray="11 8"/>`;
  s += `<rect x="${xV - 80}" y="90" width="${LV + 160}" height="${yC - 90}" fill="${ZONA}" stroke="${AZUL}" stroke-width="3" stroke-dasharray="11 8"/>`;

  // Catracas comuns e colunas
  const pedestal = x => ret(x, yC, 40, aC, C.piso, 'rx="6"');
  for (const x of [130, 300, 470]) {
    s += pedestal(x);
    const cy = yC + aC / 2, x0 = x + 40;
    s += `<circle cx="${x0}" cy="${cy}" r="9" fill="#444"/>`;
    s += `<line x1="${x0}" y1="${cy}" x2="${x0 + 120}" y2="${cy}" stroke="${C.linha}" stroke-width="7" stroke-linecap="round"/>`;
    s += `<line x1="${x0}" y1="${cy}" x2="${x0 - 22}" y2="${cy - 48}" stroke="${C.linha}" stroke-width="7" stroke-linecap="round"/>`;
  }
  s += pedestal(xV - 40) + pedestal(xV + LV);
  s += texto(330, 200, 'Catracas comuns', { tam: 25, halo: false });
  s += texto(330, 460, 'A cadeira de rodas não passa', { tam: 22, peso: 500, halo: false });

  // Passagem acessível
  s += `<line x1="${xV + LV / 2}" y1="560" x2="${xV + LV / 2}" y2="${yC + aC / 2 + 10}" stroke="${AZUL}" stroke-width="8"/>`;
  s += `<line x1="${xV + LV / 2}" y1="${yC + aC / 2 - 46}" x2="${xV + LV / 2}" y2="140" stroke="${AZUL}" stroke-width="8"/>`;
  s += seta({ x: xV + LV / 2, y: 150 }, { x: xV + LV / 2, y: 104 }, { dupla: false, cor: AZUL, largura: 8, ponta: 22 });
  s += cadeira(xV + LV / 2, 610, -90, 0.72);
  s += seta({ x: xV, y: yC + aC / 2 }, { x: xV + LV, y: yC + aC / 2 }, { largura: 3 });
  s += texto(xV + LV / 2, yC + aC / 2 - 14, 'mín. 0,80 m', { tam: 27 });

  s += texto(xV + LV + 100, yC + 60, 'Ao menos uma passagem', { tam: 25, anc: 'start' });
  s += texto(xV + LV + 100, yC + 94, 'com este vão livre', { tam: 22, peso: 500, anc: 'start' });
  s += texto(xV + LV + 100, 540, 'Espaço de manobra', { tam: 25, anc: 'start' });
  s += texto(xV + LV + 100, 574, 'Antes e depois da passagem', { tam: 22, peso: 500, anc: 'start' });

  return {
    nome: 'catraca_vao',
    itens: [33],
    derivados: [],
    svg: documento({
      titulo: 'Passagem acessível na catraca',
      descricao: 'Vista de cima de um controle de acesso. As catracas comuns não dão passagem à cadeira de rodas. Ao menos uma passagem tem vão livre mínimo de 0,80 metro e espaço de manobra antes e depois.',
      conteudo: s,
    }),
  };
}

// ---------------------------------------------------------------------------
function vagaIdoso() {
  let s = `<rect x="30" y="30" width="1316" height="710" fill="#8a8a8a" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += texto(56, 76, 'Vista de cima, sem escala', { tam: 24, anc: 'start' });

  // Edificação e passeio
  s += ret(860, 50, 466, 190, C.branco);
  s += texto(1093, 130, 'Edificação', { tam: 28, halo: false });
  s += `<rect x="1000" y="228" width="120" height="24" fill="#fff" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += texto(1060, 212, 'Entrada', { tam: 24, halo: false });
  s += `<path d="M 70 330 H 1005 V 252 H 1115 V 330 H 1326 V 420 H 70 Z" fill="#ededed" stroke="${C.linha}" stroke-width="2.5"/>`;

  // Vagas
  const yV = 420, aV = 290, lv = 150, x0 = 70;
  for (const i of [5, 6]) s += `<rect x="${x0 + i * lv}" y="${yV}" width="${lv}" height="${aV}" fill="#cfe0f2"/>`;
  for (let i = 0; i <= 8; i++) s += `<line x1="${x0 + i * lv}" y1="${yV}" x2="${x0 + i * lv}" y2="${yV + aV}" stroke="#fff" stroke-width="6"/>`;
  for (const i of [5, 6]) {
    s += simboloAcesso(x0 + i * lv + 25, yV + 130, 100);
    s += `<line x1="${x0 + i * lv + 75}" y1="396" x2="${x0 + i * lv + 75}" y2="372" stroke="${C.linha}" stroke-width="5"/>`;
    s += simboloAcesso(x0 + i * lv + 50, 340, 50);
  }
  s += texto(x0 + 2.5 * lv, yV + 160, 'Outras vagas', { tam: 22 });

  // Rótulos
  s += chamada({ x: x0 + 5 * lv + 50, y: 362 }, 500, 372, [['Placa vertical', 700]], 650, 364);
  s += chamada({ x: x0 + 5 * lv + 25, y: yV + 200 }, 460, yV + 90, [['Símbolo no piso', 700]], 660, yV + 88);
  s += texto(60, 170, '5% do total de vagas', { tam: 34, anc: 'start' });
  s += texto(60, 210, 'Reservadas para idosos, perto da entrada', { tam: 25, peso: 600, anc: 'start' });
  s += texto(60, 246, 'Sinalizadas no piso e em placa vertical', { tam: 25, peso: 600, anc: 'start' });

  return {
    nome: 'vaga_idoso',
    itens: [36],
    derivados: [],
    aConfirmar: ['símbolo da vaga para idosos (a pergunta cita o SIA)'],
    svg: documento({
      titulo: 'Vaga reservada para idosos',
      descricao: 'Estacionamento visto de cima. As vagas reservadas para idosos, em 5 por cento do total, ficam perto da entrada e têm o Símbolo Internacional de Acesso no piso e em placa vertical.',
      conteudo: s,
    }),
  };
}

// ---------------------------------------------------------------------------
function auditorioAssentoPmr() {
  const P = 0.6 * 183, l = 80, a = 100, xA = 640, yB = 310;
  let s = texto(40, 60, 'Vista de cima', { tam: 26, anc: 'start', halo: false });
  const assento = (x, y, fill = C.branco) => ret(x + 4, y, l - 8, a, fill, 'rx="6"')
    + `<rect x="${x + 4}" y="${y + a - 16}" width="${l - 8}" height="16" rx="4" fill="#777" stroke="${C.linha}" stroke-width="2"/>`;
  for (const y of [yB - a - P, yB, yB + a + P]) {
    for (let i = 0; i < 6; i++) {
      const x = xA - l * (i + 1);
      s += assento(x, y, y === yB && i === 0 ? '#bcd4ec' : C.branco);
    }
  }
  // Espaço frontal e apoio de braço
  const xS = xA - l;
  s += `<rect x="${xS + 4}" y="${yB - P}" width="${l - 8}" height="${P}" fill="${ZONA}" stroke="${AZUL}" stroke-width="3" stroke-dasharray="9 7"/>`;
  s += `<rect x="${xA - 6}" y="${yB + 4}" width="12" height="${a - 8}" rx="4" fill="${LARANJA}" stroke="${C.linha}" stroke-width="2"/>`;

  // Corredor
  s += seta({ x: xA + 36, y: yB }, { x: xA + 36, y: yB - P }, { largura: 3 });
  s += linhaFina(xA - 4, yB, xA + 50, yB) + linhaFina(xA - 4, yB - P, xA + 50, yB - P);
  s += texto(xA + 50, yB - P / 2 + 9, 'mín. 0,60 m', { tam: 25, anc: 'start' });
  s += texto(xA + 16, yB + a / 2 + 8, 'Apoio de braço', { tam: 21, peso: 600, anc: 'start' });
  s += texto(xA + 70, 690, 'Corredor', { tam: 24, peso: 600 });
  s += texto(xS - 8, yB - 54, 'Assento para PMR e PO', { tam: 24, anc: 'end' });
  s += texto(xS - 8, yB - 24, 'Junto ao corredor', { tam: 21, peso: 500, anc: 'end' });
  s += texto(360, 690, '2% dos assentos ou 1 assento, o que for maior', { tam: 21, peso: 600 });

  // Apoio basculante, visto de lado
  const xd = 880, yP = 600, xE = 960;
  s += `<rect x="${xd}" y="110" width="440" height="${yP - 110}" fill="${C.parede}" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += piso(xd, 1320, yP).replace(/height="[^"]+"/, 'height="36"');
  s += texto(xd + 220, 150, 'Assento visto de lado', { tam: 24, halo: false });
  s += `<rect x="${xE + 170}" y="340" width="26" height="${yP - 340 - 30}" rx="6" fill="#777" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += `<rect x="${xE}" y="${yP - 150}" width="196" height="30" rx="6" fill="#fff" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += `<rect x="${xE + 150}" y="${yP - 120}" width="20" height="120" fill="#777" stroke="${C.linha}" stroke-width="2"/>`;
  const xH = xE + 170, yH = yP - 240;
  s += `<rect x="${xE + 10}" y="${yH - 7}" width="${xH - xE - 10}" height="14" rx="6" fill="${LARANJA}" stroke="${C.linha}" stroke-width="2"/>`;
  s += `<rect x="${xH - 7}" y="${yH - 160}" width="14" height="160" rx="6" fill="none" stroke="${LARANJA}" stroke-width="3" stroke-dasharray="9 7"/>`;
  s += `<path d="M ${xE + 56} ${yH - 18} A 116 116 0 0 1 ${xH - 22} ${yH - 124}" fill="none" stroke="${C.cota}" stroke-width="3"/>`;
  s += seta({ x: xH - 40, y: yH - 118 }, { x: xH - 22, y: yH - 124 }, { dupla: false, ponta: 13, largura: 2 });
  s += texto(xd + 220, 674, 'Apoio de braço basculante ou removível', { tam: 21, peso: 700 });
  s += texto(xd + 220, 702, 'No lado do corredor', { tam: 21, peso: 500 });

  return {
    nome: 'auditorio_assento_pmr',
    itens: [123],
    derivados: [],
    svg: documento({
      titulo: 'Assento para PMR e PO no auditório',
      descricao: 'À esquerda, fileiras de um auditório vistas de cima. O assento para pessoa com mobilidade reduzida e pessoa obesa fica junto ao corredor, com espaço livre frontal mínimo de 0,60 metro, em 2 por cento dos assentos ou 1 assento, o que for maior. À direita, o assento visto de lado, com apoio de braço basculante ou removível no lado do corredor.',
      conteudo: s,
    }),
  };
}

// ---------------------------------------------------------------------------
function interpreteLibras() {
  const pessoa = (cx, yP, cor = '#444') => {
    const yC = yP - 330;
    return `<circle cx="${cx}" cy="${yC}" r="34" fill="${cor}"/>`
      + `<rect x="${cx - 42}" y="${yC + 40}" width="84" height="150" rx="22" fill="${cor}"/>`
      + `<rect x="${cx - 36}" y="${yC + 182}" width="30" height="${yP - yC - 182}" fill="${cor}"/><rect x="${cx + 6}" y="${yC + 182}" width="30" height="${yP - yC - 182}" fill="${cor}"/>`
      + `<path d="M ${cx - 38} ${yC + 62} L ${cx - 92} ${yC + 110} L ${cx - 46} ${yC + 40} M ${cx + 38} ${yC + 62} L ${cx + 92} ${yC + 110} L ${cx + 46} ${yC + 40}" fill="none" stroke="${cor}" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/>`;
  };
  const cena = (x, correta) => {
    const yT = 96, yP = 630, xE = x + 16, l = 608, cx = x + 250;
    const id = correta ? 'palco-correto' : 'palco-incorreto';
    let t = quadro(x, 30, 640, 690, correta ? 'Correto: visível e sem sombra' : 'Incorreto: sombra e pernas encobertas', correta ? VERDE : VERMELHO);
    t += `<clipPath id="${id}"><rect x="${xE}" y="${yT}" width="${l}" height="${yP - yT}"/></clipPath>`;
    t += `<rect x="${xE}" y="${yT}" width="${l}" height="${yP - yT}" fill="${C.parede}"/>`;
    t += `<rect x="${xE}" y="${yP}" width="${l}" height="74" fill="${C.piso}" stroke="${C.linha}" stroke-width="2"/>`;
    if (correta) {
      t += `<polygon points="${cx - 22},${yT + 12} ${cx + 22},${yT + 12} ${cx + 150},${yP} ${cx - 150},${yP}" fill="#ffe680" opacity=".75" clip-path="url(#${id})"/>`;
      t += `<rect x="${cx - 34}" y="${yT}" width="68" height="14" fill="#333"/>`;
      t += pessoa(cx, yP);
      // Da cabeça aos joelhos
      const yC = yP - 330 - 34, yJ = yP - 80, xB = x + 400;
      t += seta({ x: xB, y: yC }, { x: xB, y: yJ }, { largura: 3 });
      t += linhaFina(cx + 40, yC, xB + 14, yC) + linhaFina(cx + 40, yJ, xB + 14, yJ);
      t += texto(xB + 14, (yC + yJ) / 2 - 8, 'Da cabeça', { tam: 23, anc: 'start' });
      t += texto(xB + 14, (yC + yJ) / 2 + 20, 'aos joelhos', { tam: 23, anc: 'start' });
      t += texto(x + 340, 150, 'Iluminação direcional', { tam: 23, anc: 'start' });
      t += simboloSurdez(x + 44, 130, 70);
      t += texto(x + 44, 228, 'Local', { tam: 21, peso: 600, anc: 'start', halo: false });
      t += texto(x + 44, 254, 'identificado', { tam: 21, peso: 600, anc: 'start', halo: false });
    } else {
      // Luz de lado, sombra na parede e móvel à frente
      t += `<polygon points="${xE + 20},246 ${xE + 20},278 ${cx},470 ${cx},230" fill="#ffe680" opacity=".75"/>`;
      t += `<rect x="${xE}" y="240" width="20" height="44" fill="#333"/>`;
      t += `<g transform="translate(150 -6) skewX(-4)" opacity=".9">${pessoa(cx, yP, '#8d8d94')}</g>`;
      t += pessoa(cx, yP);
      t += ret(cx - 90, yP - 170, 180, 170, '#b08a5a', 'rx="4"');
      t += texto(x + 300 + 170, 190, 'Sombra no fundo', { tam: 23, anc: 'middle' });
      t += texto(cx, yP - 80, 'Pernas', { tam: 21, peso: 700, cor: '#fff', halo: false });
      t += texto(cx, yP - 54, 'encobertas', { tam: 21, peso: 700, cor: '#fff', halo: false });
      t += texto(x + 44, 150, 'Sem identificação', { tam: 23, anc: 'start' });
    }
    return t;
  };
  const s = cena(30, true) + cena(706, false);
  return {
    nome: 'interprete_libras',
    itens: [125],
    derivados: [],
    svg: documento({
      titulo: 'Local do intérprete de Libras',
      descricao: 'Duas cenas com um intérprete de Libras. Na correta, o local é identificado com o símbolo de pessoas com deficiência auditiva, a iluminação é direcional e a pessoa fica visível da cabeça aos joelhos, sem sombra no fundo. Na incorreta, não há identificação, a luz lateral projeta sombra no fundo e um móvel encobre as pernas.',
      conteudo: s,
    }),
  };
}

// ---------------------------------------------------------------------------
function arquibancadaPcr() {
  let s = texto(40, 56, 'Vista de cima, sem escala', { tam: 24, anc: 'start', halo: false });
  const x0 = 60, x1 = 1316, y0 = 110, y1 = 340, n = 5, passo = (y1 - y0) / n;

  // Arquibancada em setores
  s += `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" fill="${C.patamar}" stroke="${C.linha}" stroke-width="3"/>`;
  for (let i = 1; i < n; i++) s += linhaFina(x0, y0 + i * passo, x1, y0 + i * passo, 2);
  const lS = (x1 - x0) / 3;
  for (let j = 0; j < 3; j++) {
    const xs = x0 + j * lS, cx = xs + lS / 2;
    if (j) s += `<line x1="${xs}" y1="${y0}" x2="${xs}" y2="${y1}" stroke="${C.linha}" stroke-width="5"/>`;
    s += texto(cx, y0 - 14, `Setor ${j + 1}`, { tam: 23, halo: false });
    s += `<rect x="${cx - 62}" y="${y1 - passo}" width="124" height="${passo}" fill="#bcd4ec" stroke="${AZUL}" stroke-width="3"/>`;
    s += simboloAcesso(cx - 18, y1 - passo + 5, 36);
    s += `<line x1="${cx}" y1="${y1}" x2="${cx}" y2="386" stroke="${AZUL}" stroke-width="7"/>`;
  }
  s += texto(x0 + 20, y0 + passo * 2 - 12, 'Assentos', { tam: 22, peso: 600, anc: 'start', halo: false });

  // Rota até vestiários e sanitários
  const xr = x0 + lS / 2;
  s += `<line x1="${xr}" y1="386" x2="1136" y2="386" stroke="${AZUL}" stroke-width="7"/>`;
  s += seta({ x: 1136, y: 383 }, { x: 1136, y: 476 }, { dupla: false, cor: AZUL, largura: 7, ponta: 20 });
  s += texto(480, 372, 'Rota acessível', { tam: 22, anc: 'middle' });
  s += ret(960, 478, 356, 180, C.branco);
  s += texto(1138, 562, 'Vestiários', { tam: 26, halo: false });
  s += texto(1138, 594, 'e sanitários', { tam: 26, halo: false });

  // Quadra com a regra
  s += `<rect x="${x0}" y="430" width="860" height="290" fill="#e4eee4" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += texto(490, 500, '2% do total de assentos', { tam: 34, halo: false });
  s += texto(490, 544, 'Ou 1 espaço, o que for maior', { tam: 25, peso: 600, halo: false });
  s += texto(490, 600, 'Em diferentes setores, sinalizados com o SIA', { tam: 25, peso: 600, halo: false });
  s += texto(490, 696, 'Quadra', { tam: 21, peso: 500, halo: false });

  return {
    nome: 'arquibancada_pcr',
    itens: [175],
    derivados: [],
    svg: documento({
      titulo: 'Espaços reservados na arquibancada',
      descricao: 'Arquibancada vista de cima, dividida em setores. Cada setor tem um espaço reservado para pessoa em cadeira de rodas, sinalizado com o Símbolo Internacional de Acesso, em 2 por cento do total de assentos ou 1 espaço, o que for maior. Uma rota acessível liga esses espaços aos vestiários e sanitários.',
      conteudo: s,
    }),
  };
}

// ---------------------------------------------------------------------------
function bancoPatio() {
  const S = 420, PISO = 690, y = h => PISO - h * S;
  let s = piso(30, 740, PISO);
  const x0 = 190, lA = 0.5 * S, lB = 2 * lA;
  s += texto(385, 60, 'Banco visto de frente', { tam: 26, halo: false });

  // Faixa de altura do assento
  s += `<rect x="${x0 - 20}" y="${y(0.45)}" width="${lB + 40}" height="${0.05 * S}" fill="${ZONA}" stroke="${AZUL}" stroke-width="3" stroke-dasharray="9 7"/>`;
  // Encosto, assento e pés
  s += ret(x0 + 8, y(0.88), lB - 16, 0.3 * S, '#d8d8d8', 'rx="8"');
  s += texto(x0 + lB / 2, y(0.73) + 8, 'Encosto', { tam: 25, halo: false });
  for (const dx of [0.14, 0.86]) s += `<rect x="${x0 + lB * dx - 10}" y="${y(0.58)}" width="20" height="${y(0.42) - y(0.58)}" fill="#777" stroke="${C.linha}" stroke-width="2"/>`;
  s += ret(x0, y(0.425), lB, 22, C.branco, 'rx="5"');
  for (const dx of [0.14, 0.86]) s += `<rect x="${x0 + lB * dx - 12}" y="${y(0.425) + 22}" width="24" height="${PISO - y(0.425) - 22}" fill="#777" stroke="${C.linha}" stroke-width="2"/>`;
  s += linhaFina(x0 + lA, y(0.425), x0 + lA, y(0.425) + 22, 2);

  // Altura
  s += seta({ x: 120, y: PISO }, { x: 120, y: y(0.45) }, { largura: 3 }) + linhaFina(106, y(0.45), x0 - 20, y(0.45));
  s += texto(108, y(0.2), '0,45 m', { tam: 25, anc: 'end' });
  s += seta({ x: 650, y: PISO }, { x: 650, y: y(0.4) }, { largura: 3 }) + linhaFina(x0 + lB + 20, y(0.4), 664, y(0.4));
  s += texto(662, y(0.2), '0,40 m', { tam: 25, anc: 'start' });
  s += texto(x0 + lB / 2, y(0.2) - 12, 'Altura do assento', { tam: 23, peso: 600 });
  s += texto(x0 + lB / 2, y(0.2) + 18, 'entre as duas medidas', { tam: 21, peso: 500 });

  // Largura individual
  const yL = y(0.88) - 22;
  s += seta({ x: x0, y: yL }, { x: x0 + lA, y: yL }, { largura: 3 });
  s += linhaFina(x0, yL - 12, x0, yL + 12) + linhaFina(x0 + lA, yL - 12, x0 + lA, yL + 12);
  s += texto(x0, yL - 52, 'Largura de cada assento', { tam: 23, peso: 600, anc: 'start' });
  s += texto(x0, yL - 20, 'Entre 0,45 m e 0,50 m', { tam: 25, anc: 'start' });

  // Planta com o módulo de referência
  const S2 = 180, xb = 830, yb = 230, ab = 90, xm = xb + 240, lm = 0.8 * S2, am = 1.2 * S2;
  s += texto(1060, 60, 'Vista de cima', { tam: 26, halo: false });
  s += ret(xb, yb, 230, ab, C.branco, 'rx="6"');
  s += `<rect x="${xb}" y="${yb}" width="230" height="16" rx="4" fill="#d8d8d8" stroke="${C.linha}" stroke-width="2"/>`;
  s += texto(xb + 115, yb + 64, 'Banco', { tam: 24, halo: false });
  s += `<rect x="${xm}" y="${yb}" width="${lm}" height="${am}" fill="${ZONA}" stroke="${AZUL}" stroke-width="3" stroke-dasharray="11 8"/>`;
  s += cadeira(xm + lm / 2, yb + am / 2, 90, 0.72);
  s += cotaH(xm, xm + lm, yb - 26, '0,80 m', { tam: 25, ext: 10 });
  s += seta({ x: xm + lm + 30, y: yb + am }, { x: xm + lm + 30, y: yb }, { largura: 3 });
  s += linhaFina(xm + lm, yb, xm + lm + 44, yb) + linhaFina(xm + lm, yb + am, xm + lm + 44, yb + am);
  s += texto(xm + lm + 42, yb + am / 2 + 9, '1,20 m', { tam: 25, anc: 'start' });
  s += texto(1060, yb + am + 64, 'Módulo de referência', { tam: 25 });
  s += texto(1060, yb + am + 98, 'Ao lado de cada assento fixo', { tam: 22, peso: 500 });

  return {
    nome: 'banco_patio',
    itens: [177],
    derivados: [],
    svg: documento({
      titulo: 'Banco do pátio',
      descricao: 'À esquerda, banco com encosto visto de frente, com altura do assento entre 0,40 e 0,45 metro e largura de cada assento entre 0,45 e 0,50 metro. À direita, vista de cima, com módulo de referência de 0,80 por 1,20 metro ao lado de cada assento fixo, para pessoa em cadeira de rodas.',
      conteudo: s,
    }),
  };
}

// ---------------------------------------------------------------------------
function luminariaRota() {
  const PISO = 600;
  let s = `<rect x="30" y="30" width="1316" height="${PISO - 30}" fill="#3e4552" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += `<rect x="30" y="${PISO}" width="1316" height="130" fill="${C.piso}" stroke="${C.linha}" stroke-width="2.5"/>`;

  const lum = (x, ok) => {
    let t = '';
    if (ok) t += `<polygon points="${x - 40},132 ${x + 40},132 ${x + 150},${PISO} ${x - 150},${PISO}" fill="#fff3b0" opacity=".85"/>`;
    t += `<rect x="${x - 54}" y="100" width="108" height="34" rx="5" fill="${ok ? '#fff' : '#7a7a7a'}" stroke="${C.linha}" stroke-width="2.5"/>`;
    for (const dx of [-26, 26]) t += `<circle cx="${x + dx}" cy="117" r="11" fill="${ok ? LUZ : '#555'}" stroke="${C.linha}" stroke-width="2"/>`;
    return t;
  };
  s += lum(190, true) + lum(530, false) + lum(860, true);
  s += xis(530, 117, 30);

  // Porta de saída
  const xD = 1110;
  s += `<rect x="${xD - 12}" y="222" width="194" height="${PISO - 222}" fill="#8a8a8a" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += ret(xD, 234, 170, PISO - 234, C.branco);
  s += `<rect x="${xD + 14}" y="430" width="142" height="16" rx="6" fill="#444"/>`;
  s += `<rect x="${xD - 12}" y="164" width="194" height="46" rx="4" fill="${VERDE}" stroke="${C.linha}" stroke-width="2"/>`;
  s += texto(xD + 85, 198, 'SAÍDA', { tam: 28, cor: '#fff', halo: false });
  s += lum(1195, true).replace(/<polygon[^>]*>/, '');

  // Rótulos
  s += texto(190, 300, 'Acesa e visível', { tam: 25 });
  s += texto(860, 300, 'Em bom estado', { tam: 25 });
  s += texto(530, 190, 'Apagada ou', { tam: 25, cor: '#fff', halo: false });
  s += texto(530, 222, 'com vidro quebrado', { tam: 25, cor: '#fff', halo: false });
  s += texto(530, 256, 'Anote como problema', { tam: 21, peso: 500, cor: '#fff', halo: false });

  // Rota no piso
  s += seta({ x: 70, y: 660 }, { x: xD + 160, y: 660 }, { dupla: false, cor: AZUL, largura: 8, ponta: 24 });
  s += texto(600, 636, 'Iluminar o caminho até a saída', { tam: 25 });
  s += texto(600, 712, 'Confira corredores, escadas e saídas', { tam: 23, peso: 600 });

  return {
    nome: 'luminaria_rota',
    itens: [178],
    derivados: [],
    svg: documento({
      titulo: 'Luminárias na rota de fuga',
      descricao: 'Corredor no escuro, visto de lado, até uma porta de saída. As luminárias de emergência estão acesas, visíveis e em bom estado, e iluminam o caminho até a saída. Uma delas está apagada ou com vidro quebrado, o que deve ser anotado como problema. A conferência vale para corredores, escadas e saídas.',
      conteudo: s,
    }),
  };
}

// ---------------------------------------------------------------------------
function mapaTatil() {
  const PISO = 690;
  let s = `<rect x="30" y="60" width="430" height="${PISO - 60}" fill="${C.parede}" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += piso(30, 460, PISO);
  s += texto(245, 104, 'Parede da sala', { tam: 25, halo: false });

  // Porta e mapa na parede
  s += ret(70, 190, 170, PISO - 190, C.branco);
  s += `<circle cx="218" cy="450" r="9" fill="#444"/>`;
  const xm = 290, ym = 330, lm = 130, am = 92;
  s += `<rect x="${xm}" y="${ym}" width="${lm}" height="${am}" rx="4" fill="#fff" stroke="${C.linha}" stroke-width="3"/>`;
  s += `<rect x="${xm + 12}" y="${ym + 12}" width="${lm - 24}" height="${am - 24}" fill="none" stroke="${C.muted}" stroke-width="2"/>`;
  s += `<path d="M ${xm + 24} ${ym + 66} H ${xm + 76} V ${ym + 28} H ${xm + 106}" fill="none" stroke="${AZUL}" stroke-width="4"/>`;

  // Ligação ao detalhe
  const D = { x: 520, y: 60, l: 826, a: 630 };
  s += linhaFina(xm + lm, ym, D.x, D.y + 60, 1.8) + linhaFina(xm + lm, ym + am, D.x, D.y + D.a - 60, 1.8);

  // Mapa ampliado
  s += `<rect x="${D.x}" y="${D.y}" width="${D.l}" height="${D.a}" rx="10" fill="#fff" stroke="${C.linha}" stroke-width="3"/>`;
  s += texto(D.x + D.l / 2, D.y + 44, 'Mapa da rota de fuga (ampliado)', { tam: 26, halo: false });
  const xP = D.x + 40, yP = D.y + 76, lP = 500, aP = 400;
  s += `<rect x="${xP}" y="${yP}" width="${lP}" height="${aP}" fill="#eef1f4" stroke="${C.linha}" stroke-width="7"/>`;
  // Paredes em relevo
  const parede = d => `<path d="${d}" fill="none" stroke="${C.linha}" stroke-width="7"/>`;
  s += parede(`M ${xP} ${yP + 150} H ${xP + 190} M ${xP + 280} ${yP + 150} H ${xP + lP}`);
  s += parede(`M ${xP} ${yP + 260} H ${xP + 330} M ${xP + 420} ${yP + 260} H ${xP + lP}`);
  s += parede(`M ${xP + 170} ${yP} V ${yP + 150} M ${xP + 340} ${yP} V ${yP + 150}`);
  s += parede(`M ${xP + 250} ${yP + 260} V ${yP + aP}`);
  // Rota em relevo
  const rota = [[xP + 85, yP + 80], [xP + 235, yP + 80], [xP + 235, yP + 205], [xP + 375, yP + 205], [xP + 375, yP + 330], [xP + 470, yP + 330]];
  s += `<polyline points="${rota.map(p => p.join(',')).join(' ')}" fill="none" stroke="${AZUL}" stroke-width="8" stroke-dasharray="2 16" stroke-linecap="round"/>`;
  s += seta({ x: xP + 440, y: yP + 330 }, { x: xP + lP - 4, y: yP + 330 }, { dupla: false, cor: AZUL, largura: 6, ponta: 20 });
  s += `<circle cx="${xP + 85}" cy="${yP + 80}" r="17" fill="${VERMELHO}" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += `<rect x="${xP + lP - 66}" y="${yP + 346}" width="62" height="34" rx="4" fill="${VERDE}"/>`;
  s += texto(xP + lP - 35, yP + 370, 'Saída', { tam: 19, cor: '#fff', halo: false });
  s += texto(xP + 85, yP + 124, 'Você está aqui', { tam: 18, peso: 600 });

  // Legenda
  const xL = xP + lP + 28;
  s += texto(xL, yP + 30, 'Visual', { tam: 25, anc: 'start', halo: false });
  s += texto(xL, yP + 60, 'Cores e textos', { tam: 21, peso: 500, anc: 'start', halo: false });
  s += texto(xL, yP + 86, 'de leitura fácil', { tam: 21, peso: 500, anc: 'start', halo: false });
  s += texto(xL, yP + 160, 'Tátil', { tam: 25, anc: 'start', halo: false });
  s += texto(xL, yP + 190, 'Paredes e rota', { tam: 21, peso: 500, anc: 'start', halo: false });
  s += texto(xL, yP + 216, 'em relevo', { tam: 21, peso: 500, anc: 'start', halo: false });
  for (const [c, pts] of [[0, '110100'], [1, '101010'], [2, '111000'], [3, '100110']]) {
    [...pts].forEach((b, i) => {
      if (b === '1') s += `<circle cx="${xL + 6 + c * 44 + (i % 2) * 15}" cy="${yP + 262 + Math.floor(i / 2) * 15}" r="5" fill="${C.cota}"/>`;
    });
  }
  s += texto(xL, yP + 334, 'Braille', { tam: 25, anc: 'start', halo: false });
  s += `<text x="${D.x + D.l / 2}" y="${D.y + D.a - 40}" font-size="19" text-anchor="middle" fill="${C.muted}">Planta e pontos em Braille meramente ilustrativos.</text>`;
  s += texto(245, 148, 'Em salas, laboratórios', { tam: 21, peso: 500, halo: false });
  s += texto(245, 174, 'e auditório', { tam: 21, peso: 500, halo: false });

  return {
    nome: 'mapa_tatil',
    itens: [182],
    derivados: [],
    svg: documento({
      titulo: 'Mapa tátil da rota de fuga',
      descricao: 'À esquerda, parede de uma sala com um mapa ao lado da porta. À direita, o mapa ampliado mostra a rota de fuga até a saída, em formato visual, com cores e textos, e tátil, com paredes e rota em relevo e Braille. O mapa deve existir em salas de aula, laboratórios e auditório.',
      conteudo: s,
    }),
  };
}

// ---------------------------------------------------------------------------
function plateiaCorrimao() {
  const S = 300, H = 0.7 * S;
  const cena = (x0, x1, titulo, comRampa) => {
    let t = texto((x0 + x1) / 2, 150, titulo, { tam: 26, halo: false });
    const yB = 630, yA = 470, xa = x0 + 80, xb = x1 - 80, n = 4, px = (xb - xa) / n, py = (yB - yA) / n;
    let pts = `${x0},${yB} ${xa},${yB}`;
    if (comRampa) pts += ` ${xb},${yA}`;
    else for (let i = 0; i < n; i++) pts += ` ${xa + i * px},${yB - (i + 1) * py} ${xa + (i + 1) * px},${yB - (i + 1) * py}`;
    pts += ` ${x1},${yA} ${x1},690 ${x0},690`;
    t += `<polygon points="${pts}" fill="${C.piso}" stroke="${C.linha}" stroke-width="3"/>`;

    // Referência da altura: a superfície da rampa, ou a linha que une as bordas dos degraus
    const xI = xa, yI = comRampa ? yB : yB - py, xF = comRampa ? xb : xa + (n - 1) * px, yF = yA;
    const ref = xx => yI + (yF - yI) * (xx - xI) / (xF - xI);
    t += `<polyline points="${xI - 30},${yI - H} ${xI},${yI - H} ${xF},${yF - H} ${xF + 30},${yF - H}" fill="none" stroke="${AZUL}" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>`;
    for (const xx of comRampa ? [xa + 60, xb - 60] : [xI, xF]) {
      t += `<line x1="${xx}" y1="${ref(xx) - H + 4}" x2="${xx}" y2="${ref(xx)}" stroke="#777" stroke-width="7"/>`;
    }
    const xc = comRampa ? (xa + xb) / 2 : xa + px;
    t += seta({ x: xc, y: ref(xc) }, { x: xc, y: ref(xc) - H + 6 }, { largura: 3 });
    t += texto(xc + 14, ref(xc) - H / 2 + 9, '0,70 m', { tam: 27, anc: 'start' });
    t += texto(xF, yF - H - 26, 'Corrimão', { tam: 23 });
    return t;
  };
  let s = cena(40, 660, 'Corredor com rampa', true) + cena(716, 1336, 'Corredor com degraus', false);
  s += texto(688, 736, 'Ao menos um corrimão, com o corredor livre de obstáculos', { tam: 24, peso: 600 });

  return {
    nome: 'plateia_corrimao',
    itens: [124],
    derivados: [],
    svg: documento({
      titulo: 'Corrimão no corredor da plateia',
      descricao: 'Dois cortes de corredores de plateia, um com rampa e outro com degraus. Em ambos há pelo menos um corrimão a 0,70 metro de altura, e o corredor fica livre de obstáculos.',
      conteudo: s,
    }),
  };
}

// ---------------------------------------------------------------------------
function sinalizacaoLuminosaPiso() {
  let s = `<rect x="30" y="30" width="800" height="700" fill="#1f2630" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += texto(430, 76, 'Auditório com luz reduzida, visto de cima', { tam: 25, cor: '#fff', halo: false });

  // Fileiras e corredor
  const xc0 = 350, xc1 = 510, y0 = 170;
  for (let f = 0; f < 5; f++) {
    const y = y0 + f * 106;
    for (const [x0, n] of [[70, 4], [xc1 + 10, 4]]) {
      for (let i = 0; i < n; i++) s += `<rect x="${x0 + i * 69}" y="${y}" width="60" height="64" rx="6" fill="#49525f" stroke="#111" stroke-width="2"/>`;
    }
  }
  // Luzes do percurso
  for (let y = 180; y < 716; y += 42) {
    for (const x of [xc0 + 22, xc1 - 22]) s += `<circle cx="${x}" cy="${y}" r="8" fill="${LUZ}"/><circle cx="${x}" cy="${y}" r="16" fill="${LUZ}" opacity=".28"/>`;
  }
  s += seta({ x: (xc0 + xc1) / 2, y: 690 }, { x: (xc0 + xc1) / 2, y: 190 }, { dupla: false, cor: '#fff', largura: 5, ponta: 18 });
  s += `<rect x="${(xc0 + xc1) / 2 - 62}" y="104" width="124" height="44" rx="4" fill="${VERDE}" stroke="#fff" stroke-width="2"/>`;
  s += texto((xc0 + xc1) / 2, 136, 'SAÍDA', { tam: 25, cor: '#fff', halo: false });

  // Detalhe: de lado
  const xd = 870, xf = 1346, PISO = 560;
  s += `<rect x="${xd}" y="30" width="${xf - xd}" height="700" rx="10" fill="#2a313c" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += texto((xd + xf) / 2, 76, 'Duas formas de sinalizar', { tam: 25, cor: '#fff', halo: false });
  s += `<rect x="${xd + 16}" y="${PISO}" width="${xf - xd - 32}" height="50" fill="#6b7280" stroke="#111" stroke-width="2"/>`;
  // Assento lateral com luz baixa
  s += `<rect x="${xd + 60}" y="${PISO - 260}" width="30" height="260" fill="#49525f" stroke="#111" stroke-width="2"/>`;
  s += `<rect x="${xd + 90}" y="${PISO - 130}" width="120" height="26" rx="5" fill="#49525f" stroke="#111" stroke-width="2"/>`;
  s += `<rect x="${xd + 190}" y="${PISO - 104}" width="20" height="104" fill="#49525f" stroke="#111" stroke-width="2"/>`;
  const xBaixa = xd + 214, yBaixa = PISO - 26;
  s += `<rect x="${xBaixa - 4}" y="${yBaixa - 10}" width="12" height="20" fill="${LUZ}" stroke="#111"/>`;
  s += `<circle cx="${xBaixa + 4}" cy="${yBaixa}" r="26" fill="${LUZ}" opacity=".3"/>`;
  // Luz no piso
  const xNo = xd + 370;
  s += `<rect x="${xNo - 40}" y="${PISO - 8}" width="80" height="12" rx="3" fill="${LUZ}" stroke="#111"/>`;
  s += `<ellipse cx="${xNo}" cy="${PISO - 10}" rx="62" ry="22" fill="${LUZ}" opacity=".28"/>`;
  s += linhaFina(xBaixa + 4, yBaixa - 28, xd + 214, 330, 2, '#fff');
  s += texto(xd + 214, 288, 'Próxima', { tam: 24, cor: '#fff', halo: false });
  s += texto(xd + 214, 318, 'ao piso', { tam: 24, cor: '#fff', halo: false });
  s += linhaFina(xNo, PISO - 28, xNo, 430, 2, '#fff');
  s += texto(xNo, 416, 'No piso', { tam: 24, cor: '#fff', halo: false });
  s += texto((xd + xf) / 2, 668, 'Orienta o caminho quando', { tam: 23, peso: 600, cor: '#fff', halo: false });
  s += texto((xd + xf) / 2, 698, 'a luz do auditório diminui', { tam: 23, peso: 600, cor: '#fff', halo: false });

  return {
    nome: 'sinalizacao_luminosa_piso',
    itens: [128],
    derivados: [],
    svg: documento({
      titulo: 'Sinalização luminosa no piso',
      descricao: 'Auditório com luz reduzida, visto de cima, com pontos de luz ao longo do corredor até a saída. No detalhe, as duas formas de sinalizar: próxima ao piso, na lateral do assento, ou no próprio piso.',
      conteudo: s,
    }),
  };
}

// ---------------------------------------------------------------------------
function iluminacaoBalcao() {
  const cena = (x, correta) => {
    const yT = 96, yB = 560, xE = x + 16, l = 608, cx = x + 320, cy = 300, r = 104;
    const id = correta ? 'rosto-correto' : 'rosto-incorreto';
    let t = quadro(x, 30, 640, 690, correta ? 'Correto: rosto bem iluminado' : 'Incorreto: rosto na sombra', correta ? VERDE : VERMELHO);
    t += `<rect x="${xE}" y="${yT}" width="${l}" height="${yB - yT}" fill="${correta ? '#fbf3d4' : '#5a616e'}"/>`;
    if (!correta) {
      t += `<rect x="${cx - 200}" y="${yT + 26}" width="400" height="300" fill="#fffbe0" stroke="${C.linha}" stroke-width="3"/>`;
      t += linhaFina(cx, yT + 26, cx, yT + 326, 3);
    } else {
      t += `<polygon points="${cx - 50},${yT + 14} ${cx + 50},${yT + 14} ${cx + 210},${yB} ${cx - 210},${yB}" fill="#ffe680" opacity=".7"/>`;
      t += `<rect x="${cx - 60}" y="${yT}" width="120" height="14" fill="#fff" stroke="${C.linha}" stroke-width="2"/>`;
    }
    // Atendente de frente
    t += `<path d="M ${cx - 170} ${yB} Q ${cx - 170} ${cy + 118} ${cx} ${cy + 118} Q ${cx + 170} ${cy + 118} ${cx + 170} ${yB} Z" fill="#7b8794" stroke="${C.linha}" stroke-width="3"/>`;
    t += `<clipPath id="${id}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath>`;
    t += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#d5d9df" stroke="${C.linha}" stroke-width="3"/>`;
    for (const dx of [-38, 38]) t += `<ellipse cx="${cx + dx}" cy="${cy - 22}" rx="11" ry="13" fill="#222"/>`;
    t += `<path d="M ${cx - 16} ${cy + 2} q 16 18 24 6" fill="none" stroke="#555" stroke-width="3"/>`;
    t += `<ellipse cx="${cx}" cy="${cy + 50}" rx="36" ry="17" fill="#555" stroke="#222" stroke-width="2.5"/>`;
    if (!correta) {
      t += `<rect x="${cx - r}" y="${cy - r}" width="${2 * r}" height="${2 * r}" fill="#20242c" opacity=".78" clip-path="url(#${id})"/>`;
    }
    // Balcão
    t += `<rect x="${xE}" y="${yB}" width="${l}" height="30" fill="#fff" stroke="${C.linha}" stroke-width="3"/>`;
    t += `<rect x="${xE + 30}" y="${yB + 30}" width="${l - 60}" height="${704 - yB - 30}" fill="${C.patamar}" stroke="${C.linha}" stroke-width="2.5"/>`;
    if (correta) {
      t += texto(cx, 150, 'Luz sobre a face', { tam: 23 });
      t += seta({ x: cx + 136, y: cy + 50 }, { x: cx + 48, y: cy + 50 }, { dupla: false, ponta: 14, largura: 3 });
      t += texto(cx + 142, cy + 42, 'Boca', { tam: 23, anc: 'start' });
      t += texto(cx + 142, cy + 70, 'visível', { tam: 23, anc: 'start' });
      t += texto(cx, 640, 'A leitura labial fica possível', { tam: 25, peso: 700, halo: false });
    } else {
      t += texto(cx, yT + 58, 'Janela atrás do atendente', { tam: 23 });
      t += seta({ x: cx + 136, y: cy + 50 }, { x: cx + 48, y: cy + 50 }, { dupla: false, ponta: 14, largura: 3 });
      t += texto(cx + 142, cy + 42, 'Boca', { tam: 23, anc: 'start' });
      t += texto(cx + 142, cy + 70, 'no escuro', { tam: 23, anc: 'start' });
      t += texto(cx, 640, 'A leitura labial fica difícil', { tam: 25, peso: 700, halo: false });
    }
    return t;
  };
  const s = cena(30, true) + cena(706, false);
  return {
    nome: 'iluminacao_balcao',
    itens: [145],
    derivados: [],
    svg: documento({
      titulo: 'Iluminação no balcão de atendimento',
      descricao: 'Duas cenas com um atendente de frente, atrás do balcão. Na correta, o rosto recebe luz uniforme, a boca fica visível e a leitura labial é possível. Na incorreta, uma janela atrás do atendente deixa o rosto na sombra, e a leitura labial fica difícil.',
      conteudo: s,
    }),
  };
}

export const LOTE5 = [portaGiratoria, catracaVao, vagaIdoso, auditorioAssentoPmr, interpreteLibras, arquibancadaPcr, bancoPatio, luminariaRota, mapaTatil, plateiaCorrimao, sinalizacaoLuminosaPiso, iluminacaoBalcao];
