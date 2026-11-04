// Primitivas dos desenhos técnicos: projeção isométrica, cotas e padrões de piso tátil.
export const C = {
  linha: '#1a1a1a', piso: '#c0c0c0', patamar: '#d9d9d9', branco: '#ffffff', parede: '#f2f2f2',
  tatil: '#ffdf00', relevo: '#7a6200', cota: '#1a1a1a', apoio: '#0b57a4', muted: '#555555',
};

export function criarVista({ escala, origem }) {
  const COS = Math.cos(Math.PI / 6), SEN = Math.sin(Math.PI / 6);
  const proj = (x, y, z = 0) => ({
    x: origem.x + (x - y) * COS * escala,
    y: origem.y + (x + y) * SEN * escala - z * escala,
  });
  const pts = lista => lista.map(([x, y, z]) => { const p = proj(x, y, z); return `${p.x.toFixed(1)},${p.y.toFixed(1)}`; }).join(' ');

  return {
    escala,
    proj,
    poli: (lista, fill, extra = '') =>
      `<polygon points="${pts(lista)}" fill="${fill}" stroke="${C.linha}" stroke-width="2" stroke-linejoin="round" ${extra}/>`,
    linha: (a, b, largura = 2, cor = C.linha, extra = '') => {
      const p = proj(...a), q = proj(...b);
      return `<line x1="${p.x.toFixed(1)}" y1="${p.y.toFixed(1)}" x2="${q.x.toFixed(1)}" y2="${q.y.toFixed(1)}" stroke="${cor}" stroke-width="${largura}" stroke-linecap="round" ${extra}/>`;
    },
    // Um círculo no piso aparece como elipse de eixos horizontal e vertical nesta projeção
    circuloPiso: (x, y, z, raio, attrs) => {
      const p = proj(x, y, z);
      return `<ellipse cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" rx="${(raio * 1.2247 * escala).toFixed(1)}" ry="${(raio * 0.7071 * escala).toFixed(1)}" ${attrs}/>`;
    },
    caixa: (x0, x1, y0, y1, z0, z1, { topo = C.branco, frente = C.branco, lado = C.parede } = {}) => {
      const v = (x, y, z) => [x, y, z];
      return [
        `<polygon points="${pts([v(x1, y0, z0), v(x1, y1, z0), v(x1, y1, z1), v(x1, y0, z1)])}" fill="${lado}" stroke="${C.linha}" stroke-width="2" stroke-linejoin="round"/>`,
        `<polygon points="${pts([v(x0, y1, z0), v(x1, y1, z0), v(x1, y1, z1), v(x0, y1, z1)])}" fill="${frente}" stroke="${C.linha}" stroke-width="2" stroke-linejoin="round"/>`,
        `<polygon points="${pts([v(x0, y0, z1), v(x1, y0, z1), v(x1, y1, z1), v(x0, y1, z1)])}" fill="${topo}" stroke="${C.linha}" stroke-width="2" stroke-linejoin="round"/>`,
      ].join('');
    },
  };
}

export function texto(x, y, t, { tam = 24, peso = 700, anc = 'middle', cor = C.cota, halo = true } = {}) {
  const contorno = halo ? 'paint-order="stroke" stroke="#fff" stroke-width="6" stroke-linejoin="round"' : '';
  return `<text x="${x}" y="${y}" font-size="${tam}" font-weight="${peso}" text-anchor="${anc}" fill="${cor}" ${contorno}>${t}</text>`;
}

export function seta(p, q, { largura = 2.5, cor = C.cota, ponta = 13, dupla = true } = {}) {
  const ang = Math.atan2(q.y - p.y, q.x - p.x);
  const triangulo = (v, s) => {
    const a = `${(v.x + s * ponta * Math.cos(ang - 0.4)).toFixed(1)},${(v.y + s * ponta * Math.sin(ang - 0.4)).toFixed(1)}`;
    const b = `${(v.x + s * ponta * Math.cos(ang + 0.4)).toFixed(1)},${(v.y + s * ponta * Math.sin(ang + 0.4)).toFixed(1)}`;
    return `<polygon points="${v.x.toFixed(1)},${v.y.toFixed(1)} ${a} ${b}" fill="${cor}"/>`;
  };
  return `<line x1="${p.x.toFixed(1)}" y1="${p.y.toFixed(1)}" x2="${q.x.toFixed(1)}" y2="${q.y.toFixed(1)}" stroke="${cor}" stroke-width="${largura}"/>`
    + (dupla ? triangulo(p, 1) : '') + triangulo(q, -1);
}

// ---------- Piso tátil no desenho isométrico (faixa horizontal, ao longo de x ou y) ----------

/** Alerta: pontos em grade. A faixa cobre [x0, x1] × [y0, y1] na altura z. */
export function tatilAlerta(v, x0, x1, y0, y1, z, passo = 0.15, raio = 0.048) {
  let s = v.poli([[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]], C.tatil);
  for (let x = x0 + passo / 2; x < x1 - passo * 0.3; x += passo) {
    for (let y = y0 + passo / 2; y < y1 - passo * 0.3; y += passo) {
      s += v.circuloPiso(x, y, z, raio, `fill="${C.relevo}" stroke="none"`);
    }
  }
  return s;
}

/** Direcional: relevos em linhas, paralelos ao sentido da caminhada (eixo x). */
export function tatilDirecional(v, x0, x1, y0, y1, z, passoY = 0.1, trecho = 0.34, vao = 0.09) {
  let s = v.poli([[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]], C.tatil);
  for (let y = y0 + passoY * 0.75; y < y1 - passoY * 0.4; y += passoY) {
    for (let x = x0 + 0.05; x < x1 - 0.05; x += trecho + vao) {
      s += v.linha([x, y, z], [Math.min(x + trecho, x1 - 0.05), y, z], 3.2, C.relevo);
    }
  }
  return s;
}

// ---------- Legenda ampliada, em vista de cima ----------

export function amostraAlerta(x, y, lado) {
  let s = `<rect x="${x}" y="${y}" width="${lado}" height="${lado}" fill="${C.tatil}" stroke="${C.linha}" stroke-width="2" rx="4"/>`;
  const n = 5, passo = lado / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    s += `<circle cx="${(x + passo * (i + 0.5)).toFixed(1)}" cy="${(y + passo * (j + 0.5)).toFixed(1)}" r="${(passo * 0.3).toFixed(1)}" fill="${C.relevo}"/>`;
  }
  return s;
}

export function amostraDirecional(x, y, lado) {
  let s = `<rect x="${x}" y="${y}" width="${lado}" height="${lado}" fill="${C.tatil}" stroke="${C.linha}" stroke-width="2" rx="4"/>`;
  const n = 4, passo = lado / n;
  for (let i = 0; i < n; i++) {
    const cx = x + passo * (i + 0.5);
    s += `<line x1="${cx.toFixed(1)}" y1="${(y + lado * 0.1).toFixed(1)}" x2="${cx.toFixed(1)}" y2="${(y + lado * 0.9).toFixed(1)}" stroke="${C.relevo}" stroke-width="${(passo * 0.42).toFixed(1)}" stroke-linecap="round"/>`;
  }
  return s;
}

export function documento({ titulo, descricao, conteudo }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1376 768" role="img" aria-labelledby="t d" font-family="Inter, Arial, Helvetica, sans-serif">
<title id="t">${titulo}</title><desc id="d">${descricao}</desc>
<rect width="1376" height="768" fill="#fff"/>
${conteudo}
</svg>
`;
}
