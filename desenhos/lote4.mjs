// Lote 4: restante da prioridade 2 e as imagens de prioridade 3 que atendem mais itens.
// As medidas vêm das perguntas em `itens`.
import { C, texto, seta, amostraAlerta, documento } from './lib.mjs';
import { AZUL, ZONA, linhaFina, ret, piso, cotaH, chamada, cadeira } from './lote1.mjs';
import { simboloAcesso } from './lote2.mjs';

const VERDE = '#15703a', VERMELHO = '#b91c1c';

/** Faixa de alerta em vista de cima ou de corte: fundo amarelo com pontos em relevo. */
function faixaAlerta(x, y, l, a, passo = 22) {
  let s = `<rect x="${x}" y="${y}" width="${l}" height="${a}" fill="${C.tatil}" stroke="${C.linha}" stroke-width="2"/>`;
  const raio = Math.min(passo * 0.3, a * 0.34);
  for (let i = 0; i < Math.floor(l / passo); i++) {
    for (let j = 0; j < Math.max(1, Math.floor(a / passo)); j++) {
      const cy = a < passo ? y + a / 2 : y + passo * (j + 0.5);
      s += `<circle cx="${x + passo * (i + 0.5)}" cy="${cy}" r="${raio}" fill="${C.relevo}"/>`;
    }
  }
  return s;
}

/** Quadro com faixa de título colorida, como em "Piso firme e regular". */
export function quadro(x, y, l, a, titulo, cor) {
  return `<rect x="${x}" y="${y}" width="${l}" height="${a}" rx="10" fill="#fff" stroke="${C.linha}" stroke-width="2.5"/>`
    + `<rect x="${x}" y="${y}" width="${l}" height="54" rx="10" fill="${cor}"/>`
    + texto(x + l / 2, y + 37, titulo, { tam: 25, cor: '#fff', halo: false });
}

const celular = (xc, yc, ang) => `<g transform="translate(${xc} ${yc}) rotate(${ang})"><rect x="-90" y="-16" width="180" height="16" rx="5" fill="#222"/></g>`;

// ---------------------------------------------------------------------------
function escadaPisoTatil() {
  let s = texto(40, 60, 'Vista de lado', { tam: 26, anc: 'start', halo: false });
  s += amostraAlerta(60, 96, 76);
  s += texto(150, 128, 'Piso tátil de alerta', { tam: 24, anc: 'start', halo: false });
  s += texto(150, 158, 'Pontos em relevo', { tam: 21, peso: 500, anc: 'start', halo: false });

  // Corte da escada
  const yBase = 600, passoX = 60, passoY = 40, x0 = 260, n = 6, yTopo = yBase - n * passoY, xTopo = x0 + (n - 1) * passoX;
  let p = `40,${yBase} ${x0},${yBase}`;
  for (let i = 0; i < n; i++) {
    const yi = yBase - (i + 1) * passoY;
    p += ` ${x0 + i * passoX},${yi}`;
    if (i < n - 1) p += ` ${x0 + (i + 1) * passoX},${yi}`;
  }
  p += ` 770,${yTopo} 770,690 40,690`;
  s += `<polygon points="${p}" fill="${C.piso}" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += faixaAlerta(160, yBase - 14, 100, 14);
  s += faixaAlerta(xTopo, yTopo - 14, 100, 14);
  s += chamada({ x: 210, y: yBase - 16 }, 60, 500, [['Início do lance', 700]], 170, 510);
  s += chamada({ x: xTopo + 50, y: yTopo - 16 }, xTopo + 50, 280, [['Término do lance', 700]], xTopo + 50, 290, 'middle');

  // Planta
  const xp = 960, lp = 300, yE0 = 196, yE1 = 516;
  s += texto(xp + lp / 2, 60, 'Vista de cima', { tam: 26, halo: false });
  s += `<rect x="${xp}" y="96" width="${lp}" height="520" fill="${C.patamar}" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += `<rect x="${xp}" y="${yE0}" width="${lp}" height="${yE1 - yE0}" fill="${C.piso}" stroke="${C.linha}" stroke-width="2.5"/>`;
  for (let y = yE0 + 40; y < yE1; y += 40) s += linhaFina(xp, y, xp + lp, y, 2);
  s += faixaAlerta(xp, yE0 - 66, lp, 66);
  s += faixaAlerta(xp, yE1, lp, 66);
  s += texto(xp - 18, yE0 - 26, 'Término', { tam: 24, anc: 'end' });
  s += texto(xp - 18, yE1 + 40, 'Início', { tam: 24, anc: 'end' });
  s += seta({ x: xp + lp / 2, y: yE1 - 20 }, { x: xp + lp / 2, y: yE0 + 20 }, { dupla: false, largura: 4, ponta: 15 });
  s += seta({ x: xp, y: 646 }, { x: xp + lp, y: 646 }, { largura: 3 });
  s += linhaFina(xp, 616, xp, 660) + linhaFina(xp + lp, 616, xp + lp, 660);
  s += texto(xp + lp / 2, 688, 'Em toda a extensão do degrau', { tam: 24 });

  return {
    nome: 'escada_piso_tatil',
    itens: [62],
    derivados: [],
    svg: documento({
      titulo: 'Piso tátil na escada',
      descricao: 'Escada vista de lado e de cima. Uma faixa de piso tátil de alerta, com pontos em relevo, fica no início e no término de cada lance e cobre toda a extensão do degrau.',
      conteudo: s,
    }),
  };
}

// ---------------------------------------------------------------------------
function portaEspacoLateral() {
  const S = 300, yP = 250, xD = 430, LP = 0.8 * S, xM = xD + LP, LZ = 0.6 * S, AZ = 300;
  let s = texto(40, 60, 'Vista de cima', { tam: 26, anc: 'start', halo: false });

  // Parede com o vão da porta
  s += `<rect x="60" y="${yP - 30}" width="${xD - 60}" height="30" fill="#8a8a8a" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += `<rect x="${xM}" y="${yP - 30}" width="${1320 - xM}" height="30" fill="#8a8a8a" stroke="${C.linha}" stroke-width="2.5"/>`;

  // Espaço livre e cadeira
  s += `<rect x="${xM}" y="${yP}" width="${LZ}" height="${AZ}" fill="${ZONA}" stroke="${AZUL}" stroke-width="3" stroke-dasharray="11 8"/>`;
  s += cadeira(xM + LZ / 2, yP + 170, -90, 0.72);

  // Porta fechada, trajetória e folha aberta
  s += `<rect x="${xD}" y="${yP - 20}" width="${LP}" height="10" fill="#fff" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += `<path d="M ${xD} ${yP + LP} A ${LP} ${LP} 0 0 0 ${xM} ${yP - 10}" fill="none" stroke="${C.muted}" stroke-width="2" stroke-dasharray="8 7"/>`;
  s += `<line x1="${xD}" y1="${yP - 10}" x2="${xD}" y2="${yP + LP}" stroke="${C.muted}" stroke-width="5" stroke-dasharray="12 8"/>`;
  s += `<rect x="${xM - 26}" y="${yP - 8}" width="16" height="16" rx="4" fill="#444"/>`;

  s += chamada({ x: xM - 18, y: yP - 22 }, xM - 18, yP - 90, [['Maçaneta', 700]], xM - 18, yP - 80, 'middle');
  s += texto(xD - 18, yP + 130, 'A folha abre', { tam: 23, peso: 600, anc: 'end' });
  s += texto(xD - 18, yP + 160, 'para este lado', { tam: 23, peso: 600, anc: 'end' });

  s += cotaH(xM, xM + LZ, yP + AZ + 42, '0,60 m', { acima: false, ext: 10, tam: 28 });

  s += texto(xM + LZ + 40, yP + 90, 'Espaço livre ao lado da maçaneta', { tam: 25, anc: 'start' });
  s += texto(xM + LZ + 40, yP + 124, 'No sentido de abertura da porta', { tam: 22, peso: 500, anc: 'start' });
  s += texto(xM + LZ + 40, yP + 154, 'Sem móveis, lixeiras ou carrinhos', { tam: 22, peso: 500, anc: 'start' });

  return {
    nome: 'porta_espaco_lateral',
    itens: [95],
    derivados: [],
    svg: documento({
      titulo: 'Espaço ao lado da maçaneta',
      descricao: 'Porta vista de cima. Ao lado da maçaneta, no lado para onde a folha abre, há um espaço livre de 0,60 metro onde a pessoa em cadeira de rodas se aproxima, sem móveis, lixeiras ou carrinhos.',
      conteudo: s,
    }),
  };
}

// ---------------------------------------------------------------------------
function balcaoAutosservico() {
  const S = 400, PISO = 690, y = h => PISO - h * S;
  let s = piso(30, 720, PISO);
  const xb = 240, lb = 320;
  s += texto(375, 60, 'Balcão visto de frente', { tam: 26, halo: false });

  // Faixa de altura, balcão e itens
  s += `<rect x="${xb - 20}" y="${y(0.85)}" width="${lb + 40}" height="${0.1 * S}" fill="${ZONA}" stroke="${AZUL}" stroke-width="3" stroke-dasharray="11 8"/>`;
  s += ret(xb, y(0.8), lb, 18, C.branco) + ret(xb + 20, y(0.8) + 18, lb - 40, PISO - y(0.8) - 18, C.parede);
  const topo = y(0.8);
  s += `<rect x="${xb + 18}" y="${topo - 10}" width="110" height="10" rx="3" fill="#7fa3c7" stroke="${C.linha}" stroke-width="2"/>`;
  s += `<rect x="${xb + 18}" y="${topo - 20}" width="110" height="10" rx="3" fill="#7fa3c7" stroke="${C.linha}" stroke-width="2"/>`;
  s += `<rect x="${xb + 150}" y="${topo - 44}" width="44" height="44" rx="4" fill="#e6e6e6" stroke="${C.linha}" stroke-width="2"/>`;
  s += `<path d="M ${xb + 160} ${topo - 44} v -26 M ${xb + 172} ${topo - 44} v -30 M ${xb + 184} ${topo - 44} v -24" stroke="${C.linha}" stroke-width="4" stroke-linecap="round"/>`;
  s += `<ellipse cx="${xb + 256}" cy="${topo - 16}" rx="44" ry="16" fill="#d9a441" stroke="${C.linha}" stroke-width="2"/>`;
  s += texto(xb + lb / 2, topo - 100, 'Bandejas, talheres e alimentos', { tam: 23, peso: 600 });

  // Cotas
  s += seta({ x: 130, y: PISO }, { x: 130, y: y(0.85) }, { largura: 3 }) + linhaFina(116, y(0.85), xb - 20, y(0.85));
  s += texto(118, y(0.42), '0,85 m', { tam: 25, anc: 'end' });
  s += seta({ x: 620, y: PISO }, { x: 620, y: y(0.75) }, { largura: 3 }) + linhaFina(xb + lb + 20, y(0.75), 634, y(0.75));
  s += texto(632, y(0.42), '0,75 m', { tam: 25, anc: 'start' });
  s += texto(375, y(0.3), 'Superfície entre', { tam: 22, peso: 500 });
  s += texto(375, y(0.3) + 30, 'as duas alturas', { tam: 22, peso: 500 });

  // Planta
  const xp = 780, xf = 1330, S2 = 240, yb = 150, ab = 110, yc = yb + ab, ac = 0.9 * S2;
  s += texto((xp + xf) / 2, 60, 'Vista de cima', { tam: 26, halo: false });
  s += ret(xp, yb, xf - xp, ab, C.branco);
  s += texto((xp + xf) / 2, yb + ab / 2 + 9, 'Balcão', { tam: 25, halo: false });
  s += `<rect x="${xp}" y="${yc + ac}" width="${xf - xp}" height="36" fill="#8a8a8a" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += `<rect x="${xp}" y="${yc}" width="${xf - xp}" height="${ac}" fill="${ZONA}"/>`;
  s += cadeira(920, yc + ac / 2, 0, 0.72);
  s += seta({ x: 1110, y: yc + ac }, { x: 1110, y: yc }, { largura: 3 });
  s += texto(1126, yc + ac / 2 + 9, 'mín. 0,90 m', { tam: 26, anc: 'start' });
  s += texto((xp + xf) / 2, yc + ac + 84, 'Corredor ao lado do balcão', { tam: 25 });
  s += texto((xp + xf) / 2, yc + ac + 118, 'Sem móveis na passagem', { tam: 21, peso: 500 });

  return {
    nome: 'balcao_autosservico',
    itens: [134],
    derivados: [],
    svg: documento({
      titulo: 'Balcão de autosserviço',
      descricao: 'À esquerda, balcão visto de frente, com bandejas, talheres e alimentos sobre uma superfície entre 0,75 e 0,85 metro do piso. À direita, vista de cima, com corredor de largura mínima de 0,90 metro ao lado do balcão.',
      conteudo: s,
    }),
  };
}

// ---------------------------------------------------------------------------
function saidaAntipanico() {
  const S = 250, PISO = 690, y = h => PISO - h * S;
  let s = `<rect x="30" y="50" width="690" height="${PISO - 50}" fill="${C.parede}" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += piso(30, 720, PISO);

  // Porta de frente
  const x0 = 200, l = 0.8 * S, yT = y(2.1);
  s += `<rect x="${x0 - 14}" y="${yT - 14}" width="${l + 28}" height="${PISO - yT + 14}" fill="#8a8a8a" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += ret(x0, yT, l, PISO - yT, C.branco);
  s += `<rect x="${x0 + 14}" y="${y(1.0) - 9}" width="${l - 28}" height="18" rx="6" fill="#444" stroke="${C.linha}" stroke-width="2"/>`;
  s += `<rect x="${x0 - 2}" y="${yT - 72}" width="${l + 4}" height="48" rx="4" fill="${VERDE}" stroke="${C.linha}" stroke-width="2"/>`;
  s += texto(x0 + l / 2, yT - 38, 'SAÍDA', { tam: 28, cor: '#fff', halo: false });
  s += chamada({ x: x0 + l - 14, y: y(1.0) }, x0 + l + 60, y(1.0) - 50, [['Barra antipânico', 700], ['Abre com um empurrão', 500]], x0 + l + 54, y(1.0) - 40);
  s += seta({ x: x0, y: PISO - 40 }, { x: x0 + l, y: PISO - 40 }, { largura: 3 });
  s += texto(x0 + l + 40, PISO - 62, 'Vão livre', { tam: 23, peso: 500, anc: 'start' });
  s += texto(x0 + l + 40, PISO - 30, 'mín. 0,80 m', { tam: 27, anc: 'start' });

  // Rampa ou degrau
  const secao = (y0, correto) => {
    const yF = y0 + 262, yA = yF - 62, xE = 790, xD = 1040, xS = 1316;
    let t = quadro(760, y0, 586, 330, correto ? 'Correto: rampa junto ao degrau' : 'Incorreto: degrau sem rampa', correto ? VERDE : VERMELHO);
    const xR = correto ? xD + 170 : xD;
    t += `<polygon points="${xE},${yA} ${xD},${yA} ${xR},${yF} ${xS},${yF} ${xS},${yF + 46} ${xE},${yF + 46}" fill="${C.piso}" stroke="${C.linha}" stroke-width="2.5"/>`;
    t += `<rect x="${xD - 90}" y="${y0 + 70}" width="12" height="${yA - y0 - 70}" fill="#8a8a8a" stroke="${C.linha}" stroke-width="2"/>`;
    t += texto(xD - 100, y0 + 100, 'Porta', { tam: 21, peso: 600, anc: 'end', halo: false });
    if (correto) {
      t += `<polyline points="${xE + 16},${yA - 26} ${xD},${yA - 26} ${xR},${yF - 26} ${xS - 26},${yF - 26}" fill="none" stroke="${AZUL}" stroke-width="7"/>`;
      t += seta({ x: xS - 60, y: yF - 26 }, { x: xS - 20, y: yF - 26 }, { dupla: false, largura: 7, cor: AZUL, ponta: 20 });
      t += texto(xD + 110, yA - 34, 'Rampa', { tam: 24, anc: 'start' });
    } else {
      t += `<line x1="${xE + 16}" y1="${yA - 26}" x2="${xD - 26}" y2="${yA - 26}" stroke="${AZUL}" stroke-width="7"/>`;
      t += `<path d="M ${xD - 26} ${yA - 44} l 36 36 m 0 -36 l -36 36" stroke="${VERMELHO}" stroke-width="7" stroke-linecap="round"/>`;
      t += texto(xD + 44, yA + 14, 'Degrau isolado', { tam: 24, anc: 'start' });
    }
    return t;
  };
  s += secao(30, false) + secao(390, true);

  return {
    nome: 'saida_antipanico',
    itens: [179],
    derivados: [],
    svg: documento({
      titulo: 'Saída de emergência acessível',
      descricao: 'À esquerda, porta de saída de emergência vista de frente, com barra antipânico e vão livre mínimo de 0,80 metro. À direita, dois cortes: um degrau isolado sem rampa bloqueia a saída, o que é incorreto; com rampa junto ao degrau, o percurso fica contínuo, o que é correto.',
      conteudo: s,
    }),
  };
}

// ---------------------------------------------------------------------------
function areaResgate() {
  let s = texto(40, 60, 'Vista de cima', { tam: 26, anc: 'start', halo: false });

  // Corredor
  s += `<rect x="40" y="520" width="820" height="130" fill="${C.patamar}" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += seta({ x: 70, y: 605 }, { x: 830, y: 605 }, { dupla: false, cor: AZUL, largura: 7, ponta: 20 });
  s += texto(450, 570, 'Fluxo principal de circulação', { tam: 24 });

  // Escada
  s += `<rect x="520" y="130" width="320" height="390" fill="${C.piso}" stroke="${C.linha}" stroke-width="3"/>`;
  for (let y = 166; y < 520; y += 36) s += linhaFina(520, y, 840, y, 2);
  s += texto(680, 290, 'Escada de', { tam: 24 });
  s += texto(680, 322, 'emergência', { tam: 24 });

  // Área de resgate, fora do fluxo
  s += `<rect x="130" y="230" width="390" height="290" fill="${ZONA}" stroke="${AZUL}" stroke-width="3" stroke-dasharray="11 8"/>`;
  s += texto(325, 276, 'Área de resgate', { tam: 26, halo: false });
  s += texto(325, 306, 'Fora do fluxo principal', { tam: 21, peso: 500, halo: false });
  s += `<rect x="225" y="330" width="200" height="170" fill="#fff" stroke="${C.linha}" stroke-width="2.5" rx="6"/>`;
  s += cadeira(325, 400, 90, 0.62);
  s += texto(325, 488, 'Espaço para PCR', { tam: 20, peso: 600, halo: false });

  // Intercomunicador
  s += `<rect x="168" y="222" width="34" height="16" fill="#333" stroke="${C.linha}" stroke-width="2"/>`;
  s += chamada({ x: 185, y: 222 }, 60, 150, [['Intercomunicador', 700]], 185, 158);

  s += texto(450, 696, 'Ao menos 1 espaço por escada ou elevador de emergência', { tam: 23, peso: 600 });

  // Altura do intercomunicador
  const S = 330, PISO = 690, y = h => PISO - h * S;
  s += `<rect x="900" y="110" width="446" height="${PISO - 110}" fill="${C.parede}" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += piso(900, 1346, PISO);
  s += texto(1123, 152, 'Intercomunicador', { tam: 26, halo: false });
  s += texto(1123, 184, 'Parede da área de resgate', { tam: 21, peso: 500, halo: false });
  const zx = 1050, zl = 140;
  s += `<rect x="${zx}" y="${y(1.2)}" width="${zl}" height="${0.4 * S}" fill="${ZONA}" stroke="${AZUL}" stroke-width="3" stroke-dasharray="11 8"/>`;
  s += `<rect x="${zx + 38}" y="${y(1.0) - 44}" width="64" height="88" rx="6" fill="#333" stroke="${C.linha}" stroke-width="2"/>`;
  for (let i = 0; i < 3; i++) s += linhaFina(zx + 52, y(1.0) - 28 + i * 10, zx + 88, y(1.0) - 28 + i * 10, 2.5, '#fff');
  s += `<circle cx="${zx + 70}" cy="${y(1.0) + 22}" r="11" fill="#fff"/>`;
  s += seta({ x: zx + zl + 36, y: PISO }, { x: zx + zl + 36, y: y(1.2) }, { largura: 3 }) + linhaFina(zx + zl, y(1.2), zx + zl + 50, y(1.2));
  s += texto(zx + zl + 48, y(0.6), '1,20 m', { tam: 25, anc: 'start' });
  s += seta({ x: zx - 36, y: PISO }, { x: zx - 36, y: y(0.8) }, { largura: 3 }) + linhaFina(zx - 50, y(0.8), zx, y(0.8));
  s += texto(zx - 48, y(0.4), '0,80 m', { tam: 25, anc: 'end' });

  return {
    nome: 'area_resgate',
    itens: [180],
    derivados: [],
    svg: documento({
      titulo: 'Área de resgate',
      descricao: 'À esquerda, vista de cima de uma área de resgate ao lado da escada de emergência, fora do fluxo principal de circulação, com ao menos um espaço para pessoa em cadeira de rodas. À direita, o intercomunicador na parede, entre 0,80 e 1,20 metro do piso.',
      conteudo: s,
    }),
  };
}

// ---------------------------------------------------------------------------
function iluminacaoUniforme() {
  const cena = (x, correta) => {
    const yTeto = 96, yPiso = 630, xE = x + 16, l = 608;
    let t = quadro(x, 30, 640, 690, correta ? 'Correto: luz uniforme' : 'Incorreto: sombra e ofuscamento', correta ? VERDE : VERMELHO);
    const clip = correta ? 'sala-correta' : 'sala-incorreta';
    t += `<clipPath id="${clip}"><rect x="${xE}" y="${yTeto}" width="${l}" height="${yPiso - yTeto}"/></clipPath>`;
    t += `<rect x="${xE}" y="${yTeto}" width="${l}" height="${yPiso - yTeto}" fill="${correta ? '#fff6cf' : '#454b58'}"/>`;
    const cone = (cx, abre, cor) => `<polygon points="${cx - 26},${yTeto + 12} ${cx + 26},${yTeto + 12} ${cx + abre},${yPiso} ${cx - abre},${yPiso}" fill="${cor}" clip-path="url(#${clip})"/>`;
    const lamp = cx => `<rect x="${cx - 34}" y="${yTeto}" width="68" height="12" fill="#fff" stroke="${C.linha}" stroke-width="2"/>`;
    if (correta) {
      for (const cx of [x + 130, x + 320, x + 510]) t += cone(cx, 150, 'rgba(255,214,84,.28)');
      for (const cx of [x + 130, x + 320, x + 510]) t += lamp(cx);
    } else {
      t += cone(x + 450, 150, '#fff3b0') + lamp(x + 450);
    }
    // Janela na parede da direita
    t += `<rect x="${x + 602}" y="210" width="22" height="200" fill="${correta ? '#dbe7f3' : '#fffbe0'}" stroke="${C.linha}" stroke-width="2.5"/>`;
    if (correta) {
      t += `<rect x="${x + 566}" y="192" width="36" height="236" fill="#b9c8d8" stroke="${C.linha}" stroke-width="2.5"/>`;
      for (let d = 10; d < 36; d += 12) t += linhaFina(x + 566 + d, 192, x + 566 + d, 428, 1.6);
    } else {
      for (const [dy, fim] of [[-40, -14], [0, 2], [40, 18]]) {
        t += `<line x1="${x + 600}" y1="${310 + dy}" x2="${x + 170}" y2="${430 + fim}" stroke="#ffd84d" stroke-width="7"/>`;
      }
    }
    // Pessoa sentada à mesa
    t += `<rect x="${xE}" y="${yPiso}" width="${l}" height="74" fill="${C.piso}" stroke="${C.linha}" stroke-width="2"/>`;
    t += `<circle cx="${x + 130}" cy="436" r="24" fill="#555" stroke="${correta ? 'none' : '#fff'}" stroke-width="2"/>`;
    t += `<rect x="${x + 108}" y="462" width="44" height="92" rx="14" fill="#555" stroke="${correta ? 'none' : '#fff'}" stroke-width="2"/>`;
    t += `<rect x="${x + 96}" y="554" width="64" height="12" fill="#777"/><rect x="${x + 122}" y="566" width="12" height="64" fill="#777"/>`;
    t += `<rect x="${x + 170}" y="516" width="270" height="14" fill="#fff" stroke="${C.linha}" stroke-width="2.5"/>`;
    t += `<rect x="${x + 186}" y="530" width="12" height="100" fill="#777"/><rect x="${x + 412}" y="530" width="12" height="100" fill="#777"/>`;
    if (correta) {
      t += texto(x + 300, 190, 'Luminárias bem distribuídas', { tam: 24 });
      t += texto(x + 300, 300, 'Sem sombra sobre', { tam: 23, peso: 600 });
      t += texto(x + 300, 330, 'mesas, lousa e bancadas', { tam: 23, peso: 600 });
      t += texto(x + 556, 470, 'Cortina ou persiana', { tam: 22, peso: 600, anc: 'end' });
    } else {
      t += texto(x + 180, 476, 'Sombra', { tam: 23, cor: '#fff', anc: 'start', halo: false });
      t += texto(x + 180, 504, 'na mesa', { tam: 23, cor: '#fff', anc: 'start', halo: false });
      t += texto(x + 170, 220, 'Ofuscamento', { tam: 25, cor: '#fff', halo: false });
      t += texto(x + 170, 252, 'Janela sem proteção', { tam: 21, peso: 500, cor: '#fff', halo: false });
    }
    return t;
  };
  const s = cena(30, false) + cena(706, true);
  return {
    nome: 'iluminacao_uniforme',
    itens: [45, 97, 109, 130, 140, 172],
    derivados: [],
    svg: documento({
      titulo: 'Iluminação uniforme',
      descricao: 'Dois cortes de um ambiente com uma pessoa sentada à mesa. No incorreto, há uma só luminária, sombra sobre a mesa e ofuscamento por uma janela sem proteção. No correto, as luminárias são bem distribuídas, não há sombra sobre mesas, lousa e bancadas, e a janela tem cortina ou persiana.',
      conteudo: s,
    }),
  };
}

// ---------------------------------------------------------------------------
function escadaInclinacao() {
  const xl = 110, xr = 780, ya = 240, T = 60, R = 170;
  const yEm = (x, base) => base + T * (x - xl) / (xr - xl);
  let s = texto(xl, 60, 'Escada vista de frente', { tam: 26, anc: 'start', halo: false });
  for (let i = 0; i < 2; i++) {
    const b = ya + i * R;
    s += `<polygon points="${xl},${b} ${xr},${b + T} ${xr},${b + T + R} ${xl},${b + R}" fill="${i % 2 ? C.patamar : C.piso}" stroke="${C.linha}" stroke-width="3"/>`;
  }
  const b2 = ya + 2 * R;
  s += `<polygon points="${xl},${b2} ${xr},${b2 + T} ${xr},680 ${xl},680" fill="${C.piso}" stroke="${C.linha}" stroke-width="3"/>`;

  s += texto((xl + xr) / 2, yEm((xl + xr) / 2, ya + R) + 92, 'Confira degraus e patamares', { tam: 24, peso: 600 });
  s += linhaFina(xl, ya, xr + 40, ya, 2.5, C.cota, 'stroke-dasharray="11 8"');
  s += texto(xl, ya - 16, 'Linha de nível', { tam: 21, peso: 500, anc: 'start' });
  s += seta({ x: xr + 26, y: ya }, { x: xr + 26, y: ya + T }, { largura: 3, ponta: 10 });
  s += texto(xr + 40, ya + T / 2 + 9, 'Caimento', { tam: 24, anc: 'start' });

  const xc = 445, yc = yEm(xc, ya), ang = Math.atan2(T, xr - xl) * 180 / Math.PI;
  s += celular(xc, yc, ang);
  s += texto(xc, yc + 62, 'Celular apoiado no degrau', { tam: 23, peso: 600 });
  s += seta({ x: xc - 190, y: yEm(xc - 190, ya) + 90 }, { x: xc + 190, y: yEm(xc + 190, ya) + 90 }, { largura: 3.5, ponta: 15 });
  s += texto(xc, yc + 134, 'Atravessado, de um lado ao outro', { tam: 23, peso: 600 });

  const D = { x: 950, y: 110, l: 380, a: 340 };
  s += `<rect x="${D.x}" y="${D.y}" width="${D.l}" height="${D.a}" fill="#fff" stroke="${C.linha}" stroke-width="2.5" rx="8"/>`;
  const tl = (dy, t, tam, peso = 700) => texto(D.x + 22, D.y + dy, t, { tam, peso, anc: 'start', halo: false });
  s += tl(42, 'Inclinação transversal', 24);
  s += tl(88, 'Escada externa', 21, 500) + tl(122, 'máx. 2%', 28) + tl(152, '1,1° no celular', 20, 500);
  s += tl(204, 'Escada interna', 21, 500) + tl(238, 'máx. 1%', 28) + tl(268, '0,6° no celular', 20, 500);
  s += tl(314, 'Meça em pelo menos 3 pontos', 20, 600);
  s += `<text x="1330" y="722" font-size="19" text-anchor="end" fill="${C.muted}">Inclinação ampliada para ficar visível.</text>`;

  return {
    nome: 'escada_inclinacao',
    itens: [17, 57],
    derivados: [],
    svg: documento({
      titulo: 'Inclinação transversal na escada',
      descricao: 'Escada vista de frente, com o caimento dos degraus ampliado para ficar visível e um celular apoiado de um lado ao outro. O limite é de 2 por cento, ou 1,1 grau no celular, na escada externa, e de 1 por cento, ou 0,6 grau, na escada interna.',
      conteudo: s,
    }),
  };
}

// ---------------------------------------------------------------------------
function corrimaoBraille() {
  let s = texto(40, 60, 'Corrimão visto de lado', { tam: 26, anc: 'start', halo: false });

  // Tubo e suportes
  const yT = 420, D = 44, cx = 460;
  s += `<rect x="60" y="640" width="800" height="60" fill="${C.piso}" stroke="${C.linha}" stroke-width="2.5"/>`;
  for (const x of [170, 750]) s += `<rect x="${x - 8}" y="${yT + D}" width="16" height="${640 - yT - D}" fill="#777" stroke="${C.linha}" stroke-width="2"/>`;
  s += `<rect x="60" y="${yT}" width="800" height="${D}" rx="22" fill="#b5bcc4" stroke="${C.linha}" stroke-width="3"/>`;
  s += `<rect x="72" y="${yT + 8}" width="776" height="8" rx="4" fill="#e3e7ea"/>`;
  s += `<rect x="${cx - 40}" y="${yT - 7}" width="80" height="10" rx="3" fill="${AZUL}" stroke="${C.linha}" stroke-width="1.5"/>`;

  // Detalhe ampliado, com o Braille real do número 3
  const yZ = 180, r = 130;
  s += linhaFina(cx - 40, yT - 7, cx - 96, yZ + r - 34, 1.8) + linhaFina(cx + 40, yT - 7, cx + 96, yZ + r - 34, 1.8);
  s += `<circle cx="${cx}" cy="${yZ}" r="${r}" fill="#fff" stroke="${C.linha}" stroke-width="3"/>`;
  s += `<text x="${cx - 60}" y="${yZ + 32}" font-size="96" font-weight="800" text-anchor="middle" fill="${C.cota}">3</text>`;
  const celula = (x0, pontos) => pontos.map(p => {
    const col = p > 3 ? 1 : 0, lin = (p - 1) % 3;
    return `<circle cx="${x0 + col * 20}" cy="${yZ - 20 + lin * 20}" r="7.5" fill="${C.cota}"/>`;
  }).join('');
  s += celula(cx + 2, [3, 4, 5, 6]) + celula(cx + 52, [1, 4]);
  s += texto(cx, yZ + 88, 'Relevo e Braille', { tam: 20, peso: 600, halo: false });

  s += texto(cx, 530, 'Número do pavimento', { tam: 25 });
  s += texto(cx, 562, 'em relevo e em Braille', { tam: 25 });

  // Corte do tubo
  const xc = 1110, yc = 400, rc = 92;
  s += texto(xc, 60, 'Corte do corrimão', { tam: 26, halo: false });
  s += `<rect x="${xc - 14}" y="${yc + rc - 4}" width="28" height="130" fill="#777" stroke="${C.linha}" stroke-width="2"/>`;
  s += `<circle cx="${xc}" cy="${yc}" r="${rc}" fill="#b5bcc4" stroke="${C.linha}" stroke-width="3"/>`;
  const a = 0.5, dx = (rc * Math.sin(a)).toFixed(1), dy = (rc * Math.cos(a)).toFixed(1);
  s += `<path d="M ${xc - dx} ${yc - dy} A ${rc} ${rc} 0 0 1 ${Number(xc) + Number(dx)} ${yc - dy}" fill="none" stroke="${AZUL}" stroke-width="12" stroke-linecap="round"/>`;
  s += seta({ x: xc, y: 240 }, { x: xc, y: yc - rc - 12 }, { dupla: false, largura: 3, ponta: 13 });
  s += texto(xc, 176, 'Geratriz superior', { tam: 26 });
  s += texto(xc, 210, 'A parte de cima do tubo, onde a mão passa', { tam: 20, peso: 500 });

  return {
    nome: 'corrimao_braille',
    itens: [29, 78],
    derivados: [],
    svg: documento({
      titulo: 'Braille no corrimão',
      descricao: 'Corrimão visto de lado com o número do pavimento em relevo e em Braille. O detalhe mostra o número 3 e sua escrita em Braille. O corte do tubo indica a geratriz superior, a parte de cima, onde a mão passa.',
      conteudo: s,
    }),
  };
}

// ---------------------------------------------------------------------------
function estacionamentoPercurso() {
  let s = `<rect x="30" y="30" width="1316" height="710" fill="#8a8a8a" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += texto(56, 76, 'Vista de cima, sem escala', { tam: 24, anc: 'start' });

  // Edificação
  s += ret(860, 50, 466, 220, C.branco);
  s += texto(1093, 150, 'Edificação', { tam: 28, halo: false });
  s += `<rect x="990" y="258" width="120" height="24" fill="#fff" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += texto(1050, 240, 'Acesso', { tam: 24, halo: false });

  // Faixa de pedestres até o acesso
  const yF = 380, aF = 110, xV = 995, lV = 110;
  s += `<path d="M 70 ${yF} H ${xV} V 282 H ${xV + lV} V ${yF + aF} H 70 Z" fill="#ededed" stroke="${C.linha}" stroke-width="2.5"/>`;

  // Vagas
  const lv = 170, yV = yF + aF, aV = 220;
  s += `<rect x="70" y="${yV}" width="${lv}" height="${aV}" fill="#cfe0f2"/>`;
  for (let i = 0; i <= 5; i++) s += `<line x1="${70 + i * lv}" y1="${yV}" x2="${70 + i * lv}" y2="${yV + aV}" stroke="#fff" stroke-width="6"/>`;
  s += simboloAcesso(70 + lv / 2 - 45, yV + 80, 90);
  s += texto(70 + 2.5 * lv, yV + 118, 'Outras vagas', { tam: 24 });

  // Rota
  const yM = yF + aF / 2, xM = xV + lV / 2;
  s += `<polyline points="${70 + lv / 2},${yV + 70} ${70 + lv / 2},${yM} ${xM},${yM} ${xM},312" fill="none" stroke="${AZUL}" stroke-width="8" stroke-linejoin="round"/>`;
  s += seta({ x: xM, y: 330 }, { x: xM, y: 288 }, { dupla: false, largura: 8, cor: AZUL, ponta: 22 });

  // Medidas
  s += seta({ x: 760, y: yF + aF }, { x: 760, y: yF }, { largura: 3 });
  s += texto(760, yF - 16, 'Largura da faixa: mín. 1,20 m', { tam: 25 });
  s += texto(90, yF - 50, 'Percurso da vaga ao acesso', { tam: 25, anc: 'start' });
  s += texto(90, yF - 16, 'máx. 50 m', { tam: 30, anc: 'start' });

  return {
    nome: 'estacionamento_percurso',
    itens: [37, 39],
    derivados: [],
    svg: documento({
      titulo: 'Percurso da vaga ao acesso',
      descricao: 'Vista de cima de um estacionamento. Uma faixa de pedestres com largura mínima de 1,20 metro liga a vaga reservada ao acesso da edificação, por uma rota de no máximo 50 metros.',
      conteudo: s,
    }),
  };
}

// ---------------------------------------------------------------------------
function elevadorEntrada() {
  let s = texto(365, 60, 'Porta contrasta com a parede', { tam: 26, halo: false });
  const parede = (x, corP, corD, ok) => {
    const l = 330, yP = 620;
    let t = `<rect x="${x}" y="96" width="${l}" height="${yP - 96}" fill="${corP}" stroke="${C.linha}" stroke-width="2.5"/>`;
    t += `<rect x="${x}" y="${yP}" width="${l}" height="50" fill="${C.piso}" stroke="${C.linha}" stroke-width="2.5"/>`;
    t += `<rect x="${x + 60}" y="170" width="170" height="${yP - 170}" fill="${corD}" stroke="${C.linha}" stroke-width="2.5"/>`;
    t += `<line x1="${x + 145}" y1="170" x2="${x + 145}" y2="${yP}" stroke="${C.linha}" stroke-width="2"/>`;
    t += `<rect x="${x + 254}" y="370" width="36" height="56" rx="5" fill="#333" stroke="${C.linha}" stroke-width="2"/><circle cx="${x + 272}" cy="398" r="9" fill="#fff"/>`;
    t += texto(x + l / 2, 708, ok ? 'Correto' : 'Incorreto', { tam: 26, cor: ok ? VERDE : VERMELHO });
    return t;
  };
  s += parede(30, '#f2efe6', '#23476b', true) + parede(380, '#c9c9c9', '#c4c4c4', false);

  // Piso da cabina
  const x0 = 800, l = 400, yC = 100, aC = 260, yS = yC + aC, aS = 26, yP = yS + aS, aP = 280;
  s += texto(x0 + l / 2, 60, 'Piso da cabina, visto de cima', { tam: 26, halo: false });
  s += `<rect x="${x0}" y="${yC}" width="${l}" height="${aC}" fill="#37465a" stroke="${C.linha}" stroke-width="6"/>`;
  for (let i = 0; i < 12; i++) for (let j = 0; j < 8; j++) {
    const px = x0 + 26 + i * 32 + (j % 2) * 16, py = yC + 24 + j * 30;
    if (px < x0 + l - 12) s += `<path d="M ${px} ${py - 6} l 7 6 l -7 6 l -7 -6 Z" fill="#5d6d82"/>`;
  }
  s += texto(x0 + l / 2, yC + aC / 2 - 16, 'Cabina', { tam: 28, cor: '#fff', halo: false });
  s += texto(x0 + l / 2, yC + aC / 2 + 16, 'Piso duro e antiderrapante', { tam: 23, peso: 600, cor: '#fff', halo: false });
  s += `<rect x="${x0}" y="${yS}" width="${l}" height="${aS}" fill="#8a8a8a" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += texto(x0 + l + 16, yS + 12, 'Soleira:', { tam: 22, anc: 'start', halo: false });
  s += texto(x0 + l + 16, yS + 40, 'não conta', { tam: 21, peso: 500, anc: 'start', halo: false });
  s += `<rect x="${x0}" y="${yP}" width="${l}" height="${aP}" fill="#ece8dc" stroke="${C.linha}" stroke-width="2.5"/>`;
  for (let i = 1; i < 4; i++) s += linhaFina(x0 + l * i / 4, yP, x0 + l * i / 4, yP + aP, 1.5, '#a8a494');
  for (let i = 1; i < 3; i++) s += linhaFina(x0, yP + aP * i / 3, x0 + l, yP + aP * i / 3, 1.5, '#a8a494');
  s += texto(x0 + l / 2, yP + aP / 2 - 8, 'Pavimento', { tam: 28 });
  s += texto(x0 + l / 2, yP + aP / 2 + 24, 'Cor contrastante com a cabina', { tam: 22, peso: 600 });

  return {
    nome: 'elevador_entrada',
    itens: [81, 85],
    derivados: [],
    svg: documento({
      titulo: 'Contraste na entrada do elevador',
      descricao: 'À esquerda, duas paredes com porta de elevador: a porta escura em parede clara contrasta e está correta; a porta cinza em parede cinza não contrasta e está incorreta. À direita, vista de cima: o piso da cabina é duro, antiderrapante e contrasta com o piso do pavimento, sem contar a soleira.',
      conteudo: s,
    }),
  };
}

// ---------------------------------------------------------------------------
function bebedouroBica() {
  const cena = (x, correto) => {
    const yB = 350, aB = 90, xP = x + 66, lB = 280, yPiso = 650;
    let t = quadro(x, 30, 628, 690, correto ? 'Correto: jato inclinado, na frente' : 'Incorreto: jato vertical, atrás', correto ? VERDE : VERMELHO);
    t += `<rect x="${x + 16}" y="${yPiso}" width="596" height="54" fill="${C.piso}" stroke="${C.linha}" stroke-width="2"/>`;
    t += `<rect x="${x + 16}" y="96" width="50" height="${yPiso - 96}" fill="${C.patamar}" stroke="${C.linha}" stroke-width="2.5"/>`;
    t += `<rect x="${xP}" y="${yB + aB}" width="60" height="${yPiso - yB - aB}" fill="#d0d0d0" stroke="${C.linha}" stroke-width="2.5"/>`;
    t += `<path d="M ${xP} ${yB} H ${xP + lB} V ${yB + aB - 20} Q ${xP + lB} ${yB + aB} ${xP + lB - 20} ${yB + aB} H ${xP} Z" fill="#fff" stroke="${C.linha}" stroke-width="3"/>`;
    const jato = '#2f80d0';
    if (correto) {
      const bx = xP + lB - 26;
      t += `<rect x="${bx - 9}" y="${yB - 34}" width="18" height="34" rx="4" fill="#666" stroke="${C.linha}" stroke-width="2"/>`;
      t += `<path d="M ${bx} ${yB - 36} Q ${bx - 60} ${yB - 170} ${bx - 120} ${yB - 76}" fill="none" stroke="${jato}" stroke-width="7" stroke-linecap="round"/>`;
      t += `<path d="M ${bx - 148} ${yB - 80} H ${bx - 92} L ${bx - 100} ${yB} H ${bx - 140} Z" fill="#fff" stroke="${C.linha}" stroke-width="2.5"/>`;
      t += `<path d="M ${bx - 145} ${yB - 56} H ${bx - 95} L ${bx - 100} ${yB - 1} H ${bx - 140} Z" fill="#9cc6ee"/>`;
      t += texto(x + 372, 170, 'Jato inclinado', { tam: 25, anc: 'start' });
      t += texto(x + 372, 204, 'Enche o copo', { tam: 21, peso: 500, anc: 'start' });
      t += texto(x + 372, 340, 'Bica no lado frontal', { tam: 23, peso: 600, anc: 'start' });
    } else {
      const bx = xP + 40;
      t += `<rect x="${bx - 9}" y="${yB - 34}" width="18" height="34" rx="4" fill="#666" stroke="${C.linha}" stroke-width="2"/>`;
      t += `<path d="M ${bx} ${yB - 36} V ${yB - 150}" fill="none" stroke="${jato}" stroke-width="7" stroke-linecap="round"/>`;
      t += `<path d="M ${bx + 70} ${yB - 80} H ${bx + 126} L ${bx + 118} ${yB} H ${bx + 78} Z" fill="#fff" stroke="${C.linha}" stroke-width="2.5"/>`;
      t += `<path d="M ${bx + 78} ${yB - 56} l 40 40 m 0 -40 l -40 40" stroke="${VERMELHO}" stroke-width="6" stroke-linecap="round"/>`;
      t += texto(x + 372, 170, 'Jato vertical', { tam: 25, anc: 'start' });
      t += texto(x + 372, 204, 'Não enche o copo', { tam: 21, peso: 500, anc: 'start' });
      t += texto(x + 372, 340, 'Bica longe da frente', { tam: 23, peso: 600, anc: 'start' });
    }
    t += seta({ x: xP + lB + 16, y: yB + aB + 50 }, { x: xP + lB + 116, y: yB + aB + 50 }, { dupla: false, largura: 3.5, ponta: 15 });
    t += texto(xP + lB + 16, yB + aB + 90, 'Frente do bebedouro', { tam: 22, peso: 600, anc: 'start' });
    return t;
  };
  const s = cena(40, true) + cena(708, false);
  return {
    nome: 'bebedouro_bica',
    itens: [87, 184],
    derivados: [],
    svg: documento({
      titulo: 'Bica do bebedouro',
      descricao: 'Dois bebedouros vistos de lado. No correto, a bica fica no lado frontal e tem jato inclinado, que enche um copo. No incorreto, a bica fica longe da frente e o jato é vertical, o que não permite encher o copo.',
      conteudo: s,
    }),
  };
}

// ---------------------------------------------------------------------------
function inclinacaoLongitudinal() {
  const xa = 90, xb = 1290, ya = 570, yb = 450;
  const yEm = x => ya + (yb - ya) * (x - xa) / (xb - xa);
  let s = texto(xa, 60, 'Corredor visto de lado', { tam: 26, anc: 'start', halo: false });
  s += `<polygon points="${xa},${ya} ${xb},${yb} ${xb},690 ${xa},690" fill="${C.piso}" stroke="${C.linha}" stroke-width="3"/>`;
  s += linhaFina(xa, ya, xb, ya, 2.5, C.cota, 'stroke-dasharray="11 8"');
  s += texto(xb - 44, ya + 28, 'Linha de nível', { tam: 21, peso: 500, anc: 'end' });
  s += texto(xb - 44, ya - 30, 'Subida', { tam: 22, anc: 'end' });
  s += seta({ x: xb - 30, y: ya }, { x: xb - 30, y: yEm(xb - 30) }, { largura: 3 });

  // Pessoa caminhando
  const px = 240, py = yEm(px);
  s += `<circle cx="${px}" cy="${py - 238}" r="23" fill="#555"/><rect x="${px - 24}" y="${py - 212}" width="48" height="112" rx="16" fill="#555"/><rect x="${px - 20}" y="${py - 104}" width="17" height="104" fill="#555"/><rect x="${px + 3}" y="${py - 104}" width="17" height="104" fill="#555"/>`;
  s += seta({ x: px + 60, y: py - 110 }, { x: px + 300, y: yEm(px + 300) - 110 }, { dupla: false, largura: 5, ponta: 18, cor: AZUL });
  s += texto(px + 70, py - 168, 'Sentido da caminhada', { tam: 24, anc: 'start' });

  // Celular apoiado no piso
  const xc = 720, yc = yEm(xc), ang = Math.atan2(yb - ya, xb - xa) * 180 / Math.PI;
  s += celular(xc, yc, ang);
  s += texto(xc, 616, 'Celular apoiado no piso', { tam: 24, peso: 600 });
  s += texto(xc, 650, 'Alinhado com o sentido da caminhada', { tam: 24, peso: 600 });

  // Limite
  const D = { x: 860, y: 70, l: 430, a: 270 };
  s += `<rect x="${D.x}" y="${D.y}" width="${D.l}" height="${D.a}" fill="#fff" stroke="${C.linha}" stroke-width="2.5" rx="8"/>`;
  const tl = (dy, t, tam, peso = 700) => texto(D.x + 22, D.y + dy, t, { tam, peso, anc: 'start', halo: false });
  s += tl(42, 'Inclinação longitudinal', 24);
  s += tl(96, 'Inferior a 5%', 32);
  s += tl(130, 'Menos de 2,9° no celular', 21, 500);
  s += tl(176, 'Meça em 3 pontos do percurso', 21, 500);
  s += tl(226, 'A partir de 5%: trate como rampa', 21, 600);
  s += `<text x="1290" y="726" font-size="19" text-anchor="end" fill="${C.muted}">Inclinação ampliada para ficar visível.</text>`;

  return {
    nome: 'inclinacao_longitudinal',
    itens: [49],
    derivados: [],
    svg: documento({
      titulo: 'Inclinação longitudinal do piso',
      descricao: 'Corredor visto de lado, com a inclinação ampliada para ficar visível e um celular apoiado no piso, alinhado com o sentido da caminhada. A inclinação deve ser inferior a 5 por cento, ou menos de 2,9 graus no celular. A partir de 5 por cento, o trecho deve ser tratado como rampa.',
      conteudo: s,
    }),
  };
}

export const LOTE4 = [escadaPisoTatil, portaEspacoLateral, balcaoAutosservico, saidaAntipanico, areaResgate, iluminacaoUniforme, escadaInclinacao, corrimaoBraille, estacionamentoPercurso, elevadorEntrada, bebedouroBica, inclinacaoLongitudinal];
