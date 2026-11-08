// Dados carregados do JSON gerado via planilha NBR 9050
import dados from './checklist.json';
import { listarFotos } from './fotos.js';

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
 * Progresso de uma vistoria e posição, na lista completa, do primeiro item técnico sem resposta (-1 se não houver)
 */
export function resumoProgresso(respostas = {}) {
  const total = ITENS_TECNICOS.length;
  const respondidos = ITENS_TECNICOS.filter(item => respostas[item.id]?.valor).length;
  const pendente = ITENS_TECNICOS.find(item => !respostas[item.id]?.valor);

  return {
    total,
    respondidos,
    pct: total > 0 ? Math.round((respondidos / total) * 100) : 0,
    proximoIndice: pendente ? TODOS_ITENS.findIndex(i => i.id === pendente.id) : -1,
  };
}

const VALORES_NEGATIVOS = ['nao', 'nao-conforme', 'nao-aplica'];

// Itens ligados a mais de uma triagem (dependeDe em lista): os corrimãos de escada e rampa externas
const itensConjuntos = triagemId => TODOS_ITENS.filter(i => Array.isArray(i.dependeDe) && i.dependeDe.includes(triagemId));

/** Itens ligados a várias triagens que saem junto com esta: só quando todas as outras já são negativas. */
function conjuntosQueFecham(triagem, respostas) {
  return itensConjuntos(triagem?.id)
    .filter(i => i.dependeDe.every(id => id === triagem.id || VALORES_NEGATIVOS.includes(respostas[id]?.valor)))
    .map(i => i.id);
}

/**
 * Todos os itens abaixo de uma triagem, incluindo os de triagens aninhadas,
 * cada um com a triagem que o controla diretamente.
 */
export function dependentesEmCascata(triagem, respostas = {}) {
  return [...(triagem?.dependentes || []), ...conjuntosQueFecham(triagem, respostas)].flatMap(depId => [
    { id: depId, origemTriagem: triagem.id },
    ...dependentesEmCascata(ITENS_POR_ID[depId], respostas),
  ]);
}

/**
 * Itens abaixo da triagem com registros que uma resposta negativa apagaria.
 * Um N/A sem observação nem foto não conta: o resultado da cascata seria o mesmo.
 */
export function dependentesComDados(triagem, respostas = {}) {
  return dependentesEmCascata(triagem, respostas).map(dep => dep.id).filter(id => {
    const resp = respostas[id];
    return resp && ((resp.valor && resp.valor !== 'nao-aplica') || resp.obs || listarFotos(resp).length > 0);
  });
}

/**
 * Itens a limpar quando uma triagem deixa de ser negativa, incluindo os de triagens aninhadas.
 * Vistorias salvas antes de a marca `automatico` ser persistida não a têm: nelas, um N/A sem
 * observação nem foto sob uma triagem negativa é tratado como automático.
 */
export function dependentesParaLimpar(triagem, respostas = {}) {
  const valorTriagem = respostas[triagem?.id]?.valor;
  const triagemNegativa = VALORES_NEGATIVOS.includes(valorTriagem);
  const diretos = triagem?.dependentes || [];
  const conjuntos = itensConjuntos(triagem?.id).map(i => i.id);
  const limpar = [];

  for (const depId of [...diretos, ...conjuntos]) {
    const resp = respostas[depId];
    const automatica = resp?.automatico ||
      (triagemNegativa && diretos.includes(depId) && resp?.valor === 'nao-aplica' && !resp.obs && listarFotos(resp).length === 0);
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

