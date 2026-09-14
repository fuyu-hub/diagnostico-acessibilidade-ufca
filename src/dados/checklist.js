// Dados carregados do JSON gerado via planilha NBR 9050
import dados from './checklist.json';

export const SECOES = dados.secoes;
export const TODOS_ITENS = dados.itens;

// Mapa id -> item para lookup rapido
export const ITENS_POR_ID = Object.fromEntries(
  TODOS_ITENS.map(item => [item.id, item])
);

// Itens por secao
export const ITENS_POR_SECAO = SECOES.reduce((acc, s) => {
  acc[s.id] = TODOS_ITENS.filter(i => i.secaoId === s.id);
  return acc;
}, {});

// Subgrupos de uma secao (ordem de aparicao)
export function subgruposDaSecao(secaoId) {
  const vistos = new Set();
  const resultado = [];
  for (const item of ITENS_POR_SECAO[secaoId] || []) {
    if (item.subgrupo && !vistos.has(item.subgrupo)) {
      vistos.add(item.subgrupo);
      resultado.push(item.subgrupo);
    }
  }
  return resultado;
}

// Itens tecnicos (excluindo triagens) — usados no calculo do indice
export const ITENS_TECNICOS = TODOS_ITENS.filter(i => i.tipo === 'tecnico');

export const totalItens = TODOS_ITENS.length;
