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

  const MAPA_IDS_LEGADOS = {
    "8": "1001", "13": "1002", "20": "1003", "26": "1004", "36": "1005", "38": "1006", "40": "1007", 
    "61": "1008", "63": "1009", "72": "1010", "91": "1012", "100": "1013", "118": "1014", "122": "1015", 
    "134": "1016", "136": "1025", "147": "1017", "162": "1018", "164": "1019", "170": "1020", "190": "1021", 
    "193": "1022", "197": "1023", "200": "1024",
    // Itens técnicos que foram deslocados após as triagens
    "54": "47", "11": "10", "12": "11", "14": "12", "79": "56", "80": "59", "81": "60", "82": "61",
    "74": "64", "75": "65", "24": "21", "85": "73", "86": "74", "87": "75", "88": "76", "90": "78",
    "34": "30", "109": "94", "37": "32", "39": "33", "41": "34", "42": "35", "43": "36", "44": "37",
    "45": "38", "46": "39", "47": "40", "60": "53", "49": "42", "50": "43", "51": "44", "52": "45",
    "53": "183", "57": "50", "64": "55", "67": "58", "71": "62", "92": "79", "93": "80", "94": "81",
    "95": "82", "96": "83", "97": "84", "98": "85", "99": "86", "102": "88", "103": "89", "105": "90",
    "106": "91", "107": "92", "108": "93", "110": "95", "111": "96", "112": "97", "113": "98", "114": "99",
    "115": "100", "116": "101", "117": "102", "119": "103", "120": "104", "121": "105", "123": "106",
    "124": "107", "125": "108", "126": "109", "127": "110", "168": "147", "130": "113", "131": "114",
    "132": "115", "133": "116", "135": "117", "137": "119", "138": "120", "139": "121", "140": "122",
    "141": "123", "142": "124", "143": "125", "144": "126", "145": "127", "146": "128", "148": "129",
    "149": "130", "150": "131", "151": "132", "152": "133", "153": "134", "154": "135", "155": "136",
    "156": "137", "157": "138", "158": "139", "159": "140", "160": "141", "161": "142", "163": "143",
    "165": "144", "166": "145", "167": "146", "169": "148", "171": "149", "172": "150", "173": "151",
    "174": "152", "175": "153", "176": "154", "177": "155", "178": "156", "179": "157", "180": "158",
    "181": "159", "182": "160", "183": "161", "184": "162", "185": "163", "186": "164", "187": "165",
    "188": "166", "189": "167", "191": "168", "192": "169", "194": "170", "195": "171", "196": "172",
    "198": "173", "199": "174", "201": "175", "202": "176", "203": "177", "204": "178", "205": "179",
    "206": "180", "207": "181", "208": "182"
  };

  let totalRespondidos = 0;
  for (const [chave, item] of Object.entries(respostasLegadas)) {
    if (!item) continue;
    
    // Traduz chave se ela sofreu reordenação
    const chaveAtualizada = MAPA_IDS_LEGADOS[chave] || chave;

    const valorBruto = typeof item === 'object' ? (item.resposta || item.valor) : item;
    const respostaNormalizada = normalizarValorResposta(valorBruto);
    const obs = typeof item === 'object' ? (item.observacao || item.obs || '') : '';
    const foto = typeof item === 'object' ? (item.foto || null) : null;

    if (respostaNormalizada !== null) {
      totalRespondidos++;
    }

    dadosVistoria[String(chaveAtualizada)] = {
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
