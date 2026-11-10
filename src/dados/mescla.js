// Mescla de cópias da mesma vistoria vindas de aparelhos diferentes (Escopo 09, Etapa 1).
//
// Cada resposta é um registro imutável com `atualizadaEm` (quando), `autor` (quem) e `base`
// (o carimbo mais recente que essa pessoa tinha na tela ao responder). Uma resposta só
// substitui outra quando foi dada depois e por quem já tinha visto a anterior. Respostas dadas
// sem uma conhecer a outra continuam todas guardadas: a mais recente aparece, e as demais
// ficam em `alternativas` até alguém responder de novo, o que encerra a divergência.
//
// A mescla não depende da ordem nem de quantas vezes é aplicada, para que todos os
// aparelhos cheguem ao mesmo resultado. A única exceção são respostas antigas, sem carimbo,
// em que a ordem das cópias desempata.

import { listarFotos, camposFotos } from './fotos.js';

const carimbo = e => e?.atualizadaEm || '';

function temConteudo(e) {
  return e.resposta !== null || (e.observacao || '') !== '' || listarFotos(e).length > 0;
}

// Identidade de um registro. Fotos ficam de fora: alternativas são guardadas sem elas.
function chave(e) {
  return [e.autor || '', carimbo(e), e.resposta ?? '', e.observacao || ''].join('\u0001');
}

/** Registros de um item: a resposta principal e as alternativas guardadas. */
function registrosDoItem(valor) {
  if (!valor || typeof valor !== 'object') return [];
  const { alternativas, ...principal } = valor;
  return [principal, ...(Array.isArray(alternativas) ? alternativas : [])];
}

/** Carimbo mais recente entre a resposta e as alternativas de um item. */
export function carimboConhecido(valor) {
  return registrosDoItem(valor).reduce((maior, e) => (carimbo(e) > maior ? carimbo(e) : maior), '');
}

/**
 * `a` substitui `b` quando foi dada depois, por quem já conhecia `b`.
 * Um N/A automático de triagem nunca substitui a resposta manual de outra pessoa.
 */
function substitui(a, b) {
  if (!a.atualizadaEm || a.base === undefined) return false;
  if (a.atualizadaEm <= carimbo(b) || a.base < carimbo(b)) return false;
  if (a.automatico && !b.automatico && a.autor !== b.autor) return false;
  return true;
}

/**
 * Prepara uma resposta nova para gravar, carimbada com autor, hora e o que havia na tela.
 * O carimbo sempre avança além do que já era conhecido, mesmo com o relógio atrasado.
 */
export function carimbarResposta(nova, anterior, autor, agora = new Date().toISOString()) {
  const { alternativas: _alt, atualizadaEm: _em, autor: _autor, base: _base, ...limpa } = nova;
  const conhecido = anterior ? carimboConhecido(anterior) : '';
  let quando = agora;
  if (conhecido && quando <= conhecido) {
    quando = new Date(Date.parse(conhecido) + 1).toISOString();
  }
  return {
    ...limpa,
    atualizadaEm: quando,
    autor,
    ...(anterior ? { base: conhecido } : {}),
  };
}

/** Campos de carimbo e divergência de uma resposta, para as conversões de formato preservarem. */
export function extrairCarimbos(resposta) {
  if (!resposta || typeof resposta !== 'object') return {};
  const campos = {};
  for (const nome of ['atualizadaEm', 'autor', 'base']) {
    if (typeof resposta[nome] === 'string') campos[nome] = resposta[nome];
  }
  if (Array.isArray(resposta.alternativas) && resposta.alternativas.length > 0) {
    campos.alternativas = resposta.alternativas;
  }
  return campos;
}

/**
 * Mescla os valores de um mesmo item vindos de várias cópias.
 * Em respostas antigas, sem carimbo, a cópia que vem depois na lista vence o empate.
 * @returns {object|null} a resposta mesclada, com `alternativas` se houver divergência
 */
export function mesclarItem(valores) {
  const vistos = new Map();

  valores.forEach((valor, ordem) => {
    for (const registro of registrosDoItem(valor)) {
      // Resposta antiga vazia é ausência de resposta, e não uma decisão de apagar
      if (!registro.atualizadaEm && !temConteudo(registro)) continue;
      const k = chave(registro);
      const visto = vistos.get(k);
      if (visto) {
        visto.fotos.push(...listarFotos(registro));
        visto.ordem = Math.max(visto.ordem, ordem);
      } else {
        vistos.set(k, { registro, ordem, chave: k, fotos: listarFotos(registro) });
      }
    }
  });

  const todos = [...vistos.values()];
  if (todos.length === 0) return null;

  const vigentes = todos
    .filter(x => !todos.some(y => y !== x && substitui(y.registro, x.registro)))
    .sort((x, y) =>
      carimbo(y.registro).localeCompare(carimbo(x.registro)) ||
      y.ordem - x.ordem ||
      x.chave.localeCompare(y.chave)
    );

  const [vencedora, ...outras] = vigentes;
  const { alternativas: _alt, foto: _foto, fotos: _fotos, ...principal } = vencedora.registro;
  const fotos = [...new Set(vigentes.flatMap(v => v.fotos))];

  // Uma alternativa igual à principal, ou que só não tem observação, não acrescenta nada
  const alternativas = outras
    .map(o => {
      const { alternativas: _a, foto: _f, fotos: _fs, ...resto } = o.registro;
      return resto;
    })
    .filter(a => a.resposta !== principal.resposta ||
      ((a.observacao || '') !== '' && a.observacao !== principal.observacao));

  return {
    ...principal,
    observacao: principal.observacao || '',
    ...camposFotos(fotos),
    ...(alternativas.length > 0 ? { alternativas } : {}),
  };
}

/**
 * Mescla as respostas (`dadosVistoria`) de várias cópias de uma vistoria.
 * @param {object[]} listaDados - um `dadosVistoria` por cópia
 */
export function mesclarCopias(listaDados) {
  const ids = new Set(listaDados.flatMap(d => Object.keys(d || {})));
  const resultado = {};
  for (const id of ids) {
    const mesclado = mesclarItem(listaDados.map(d => d?.[id]));
    if (mesclado) resultado[id] = mesclado;
  }
  return resultado;
}

/** Itens em que pessoas deram respostas diferentes e ninguém decidiu ainda. */
export function listarDivergencias(dadosVistoria = {}) {
  return Object.entries(dadosVistoria)
    .filter(([, valor]) => (valor?.alternativas || []).some(a => a.resposta !== valor.resposta))
    .map(([itemId, valor]) => ({ itemId, opcoes: registrosDoItem(valor) }));
}
