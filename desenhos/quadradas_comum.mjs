// Peças comuns das ilustrações quadradas (720×720), a partir do lote 4.
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { C, texto } from './lib.mjs';

export const LADO = 720, T = 38, A = 30;
export const AZUL = C.apoio;
export const ZONA = 'rgba(11,87,164,.14)';
export const VERDE = '#15703a', VERMELHO = '#b91c1c', LARANJA = '#d97706';

export const documento = ({ titulo, descricao, conteudo }) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${LADO} ${LADO}" role="img" aria-labelledby="t d" font-family="Inter, Arial, Helvetica, sans-serif">
<title id="t">${titulo}</title><desc id="d">${descricao}</desc>
<rect width="${LADO}" height="${LADO}" fill="#fff"/>
${conteudo}
</svg>
`;
export const tt = (x, y, s, o = {}) => texto(x, y, s, { tam: T, anc: 'start', ...o });
export const ta = (x, y, s, o = {}) => texto(x, y, s, { tam: A, peso: 500, anc: 'start', ...o });
export const tb = (x, y, s, o = {}) => texto(x, y, s, { tam: A, peso: 700, anc: 'start', ...o });
export const ret = (x, y, l, a, fill, extra = '') => `<rect x="${x}" y="${y}" width="${l}" height="${a}" fill="${fill}" stroke="${C.linha}" stroke-width="2.5" ${extra}/>`;
export const linha = (x1, y1, x2, y2, l = 2.5, cor = C.linha, extra = '') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${cor}" stroke-width="${l}" ${extra}/>`;
export const chamada = (de, x, y) => linha(de.x.toFixed(1), de.y.toFixed(1), x, y) + `<circle cx="${de.x.toFixed(1)}" cy="${de.y.toFixed(1)}" r="6" fill="${C.linha}"/>`;
export const vertical = (x, y, s, tam = T, peso = 700) => `<text x="${x}" y="${y}" font-size="${tam}" font-weight="${peso}" text-anchor="middle" fill="${C.cota}" paint-order="stroke" stroke="#fff" stroke-width="6" stroke-linejoin="round" transform="rotate(-90 ${x} ${y})">${s}</text>`;
export const zona = (x, y, l, a) => `<rect x="${x}" y="${y}" width="${l}" height="${a}" fill="${ZONA}" stroke="${AZUL}" stroke-width="3" stroke-dasharray="11 8"/>`;
export const piso = (x0, x1, y, a = 50) => ret(x0, y, x1 - x0, a, C.piso);
/** Número em círculo, ligado a uma legenda em texto. */
export const marca = (x, y, n) => `<circle cx="${x}" cy="${y}" r="20" fill="${C.linha}" stroke="#fff" stroke-width="2"/><text x="${x}" y="${y + 11}" font-size="${A}" font-weight="700" text-anchor="middle" fill="#fff">${n}</text>`;
/** Quadro com faixa de título colorida. */
export function quadro(x, y, l, a, titulo, cor) {
  return `<rect x="${x}" y="${y}" width="${l}" height="${a}" fill="#fff" stroke="${C.linha}" stroke-width="2.5" rx="8"/>`
    + `<path d="M ${x} ${y + 8} a 8 8 0 0 1 8 -8 h ${l - 16} a 8 8 0 0 1 8 8 v 46 h -${l} z" fill="${cor}"/>`
    + texto(x + 20, y + 38, titulo, { tam: A, cor: '#fff', halo: false, anc: 'start' });
}

/** Gera os SVGs do lote; cada medida escrita precisa estar nas perguntas dos itens e nenhum rótulo fica abaixo de 30. */
export function gerarLote(lista) {
  const saida = new URL('./saida/quadradas/', import.meta.url);
  mkdirSync(saida, { recursive: true });
  const checklist = JSON.parse(readFileSync(new URL('../src/dados/checklist.json', import.meta.url)));
  const pergunta = id => {
    const item = checklist.itens.find(i => i.id === id);
    if (!item) throw new Error(`Item ${id} não existe`);
    return item.pergunta.replace(/\s+/g, '');
  };
  let erros = 0;
  for (const criar of lista) {
    const f = criar();
    const svg = documento({ titulo: f.titulo, descricao: f.descricao, conteudo: f.s });
    const perguntas = f.itens.map(pergunta).join(' ');
    const textos = [...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map(m => m[1]);
    const medidas = textos.flatMap(t => t.match(/\d+(?:,\d+)?\s?(?:cm|mm|m\b|%)/g) || []).map(m => m.replace(/\s+/g, ''));
    // aConfirmar: medidas que vêm do desenho original e ainda dependem de confirmação na norma
    const faltando = [...new Set(medidas.filter(m => !perguntas.includes(m) && !(f.aConfirmar || []).includes(m)))];
    const tamanhos = [...svg.matchAll(/font-size="([\d.]+)"/g)].map(m => +m[1]);
    if (faltando.length) { erros++; console.log(`✗ ${f.nome}: medidas fora das perguntas: ${faltando.join(', ')}`); }
    if (Math.min(...tamanhos) < A) { erros++; console.log(`✗ ${f.nome}: rótulo menor que ${A}`); }
    writeFileSync(new URL(`${f.nome}.svg`, saida), svg);
    console.log(`${f.nome}.svg  medidas: ${[...new Set(medidas)].join(', ') || '—'}`);
  }
  if (erros) process.exit(1);
}
