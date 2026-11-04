// Lote 2: completa a prioridade 1 e substitui as 3 imagens antigas. As medidas vêm das perguntas em `itens`.
import { C, criarVista, texto, seta, tatilAlerta, tatilDirecional, documento } from './lib.mjs';
import { AZUL, ZONA, linhaFina, ret, piso, cotaV, cotaH, chamada, cadeira } from './lote1.mjs';

const VERDE = '#15703a', VERMELHO = '#b91c1c', LARANJA = '#d97706';
const ZONA_L = 'rgba(217,119,6,.18)';

/** Símbolo Internacional de Acesso simplificado. */
export function simboloAcesso(x, y, l) {
  const e = l / 36;
  return `<g transform="translate(${x} ${y}) scale(${e})"><rect width="36" height="36" rx="4" fill="${AZUL}"/><circle cx="18" cy="9" r="4" fill="#fff"/><path d="M 18 14 v 9 h 7 l 3 6 M 12 18 a 8 8 0 1 0 9 11" fill="none" stroke="#fff" stroke-width="2.6"/></g>`;
}

/** Faixa de pontos em vista de cima ou de corte. */
function faixaPontos(x, y, l, a, passo = 18) {
  let s = `<rect x="${x}" y="${y}" width="${l}" height="${a}" fill="${C.tatil}" stroke="${C.linha}" stroke-width="2"/>`;
  for (let px = x + passo / 2; px < x + l; px += passo) for (let py = y + passo / 2; py < y + a; py += passo) {
    s += `<circle cx="${px}" cy="${py}" r="${passo * 0.27}" fill="${C.relevo}"/>`;
  }
  return s;
}

/** Direcional com relevos ao longo de y, para trechos perpendiculares ao eixo x. */
function direcionalEmY(v, x0, x1, y0, y1, z = 0) {
  let s = v.poli([[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]], C.tatil);
  for (let x = x0 + 0.1; x < x1 - 0.04; x += 0.15) for (let y = y0 + 0.05; y < y1 - 0.05; y += 0.46) {
    s += v.linha([x, y, z], [x, Math.min(y + 0.36, y1 - 0.05), z], 3.2, C.relevo);
  }
  return s;
}

// ---------------------------------------------------------------------------
function objetosSalientes() {
  const S = 268, PISO = 680, y = h => PISO - h * S;
  const xp = 300;
  let s = piso(30, 1346, PISO);
  s += `<rect x="${xp - 56}" y="20" width="56" height="${PISO - 20}" fill="#d8d8d8" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += `<rect x="${xp}" y="${y(2.1)}" width="520" height="${(2.1 - 0.6) * S}" fill="${ZONA}" stroke="${AZUL}" stroke-width="2.5" stroke-dasharray="11 8"/>`;
  s += cotaV(xp - 90, PISO, y(0.6), '0,60 m', { ext: 34 });
  s += cotaV(xp - 200, PISO, y(2.1), '2,10 m', { ext: 144, lado: 'dir' });

  // Dentro do limite
  const curto = 34;
  s += ret(xp, y(1.75), curto, 0.42 * S, C.branco);
  s += chamada({ x: xp + curto, y: y(1.55) }, 880, y(1.68), [['Até 10 cm', 700], ['Pode ficar sem sinalização', 500]], 874, y(1.68) - 6);

  // Fora do limite
  const longo = 170;
  s += ret(xp, y(1.2), longo, 0.42 * S, '#dc2626');
  s += seta({ x: xp, y: y(1.2) - 18 }, { x: xp + longo, y: y(1.2) - 18 }, { ponta: 10, largura: 2.5 });
  s += chamada({ x: xp + longo, y: y(1.0) }, 880, y(1.03), [['Mais de 10 cm', 700], ['Precisa de piso tátil de alerta', 500]], 874, y(1.03) - 6);
  s += faixaPontos(xp, PISO, longo + 60, 26, 13);
  s += chamada({ x: xp + longo + 60, y: PISO + 8 }, 880, 642, [['Alerta no piso, sob o objeto', 700]], 874, 636);

  s += texto(xp + 260, y(2.1) + 40, 'Entre 0,60 m e 2,10 m de altura', { tam: 23, halo: false });

  return {
    nome: 'objetos_salientes', itens: [7, 50], derivados: [],
    svg: documento({
      titulo: 'Objetos salientes na parede',
      descricao: 'Corte de uma parede. Entre 0,60 e 2,10 metros de altura, objetos que avançam até 10 centímetros podem ficar sem sinalização. Os que avançam mais de 10 centímetros precisam de piso tátil de alerta sob o objeto.',
      conteudo: s,
    }),
  };
}

// ---------------------------------------------------------------------------
function desniveisPiso() {
  const paineis = [
    { x: 40, titulo: 'Até 5 mm', cor: VERDE, texto1: 'Pode ficar', texto2: 'sem tratamento' },
    { x: 482, titulo: 'De 5 mm a 20 mm', cor: LARANJA, texto1: 'Chanfro com inclinação', texto2: 'máxima de 1:2 (50%)' },
    { x: 924, titulo: 'Acima de 20 mm', cor: VERMELHO, texto1: 'Tratar como degrau,', texto2: 'com rampa associada' },
  ];
  const L = 412;
  let s = '';
  for (const p of paineis) {
    s += `<rect x="${p.x}" y="60" width="${L}" height="500" rx="10" fill="#fff" stroke="${C.linha}" stroke-width="2.5"/>`;
    s += `<rect x="${p.x}" y="60" width="${L}" height="64" rx="10" fill="${p.cor}"/>`;
    s += texto(p.x + L / 2, 104, p.titulo, { tam: 28, cor: '#fff', halo: false });
    s += texto(p.x + L / 2, 470, p.texto1, { tam: 25, halo: false });
    s += texto(p.x + L / 2, 504, p.texto2, { tam: 25, halo: false });
  }
  const base = 340;
  const perfil = (x, d) => `<path d="M ${x} ${base + 40} ${d} V ${base + 40} Z" fill="${C.piso}" stroke="${C.linha}" stroke-width="3" stroke-linejoin="round"/>`;

  // Até 5 mm
  const a = paineis[0].x;
  s += perfil(a + 22, `V ${base} H ${a + 200} V ${base - 16} H ${a + L - 22}`);
  s += seta({ x: a + 170, y: base - 16 }, { x: a + 170, y: base }, { ponta: 6, largura: 2 });

  // Entre 5 mm e 20 mm, com chanfro
  const b = paineis[1].x;
  s += perfil(b + 22, `V ${base} H ${b + 150} L ${b + 270} ${base - 60} H ${b + L - 22}`);
  s += linhaFina(b + 150, base, b + 300, base, 2, C.cota, 'stroke-dasharray="7 6"');
  s += linhaFina(b + 270, base, b + 270, base - 60, 2, C.cota, 'stroke-dasharray="7 6"');
  s += texto(b + 215, base + 28, '2', { tam: 24, halo: false }) + texto(b + 288, base - 22, '1', { tam: 24, anc: 'start' });

  // Acima de 20 mm, com rampa ao lado do degrau
  const c = paineis[2].x;
  s += perfil(c + 22, `V ${base} H ${c + 200} V ${base - 100} H ${c + L - 22}`);
  s += `<polygon points="${c + 22},${base} ${c + 200},${base} ${c + 200},${base - 100}" fill="${ZONA}" stroke="${AZUL}" stroke-width="3" stroke-dasharray="10 7"/>`;
  s += texto(c + 96, base - 66, 'Rampa', { tam: 24, cor: AZUL, halo: false });
  s += `<text x="688" y="610" font-size="20" text-anchor="middle" fill="${C.muted}">Desenhos ampliados, sem escala. O ideal é não haver desnível.</text>`;

  return {
    nome: 'desniveis_piso', itens: [6, 47], derivados: ['1:2'],
    svg: documento({
      titulo: 'Tratamento de desníveis no piso',
      descricao: 'Três casos de desnível. Até 5 milímetros, pode ficar sem tratamento. De 5 a 20 milímetros, precisa de chanfro com inclinação máxima de 1 para 2, ou 50 por cento. Acima de 20 milímetros, é tratado como degrau, com rampa associada.',
      conteudo: s,
    }),
  };
}

// ---------------------------------------------------------------------------
function escadaSinalVisual() {
  const v = criarVista({ escala: 135, origem: { x: 640, y: 225 } });
  const L = 3.6, N = 4, P = 0.5, E = 0.32, Y = N * P;
  let s = '';
  const faixaPiso = (x0, x1, y, z) => v.poli([[x0, y - 0.1, z], [x1, y - 0.1, z], [x1, y, z], [x0, y, z]], LARANJA);
  const faixaEsp = (x0, x1, y, z) => v.poli([[x0, y, z - 0.1], [x1, y, z - 0.1], [x1, y, z], [x0, y, z]], LARANJA);
  for (let k = N - 1; k >= 0; k--) {
    const y0 = Y - P * (k + 1), y1 = Y - P * k, z = E * (k + 1);
    s += v.caixa(0, L, y0 + 0, y1, 0, z, { topo: C.patamar, frente: C.branco, lado: C.parede });
    for (const [a, b] of [[0.08, 0.68], [L - 0.68, L - 0.08]]) {
      s += faixaPiso(a, b, y1, z) + faixaEsp(a, b, y1, z);
    }
  }

  const alvo = v.proj(L - 0.3, Y, E - 0.05);
  s += chamada(alvo, 960, 590, [['Nos pisos e nos espelhos', 700], ['Cor que contrasta com o degrau', 500]], 956, 582);

  // Detalhe ampliado
  const D = { x: 40, y: 430, l: 450, a: 300 };
  s += `<rect x="${D.x}" y="${D.y}" width="${D.l}" height="${D.a}" fill="#fff" stroke="${C.linha}" stroke-width="2.5" rx="8"/>`;
  s += texto(D.x + 20, D.y + 38, 'Faixa (ampliada)', { tam: 23, anc: 'start', halo: false });
  const fx = D.x + 60, fy = D.y + 110, fl = 330, fa = 70;
  s += `<rect x="${fx}" y="${fy}" width="${fl}" height="${fa}" fill="${LARANJA}" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += seta({ x: fx, y: fy + fa + 26 }, { x: fx + fl, y: fy + fa + 26 }, { ponta: 10, largura: 2.5 });
  s += texto(fx + fl / 2, fy + fa + 60, 'Comprimento: mín. 7 cm', { tam: 23, halo: false });
  s += seta({ x: fx - 24, y: fy + fa }, { x: fx - 24, y: fy }, { ponta: 9, largura: 2.5 });
  s += texto(fx, fy - 16, 'Largura: 3 cm', { tam: 23, anc: 'start', halo: false });
  s += texto(960, 680, 'De preferência, fotoluminescente', { tam: 21, peso: 500, anc: 'start' });

  return {
    nome: 'escada_sinal_visual', itens: [16, 61], derivados: [],
    svg: documento({
      titulo: 'Sinalização visual dos degraus',
      descricao: 'Escada com faixas contrastantes no piso e no espelho de cada degrau. Cada faixa tem 3 centímetros de largura e no mínimo 7 centímetros de comprimento, de preferência fotoluminescente.',
      conteudo: s,
    }),
  };
}

// ---------------------------------------------------------------------------
function macanetaAlavanca() {
  const S = 290, PISO = 690, y = h => PISO - h * S;
  let s = piso(30, 640, PISO);
  const x0 = 300, l = 0.8 * S;
  s += `<rect x="30" y="${y(2.25)}" width="610" height="${2.25 * S}" fill="${C.parede}" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += piso(30, 640, PISO);
  s += ret(x0, y(2.1), l, 2.1 * S, C.branco);
  s += `<rect x="${x0 - 60}" y="${y(1.1)}" width="${l + 120}" height="${0.3 * S}" fill="${ZONA}" stroke="${AZUL}" stroke-width="2.5" stroke-dasharray="11 8"/>`;
  const hx = x0 + l - 28, hy = y(0.95);
  s += `<circle cx="${hx}" cy="${hy}" r="13" fill="#777" stroke="${C.linha}" stroke-width="2"/><line x1="${hx}" y1="${hy}" x2="${hx - 72}" y2="${hy}" stroke="${C.linha}" stroke-width="10" stroke-linecap="round"/>`;
  s += cotaV(x0 - 86, PISO, y(0.8), '0,80 m', { ext: 28, lado: 'dir', tam: 21 });
  s += cotaV(x0 - 158, PISO, y(1.1), '1,10 m', { ext: 100 });
  s += texto(x0 + l / 2, y(1.1) - 14, 'Faixa de instalação', { tam: 23 });

  // Detalhe, visto de cima
  const D = { x: 690, y: 90, l: 656, a: 520 };
  s += `<rect x="${D.x}" y="${D.y}" width="${D.l}" height="${D.a}" fill="#fff" stroke="${C.linha}" stroke-width="2.5" rx="8"/>`;
  s += texto(D.x + 24, D.y + 42, 'Maçaneta vista de cima (ampliada)', { tam: 24, anc: 'start', halo: false });
  const fx = D.x + 40, fy = D.y + 350;
  s += `<rect x="${fx}" y="${fy}" width="${D.l - 80}" height="44" fill="${C.patamar}" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += texto(fx + (D.l - 80) / 2, fy + 31, 'Porta', { tam: 22, halo: false });
  const ex = fx + 500, topo = fy - 130;
  s += `<path d="M ${ex} ${fy} V ${topo} H ${ex - 330} q -28 0 -28 30" fill="none" stroke="${C.linha}" stroke-width="20" stroke-linejoin="round" stroke-linecap="round"/>`;
  s += seta({ x: ex, y: topo - 44 }, { x: ex - 358, y: topo - 44 }, { ponta: 10, largura: 2.5 });
  s += texto(ex - 180, topo - 58, 'Comprimento: mín. 10 cm', { tam: 25 });
  s += seta({ x: ex - 180, y: fy }, { x: ex - 180, y: topo + 10 }, { ponta: 10, largura: 2.5 });
  s += texto(ex - 192, fy - 44, 'Distância da porta:', { tam: 22, peso: 500, anc: 'end', halo: false });
  s += texto(ex - 192, fy - 14, 'mín. 4 cm', { tam: 25, anc: 'end', halo: false });
  s += texto(D.x + 24, D.y + D.a - 50, 'Tipo alavanca, sem arestas', { tam: 23, anc: 'start', halo: false });
  s += texto(D.x + 24, D.y + D.a - 18, 'e com a extremidade recurvada', { tam: 23, peso: 500, anc: 'start', halo: false });

  return {
    nome: 'macaneta_alavanca', itens: [31, 94], derivados: [],
    svg: documento({
      titulo: 'Maçaneta do tipo alavanca',
      descricao: 'Porta com maçaneta do tipo alavanca instalada entre 0,80 e 1,10 metro do piso. No detalhe, a maçaneta tem no mínimo 10 centímetros de comprimento, fica a no mínimo 4 centímetros da porta, não tem arestas e tem a extremidade recurvada.',
      conteudo: s,
    }),
  };
}

// ---------------------------------------------------------------------------
function vagaPcd() {
  let s = `<rect x="30" y="30" width="1316" height="710" fill="#8a8a8a" stroke="${C.linha}" stroke-width="2.5"/>`;
  const topo = 60, alt = 450, l = 230, extra = 130;
  const x1 = 110, x2 = x1 + l, x3 = x2 + extra, x4 = x3 + l;
  // Vagas comuns e reservadas
  s += `<rect x="${x2}" y="${topo}" width="${extra}" height="${alt}" fill="#d9d9d9"/>`;
  for (let i = 0; i < 9; i++) {
    const ya = topo + 12 + i * 50;
    s += `<line x1="${x2 + 4}" y1="${ya + 34}" x2="${x2 + extra - 4}" y2="${ya}" stroke="${AZUL}" stroke-width="5"/>`;
  }
  s += `<rect x="${x1}" y="${topo}" width="${l}" height="${alt}" fill="${ZONA}" stroke="#fff" stroke-width="5"/>`;
  s += `<rect x="${x3}" y="${topo}" width="${l}" height="${alt}" fill="${ZONA}" stroke="#fff" stroke-width="5"/>`;
  s += simboloAcesso(x1 + 45, topo + 170, 140) + simboloAcesso(x3 + 45, topo + 170, 140);
  s += `<line x1="${x4}" y1="${topo}" x2="${x4}" y2="${topo + alt}" stroke="#fff" stroke-width="5"/>`;

  // Placa vertical
  s += simboloAcesso(x1 + 86, topo - 2 + 8, 58);

  // Faixa de pedestres até a entrada
  s += `<rect x="30" y="${topo + alt + 60}" width="1316" height="130" fill="#d9d9d9" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += seta({ x: 80, y: topo + alt + 125 }, { x: 1290, y: topo + alt + 125 }, { dupla: false, largura: 5, ponta: 18, cor: AZUL });
  s += texto(688, topo + alt + 112, 'Rota acessível até a entrada', { tam: 25 });
  s += `<line x1="${x2 + extra / 2}" y1="${topo + alt}" x2="${x2 + extra / 2}" y2="${topo + alt + 60}" stroke="${AZUL}" stroke-width="5"/>`;

  // Rótulos sobre o asfalto
  s += seta({ x: x2, y: topo + alt - 40 }, { x: x3, y: topo + alt - 40 }, { largura: 3.5, ponta: 12 });
  const cx = 1130;
  s += chamada({ x: x3, y: topo + alt - 40 }, 830, 370, [['Espaço adicional ao lado:', 600], ['mín. 1,20 m de largura', 700]], 824, 372);
  s += chamada({ x: x1 + 144, y: topo + 34 }, 830, 110, [['Placa vertical com o símbolo', 700]], 824, 102);
  s += chamada({ x: x3 + 185, y: topo + 240 }, 830, 240, [['Símbolo de acesso no piso', 700]], 824, 232);
  s += texto(cx - 300, 470, 'Reservar 2% das vagas, ou 1 vaga,', { tam: 22, peso: 600, anc: 'start' });
  s += texto(cx - 300, 500, 'o que for maior', { tam: 22, peso: 600, anc: 'start' });

  return {
    nome: 'vaga_pcd', itens: [35, 38], derivados: [],
    svg: documento({
      titulo: 'Vaga reservada para pessoa com deficiência',
      descricao: 'Estacionamento visto de cima. Vagas reservadas, em 2 por cento do total ou no mínimo 1 vaga, têm o Símbolo Internacional de Acesso no piso e em placa vertical. Ao lado da vaga há um espaço adicional com no mínimo 1,20 metro de largura, ligado à rota acessível até a entrada.',
      conteudo: s,
    }),
  };
}

// ---------------------------------------------------------------------------
function sinalizacaoPorta() {
  const S = 300, PISO = 690, y = h => PISO - h * S;
  let s = `<rect x="30" y="${y(2.2)}" width="790" height="${2.2 * S}" fill="${C.parede}" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += piso(30, 820, PISO);
  const x0 = 170, l = 0.85 * S;
  s += ret(x0, y(2.1), l, 2.1 * S, C.branco);
  // Maçaneta do lado direito da porta
  const hx = x0 + l - 26, hy = y(0.95);
  s += `<circle cx="${hx}" cy="${hy}" r="12" fill="#777" stroke="${C.linha}" stroke-width="2"/><line x1="${hx}" y1="${hy}" x2="${hx - 66}" y2="${hy}" stroke="${C.linha}" stroke-width="9" stroke-linecap="round"/>`;
  // Faixa da placa, na parede ao lado da maçaneta
  const zx = x0 + l + 26, zl = 190;
  s += `<rect x="${zx}" y="${y(1.6)}" width="${zl}" height="${0.4 * S}" fill="${ZONA}" stroke="${AZUL}" stroke-width="3" stroke-dasharray="11 8"/>`;
  s += ret(zx + 44, y(1.5), 102, 60, '#333', 'rx="6"');
  s += seta({ x: zx + zl + 30, y: PISO }, { x: zx + zl + 30, y: y(1.2) }, { largura: 3 });
  s += seta({ x: zx + zl + 76, y: PISO }, { x: zx + zl + 76, y: y(1.6) }, { largura: 3 });
  s += linhaFina(zx + zl, y(1.2), zx + zl + 44, y(1.2)) + linhaFina(zx + zl, y(1.6), zx + zl + 90, y(1.6));
  s += texto(zx + zl + 18, y(0.55), '1,20 m', { tam: 25, anc: 'end' });
  s += texto(zx + zl + 86, y(1.4), '1,60 m', { tam: 25, anc: 'start' });

  // Placa ampliada
  const D = { x: 850, y: 100, l: 496, a: 430 };
  s += `<rect x="${D.x}" y="${D.y}" width="${D.l}" height="${D.a}" fill="#fff" stroke="${C.linha}" stroke-width="2.5" rx="8"/>`;
  s += texto(D.x + 24, D.y + 44, 'Placa (ampliada)', { tam: 24, anc: 'start', halo: false });
  const px = D.x + 40, py = D.y + 80, pl = 416, pa = 220;
  s += `<rect x="${px}" y="${py}" width="${pl}" height="${pa}" rx="12" fill="#333" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += `<text x="${px + pl / 2}" y="${py + 104}" font-size="70" font-weight="800" text-anchor="middle" fill="#fff">SALA 12</text>`;
  const braille = ['101011', '100110', '110001', '101000', '111010', '100100'];
  braille.forEach((cel, c) => {
    [...cel].forEach((b, i) => {
      if (b !== '1') return;
      const col = i % 2, lin = Math.floor(i / 2);
      s += `<circle cx="${px + 76 + c * 54 + col * 18}" cy="${py + 140 + lin * 18}" r="6.5" fill="#fff"/>`;
    });
  });
  s += texto(D.x + 24, D.y + 350, 'Texto em relevo e Braille', { tam: 25, anc: 'start', halo: false });
  s += texto(D.x + 24, D.y + 386, 'Na parede, ao lado da maçaneta', { tam: 22, peso: 500, anc: 'start', halo: false });
  s += `<text x="850" y="584" font-size="19" fill="${C.muted}">Pontos em Braille meramente ilustrativos.</text>`;

  return {
    nome: 'sinalizacao_porta', itens: [93, 167], derivados: [],
    svg: documento({
      titulo: 'Sinalização tátil da porta',
      descricao: 'Porta com placa na parede, ao lado da maçaneta, instalada entre 1,20 e 1,60 metro do piso. No detalhe, a placa identifica o ambiente com texto em relevo e Braille.',
      conteudo: s,
    }),
  };
}

// ---------------------------------------------------------------------------
function sanitarioPorta() {
  let s = '';
  const parede = (x, y, l, vao) => `<rect x="${x}" y="${y}" width="${(l - vao) / 2}" height="26" fill="#555"/><rect x="${x + (l + vao) / 2}" y="${y}" width="${(l - vao) / 2}" height="26" fill="#555"/>`;
  const S = 200, vao = 0.8 * S, l1 = 300, Y = 340;
  s += texto(40, 62, 'Vistas de cima', { tam: 25, anc: 'start', halo: false });

  // Abre para fora
  const ax = 40, g0 = ax + (l1 - vao) / 2, g1 = g0 + vao;
  s += texto(ax + l1 / 2, 130, 'Abre para fora', { tam: 25 });
  s += parede(ax, Y, l1, vao);
  s += `<line x1="${g1}" y1="${Y}" x2="${g1}" y2="${Y - vao}" stroke="${C.linha}" stroke-width="9"/>`;
  s += `<path d="M ${g1} ${Y - vao} A ${vao} ${vao} 0 0 0 ${g0} ${Y}" fill="none" stroke="${C.cota}" stroke-width="2.5" stroke-dasharray="8 6"/>`;
  s += cotaH(g0, g1, Y + 48, 'Vão livre: mín. 0,80 m', { acima: false, tam: 22 });
  s += texto(ax + l1 / 2, Y + 128, 'Interior do sanitário', { tam: 20, peso: 500, halo: false });

  // De correr
  const bx = 400, h0 = bx + (l1 - vao) / 2, h1 = h0 + vao;
  s += texto(bx + l1 / 2, 130, 'Ou de correr', { tam: 25 });
  s += parede(bx, Y, l1, vao);
  s += `<rect x="${h1 - 8}" y="${Y - 18}" width="${vao}" height="10" fill="${C.linha}"/>`;
  s += seta({ x: h1, y: Y - 40 }, { x: h1 + 120, y: Y - 40 }, { dupla: false, largura: 3, ponta: 12 });
  s += cotaH(h0, h1, Y + 48, 'Vão livre: mín. 0,80 m', { acima: false, tam: 22 });
  s += texto(bx + l1 / 2, Y + 128, 'Interior do sanitário', { tam: 20, peso: 500, halo: false });

  // Puxador
  const Sy = 300, PISO = 690, y = h => PISO - h * Sy, px0 = 900, pl = 0.8 * Sy;
  s += `<rect x="820" y="${y(1.75)}" width="526" height="${1.75 * Sy}" fill="${C.parede}" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += piso(820, 1346, PISO);
  s += ret(px0, y(1.75), pl, 1.75 * Sy, C.branco);
  s += `<rect x="${px0 - 40}" y="${y(1.1)}" width="${pl + 80}" height="${0.3 * Sy}" fill="${ZONA}" stroke="${AZUL}" stroke-width="2.5" stroke-dasharray="11 8"/>`;
  const lp = 0.4 * Sy, xp = px0 + 60, yp = y(0.95);
  s += `<line x1="${xp}" y1="${yp}" x2="${xp + lp}" y2="${yp}" stroke="${AZUL}" stroke-width="12" stroke-linecap="round"/>`;
  s += seta({ x: xp, y: yp + 24 }, { x: xp + lp, y: yp + 24 }, { ponta: 9, largura: 2.5 });
  s += texto(xp + lp / 2, yp - 18, 'mín. 0,40 m', { tam: 21 });
  s += texto(px0 + pl + 52, y(1.1) + 26, '1,10 m', { tam: 23, anc: 'start' });
  s += texto(px0 + pl + 52, y(0.8) - 8, '0,80 m', { tam: 23, anc: 'start' });
  s += texto(1083, 56, 'Puxador horizontal', { tam: 25, halo: false });
  s += texto(1083, 88, 'Do lado oposto ao de abertura', { tam: 21, peso: 500, halo: false });
  s += texto(1083, 120, 'Diâmetro: 25 mm a 35 mm', { tam: 22, peso: 600, halo: false });

  return {
    nome: 'sanitario_porta_puxador', itens: [152, 153], derivados: [],
    svg: documento({
      titulo: 'Porta e puxador do sanitário',
      descricao: 'À esquerda, vistas de cima de uma porta que abre para fora e de uma porta de correr, ambas com vão livre mínimo de 0,80 metro. À direita, puxador horizontal do lado oposto ao de abertura, com comprimento mínimo de 0,40 metro, diâmetro de 25 a 35 milímetros, entre 0,80 e 1,10 metro do piso.',
      conteudo: s,
    }),
  };
}

// ---------------------------------------------------------------------------
function baciaAltura() {
  const S = 620, PISO = 650, y = h => PISO - h * S;
  let s = piso(30, 700, PISO);
  s += `<rect x="30" y="50" width="670" height="${PISO - 50}" fill="${C.parede}" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += piso(30, 700, PISO);
  const fr = 410, yA = y(0.45);
  s += `<path d="M 30 ${yA - 180} H 130 V ${yA} H ${fr - 8} Q ${fr} ${yA} ${fr} ${yA + 8} V ${yA + 90} Q ${fr - 50} ${PISO - 60} ${fr - 90} ${PISO} H 30 Z" fill="#fff" stroke="${C.linha}" stroke-width="3"/>`;
  s += `<rect x="130" y="${yA - 16}" width="${fr - 118}" height="16" rx="7" fill="#777" stroke="${C.linha}" stroke-width="2.5"/>`;
  const xc = fr + 70;
  s += seta({ x: xc, y: PISO }, { x: xc, y: yA - 16 }, { largura: 3.5 });
  s += linhaFina(fr + 16, yA - 16, xc + 14, yA - 16);
  s += texto(xc + 20, (PISO + yA) / 2 - 26, 'Com assento', { tam: 25, anc: 'start' });
  s += texto(xc + 20, (PISO + yA) / 2 + 6, '0,43 m a 0,46 m', { tam: 24, peso: 500, anc: 'start' });
  s += texto(xc + 20, (PISO + yA) / 2 + 48, 'Sem assento', { tam: 21, anc: 'start' });
  s += texto(xc + 20, (PISO + yA) / 2 + 76, '0,43 m a 0,45 m', { tam: 21, peso: 500, anc: 'start' });
  s += texto(52, 92, 'Altura da bacia', { tam: 26, anc: 'start', halo: false });

  // Assento visto de cima
  const assento = (cx, aberto) => {
    const cy = 340, rx = 118, ry = 162;
    let a = `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#777" stroke="${C.linha}" stroke-width="3"/><ellipse cx="${cx}" cy="${cy}" rx="${rx - 44}" ry="${ry - 48}" fill="#d9d9d9" stroke="${C.linha}" stroke-width="2.5"/>`;
    if (aberto) a += `<rect x="${cx - 32}" y="${cy + 96}" width="64" height="80" fill="#fff"/><path d="M ${cx - 32} ${cy + 100} V ${cy + 158} M ${cx + 32} ${cy + 100} V ${cy + 158}" stroke="${C.linha}" stroke-width="3"/>`;
    return a;
  };
  s += texto(1030, 92, 'Assento visto de cima', { tam: 26, halo: false });
  s += assento(880, false) + assento(1180, true);
  s += texto(880, 560, 'Correto', { tam: 27, cor: VERDE, halo: false });
  s += texto(880, 592, 'Sem abertura frontal', { tam: 21, peso: 500, halo: false });
  s += texto(1180, 560, 'Incorreto', { tam: 27, cor: VERMELHO, halo: false });
  s += texto(1180, 592, 'Com abertura frontal', { tam: 21, peso: 500, halo: false });

  return {
    nome: 'bacia_altura_assento', itens: [156, 157], derivados: [],
    svg: documento({
      titulo: 'Altura da bacia e assento',
      descricao: 'À esquerda, bacia sanitária vista de lado, com altura entre 0,43 e 0,46 metro com assento, e entre 0,43 e 0,45 metro sem assento. À direita, dois assentos vistos de cima: o correto não tem abertura frontal, e o incorreto tem.',
      conteudo: s,
    }),
  };
}

// ---------------------------------------------------------------------------
function lavatorio() {
  const S = 470, PISO = 680, y = h => PISO - h * S;
  let s = `<rect x="30" y="${y(1.35)}" width="640" height="${1.35 * S}" fill="${C.parede}" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += piso(30, 670, PISO);
  s += texto(52, y(1.35) + 40, 'Vista de frente', { tam: 25, anc: 'start', halo: false });
  const x0 = 280, l = 340, topo = y(0.79);
  s += `<path d="M ${x0} ${topo} H ${x0 + l} V ${topo + 24} Q ${x0 + l} ${topo + 104} ${x0 + l / 2} ${topo + 104} Q ${x0} ${topo + 104} ${x0} ${topo + 24} Z" fill="#fff" stroke="${C.linha}" stroke-width="3"/>`;
  s += `<path d="M ${x0 + l / 2} ${topo} v -54 h 54" fill="none" stroke="${C.linha}" stroke-width="9" stroke-linecap="round"/><line x1="${x0 + l / 2 - 6}" y1="${topo - 54}" x2="${x0 + l / 2 - 52}" y2="${topo - 70}" stroke="${AZUL}" stroke-width="9" stroke-linecap="round"/>`;
  s += seta({ x: x0 - 56, y: PISO }, { x: x0 - 56, y: topo }, { largura: 3.5 });
  s += linhaFina(x0 - 70, topo, x0 + 4, topo);
  s += texto(x0 - 68, (PISO + topo) / 2 - 6, 'Superfície', { tam: 24, anc: 'end' });
  s += texto(x0 - 68, (PISO + topo) / 2 + 24, '0,78 m a 0,80 m', { tam: 20, peso: 600, anc: 'end' });
  s += chamada({ x: x0 + l / 2 - 40, y: topo - 66 }, 390, y(1.35) + 90, [['Alavanca ou sensor', 700]], 384, y(1.35) + 96);
  s += texto(x0 + l / 2, topo + 214, 'Sem coluna, com coluna suspensa', { tam: 21, peso: 500 });
  s += texto(x0 + l / 2, topo + 244, 'ou sobre tampo', { tam: 21, peso: 500 });

  // Área de aproximação
  const cy = 450, cx = 1010, R = 0.75 * 320;
  s += texto(cx, 54, 'Vista de cima', { tam: 25, halo: false });
  s += `<rect x="${cx - 120}" y="${cy - R - 96}" width="240" height="96" rx="10" fill="#fff" stroke="${C.linha}" stroke-width="3"/><ellipse cx="${cx}" cy="${cy - R - 50}" rx="74" ry="32" fill="#d9d9d9" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${ZONA}" stroke="${AZUL}" stroke-width="3.5" stroke-dasharray="12 8"/>`;
  s += cadeira(cx, cy, 270, 1.05);
  s += chamada({ x: cx + R * 0.72, y: cy + R * 0.69 }, 1040, 736, [['Aproximação frontal: círculo de 1,50 m', 700]], 1140, 712, 'middle');

  return {
    nome: 'lavatorio', itens: [162, 163], derivados: [],
    svg: documento({
      titulo: 'Lavatório acessível',
      descricao: 'À esquerda, lavatório sem coluna visto de frente, com superfície entre 0,78 e 0,80 metro do piso e torneira de alavanca ou sensor. À direita, vista de cima da área de aproximação frontal para pessoa em cadeira de rodas, um círculo de 1,50 metro de diâmetro.',
      conteudo: s,
    }),
  };
}

// ---------------------------------------------------------------------------
function giro360() {
  const cx = 500, cy = 400, R = 0.75 * 400;
  let s = '';
  s += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${ZONA}" stroke="${AZUL}" stroke-width="4" stroke-dasharray="14 9"/>`;
  s += cadeira(cx, cy, 0, 1.15);
  const r = 190;
  s += `<path d="M ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx} ${cy - r}" fill="none" stroke="${AZUL}" stroke-width="6"/>`;
  s += seta({ x: cx - 18, y: cy - r - 6 }, { x: cx, y: cy - r }, { cor: AZUL, dupla: false, largura: 6, ponta: 22 });
  const ax = cx - R, bx = cx + R;
  s += seta({ x: ax, y: 738 }, { x: bx, y: 738 }, { largura: 3.5 });
  s += linhaFina(ax, cy, ax, 750) + linhaFina(bx, cy, bx, 750);
  s += texto(cx, 726, 'Diâmetro mínimo: 1,50 m', { tam: 27 });

  // Carteira ao lado, fora do círculo
  const mesa = { x: cx + R + 30, y: cy - 110, l: 200, a: 220 };
  if (mesa.x < cx + R) throw new Error('Carteira invade a área de giro');
  s += ret(mesa.x, mesa.y, mesa.l, mesa.a, C.branco, 'rx="8"');
  s += texto(mesa.x + mesa.l / 2, mesa.y + mesa.a / 2 + 9, 'Carteira', { tam: 25, halo: false });
  s += texto(mesa.x + 12, 170, 'Área de giro de 360°', { tam: 28, anc: 'start' });
  s += texto(mesa.x + 12, 204, 'Junto à carteira, livre de obstáculos', { tam: 22, peso: 500, anc: 'start' });
  s += texto(mesa.x + 12, 590, 'Carteira distribuída pela sala,', { tam: 22, peso: 500, anc: 'start' });
  s += texto(mesa.x + 12, 620, 'sem segregar quem usa cadeira', { tam: 22, peso: 500, anc: 'start' });

  return {
    nome: 'giro_360', itens: [99], derivados: ['360°'],
    svg: documento({
      titulo: 'Área de giro de 360 graus',
      descricao: 'Vista de cima de uma cadeira de rodas dentro de uma área circular livre com diâmetro mínimo de 1,50 metro, ao lado de uma carteira, que deve estar distribuída pela sala sem segregar a pessoa.',
      conteudo: s,
    }),
  };
}

// ---------------------------------------------------------------------------
function calcadaFaixaLivre() {
  const v = criarVista({ escala: 98, origem: { x: 430, y: 176 } });
  const L = 7.6, F0 = 0.15, F1 = 1.75, S1 = 2.6, RUA = 3.5, Z = 0.14, H = 1.4;
  let s = '';
  s += v.poli([[0, 0, Z], [L, 0, Z], [L, 0, Z + H], [0, 0, Z + H]], C.parede);
  s += v.poli([[0, S1, 0], [L, S1, 0], [L, RUA, 0], [0, RUA, 0]], '#8a8a8a');
  s += v.poli([[0, 0, Z], [L, 0, Z], [L, S1, Z], [0, S1, Z]], C.patamar);
  s += v.poli([[0, F1, Z], [L, F1, Z], [L, S1, Z], [0, S1, Z]], '#a9a9a9');
  s += v.poli([[0, F0, Z], [L, F0, Z], [L, F1, Z], [0, F1, Z]], ZONA, `style="stroke:${AZUL}" stroke-dasharray="11 8"`);
  s += v.poli([[0, S1, 0], [L, S1, 0], [L, S1, Z], [0, S1, Z]], C.branco);

  // Obstáculos na faixa de serviço, fora da faixa livre
  const YO = 2.15;
  s += v.caixa(1.1, 1.3, YO - 0.1, YO + 0.1, Z, Z + 1.6, { topo: '#999', frente: '#bbb', lado: '#999' });
  s += v.caixa(3.0, 3.36, YO - 0.18, YO + 0.18, Z, Z + 0.72, { topo: '#555', frente: '#777', lado: '#666' });
  s += v.caixa(5.05, 5.39, YO - 0.17, YO + 0.17, Z, Z + 0.22, { topo: '#6b4f2b', frente: '#7d5f36', lado: '#6b4f2b' });
  const copa = v.proj(5.22, YO, Z + 0.46);
  s += `<circle cx="${copa.x}" cy="${copa.y}" r="32" fill="#3f8f4f" stroke="${C.linha}" stroke-width="2.5"/>`;

  // Largura
  const xc = 6.3, a = v.proj(xc, F0, Z), b = v.proj(xc, F1, Z);
  s += seta(a, b, { cor: AZUL, largura: 6, ponta: 18 });

  s += chamada({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, 945, 120, [['Faixa livre: mín. 1,20 m', 700], ['Recomendável: 1,50 m', 500], ['Contínua, sem buracos nem obstáculos', 500]], 1040, 196);
  s += chamada(v.proj(1.2, YO, Z + 0.9), 40, 540, [['Poste, lixeira e vegetação', 700], ['Sempre fora da faixa livre', 500]], 180, 512);

  return {
    nome: 'calcada_faixa_livre', itens: [2], derivados: [],
    svg: documento({
      titulo: 'Faixa livre da calçada',
      descricao: 'Calçada em perspectiva. A faixa livre, contínua e sem buracos nem obstáculos, tem largura mínima de 1,20 metro, recomendável 1,50 metro. Poste, lixeira e vegetação ficam fora dela.',
      conteudo: s,
    }),
  };
}

// ---------------------------------------------------------------------------
function calcadaInclinacao() {
  let s = '';
  const xa = 150, xb = 960, ya = 300, yb = 390;
  s += `<rect x="60" y="60" width="90" height="620" fill="#d8d8d8" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += `<polygon points="${xa},${ya} ${xb},${yb} ${xb},620 ${xa},620" fill="${C.piso}" stroke="${C.linha}" stroke-width="3"/>`;
  s += `<rect x="60" y="620" width="1250" height="60" fill="#8a8a8a" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += `<polygon points="${xb},${yb + 110} ${xb + 340},${yb + 110} ${xb + 340},620 ${xb},620" fill="#8a8a8a" stroke="${C.linha}" stroke-width="2.5"/>`;
  s += linhaFina(xa, ya, xb + 60, ya, 2.5, C.cota, 'stroke-dasharray="11 8"');
  s += seta({ x: xb + 30, y: ya }, { x: xb + 30, y: yb }, { largura: 3 });
  s += texto(xb + 44, (ya + yb) / 2 + 9, 'Caimento', { tam: 25, anc: 'start' });
  s += texto(xa + 16, ya - 16, 'Linha de nível', { tam: 21, peso: 500, anc: 'start' });

  // Celular apoiado no piso
  const ang = Math.atan2(yb - ya, xb - xa) * 180 / Math.PI, xc = 560, yc = ya + (yb - ya) * (xc - xa) / (xb - xa);
  s += `<g transform="translate(${xc} ${yc}) rotate(${ang})"><rect x="-90" y="-16" width="180" height="16" rx="5" fill="#222"/></g>`;
  s += texto(xc, yc + 54, 'Celular apoiado no piso', { tam: 23, peso: 600 });
  s += seta({ x: xc - 200, y: yc + 90 }, { x: xc + 200, y: yc + 90 + 44 }, { largura: 3.5, ponta: 15 });
  s += texto(xc, yc + 164, 'Atravessado, de um lado ao outro', { tam: 23, peso: 600 });

  // Limites
  const D = { x: 910, y: 60, l: 400, a: 196 };
  s += `<rect x="${D.x}" y="${D.y}" width="${D.l}" height="${D.a}" fill="#fff" stroke="${C.linha}" stroke-width="2.5" rx="8"/>`;
  s += texto(D.x + 20, D.y + 40, 'Inclinação transversal', { tam: 24, anc: 'start', halo: false });
  s += texto(D.x + 20, D.y + 84, 'Calçada e rampa externa', { tam: 20, peso: 500, anc: 'start', halo: false });
  s += texto(D.x + 20, D.y + 116, 'máx. 3%', { tam: 27, anc: 'start', halo: false });
  s += texto(D.x + 20, D.y + 150, 'Corredor e rampa interna', { tam: 20, peso: 500, anc: 'start', halo: false });
  s += texto(D.x + 20, D.y + 182, 'máx. 2%', { tam: 27, anc: 'start', halo: false });
  s += `<text x="1310" y="722" font-size="19" text-anchor="end" fill="${C.muted}">Inclinação ampliada para ficar visível.</text>`;

  return {
    nome: 'calcada_inclinacao_transversal', itens: [4, 22, 48, 67], derivados: [],
    svg: documento({
      titulo: 'Inclinação transversal do piso',
      descricao: 'Corte de um piso com caimento atravessado, ampliado para ficar visível, com um celular apoiado para medir de um lado ao outro. O limite é de 3 por cento na calçada e na rampa externa, e de 2 por cento no corredor e na rampa interna.',
      conteudo: s,
    }),
  };
}

// ---------------------------------------------------------------------------
function pisoTatilExterno() {
  const v = criarVista({ escala: 88, origem: { x: 510, y: 152 } });
  const L = 8.6, D = 3.4, RUA = 4.6, Z = 0.14, H = 1.5, P0 = 3.4, P1 = 4.8;
  let s = '';
  s += v.poli([[0, 0, Z], [L, 0, Z], [L, 0, Z + H], [0, 0, Z + H]], C.parede);
  s += v.poli([[P0, 0, Z], [P1, 0, Z], [P1, 0, Z + 1.32], [P0, 0, Z + 1.32]], '#8a8a8a');
  s += v.poli([[0, D, 0], [L, D, 0], [L, RUA, 0], [0, RUA, 0]], '#8a8a8a');
  s += v.poli([[0, 0, Z], [L, 0, Z], [L, D, Z], [0, D, Z]], C.patamar);
  s += v.poli([[0, D, 0], [L, D, 0], [L, D, Z], [0, D, Z]], C.branco);

  const xc = (P0 + P1) / 2, yc = 2.0, M = 0.3;
  // Direcional ao longo da calçada e até a entrada
  s += tatilDirecional(v, 0.05, xc - M, yc - M, yc + M, Z, 0.15, 0.36, 0.1);
  s += tatilDirecional(v, xc + M, L - 0.05, yc - M, yc + M, Z, 0.15, 0.36, 0.1);
  s += direcionalEmY(v, xc - M, xc + M, 0.7, yc - M, Z);
  // Alertas: mudança de direção, porta e obstáculo
  s += tatilAlerta(v, xc - M, xc + M, yc - M, yc + M, Z, 0.15, 0.05);
  s += tatilAlerta(v, P0, P1, 0.08, 0.7, Z, 0.15, 0.05);
  // Rebaixo com alerta
  const XR = 6.6;
  s += tatilAlerta(v, XR, XR + 1.4, D - 0.6, D - 0.02, Z, 0.15, 0.05);

  s += chamada(v.proj(1.5, yc, Z), 40, 590, [['Direcional', 700], ['Conduz até a entrada', 500]], 200, 562);
  s += chamada(v.proj(xc, yc, Z), 290, 716, [['Alerta: mudança de direção', 700]], 470, 690);
  s += chamada(v.proj(P1 - 0.3, 0.35, Z), 1050, 96, [['Alerta: porta de acesso', 700]], 1044, 100);
  s += chamada(v.proj(XR + 1.1, D - 0.3, Z), 1020, 650, [['Alerta: rebaixo de calçada', 700], ['Também em rampas, escadas', 500], ['e obstáculos', 500]], 1100, 622);
  s += texto(40, 90, 'Contínuo no trajeto e com', { tam: 22, peso: 600, anc: 'start', halo: false });
  s += texto(40, 120, 'contraste em relação ao piso', { tam: 22, peso: 600, anc: 'start', halo: false });

  return {
    nome: 'piso_tatil_externo', itens: [8, 11, 40, 41], derivados: [],
    svg: documento({
      titulo: 'Piso tátil no percurso externo',
      descricao: 'Calçada em perspectiva. O piso tátil direcional, com relevos em linhas, conduz até a entrada. O piso tátil de alerta, com relevos em pontos, marca a mudança de direção, a porta de acesso e o rebaixo de calçada, e também rampas, escadas e obstáculos. O piso é contínuo e contrasta com o piso ao redor.',
      conteudo: s,
    }),
  };
}

export const LOTE2 = [objetosSalientes, desniveisPiso, escadaSinalVisual, macanetaAlavanca, vagaPcd, sinalizacaoPorta, sanitarioPorta, baciaAltura, lavatorio, giro360, calcadaFaixaLivre, calcadaInclinacao, pisoTatilExterno];
