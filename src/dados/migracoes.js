import { Vistoria } from './esquema.js';

/**
 * Gera UUID v4 seguro com fallback
 */
export function gerarUUID() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Normaliza um valor de resposta legado para o enum canônico
 */
export function normalizarValorResposta(val) {
  if (!val) return null;
  const s = String(val).toLowerCase().trim();
  if (s === 'conforme' || s === 'sim') return 'conforme';
  if (s === 'nao-conforme' || s === 'nao_conforme' || s === 'nao') return 'nao_conforme';
  if (s === 'nao-aplica' || s === 'nao_aplica') return 'nao_aplica';
  return null;
}

/**
 * Converte uma vistoria no formato legado (localStorage nbr9050_vistorias)
 * para o formato canônico Zod sem perder nenhum dado preenchido.
 */
export function converterLegadoParaCanonica(legada) {
  if (!legada || typeof legada !== 'object') {
    throw new Error('Vistoria legada inválida fornecida para migração.');
  }

  // Se já for uma vistoria no formato canônico com vistoriaId UUID válido
  const validacaoDireta = Vistoria.safeParse(legada);
  if (validacaoDireta.success) {
    return validacaoDireta.data;
  }

  // Verifica se o objeto possui minimamente características de uma vistoria (nome, blocoAvaliado, respostas ou dadosVistoria)
  const temIndiciosVistoria =
    legada.respostas !== undefined ||
    legada.dadosVistoria !== undefined ||
    legada.blocoAvaliado !== undefined ||
    legada.nome !== undefined;

  if (!temIndiciosVistoria) {
    throw new Error('Conteúdo do arquivo não reconhecido como vistoria válida.');
  }

  const isUUID = (str) =>
    typeof str === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);

  const vistoriaId = isUUID(legada.vistoriaId)
    ? legada.vistoriaId
    : isUUID(legada.id)
      ? legada.id
      : gerarUUID();

  const dataAgora = new Date().toISOString();
  const dataCriacao = legada.dataCriacao || legada.criadaEm || dataAgora;
  const dataUltimaEdicao = legada.dataUltimaEdicao || dataAgora;

  // Normalização das respostas
  const dadosVistoria = {};
  const respostasLegadas = legada.respostas || legada.dadosVistoria || {};

  let totalRespondidos = 0;
  for (const [chave, item] of Object.entries(respostasLegadas)) {
    if (!item) continue;
    const valorBruto = typeof item === 'object' ? (item.resposta || item.valor) : item;
    const respostaNormalizada = normalizarValorResposta(valorBruto);
    const obs = typeof item === 'object' ? (item.observacao || item.obs || '') : '';
    const foto = typeof item === 'object' ? (item.foto || null) : null;

    if (respostaNormalizada !== null) {
      totalRespondidos++;
    }

    dadosVistoria[String(chave)] = {
      resposta: respostaNormalizada,
      observacao: typeof obs === 'string' ? obs : String(obs),
      foto: foto || null,
    };
  }

  // Determinar status coerente se não estiver explícito
  let status = legada.status;
  if (!['rascunho', 'em_andamento', 'concluida', 'arquivada'].includes(status)) {
    if (totalRespondidos > 0) {
      status = 'em_andamento';
    } else {
      status = 'rascunho';
    }
  }

  // Bloco avaliado / Ficha institucional
  const blocoAvaliado = (legada.blocoAvaliado || legada.nome || 'Instituição / Bloco').trim();

  const instituicao = {
    nome: legada.nome || '',
    cidade: legada.cidade || '',
    endereco: legada.endereco || '',
    bairro: legada.bairro || '',
    rede: legada.rede || '',
    nivelEnsino: legada.nivelEnsino || [],
    numAlunos: String(legada.numAlunos || ''),
    numPavimentos: String(legada.numPavimentos || '1'),
    anoConstrucao: String(legada.anoConstrucao || ''),
    data: legada.data || '',
    horarioInicio: legada.horarioInicio || '',
    horarioTermino: legada.horarioTermino || '',
    avaliadores: Array.isArray(legada.avaliadores) ? legada.avaliadores : [],
    idLegado: legada.id ? String(legada.id) : undefined,
  };

  const canonica = {
    vistoriaId,
    versaoChecklist: legada.versaoChecklist || '1.0',
    versaoClassificacao: legada.versaoClassificacao || '1.0',
    status,
    revisao: typeof legada.revisao === 'number' ? legada.revisao : 0,
    dataCriacao,
    dataUltimaEdicao,
    sincronizada: Boolean(legada.sincronizada),
    dataUltimaSincronizacao: legada.dataUltimaSincronizacao || null,
    consentimento: legada.consentimento || {
      aceito: true,
      versaoTermo: '1.0',
      dataAceite: dataCriacao,
    },
    blocoAvaliado: blocoAvaliado || 'Bloco sem nome',
    instituicao,
    triagem: legada.triagem || {
      nivelEnsino: 'nao_aplicavel',
      respostas: {},
    },
    dadosVistoria,
    resultadoSnapshot: legada.resultadoSnapshot || null,
  };

  return Vistoria.parse(canonica);
}

/**
 * Tabela de migrações sequenciais de checklist (ex: 1.0 -> 1.1)
 */
export const migracoesChecklist = {
  // Próximas versões serão inseridas aqui:
  // "1.0": (vistoria) => ({ ...vistoria, versaoChecklist: "1.1" }),
};
