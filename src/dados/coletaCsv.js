// Planilha da coleta para pesquisa: uma linha por vistoria, uma coluna por item.
// Separador ";" e BOM, para o Excel em português abrir com acentos e colunas certas.

const COLUNAS_FIXAS = [
  ['vistoriaId', d => d.id],
  ['enviadaEm', d => d.enviadaEm],
  ['versaoTermo', d => d.versaoTermo],
  ['versaoChecklist', d => d.versaoChecklist],
  ['versaoApp', d => d.versaoApp],
  ['cidade', d => d.ficha?.cidade],
  ['rede', d => d.ficha?.rede],
  ['nivelEnsino', d => [].concat(d.ficha?.nivelEnsino ?? []).join(', ')],
  ['numAlunos', d => d.ficha?.numAlunos],
  ['numPavimentos', d => d.ficha?.numPavimentos],
  ['anoConstrucao', d => d.ficha?.anoConstrucao],
  ['nota', d => (typeof d.resultado?.nota === 'number' ? String(d.resultado.nota).replace('.', ',') : '')],
  ['faixa', d => d.resultado?.faixa],
  ['conformes', d => d.resultado?.conformes],
  ['naoConformes', d => d.resultado?.naoConformes],
  ['naoAplica', d => d.resultado?.naoAplica],
];

function celula(valor) {
  const texto = valor === undefined || valor === null ? '' : String(valor);
  return /[";\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

/**
 * @param {object[]} registros - documentos da coleção `coleta`, com `id` e `enviadaEm` em texto ISO
 * @returns {string} conteúdo do CSV
 */
export function coletaParaCsv(registros) {
  const itens = [...new Set(registros.flatMap(r => Object.keys(r.respostas || {})))]
    .sort((a, b) => Number(a) - Number(b));

  const cabecalho = [...COLUNAS_FIXAS.map(([nome]) => nome), ...itens.map(id => `item_${id}`)];
  const linhas = registros.map(r => [
    ...COLUNAS_FIXAS.map(([, valor]) => valor(r)),
    ...itens.map(id => r.respostas?.[id] ?? ''),
  ]);

  return '﻿' + [cabecalho, ...linhas].map(l => l.map(celula).join(';')).join('\r\n') + '\r\n';
}
