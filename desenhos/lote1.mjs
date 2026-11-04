// Lote 1: as imagens que atendem mais itens. As medidas vêm das perguntas listadas em `itens`.
import { C, criarVista, texto, seta, tatilAlerta, tatilDirecional, amostraAlerta, amostraDirecional, documento } from './lib.mjs';

export const AZUL = C.apoio;
export const ZONA = 'rgba(11,87,164,.14)';

export const linhaFina = (x1, y1, x2, y2, largura = 1.6, cor = C.cota, extra = '') =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${cor}" stroke-width="${largura}" ${extra}/>`;
export const ret = (x, y, l, a, fill, extra = '') =>
  `<rect x="${x}" y="${y}" width="${l}" height="${a}" fill="${fill}" stroke="${C.linha}" stroke-width="2.5" ${extra}/>`;
export const piso = (x0, x1, y) => `<rect x="${x0}" y="${y}" width="${x1 - x0}" height="${Math.max(0, 748 - y)}" fill="${C.piso}" stroke="${C.linha}" stroke-width="2.5"/>`;

/** Cota vertical com linhas de extensão. */
export function cotaV(x, y0, y1, rotulo, { lado = 'esq', ext = 0, tam = 26, cor = C.cota, sub } = {}) {
  let s = seta({ x, y: y0 }, { x, y: y1 }, { cor, largura: 3 });
  if (ext) s += linhaFina(x - 14, y0, x + ext, y0) + linhaFina(x - 14, y1, x + ext, y1);
  const tx = lado === 'esq' ? x - 16 : x + 16, anc = lado === 'esq' ? 'end' : 'start', ty = (y0 + y1) / 2 + 9;
  s += texto(tx, ty - (sub ? 12 : 0), rotulo, { tam, anc });
  if (sub) s += texto(tx, ty + 16, sub, { tam: 20, peso: 500, anc });
  return s;
}

/** Cota horizontal com linhas de extensão. */
export function cotaH(x0, x1, y, rotulo, { acima = true, ext = 0, tam = 26, cor = C.cota, sub } = {}) {
  let s = seta({ x: x0, y }, { x: x1, y }, { cor, largura: 3 });
  if (ext) s += linhaFina(x0, y - 14, x0, y + ext) + linhaFina(x1, y - 14, x1, y + ext);
  if (sub) {
    s += texto((x0 + x1) / 2, y - 42, rotulo, { tam });
    s += texto((x0 + x1) / 2, y - 14, sub, { tam: 22, peso: 500 });
    return s;
  }
  s += texto((x0 + x1) / 2, acima ? y - 14 : y + 34, rotulo, { tam });
  return s;
}

export const chamada = (de, x, y, linhas, fimX, fimY, anc = 'start') => {
  let t = linhaFina(de.x.toFixed(1), de.y.toFixed(1), fimX, fimY, 1.8);
  linhas.forEach(([txt, peso], i) => { t += texto(x, y + i * 29, txt, { tam: i === 0 ? 25 : 21, peso, anc }); });
  return t;
};

/** Cadeira de rodas vista de cima, apontando para a direita em ang = 0. */
export function cadeira(cx, cy, ang = 0, escala = 1, opacidade = 1) {
  return `<g transform="translate(${cx} ${cy}) rotate(${ang}) scale(${escala})" opacity="${opacidade}">
    <rect x="-46" y="-48" width="92" height="96" rx="12" fill="${C.branco}" stroke="${C.linha}" stroke-width="3"/>
    <rect x="-40" y="-64" width="66" height="16" rx="7" fill="#444" stroke="${C.linha}" stroke-width="2"/>
    <rect x="-40" y="48" width="66" height="16" rx="7" fill="#444" stroke="${C.linha}" stroke-width="2"/>
    <rect x="-58" y="-36" width="12" height="72" rx="5" fill="#777" stroke="${C.linha}" stroke-width="2"/>
    <circle cx="-4" cy="0" r="24" fill="${C.patamar}" stroke="${C.linha}" stroke-width="2.5"/>
    <rect x="46" y="-30" width="34" height="60" rx="8" fill="${C.patamar}" stroke="${C.linha}" stroke-width="2.5"/>
  </g>`;
}

// ---------------------------------------------------------------------------
function mesaVaoLivre() {
  const S = 430, PISO = 660, H = 0.73 * S, TAMPO = 28;
  const yBaixo = PISO - H, yTopo = yBaixo - TAMPO;
  let s = piso(30, 1346, PISO);

  // De frente
  const l = 0.8 * S, x0 = 262;
  s += texto(x0 + l / 2, 200, 'Vista de frente', { tam: 27 });
  s += `<rect x="${x0}" y="${yBaixo}" width="${l}" height="${H}" fill="${ZONA}"/>`;
  s += ret(x0 - 48, yTopo, l + 96, TAMPO, C.branco);
  s += ret(x0 - 26, yBaixo, 26, H, C.parede) + ret(x0 + l, yBaixo, 26, H, C.parede);
  s += cotaV(x0 - 74, PISO, yBaixo, 'Altura livre', { sub: 'mín. 0,73 m', ext: 28 });
  s += cotaH(x0, x0 + l, yBaixo + 170, 'Largura livre', { sub: 'mín. 0,80 m' });

  // De lado
  const xFundo = 830, prof = 0.5 * S, xFrente = xFundo + prof;
  s += texto(xFundo + 150, 200, 'Vista de lado', { tam: 27 });
  s += `<rect x="${xFundo}" y="${yBaixo}" width="${prof}" height="${H}" fill="${ZONA}"/>`;
  s += ret(xFundo - 26, yTopo, prof + 110, TAMPO, C.branco);
  s += ret(xFundo - 26, yBaixo, 26, H, C.parede);
  s += cotaH(xFundo, xFrente, yBaixo + 170, 'Profundidade livre', { sub: 'mín. 0,50 m' });

  s += texto(688, 96, 'Espaço livre sob o tampo', { tam: 30, halo: false });
  s += texto(688, 134, 'Sem contar pés, travessas e gavetas', { tam: 23, peso: 500, halo: false });

  return {
    nome: 'mesa_vao_livre',
    itens: [98, 103, 112, 114, 132, 141, 146],
    derivados: [],
    svg: documento({
      titulo: 'Vão livre sob mesas e bancadas',
      descricao: 'Mesa vista de frente e de lado. O espaço livre sob o tampo tem altura mínima de 0,73 metro, largura mínima de 0,80 metro e profundidade mínima de 0,50 metro, sem contar pés, travessas e gavetas.',
      conteudo: s,
    }),
  };
}

// ---------------------------------------------------------------------------
function portaVaoLivre() {
  const v = criarVista({ escala: 122, origem: { x: 560, y: 332 } });
  const COMPR = 4.2, FUNDO = 2.2, H = 2.45, P0 = 1.6, P1 = 2.62, ALT = 2.1, ESP = 0.05;
  let s = '';
  s += v.poli([[0, 0, 0], [COMPR, 0, 0], [COMPR, FUNDO, 0], [0, FUNDO, 0]], C.patamar);
  s += v.poli([[0, 0, 0], [P0, 0, 0], [P0, 0, H], [0, 0, H]], C.parede);
  s += v.poli([[P1, 0, 0], [COMPR, 0, 0], [COMPR, 0, H], [P1, 0, H]], C.parede);
  s += v.poli([[P0, 0, ALT], [P1, 0, ALT], [P1, 0, H], [P0, 0, H]], C.parede);
  s += v.poli([[P0, 0, 0], [P1, 0, 0], [P1, 0, ALT], [P0, 0, ALT]], '#5a5a5a');

  // Largura livre sobre o piso, da face da folha até o batente oposto
  const a = v.proj(P0 + ESP, 0.14), b = v.proj(P1, 0.14);
  s += seta(a, b, { cor: AZUL, largura: 6, ponta: 18 });

  // Altura livre, no batente oposto à folha
  const c = v.proj(P1 - 0.1, 0, 0), d = v.proj(P1 - 0.1, 0, ALT);
  s += seta(c, d, { cor: '#ffffff', largura: 5, ponta: 16 });

  // Folha aberta a 90 graus: articulada em P0, avança para o observador sem cobrir o vão
  s += v.poli([[P0, 0, 0], [P0, 0.92, 0], [P0, 0.92, ALT], [P0, 0, ALT]], C.branco);
  s += v.linha([P0, 0.8, 0.95], [P0 + 0.14, 0.8, 0.95], 6);

  s += chamada(v.proj((P0 + P1) / 2 + 0.05, 0.14), 760, 626, [['Largura livre: mín. 0,80 m', 700], ['Da folha aberta a 90° até o batente', 500]], 754, 616);
  s += chamada(v.proj(P1 - 0.1, 0, ALT * 0.72), 985, 106, [['Altura livre: mín. 2,10 m', 700]], 978, 112);
  s += chamada(v.proj(P0, 0.6, 1.5), 40, 300, [['Folha aberta a 90°', 700]], 296, 292);
  s += texto(985, 330, 'Prática esportiva ou', { tam: 22, peso: 500, anc: 'start' });
  s += texto(985, 360, 'equipamentos grandes:', { tam: 22, peso: 500, anc: 'start' });
  s += texto(985, 394, 'mín. 1,00 m de largura', { tam: 26, anc: 'start' });

  return {
    nome: 'porta_vao_livre',
    itens: [30, 92, 107, 139, 174],
    derivados: ['90°'],
    svg: documento({
      titulo: 'Vão livre da porta',
      descricao: 'Porta aberta a 90 graus. A largura livre, medida da folha aberta até o batente oposto, tem no mínimo 0,80 metro, e a altura livre tem no mínimo 2,10 metros. Em locais de prática esportiva ou com equipamentos grandes, a largura mínima é de 1,00 metro.',
      conteudo: s,
    }),
  };
}

// ---------------------------------------------------------------------------
function comandosAlturas() {
  const S = 410, PISO = 700;
  const y = h => PISO - h * S;
  let s = `<rect x="30" y="${y(1.42)}" width="1316" height="${1.42 * S}" fill="${C.parede}" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += piso(30, 1346, PISO);

  const coluna = (x, titulo, sub, baixo, alto, rotBaixo, rotAlto, icone) => {
    const l = 280, topo = y(alto), base = y(baixo);
    let c = `<rect x="${x}" y="${topo}" width="${l}" height="${base - topo}" fill="rgba(11,87,164,.18)" stroke="${AZUL}" stroke-width="3" stroke-dasharray="11 8"/>`;
    c += texto(x + l / 2, y(1.42) + 40, titulo, { tam: 26, halo: false });
    if (sub) c += texto(x + l / 2, y(1.42) + 70, sub, { tam: 20, peso: 500, halo: false });
    c += icone(x + l / 2, (topo + base) / 2);
    c += seta({ x: x - 26, y: PISO }, { x: x - 26, y: topo }, { largura: 2.5, ponta: 11 });
    c += linhaFina(x - 40, base, x, base) + linhaFina(x - 40, topo, x, topo);
    c += texto(x + l - 12, topo + 34, rotAlto, { tam: 25, anc: 'end' });
    c += texto(x + l - 12, base - 14, rotBaixo, { tam: 25, anc: 'end' });
    return c;
  };
  const interruptor = (x, y0) => `<rect x="${x - 34}" y="${y0 - 46}" width="68" height="92" rx="8" fill="#fff" stroke="${C.linha}" stroke-width="3"/><rect x="${x - 14}" y="${y0 - 26}" width="28" height="52" rx="4" fill="${C.patamar}" stroke="${C.linha}" stroke-width="2.5"/>`;
  const tomada = (x, y0) => `<rect x="${x - 34}" y="${y0 - 46}" width="68" height="92" rx="8" fill="#fff" stroke="${C.linha}" stroke-width="3"/><circle cx="${x}" cy="${y0}" r="24" fill="${C.patamar}" stroke="${C.linha}" stroke-width="2.5"/><circle cx="${x - 9}" cy="${y0}" r="4" fill="${C.linha}"/><circle cx="${x + 9}" cy="${y0}" r="4" fill="${C.linha}"/>`;
  const interfone = (x, y0) => `<rect x="${x - 40}" y="${y0 - 56}" width="80" height="112" rx="9" fill="#fff" stroke="${C.linha}" stroke-width="3"/><rect x="${x - 26}" y="${y0 - 42}" width="52" height="34" rx="4" fill="${C.patamar}" stroke="${C.linha}" stroke-width="2"/>${[0, 1, 2].map(i => `<circle cx="${x - 18 + i * 18}" cy="${y0 + 16}" r="5" fill="${C.linha}"/><circle cx="${x - 18 + i * 18}" cy="${y0 + 36}" r="5" fill="${C.linha}"/>`).join('')}`;

  s += coluna(110, 'Interruptores', '', 0.6, 1.0, '0,60 m', '1,00 m', interruptor);
  s += coluna(530, 'Tomadas', '', 0.4, 1.0, '0,40 m', '1,00 m', tomada);
  s += coluna(950, 'Interfones e comandos', 'Administração e biblioteca', 0.4, 1.2, '0,40 m', '1,20 m', interfone);
  s += texto(688, 738, 'Alturas medidas a partir do piso. Use a faixa indicada na pergunta.', { tam: 21, peso: 600, halo: false });

  return {
    nome: 'comandos_alturas',
    itens: [46, 101, 111, 147, 183],
    derivados: [],
    svg: documento({
      titulo: 'Alturas de interruptores, tomadas e comandos',
      descricao: 'Parede com três faixas de altura medidas a partir do piso. Interruptores entre 0,60 e 1,00 metro. Tomadas entre 0,40 e 1,00 metro. Interfones e outros comandos, nas áreas administrativas e na biblioteca, entre 0,40 e 1,20 metro.',
      conteudo: s,
    }),
  };
}

// ---------------------------------------------------------------------------
function giro180() {
  const S = 300;
  let s = '';
  // Módulo de referência
  const mx = 200, my = 170, ml = 1.2 * S, ma = 0.8 * S;
  s += texto(mx + ml / 2, 92, 'Módulo de referência', { tam: 26 });
  s += `<rect x="${mx}" y="${my}" width="${ml}" height="${ma}" fill="${ZONA}" stroke="${AZUL}" stroke-width="3" stroke-dasharray="11 8"/>`;
  s += cadeira(mx + ml / 2 - 6, my + ma / 2, 0, 1.5);
  s += cotaH(mx, mx + ml, my + ma + 44, '1,20 m', { acima: false });
  s += cotaV(mx - 34, my + ma, my, '0,80 m', {});

  // Manobra de 180 graus
  const ax = 790, ay = 170, al = 1.5 * S, aa = 1.2 * S;
  s += texto(ax + al / 2, 92, 'Manobra de 180°', { tam: 26 });
  s += `<rect x="${ax}" y="${ay}" width="${al}" height="${aa}" fill="${ZONA}" stroke="${AZUL}" stroke-width="3" stroke-dasharray="11 8"/>`;
  s += cadeira(ax + 158, ay + 92, 0, 1.08);
  s += cadeira(ax + 158, ay + aa - 92, 180, 1.08, 0.38);
  const r = aa / 2 - 92;
  s += `<path d="M ${ax + 284} ${ay + 92} A ${r + 2} ${r + 2} 0 0 1 ${ax + 284} ${ay + aa - 92}" fill="none" stroke="${AZUL}" stroke-width="5"/>`;
  s += seta({ x: ax + 306, y: ay + aa - 104 }, { x: ax + 284, y: ay + aa - 92 }, { cor: AZUL, dupla: false, largura: 5, ponta: 18 });
  s += cotaH(ax, ax + al, ay + aa + 44, '1,50 m', { acima: false });
  s += cotaV(ax + al + 34, ay + aa, ay, '1,20 m', { lado: 'dir' });

  s += texto(688, 690, 'A área precisa ficar livre de móveis e outros obstáculos', { tam: 23, peso: 600, halo: false });

  return {
    nome: 'giro_180',
    itens: [113, 133, 137, 142, 181],
    derivados: ['180°'],
    svg: documento({
      titulo: 'Módulo de referência e manobra de 180 graus',
      descricao: 'Vistas de cima de uma cadeira de rodas. O módulo de referência mede 0,80 por 1,20 metro. A manobra de 180 graus precisa de uma área livre de 1,20 por 1,50 metro.',
      conteudo: s,
    }),
  };
}

// ---------------------------------------------------------------------------
function escadaDegrau() {
  const P = 0.3 * 700, E = 0.17 * 700, B = 660, X = 196;
  let d = `M ${X} ${B}`;
  for (let i = 0; i < 3; i++) d += ` V ${B - E * (i + 1)} H ${X + P * (i + 1)}`;
  d += ` V ${B} Z`;
  let s = piso(30, X + 3 * P, B);
  s += `<path d="${d}" fill="${C.patamar}" stroke="${C.linha}" stroke-width="3" stroke-linejoin="round"/>`;

  // Piso (p) e espelho (e) do segundo degrau
  const x1 = X + P, x2 = X + 2 * P, y2 = B - 2 * E;
  s += seta({ x: x1, y: y2 - 30 }, { x: x2, y: y2 - 30 }, { largura: 3 });
  s += linhaFina(x1, y2 - 44, x1, y2) ;
  s += texto((x1 + x2) / 2, y2 - 76, 'Piso (p)', { tam: 26 });
  s += texto((x1 + x2) / 2, y2 - 46, '0,28 m a 0,32 m', { tam: 22, peso: 500 });
  const xE = x1 - 30;
  s += seta({ x: xE, y: B - E }, { x: xE, y: y2 }, { largura: 3 });
  s += linhaFina(xE - 12, y2, x1, y2);
  s += texto(xE - 16, (B - E + y2) / 2 - 8, 'Espelho (e)', { tam: 26, anc: 'end' });
  s += texto(xE - 16, (B - E + y2) / 2 + 22, '0,16 m a 0,18 m', { tam: 22, peso: 500, anc: 'end' });

  // Fórmula
  s += `<rect x="858" y="36" width="490" height="124" rx="8" fill="#fff" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += texto(1103, 84, 'Fórmula do degrau', { tam: 23, peso: 600, halo: false });
  s += texto(1103, 132, '0,63 m ≤ p + 2e ≤ 0,65 m', { tam: 31, halo: false });

  // Detalhe do bocel: o piso superior avança sobre o espelho
  const Dx = 858, Dy = 190, Dl = 490, Da = 356;
  s += `<rect x="${Dx}" y="${Dy}" width="${Dl}" height="${Da}" fill="#fff" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += texto(Dx + 22, Dy + 38, 'Bocel (ampliado)', { tam: 23, anc: 'start', halo: false });
  const px = Dx + 214, py = Dy + 70, av = 66, dir = Dx + Dl - 2;
  s += `<path d="M ${px} ${py} H ${dir} V ${py + 210} H ${px + av} V ${py + 46} H ${px} Z" fill="${C.patamar}" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += seta({ x: px, y: py + 74 }, { x: px + av, y: py + 74 }, { ponta: 10, largura: 2.5 });
  s += linhaFina(px, py + 46, px, py + 86);
  s += texto(px - 14, py + 84, 'Avança no', { tam: 21, peso: 500, anc: 'end', halo: false });
  s += texto(px - 14, py + 112, 'máximo', { tam: 21, peso: 500, anc: 'end', halo: false });
  s += texto(px - 14, py + 146, '1,5 cm', { tam: 28, anc: 'end', halo: false });
  s += texto(Dx + 22, Dy + Da - 22, 'Espelho fechado, sem vazados', { tam: 22, peso: 600, anc: 'start', halo: false });
  s += linhaFina(Dx + 330, Dy + Da - 42, px + av, py + 170);

  return {
    nome: 'escada_degrau_dimensoes',
    itens: [14, 15, 59, 60],
    derivados: [],
    svg: documento({
      titulo: 'Dimensões do degrau',
      descricao: 'Corte de uma escada. O piso do degrau mede entre 0,28 e 0,32 metro e o espelho entre 0,16 e 0,18 metro, e a soma do piso com duas vezes o espelho fica entre 0,63 e 0,65 metro. No detalhe, o bocel avança no máximo 1,5 centímetro sobre o espelho, que é fechado, sem vazados.',
      conteudo: s,
    }),
  };
}

// ---------------------------------------------------------------------------
function auditorioPcr() {
  const S = 200, A = 74, GAP = 8;
  let s = '';
  // O encosto fica em cima: os assentos olham para baixo, em direção ao palco
  const assento = (x, y, cor = C.branco) => `<rect x="${x}" y="${y}" width="${A}" height="${A}" rx="8" fill="${cor}" stroke="${C.linha}" stroke-width="2.5"/><rect x="${x + 6}" y="${y - 14}" width="${A - 12}" height="14" rx="4" fill="#777" stroke="${C.linha}" stroke-width="2"/>`;
  const fileira = (y, de, ate) => { let t = ''; for (let x = de; x + A <= ate; x += A + GAP) t += assento(x, y); return t; };

  const eL = 0.8 * S, eA = 1.2 * S, x0 = 612, DESL = 0.3 * S;
  const yEnc = 232, yMeio = yEnc + 14, yE = yEnc + DESL, yFimE = yE + eA, yTras = yFimE + DESL + 14;
  const FIM = x0 + eL + GAP + 2 * (A + GAP);

  s += texto(40, 50, 'Vista de cima da plateia', { tam: 25, anc: 'start', halo: false });
  s += fileira(92, 120, FIM);
  s += fileira(yMeio, 120, x0 - A - GAP);
  s += assento(x0 - A - GAP, yMeio, 'rgba(217,119,6,.55)');
  s += fileira(yMeio, x0 + eL + GAP, FIM);
  s += fileira(yTras, 120, FIM);

  // Linha de referência do encosto da fileira
  s += linhaFina(x0 - 6, yEnc, x0 + eL + 6, yEnc, 2, C.cota, 'stroke-dasharray="7 6"');

  // Espaço reservado
  s += `<rect x="${x0}" y="${yE}" width="${eL}" height="${eA}" fill="${ZONA}" stroke="${AZUL}" stroke-width="3.5" stroke-dasharray="11 8"/>`;
  s += cadeira(x0 + eL / 2, yE + eA / 2 - 14, 90, 0.86);

  // Símbolo de acesso no piso
  const xs = x0 + 10, ys = yFimE - 46;
  s += `<rect x="${xs}" y="${ys}" width="36" height="36" rx="4" fill="${AZUL}"/><circle cx="${xs + 18}" cy="${ys + 9}" r="4" fill="#fff"/><path d="M ${xs + 18} ${ys + 14} v 9 h 7 l 3 6 M ${xs + 12} ${ys + 18} a 8 8 0 1 0 9 11" fill="none" stroke="#fff" stroke-width="2.6"/>`;

  // Cotas de 0,30 m
  const xm = x0 + eL - 26;
  s += seta({ x: xm, y: yEnc }, { x: xm, y: yE }, { ponta: 9, largura: 2.5 });
  s += seta({ x: xm, y: yFimE }, { x: xm, y: yFimE + DESL }, { ponta: 9, largura: 2.5 });

  s += chamada({ x: x0, y: yE + 130 }, 150, 470, [['Espaço para cadeira de rodas', 700], ['0,80 m × 1,20 m', 500]], 500, 460);
  s += chamada({ x: x0 - A / 2 - GAP, y: yMeio + A }, 150, 392, [['Assento companheiro', 700]], 410, 372);
  s += chamada({ x: xm, y: yEnc + DESL / 2 }, 960, 186, [['Deslocado 0,30 m', 700], ['em relação ao encosto', 500]], 954, 176);
  s += chamada({ x: xm, y: yFimE + DESL / 2 }, 960, 488, [['Faixa livre de 0,30 m', 700], ['até a fileira da frente e a de trás', 500]], 954, 480);
  s += chamada({ x: xs + 36, y: ys + 18 }, 960, 372, [['Símbolo de acesso no piso', 700]], 954, 366);

  return {
    nome: 'auditorio_espaco_pcr',
    itens: [119, 120, 121, 122],
    derivados: [],
    svg: documento({
      titulo: 'Espaço para cadeira de rodas na plateia',
      descricao: 'Vista de cima de fileiras de assentos. O espaço reservado mede 0,80 por 1,20 metro e fica deslocado 0,30 metro em relação ao encosto, com faixa livre de 0,30 metro até a fileira seguinte. Há um assento companheiro ao lado e o Símbolo Internacional de Acesso no piso.',
      conteudo: s,
    }),
  };
}

// ---------------------------------------------------------------------------
function baciaBarras() {
  const S = 330, PISO = 690;
  const y = h => PISO - h * S;
  let s = '';

  // Parede lateral
  const w0 = 40, w1 = 660;
  s += `<rect x="${w0}" y="30" width="${w1 - w0}" height="${PISO - 30}" fill="${C.parede}" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += piso(w0, w1, PISO);
  s += texto(w0 + 18, 68, 'Parede lateral', { tam: 25, anc: 'start', halo: false });
  const frente = w0 + 0.66 * S;
  s += `<path d="M ${w0} ${y(0.82)} H ${w0 + 0.2 * S} V ${y(0.45)} H ${frente - 6} Q ${frente} ${y(0.45)} ${frente} ${y(0.4)} V ${y(0.22)} Q ${frente - 40} ${y(0.08)} ${frente - 70} ${PISO} H ${w0} Z" fill="#fff" stroke="${C.linha}" stroke-width="3"/>`;
  const fimBarra = frente + 0.5 * S, iniBarra = fimBarra - 0.8 * S;
  s += `<line x1="${iniBarra}" y1="${y(0.75)}" x2="${fimBarra}" y2="${y(0.75)}" stroke="${AZUL}" stroke-width="11" stroke-linecap="round"/>`;
  const xV = frente + 0.3 * S, baseV = y(0.75 + 0.1), topoV = baseV - 0.7 * S;
  s += `<line x1="${xV}" y1="${baseV}" x2="${xV}" y2="${topoV}" stroke="${AZUL}" stroke-width="11" stroke-linecap="round"/>`;

  s += texto(w0 + 72, y(0.75) + 34, 'Barra horizontal', { tam: 19, anc: 'start' });
  s += texto(w0 + 72, y(0.75) + 60, 'mín. 0,80 m', { tam: 19, anc: 'start' });
  s += cotaV(w1 - 40, PISO, y(0.75), '0,75 m', { tam: 25 });
  s += linhaFina(fimBarra + 8, y(0.75), w1 - 26, y(0.75));
  s += linhaFina(fimBarra, y(0.75), fimBarra, y(0.75) + 48);
  s += seta({ x: frente, y: y(0.75) + 36 }, { x: fimBarra, y: y(0.75) + 36 }, { ponta: 9, largura: 2 });
  s += texto((frente + fimBarra) / 2, y(0.75) + 66, '0,50 m', { tam: 23 });
  s += texto(xV + 14, topoV + 44, 'Barra vertical', { tam: 22, anc: 'start' });
  s += texto(xV + 14, topoV + 72, 'mín. 0,70 m', { tam: 22, anc: 'start' });
  s += seta({ x: xV + 26, y: y(0.75) - 7 }, { x: xV + 26, y: baseV }, { ponta: 7, largura: 2 });
  s += linhaFina(xV + 6, baseV, xV + 38, baseV, 1.4);
  s += texto(xV + 40, baseV + 20, '0,10 m', { tam: 21, anc: 'start' });
  s += seta({ x: frente, y: topoV - 18 }, { x: xV, y: topoV - 18 }, { ponta: 9, largura: 2 });
  s += linhaFina(frente, topoV - 30, frente, y(0.45)) ;
  s += texto(frente - 10, topoV - 8, '0,30 m', { tam: 22, anc: 'end' });

  // Parede do fundo
  const p0 = 700, p1 = 1346, wall = 736;
  s += `<rect x="${p0}" y="30" width="${p1 - p0}" height="${PISO - 30}" fill="${C.branco}" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += `<rect x="${p0}" y="30" width="${wall - p0}" height="${PISO - 30}" fill="#d8d8d8" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += piso(p0, p1, PISO);
  s += texto(wall + 18, 68, 'Parede do fundo', { tam: 25, anc: 'start', halo: false });
  const eixo = wall + 0.4 * S;
  s += `<line x1="${eixo}" y1="90" x2="${eixo}" y2="${PISO}" stroke="${C.cota}" stroke-width="2" stroke-dasharray="14 7 3 7"/>`;
  const lb = 0.19 * S;
  s += `<rect x="${eixo - lb}" y="${y(0.82)}" width="${2 * lb}" height="${0.37 * S}" rx="6" fill="#fff" stroke="${C.linha}" stroke-width="3"/>`;
  s += `<path d="M ${eixo - lb + 4} ${y(0.45)} H ${eixo + lb - 4} L ${eixo + lb - 26} ${PISO} H ${eixo - lb + 26} Z" fill="#fff" stroke="${C.linha}" stroke-width="3"/>`;

  const xb0 = eixo - 0.3 * S, xb1 = xb0 + 0.8 * S;
  s += `<line x1="${xb0}" y1="${y(0.75)}" x2="${xb1}" y2="${y(0.75)}" stroke="${AZUL}" stroke-width="11" stroke-linecap="round"/>`;
  s += seta({ x: wall, y: PISO - 30 }, { x: eixo, y: PISO - 30 }, { ponta: 10, largura: 2.5 });
  s += texto(wall + 34, PISO - 42, '0,40 m', { tam: 23 });
  s += seta({ x: xb0, y: y(0.75) - 24 }, { x: eixo, y: y(0.75) - 24 }, { ponta: 9, largura: 2 });
  s += texto(xb0 + 40, y(0.75) - 36, '0,30 m', { tam: 22 });
  s += texto(xb1 + 14, y(0.75) + 9, 'Barra de fundo', { tam: 22, anc: 'start' });
  s += texto(xb1 + 14, y(0.75) + 37, 'mín. 0,80 m', { tam: 22, anc: 'start' });
  s += texto(xb1 + 14, y(0.75) + 65, 'a 0,75 m do piso', { tam: 20, peso: 500, anc: 'start' });

  // Válvula
  const xv = eixo + 0.34 * S, yv = y(1.0);
  s += `<circle cx="${xv}" cy="${yv}" r="17" fill="#fff" stroke="${C.linha}" stroke-width="3"/><line x1="${xv}" y1="${yv}" x2="${xv + 26}" y2="${yv}" stroke="${C.linha}" stroke-width="5"/>`;
  s += texto(xv + 40, yv - 8, 'Válvula de descarga', { tam: 22, anc: 'start' });
  s += texto(xv + 40, yv + 20, 'máx. 1,00 m', { tam: 22, peso: 500, anc: 'start' });
  s += `<text x="1022" y="736" font-size="19" font-weight="600" text-anchor="middle" fill="${C.cota}">Barras: 30 mm a 45 mm, afastadas mín. 40 mm da parede</text>`;

  return {
    nome: 'bacia_barras',
    itens: [158, 159, 160, 161],
    derivados: [],
    svg: documento({
      titulo: 'Barras de apoio da bacia sanitária',
      descricao: 'Duas vistas da bacia sanitária. Na parede lateral, barra horizontal de no mínimo 0,80 metro a 0,75 metro do piso, avançando 0,50 metro além da borda frontal, e barra vertical de no mínimo 0,70 metro, começando 0,10 metro acima da horizontal, a 0,30 metro da borda frontal. Na parede do fundo, barra de no mínimo 0,80 metro a 0,75 metro do piso, estendendo-se 0,30 metro além do eixo da bacia, que fica a 0,40 metro da parede lateral. A válvula de descarga fica a no máximo 1,00 metro. As barras têm diâmetro de 30 a 45 milímetros e afastamento mínimo de 40 milímetros.',
      conteudo: s,
    }),
  };
}

// ---------------------------------------------------------------------------
function pisoTatilInterno() {
  const v = criarVista({ escala: 92, origem: { x: 500, y: 90 } });
  const L = 8.2, Y0 = 2.1, Y1 = 3.9, XB0 = 4.0, XB1 = 5.8, H = 1.0, XE = 6.7;
  let s = '';
  // Corredor em T: ramo principal ao longo de x, e ramo para o fundo
  s += v.poli([[0, Y0, 0], [XB0, Y0, 0], [XB0, Y0, H], [0, Y0, H]], C.parede);
  s += v.poli([[XB0, 0, 0], [XB0, Y0, 0], [XB0, Y0, H], [XB0, 0, H]], C.branco);
  s += v.poli([[XB0, 0, 0], [XB1, 0, 0], [XB1, 0, H], [XB0, 0, H]], C.parede);
  s += v.poli([[XB1, Y0, 0], [XE, Y0, 0], [XE, Y0, H], [XB1, Y0, H]], C.parede);
  s += v.poli([[XB0, 0, 0], [XB1, 0, 0], [XB1, Y0, 0], [XB0, Y0, 0]], C.patamar);
  s += v.poli([[0, Y0, 0], [L, Y0, 0], [L, Y1, 0], [0, Y1, 0]], C.patamar);
  // Porta no fim do ramo e porta de elevador na parede do corredor
  s += v.poli([[XB0 + 0.5, 0, 0], [XB1 - 0.5, 0, 0], [XB1 - 0.5, 0, H * 0.95], [XB0 + 0.5, 0, H * 0.95]], '#8a8a8a');

  const yc = (Y0 + Y1) / 2, xc = (XB0 + XB1) / 2, M = 0.3, T = 0.6;
  // Direcional no eixo principal
  s += tatilDirecional(v, 0.05, xc - M, yc - M, yc + M, 0, 0.15, 0.36, 0.1);
  s += tatilDirecional(v, xc + M, 6.9, yc - M, yc + M, 0, 0.15, 0.36, 0.1);
  // Direcional no ramo: relevos ao longo de y
  let ramo = v.poli([[xc - M, T, 0], [xc + M, T, 0], [xc + M, yc - M, 0], [xc - M, yc - M, 0]], C.tatil);
  for (let x = xc - M + 0.1; x < xc + M - 0.04; x += 0.15) {
    for (let y = T + 0.05; y < yc - M - 0.05; y += 0.46) {
      ramo += v.linha([x, y, 0], [x, Math.min(y + 0.36, yc - M - 0.05), 0], 3.2, C.relevo);
    }
  }
  s += ramo;
  // Alertas: mudança de direção, porta e início da escada
  s += tatilAlerta(v, xc - M, xc + M, yc - M, yc + M, 0, 0.15, 0.05);
  s += tatilAlerta(v, xc - 0.42, xc + 0.42, 0.04, T, 0, 0.15, 0.05);
  s += tatilAlerta(v, 6.9, 7.5, yc - M, yc + M, 0, 0.15, 0.05);
  s += tatilAlerta(v, XE, L, Y0, yc - M, 0, 0.15, 0.05);
  // Escada subindo para o fundo: o degrau mais distante é desenhado primeiro
  for (let k = 4; k >= 0; k--) {
    s += v.caixa(XE, L, Y0 - 0.32 * (k + 1), Y0 - 0.32 * k, 0, 0.16 * (k + 1), { topo: C.piso, frente: C.branco });
  }
  // Parede baixa frontal
  s += v.poli([[0, Y1, 0], [L, Y1, 0], [L, Y1, 0.07], [0, Y1, 0.07]], C.branco);

  s += chamada(v.proj(2, yc + 0.1), 40, 640, [['Direcional', 700], ['Conduz da entrada aos destinos', 500]], 300, 612);
  s += chamada(v.proj(xc, yc), 590, 690, [['Alerta: mudança de direção', 700]], 650, 662);
  s += chamada(v.proj(xc + 0.25, 0.3), 1010, 70, [['Alerta: porta de acesso', 700]], 1004, 76);
  s += chamada(v.proj(7.75, Y0 + 0.3), 1000, 640, [['Alerta: início e fim', 700], ['de escadas e rampas', 500]], 1040, 612);
  s += texto(36, 60, 'Também junto à porta do elevador', { tam: 22, peso: 500, anc: 'start', halo: false });
  s += texto(36, 92, 'e em obstáculos suspensos', { tam: 22, peso: 500, anc: 'start', halo: false });
  s += amostraAlerta(36, 118, 72) + texto(120, 162, 'Pontos', { tam: 21, anc: 'start', halo: false });
  s += amostraDirecional(36, 200, 72) + texto(120, 244, 'Linhas', { tam: 21, anc: 'start', halo: false });

  return {
    nome: 'piso_tatil_interno',
    itens: [51, 52, 53, 86],
    derivados: [],
    svg: documento({
      titulo: 'Piso tátil no interior da edificação',
      descricao: 'Corredor em forma de T. O piso tátil direcional, com relevos em linhas, conduz da entrada aos destinos. O piso tátil de alerta, com relevos em pontos, marca a mudança de direção, a porta de acesso e o início da escada, e também deve estar junto à porta do elevador e em obstáculos suspensos.',
      conteudo: s,
    }),
  };
}

// ---------------------------------------------------------------------------
function bebedouroAlturas() {
  const S = 420, PISO = 690;
  const y = h => PISO - h * S;
  let s = `<rect x="30" y="${y(1.5)}" width="1316" height="${1.5 * S}" fill="${C.parede}" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += piso(30, 1346, PISO);

  const unidade = (x, l, hBica, vao, altoCorpo) => {
    const topo = y(hBica) - 18, fundo = y(vao);
    let u = '';
    if (vao > 0.5) u += `<rect x="${x}" y="${fundo}" width="${l}" height="${PISO - fundo}" fill="${ZONA}"/>`;
    u += ret(x, topo, l, fundo - topo, C.branco, 'rx="10"');
    u += `<path d="M ${x + l / 2 - 14} ${topo} v -28 h 34" fill="none" stroke="${C.linha}" stroke-width="8" stroke-linecap="round"/>`;
    return u;
  };

  // Bica baixa
  const xa = 356, la = 270;
  s += unidade(xa, la, 0.9, 0.73);
  s += cotaV(xa - 40, PISO, y(0.9), 'Bica: 0,90 m', { ext: 40, sub: 'Cadeira de rodas e crianças' });
  s += seta({ x: xa + la / 2, y: PISO }, { x: xa + la / 2, y: y(0.73) }, { largura: 3 });
  s += texto(xa + la / 2 + 14, y(0.36), 'Altura livre', { tam: 23, anc: 'start' });
  s += texto(xa + la / 2 + 14, y(0.36) + 28, 'mín. 0,73 m', { tam: 23, peso: 500, anc: 'start' });

  // Bica alta
  const xb = 730, lb = 240;
  s += ret(xb, y(1.05) - 18, lb, PISO - y(1.05) + 18, C.branco, 'rx="10"');
  s += `<path d="M ${xb + lb / 2 - 14} ${y(1.05) - 18} v -28 h 34" fill="none" stroke="${C.linha}" stroke-width="8" stroke-linecap="round"/>`;
  s += texto(xb + lb / 2, y(0.42), 'Bica:', { tam: 26 });
  s += texto(xb + lb / 2, y(0.42) + 34, '1,00 m a 1,10 m', { tam: 25 });
  s += texto(xb + lb / 2, y(0.42) + 66, 'Adultos em pé', { tam: 20, peso: 500 });

  // Faixa de acionamento
  const xc = 1060, lc = 258;
  s += `<rect x="${xc}" y="${y(1.2)}" width="${lc}" height="${y(0.8) - y(1.2)}" fill="rgba(217,119,6,.20)" stroke="#d97706" stroke-width="3" stroke-dasharray="11 8"/>`;
  s += texto(xc + lc / 2, y(1.02), 'Acionamento', { tam: 25 });
  s += texto(xc + lc - 10, y(1.2) + 30, '1,20 m', { tam: 23, anc: 'end' });
  s += texto(xc + lc - 10, y(0.8) - 10, '0,80 m', { tam: 23, anc: 'end' });
  s += texto(xc + lc / 2, y(0.8) + 40, 'Aproximação frontal', { tam: 21, peso: 600 });
  s += texto(xc + lc / 2, y(0.8) + 68, '0,80 m × 1,20 m', { tam: 23 });

  return {
    nome: 'bebedouro_alturas',
    itens: [88, 89, 90],
    derivados: [],
    svg: documento({
      titulo: 'Alturas do bebedouro',
      descricao: 'Parede com dois bebedouros. Um com bica a 0,90 metro, para pessoas em cadeira de rodas e crianças, e altura livre inferior de no mínimo 0,73 metro. Outro com bica entre 1,00 e 1,10 metro, para adultos em pé. O acionamento fica entre 0,80 e 1,20 metro, com área de aproximação frontal de 0,80 por 1,20 metro.',
      conteudo: s,
    }),
  };
}

// ---------------------------------------------------------------------------
function rebaixamento() {
  const v = criarVista({ escala: 104, origem: { x: 470, y: 60 } });
  const L = 7, D0 = 1.9, D1 = 3.0, Z = 0.2, X0 = 2.6, X1 = 4.4, ASA = 0.7, RUA = 4.6;
  let s = '';
  // Calçada alta, no fundo
  s += v.poli([[0, 0, Z], [L, 0, Z], [L, D1, Z], [X1 + ASA, D1, Z], [X1, D0, Z], [X0, D0, Z], [X0 - ASA, D1, Z], [0, D1, Z]], C.patamar);
  // Rua
  s += v.poli([[0, D1, 0], [L, D1, 0], [L, RUA, 0], [0, RUA, 0]], '#8a8a8a');
  // Guia nos trechos altos
  s += v.poli([[0, D1, 0], [X0 - ASA, D1, 0], [X0 - ASA, D1, Z], [0, D1, Z]], C.branco);
  s += v.poli([[X1 + ASA, D1, 0], [L, D1, 0], [L, D1, Z], [X1 + ASA, D1, Z]], C.branco);
  // Abas laterais e rampa central
  s += v.poli([[X0 - ASA, D1, Z], [X0, D0, Z], [X0, D1, 0]], C.piso);
  s += v.poli([[X1, D0, Z], [X1 + ASA, D1, Z], [X1, D1, 0]], C.piso);
  s += v.poli([[X0, D0, Z], [X1, D0, Z], [X1, D1, 0], [X0, D1, 0]], '#bdbdbd');
  // Alerta no início (calçada) e no término (junto à rua)
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
  s += seta(a, b, { largura: 3 });
  const p = v.proj(X0 + 0.55, D1 - 0.55, zEm(D1 - 0.55)), q = v.proj(X0 + 0.55, D0 + 0.08, zEm(D0 + 0.08));
  s += seta(p, q, { dupla: false, largura: 4, ponta: 16 });

  s += chamada({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, 790, 660, [['Largura: mín. 1,20 m', 700], ['Ideal: mín. 1,50 m', 500]], 782, 648);
  s += chamada(q, 40, 84, [['Declividade: máx. 8,33%', 700], ['Ideal: máx. 5%', 500]], 340, 96);
  s += chamada(v.proj(X0 + 0.2, D1), 40, 560, [['Sem desnível até a rua', 700]], 330, 548);
  s += chamada(v.proj(X1 - 0.3, D0 - 0.3, Z), 1000, 140, [['Piso tátil de alerta', 700], ['no início e no término', 500]], 994, 148);

  return {
    nome: 'rebaixamento_calcada',
    itens: [9, 10, 11],
    derivados: [],
    svg: documento({
      titulo: 'Rebaixamento de calçada',
      descricao: 'Calçada rebaixada até o nível da rua. O rebaixo tem largura mínima de 1,20 metro, ideal de 1,50 metro, e declividade máxima de 8,33 por cento, ideal de 5 por cento, sem desnível até a rua. Há piso tátil de alerta no início e no término do rebaixamento.',
      conteudo: s,
    }),
  };
}

export const LOTE1 = [mesaVaoLivre, portaVaoLivre, comandosAlturas, giro180, escadaDegrau, auditorioPcr, baciaBarras, pisoTatilInterno, bebedouroAlturas, rebaixamento];
