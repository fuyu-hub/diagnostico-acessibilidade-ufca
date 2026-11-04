// As 3 figuras de teste. Cada uma declara os itens do checklist que sustentam os valores desenhados.
import { C, criarVista, texto, seta, tatilAlerta, tatilDirecional, amostraAlerta, amostraDirecional, documento } from './lib.mjs';

// ---------------------------------------------------------------------------
// Rampa: comprimento e altura esquemáticos, porque em escala real cada lance teria 9,60 m
// ---------------------------------------------------------------------------
function rampa() {
  const v = criarVista({ escala: 64, origem: { x: 372, y: 198 } });
  const LARG = 2.4, PAT = 2.3, LANCE = 2.5, ALT = 0.8, FAIXA = 0.6;
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
    for (const h of [0.92, 0.7]) {
      for (let i = 0; i < marcos.length - 1; i++) {
        s += v.linha([marcos[i], y, altura(marcos[i]) + h], [marcos[i + 1], y, altura(marcos[i + 1]) + h], 3.2);
      }
    }
    for (const x of [0.1, PAT, PAT + LANCE / 2, PAT + LANCE, 2 * PAT + LANCE, 2 * PAT + 1.5 * LANCE, 2 * PAT + 2 * LANCE, COMPR - 0.1]) {
      s += v.linha([x, y, altura(x)], [x, y, altura(x) + 0.92], 2.4);
    }
    return s;
  };

  let s = corrimao(0);
  for (const t of trechos) {
    s += v.poli([[t.x0, LARG, 0], [t.x1, LARG, 0], [t.x1, LARG, t.z1], [t.x0, LARG, t.z0]], C.branco);
    s += v.poli([[t.x0, 0, t.z0], [t.x1, 0, t.z1], [t.x1, LARG, t.z1], [t.x0, LARG, t.z0]], t.tipo === 'patamar' ? C.patamar : C.piso);
  }

  // Piso tátil: alerta no início e no fim de cada lance; direcional conduzindo até a rampa
  const CENTRO = LARG / 2, META = 0.42;
  s += tatilDirecional(v, 0.05, PAT - FAIXA, CENTRO - META, CENTRO + META, 2 * ALT, 0.2, 0.42, 0.12);
  s += tatilAlerta(v, PAT - FAIXA, PAT, 0, LARG, 2 * ALT, 0.2, 0.066);
  s += tatilAlerta(v, PAT + LANCE, PAT + LANCE + FAIXA, 0, LARG, ALT, 0.2, 0.066);
  s += tatilAlerta(v, 2 * PAT + LANCE - FAIXA, 2 * PAT + LANCE, 0, LARG, ALT, 0.2, 0.066);
  s += tatilAlerta(v, 2 * PAT + 2 * LANCE, 2 * PAT + 2 * LANCE + FAIXA, 0, LARG, 0, 0.2, 0.066);
  s += tatilDirecional(v, 2 * PAT + 2 * LANCE + FAIXA, COMPR - 0.05, CENTRO - META, CENTRO + META, 0, 0.2, 0.42, 0.12);
  s += corrimao(LARG);

  // Cotas
  const O = 0.72;
  const cotaPatamar = (x0, x1, dx, dy) => {
    const a = v.proj(x0, LARG + O), b = v.proj(x1, LARG + O);
    return v.linha([x0, LARG, 0], [x0, LARG + O + 0.14, 0], 1.5) + v.linha([x1, LARG, 0], [x1, LARG + O + 0.14, 0], 1.5)
      + seta(a, b) + texto((a.x + b.x) / 2 + dx, (a.y + b.y) / 2 + dy, 'Patamar: mín. 1,20 m');
  };
  s += cotaPatamar(2 * PAT + 2 * LANCE, COMPR, -86, 54);
  s += cotaPatamar(PAT + LANCE, 2 * PAT + LANCE, 66, 76);

  const larg0 = v.proj(COMPR + 0.5, 0), larg1 = v.proj(COMPR + 0.5, LARG);
  s += v.linha([COMPR, 0, 0], [COMPR + 0.65, 0, 0], 1.5) + v.linha([COMPR, LARG, 0], [COMPR + 0.65, LARG, 0], 1.5);
  s += seta(larg0, larg1);
  const legX = (larg0.x + larg1.x) / 2 + 24, legY = (larg0.y + larg1.y) / 2 + 40;
  s += texto(legX, legY, 'Largura: mín. 1,20 m', { anc: 'start' });
  s += texto(legX, legY + 26, '(recomendável 1,50 m)', { tam: 19, peso: 500, anc: 'start' });

  // Declividade sobre o lance inferior
  const decl = 2 * PAT + 1.62 * LANCE, ponto = v.proj(decl, LARG * 0.5, altura(decl));
  const alvo = v.proj(decl - 1.0, LARG * 0.5, altura(decl - 0.9));
  s += seta(ponto, alvo, { largura: 3.5, dupla: false, ponta: 16 });
  s += texto(ponto.x + 88, ponto.y - 2, 'i ≤ 8,33%', { tam: 24 });

  // Quadro da declividade, em escala real
  const Q = { x: 878, y: 28, l: 470, a: 192 };
  const bx = Q.x + 30, by = Q.y + 112, run = 410, rise = run / 12;
  s += `<rect x="${Q.x}" y="${Q.y}" width="${Q.l}" height="${Q.a}" fill="#fff" stroke="${C.linha}" stroke-width="2" rx="6"/>`;
  s += texto(Q.x + 22, Q.y + 34, 'Declividade em escala real (1:12)', { tam: 21, anc: 'start', halo: false });
  s += `<polygon points="${bx},${by} ${bx + run},${by} ${bx + run},${by - rise}" fill="${C.piso}" stroke="${C.linha}" stroke-width="2"/>`;
  s += texto(bx + run / 2, by + 26, '9,60 m de comprimento para vencer 0,80 m', { tam: 18, peso: 500, halo: false });
  s += texto(Q.x + 22, Q.y + 172, 'Desnível máximo por lance: 0,80 m', { tam: 20, anc: 'start', halo: false });

  // Legenda do piso tátil
  const L = { x: 24, y: 512, lado: 104 };
  s += `<rect x="${L.x}" y="${L.y}" width="444" height="236" fill="#fff" stroke="${C.linha}" stroke-width="2" rx="6"/>`;
  s += texto(L.x + 18, L.y + 32, 'Piso tátil (detalhe, visto de cima)', { tam: 20, anc: 'start', halo: false });
  s += amostraAlerta(L.x + 18, L.y + 48, L.lado);
  s += texto(L.x + 136, L.y + 72, 'Alerta', { tam: 20, anc: 'start', halo: false });
  s += texto(L.x + 136, L.y + 98, 'Relevos em pontos: avisam', { tam: 17, peso: 500, anc: 'start', halo: false });
  s += texto(L.x + 136, L.y + 120, 'do risco no início e no fim', { tam: 17, peso: 500, anc: 'start', halo: false });
  s += texto(L.x + 136, L.y + 142, 'de cada lance', { tam: 17, peso: 500, anc: 'start', halo: false });
  s += amostraDirecional(L.x + 18, L.y + 160, 68);
  s += texto(L.x + 104, L.y + 180, 'Direcional', { tam: 20, anc: 'start', halo: false });
  s += texto(L.x + 104, L.y + 205, 'Relevos em linhas: indicam o caminho', { tam: 17, peso: 500, anc: 'start', halo: false });

  s += `<text x="1352" y="752" font-size="16" text-anchor="end" fill="${C.muted}">Esquema sem escala, exceto o quadro. Rampas novas.</text>`;

  return {
    nome: 'rampa_dimensoes',
    itens: [18, 19, 21, 24, 40, 8, 41],
    derivados: ['9,60 m', '1:12'],
    svg: documento({
      titulo: 'Rampa com dois lances e três patamares',
      descricao: 'Rampa em perspectiva, com patamares no início, entre os lances e no fim, cada um com no mínimo 1,20 metro de comprimento. A largura mínima é de 1,20 metro, recomendável 1,50 metro. A inclinação máxima é de 8,33 por cento, com desnível máximo de 0,80 metro por lance. Há corrimãos nos dois lados. Faixas de piso tátil de alerta, com relevos em pontos, marcam o início e o fim de cada lance. Faixas de piso tátil direcional, com relevos em linhas, conduzem até a rampa.',
      conteudo: s,
    }),
  };
}

// ---------------------------------------------------------------------------
// Corrimão: vista lateral em escala, com detalhe da seção
// ---------------------------------------------------------------------------
function corrimao() {
  const S = 250, PISO = 690;
  const xTopo = 205, xBase = 835;
  const desnivel = ((xBase - xTopo) / S) / 12 * S;
  const yTopo = PISO - desnivel;
  const superficie = x => x <= xTopo ? yTopo : x >= xBase ? PISO : yTopo + (x - xTopo) * (PISO - yTopo) / (xBase - xTopo);
  const ext = 0.3 * S;

  let s = `<polygon points="30,742 30,${yTopo} ${xTopo},${yTopo} ${xBase},${PISO} 1346,${PISO} 1346,742" fill="${C.piso}" stroke="${C.linha}" stroke-width="2.5"/>`;

  const tubo = (h, larg) => {
    const yT = yTopo - h * S, yB = PISO - h * S;
    const x0 = xTopo - ext, x1 = xBase + ext;
    const curva = 26;
    return `<path d="M ${x0 - curva} ${yT + curva} Q ${x0 - curva} ${yT} ${x0} ${yT} L ${xTopo} ${yT} L ${xBase} ${yB} L ${x1} ${yB} Q ${x1 + curva} ${yB} ${x1 + curva} ${yB + curva}" fill="none" stroke="${C.linha}" stroke-width="${larg}" stroke-linecap="round" stroke-linejoin="round"/>`;
  };
  // Montantes
  for (const x of [xTopo - 30, xTopo + 90, xTopo + 430, xBase, xBase + 40]) {
    const y = superficie(x);
    s += `<line x1="${x}" y1="${y}" x2="${x}" y2="${y - 0.92 * S}" stroke="${C.linha}" stroke-width="4"/>`;
  }
  s += tubo(0.92, 9) + tubo(0.7, 9);

  // Alturas
  const xc = xTopo + 315, yc = superficie(xc);
  const y92 = yc - 0.92 * S, y70 = yc - 0.7 * S;
  s += seta({ x: xc - 62, y: yc }, { x: xc - 62, y: y92 }, { largura: 3 });
  s += texto(xc - 74, (yc + y92) / 2 - 4, '0,92 m', { tam: 28, anc: 'end' });
  s += seta({ x: xc + 60, y: yc }, { x: xc + 60, y: y70 }, { largura: 3 });
  s += texto(xc + 72, (yc + y70) / 2 + 14, '0,70 m', { tam: 28, anc: 'start' });
  s += `<line x1="${xc - 84}" y1="${y92}" x2="${xc + 8}" y2="${y92}" stroke="${C.cota}" stroke-width="1.5"/>`;
  s += `<line x1="${xc - 8}" y1="${y70}" x2="${xc + 84}" y2="${y70}" stroke="${C.cota}" stroke-width="1.5"/>`;
  s += `<line x1="${xc - 84}" y1="${yc}" x2="${xc + 84}" y2="${yc}" stroke="${C.cota}" stroke-width="1.5"/>`;

  // Prolongamentos
  const yBaseCorr = PISO - 0.92 * S;
  s += `<line x1="${xBase}" y1="${yBaseCorr - 36}" x2="${xBase}" y2="${yBaseCorr + 4}" stroke="${C.cota}" stroke-width="1.5"/>`;
  s += `<line x1="${xBase + ext}" y1="${yBaseCorr - 36}" x2="${xBase + ext}" y2="${yBaseCorr + 4}" stroke="${C.cota}" stroke-width="1.5"/>`;
  s += seta({ x: xBase, y: yBaseCorr - 24 }, { x: xBase + ext, y: yBaseCorr - 24 }, { ponta: 10 });
  s += texto(xBase + ext + 18, yBaseCorr - 50, 'Prolonga pelo menos 0,30 m', { tam: 21, anc: 'start' });
  s += texto(xBase + ext + 18, yBaseCorr - 24, 'além do início e do término', { tam: 21, peso: 500, anc: 'start' });
  s += texto(xBase + ext + 54, PISO - 110, 'Extremidade recurvada', { tam: 21, anc: 'start' });
  s += seta({ x: xBase + ext + 48, y: PISO - 118 }, { x: xBase + ext + 28, y: yBaseCorr + 26 }, { dupla: false, ponta: 11, largura: 2 });
  s += texto(xc, 728, 'Alturas medidas da face superior do corrimão até o piso', { tam: 21, peso: 600, halo: false });

  // Detalhe da seção, ampliado
  const D = { x: 836, y: 24, l: 514, a: 262 };
  s += `<rect x="${D.x}" y="${D.y}" width="${D.l}" height="${D.a}" fill="#fff" stroke="${C.linha}" stroke-width="2" rx="6"/>`;
  s += texto(D.x + 20, D.y + 34, 'Seção do corrimão (ampliada)', { tam: 21, anc: 'start', halo: false });
  const px = D.x + 42;
  s += `<defs><pattern id="hachura" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="10" stroke="${C.linha}" stroke-width="1.5"/></pattern></defs>`;
  s += `<rect x="${px}" y="${D.y + 52}" width="44" height="190" fill="url(#hachura)" stroke="${C.linha}" stroke-width="2"/>`;
  const paredeX = px + 44, gap = 62, r = 44, cx = paredeX + gap + r, cy = D.y + 136;
  s += `<rect x="${paredeX}" y="${cy - 6}" width="${gap}" height="12" fill="${C.parede}" stroke="${C.linha}" stroke-width="1.5"/>`;
  s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.patamar}" stroke="${C.linha}" stroke-width="4"/>`;
  s += seta({ x: paredeX, y: cy + r + 26 }, { x: paredeX + gap, y: cy + r + 26 }, { ponta: 10 });
  s += `<line x1="${paredeX + gap}" y1="${cy + 8}" x2="${paredeX + gap}" y2="${cy + r + 34}" stroke="${C.cota}" stroke-width="1.5"/>`;
  s += texto(paredeX + 6, cy + r + 54, 'Afastamento: mín. 4 cm', { tam: 19, anc: 'start', halo: false });
  s += seta({ x: cx - r, y: cy - r - 16 }, { x: cx + r, y: cy - r - 16 }, { ponta: 10 });
  s += texto(cx + r + 22, cy - 12, 'Diâmetro: entre', { tam: 19, anc: 'start', peso: 500, halo: false });
  s += texto(cx + r + 22, cy + 14, '3 cm e 4,5 cm', { tam: 21, anc: 'start', halo: false });

  return {
    nome: 'corrimao_alturas',
    itens: [24, 27, 28],
    derivados: [],
    svg: documento({
      titulo: 'Alturas e prolongamento do corrimão duplo',
      descricao: 'Vista lateral de rampa com corrimão duplo. O corrimão superior fica a 0,92 metro e o inferior a 0,70 metro, medidos da face superior até o piso. Os corrimãos se prolongam pelo menos 0,30 metro além do início e do término, com extremidades recurvadas. No detalhe, a seção circular tem diâmetro entre 3 e 4,5 centímetros e fica afastada no mínimo 4 centímetros da parede.',
      conteudo: s,
    }),
  };
}

// ---------------------------------------------------------------------------
// Sanitário: ambiente em escala; o círculo de giro é validado contra as peças
// ---------------------------------------------------------------------------
function sanitario() {
  const v = criarVista({ escala: 148, origem: { x: 560, y: 196 } });
  const W = 2.2, D = 2.1, H = 0.95;
  const CIRC = { x: 1.34, y: 1.27, r: 0.75 };

  const BACIA = { x0: 0.22, x1: 0.58, y0: 0, y1: 0.66 };
  const PIA = { x0: 1.62, x1: 2.12, y0: 0, y1: 0.44 };
  for (const [nome, p] of Object.entries({ BACIA, PIA })) {
    const dx = Math.max(p.x0 - CIRC.x, 0, CIRC.x - p.x1), dy = Math.max(p.y0 - CIRC.y, 0, CIRC.y - p.y1);
    if (Math.hypot(dx, dy) < CIRC.r) throw new Error(`Círculo de giro invade ${nome}`);
  }
  if (CIRC.x + CIRC.r > W || CIRC.y + CIRC.r > D || CIRC.x - CIRC.r < 0) throw new Error('Círculo de giro fora do ambiente');

  let s = '';
  // Paredes do fundo
  s += v.poli([[0, 0, 0], [W, 0, 0], [W, 0, H], [0, 0, H]], C.parede);
  s += v.poli([[0, 0, 0], [0, D, 0], [0, D, H], [0, 0, H]], C.branco);
  // Piso
  s += v.poli([[0, 0, 0], [W, 0, 0], [W, D, 0], [0, D, 0]], '#e5e5e5');

  // Transferência lateral (0,80 × 1,20)
  const T = { x0: 0.62, x1: 1.42, y0: 0, y1: 1.2 };
  s += v.poli([[T.x0, T.y0, 0], [T.x1, T.y0, 0], [T.x1, T.y1, 0], [T.x0, T.y1, 0]], 'rgba(11,87,164,0.14)', `stroke-dasharray="9 7" style="stroke:${C.apoio}"`);

  // Círculo de giro
  s += v.circuloPiso(CIRC.x, CIRC.y, 0, CIRC.r, `fill="rgba(11,87,164,0.10)" stroke="${C.apoio}" stroke-width="3" stroke-dasharray="12 8"`);
  const dia0 = v.proj(CIRC.x - CIRC.r, CIRC.y), dia1 = v.proj(CIRC.x + CIRC.r, CIRC.y);
  s += seta(dia0, dia1, { cor: C.apoio, largura: 3 });

  // Barras de apoio
  s += v.linha([0.04, 0.2, 0.75], [0.04, 1.0, 0.75], 7, '#555');
  s += v.linha([0.2, 0.04, 0.75], [1.0, 0.04, 0.75], 7, '#555');

  // Bacia e lavatório
  s += v.caixa(BACIA.x0, BACIA.x1, 0, 0.17, 0, 0.72);
  s += v.caixa(BACIA.x0 + 0.05, BACIA.x1 - 0.05, 0.17, BACIA.y1 - 0.14, 0, 0.45);
  s += v.circuloPiso(0.4, 0.42, 0.45, 0.2, `fill="#fff" stroke="${C.linha}" stroke-width="2.5"`);
  s += v.circuloPiso(0.4, 0.42, 0.45, 0.12, `fill="#d9d9d9" stroke="${C.linha}" stroke-width="2"`);
  s += v.caixa(PIA.x0, PIA.x1, PIA.y0, PIA.y1, 0.7, 0.8);
  s += v.circuloPiso(1.87, 0.22, 0.8, 0.13, `fill="#d9d9d9" stroke="${C.linha}" stroke-width="2"`);

  // Parede frontal baixa, com vão da porta e folha abrindo para fora
  const CURB = 0.1, P0 = 0.72, P1 = P0 + 0.8;
  s += v.poli([[0, D, 0], [P0, D, 0], [P0, D, CURB], [0, D, CURB]], C.branco);
  s += v.poli([[P1, D, 0], [W, D, 0], [W, D, CURB], [P1, D, CURB]], C.branco);
  s += v.poli([[W, 0, 0], [W, D, 0], [W, D, CURB], [W, 0, CURB]], C.branco);
  // Folha e arco de abertura para o lado de fora (y > D)
  const arco = [];
  for (let a = 0; a <= 90; a += 6) arco.push(v.proj(P1 - 0.8 * Math.cos(a * Math.PI / 180), D + 0.8 * Math.sin(a * Math.PI / 180)));
  s += `<polyline points="${arco.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}" fill="none" stroke="${C.cota}" stroke-width="2" stroke-dasharray="7 6"/>`;
  s += v.linha([P1, D, 0], [P1, D + 0.8, 0], 6, C.cota);

  // Rótulos com linha de chamada
  const chamada = (de, x, y, linhas, fimX = x - 8, fimY = y - 8, anc = 'start') => {
    let t = `<line x1="${de.x.toFixed(1)}" y1="${de.y.toFixed(1)}" x2="${fimX}" y2="${fimY}" stroke="${C.cota}" stroke-width="1.8"/>`;
    linhas.forEach(([txt, peso], i) => { t += texto(x, y + i * 27, txt, { tam: i === 0 ? 23 : 20, peso, anc }); });
    return t;
  };
  s += chamada(v.proj(CIRC.x + 0.45, CIRC.y + 0.3), 1010, 402, [['Giro de 360° livre', 700], ['Diâmetro mínimo: 1,50 m', 500]]);
  s += chamada(v.proj(0.9, 0.5), 960, 122, [['Transferência lateral', 700], ['0,80 m × 1,20 m', 500]]);
  s += chamada(v.proj(0.4, 0.42, 0.45), 36, 110, [['Bacia com assento', 700], ['Altura entre 0,43 m e 0,46 m', 500]], 345, 132);
  s += chamada(v.proj((P0 + P1) / 2, D + 0.05), 60, 600, [['Porta abre para fora', 700], ['Vão livre: mín. 0,80 m', 500]], 250, 572);

  s += `<text x="1352" y="752" font-size="16" text-anchor="end" fill="${C.muted}">Ambiente ilustrativo: a norma exige as áreas livres, não estas dimensões de parede.</text>`;

  return {
    nome: 'sanitario_area_manobra',
    itens: [155, 156, 152],
    derivados: ['360°'],
    // Não consta no checklist: vem do catálogo e precisa de confirmação na norma
    aConfirmar: ['0,80 m × 1,20 m'],
    svg: documento({
      titulo: 'Sanitário acessível: giro e transferência',
      descricao: 'Sanitário acessível em perspectiva. Um círculo de 1,50 metro de diâmetro, livre de peças, permite o giro de 360 graus. Ao lado da bacia, uma área de transferência lateral de 0,80 por 1,20 metro. A bacia com assento tem altura entre 0,43 e 0,46 metro. A porta abre para fora e tem vão livre mínimo de 0,80 metro.',
      conteudo: s,
    }),
  };
}

// ---------------------------------------------------------------------------
// Corredor: versão estática da animação da trena
// ---------------------------------------------------------------------------
function corredor() {
  const v = criarVista({ escala: 105, origem: { x: 420, y: 170 } });
  const COMPR = 7, LARG = 1.9, H = 1.3, CURB = 0.08;
  const XLIVRE = 1.6, XEXT = 4.2, RECUO = 0.24;
  const LARANJA = '#d97706';

  let s = '';
  s += v.poli([[0, 0, 0], [COMPR, 0, 0], [COMPR, 0, H], [0, 0, H]], C.parede);
  s += v.poli([[0, 0, 0], [0, LARG, 0], [0, LARG, H], [0, 0, H]], C.branco);
  s += v.poli([[0, 0, 0], [COMPR, 0, 0], [COMPR, LARG, 0], [0, LARG, 0]], C.patamar);

  // Trecho sem obstáculo: tracejado, porque não define a largura
  s += v.linha([XLIVRE, LARG, 0], [XLIVRE, 0, 0], 3.5, '#6b6b6b', 'stroke-dasharray="11 9"');

  // Destaque no piso e obstáculo
  s += v.circuloPiso(XEXT, RECUO / 2, 0, 0.5, `fill="rgba(217,119,6,.18)" stroke="${LARANJA}" stroke-width="3" stroke-dasharray="10 7"`);
  s += v.caixa(XEXT - 0.2, XEXT + 0.2, 0, RECUO, 0.1, 1.05, { topo: '#fca5a5', frente: '#dc2626', lado: '#b91c1c' });

  // Medida no ponto mais estreito
  const a = v.proj(XEXT, LARG), b = v.proj(XEXT, RECUO);
  s += seta(a, b, { cor: LARANJA, largura: 6, ponta: 18 });

  // Parede frontal baixa, cortada para mostrar o interior
  s += v.poli([[0, LARG, 0], [COMPR, LARG, 0], [COMPR, LARG, CURB], [0, LARG, CURB]], C.branco);
  s += v.poli([[COMPR, 0, 0], [COMPR, LARG, 0], [COMPR, LARG, CURB], [COMPR, 0, CURB]], C.branco);

  // Trena apoiada na parede oposta ao obstáculo
  s += `<g transform="translate(${a.x.toFixed(1)} ${a.y.toFixed(1)})"><rect x="-27" y="-24" width="54" height="42" rx="8" fill="${LARANJA}" stroke="${C.linha}" stroke-width="2.5"/><circle cx="0" cy="-3" r="11" fill="#fff" stroke="${C.linha}" stroke-width="2"/></g>`;

  const chamada = (de, x, y, linhas, fimX, fimY) => {
    let t = `<line x1="${de.x.toFixed(1)}" y1="${de.y.toFixed(1)}" x2="${fimX}" y2="${fimY}" stroke="${C.cota}" stroke-width="1.8"/>`;
    linhas.forEach(([txt, peso], i) => { t += texto(x, y + i * 30, txt, { tam: i === 0 ? 27 : 22, peso, anc: 'start' }); });
    return t;
  };
  s += chamada(v.proj(XEXT, (LARG + RECUO) / 2), 150, 640, [['Largura livre: mín. 1,50 m', 700], ['Meça no ponto mais estreito', 500]], 500, 612);
  s += chamada(v.proj(XLIVRE, LARG / 2), 36, 470, [['Trecho sem obstáculo', 700], ['Não define a largura do corredor', 500]], 250, 442);
  s += chamada(v.proj(XEXT + 0.2, RECUO, 0.8), 925, 120, [['Obstáculo reduz a largura', 700], ['Extintor, mural, prateleira ou móvel', 500]], 1040, 142);

  return {
    nome: 'corredor_largura',
    itens: [42, 43],
    derivados: [],
    svg: documento({
      titulo: 'Largura livre do corredor',
      descricao: 'Corredor em perspectiva com um extintor saliente na parede. A trena mede a distância entre a face do extintor e a parede oposta, que é o ponto mais estreito, e essa largura livre deve ter no mínimo 1,50 metro. Uma linha tracejada em um trecho sem obstáculo mostra que aquela medida não define a largura do corredor.',
      conteudo: s,
    }),
  };
}

export const FIGURAS = [rampa, corrimao, sanitario, corredor];
