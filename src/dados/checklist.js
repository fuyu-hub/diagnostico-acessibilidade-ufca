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

/**
 * Todos os itens abaixo de uma triagem, incluindo os de triagens aninhadas,
 * cada um com a triagem que o controla diretamente.
 */
export function dependentesEmCascata(triagem) {
  return (triagem?.dependentes || []).flatMap(depId => [
    { id: depId, origemTriagem: triagem.id },
    ...dependentesEmCascata(ITENS_POR_ID[depId]),
  ]);
}

/**
 * Itens a limpar quando uma triagem deixa de ser negativa, incluindo os de triagens aninhadas.
 * Vistorias salvas antes de a marca `automatico` ser persistida não a têm: nelas, um N/A sem
 * observação nem foto sob uma triagem negativa é tratado como automático.
 */
export function dependentesParaLimpar(triagem, respostas = {}) {
  const valorTriagem = respostas[triagem?.id]?.valor;
  const triagemNegativa = ['nao', 'nao-conforme', 'nao-aplica'].includes(valorTriagem);
  const limpar = [];

  for (const depId of triagem?.dependentes || []) {
    const resp = respostas[depId];
    const automatica = resp?.automatico ||
      (triagemNegativa && resp?.valor === 'nao-aplica' && !resp.obs && !resp.foto);
    if (automatica) {
      limpar.push(depId, ...dependentesParaLimpar(ITENS_POR_ID[depId], respostas));
    }
  }
  return limpar;
}

/**
 * Retorna a lista de critérios técnicos aplicáveis a uma vistoria com base na triagem
 */
export function criteriosAplicaveis(triagem = {}, respostas = {}) {
  return ITENS_TECNICOS.filter(item => {
    // Regra de aplicabilidade: permite regras condicionais futuras ou ativas de triagem
    return true;
  });
}

/**
 * Calcula o status canônico da vistoria ('rascunho' | 'em_andamento' | 'concluida')
 * conforme especificado no Escopo 1 (§2.1 e §7.1)
 */
export function calcularStatusVistoria(respostas = {}, triagem = {}) {
  const aplicaveis = criteriosAplicaveis(triagem, respostas);
  if (!aplicaveis || aplicaveis.length === 0) return 'rascunho';

  let respondidos = 0;
  let pendentes = 0;

  for (const item of aplicaveis) {
    const resp = respostas[item.id] || respostas[String(item.id)];
    const val = resp ? (typeof resp === 'object' ? (resp.resposta || resp.valor) : resp) : null;
    if (val !== null && val !== undefined && val !== '') {
      respondidos++;
    } else {
      pendentes++;
    }
  }

  if (respondidos === 0) return 'rascunho';
  if (pendentes === 0) return 'concluida';
  return 'em_andamento';
}

