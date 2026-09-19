import { z } from 'zod';

export const RespostaCriterio = z.object({
  resposta: z.enum(['conforme', 'nao_conforme', 'nao_aplica']).nullable(),
  observacao: z.string().default(''),
  foto: z.string().nullable().optional(),
});

export const Consentimento = z.object({
  aceito: z.boolean().default(true),
  versaoTermo: z.string().default('1.0'),
  dataAceite: z.string().nullable().default(null),
});

export const FichaInstituicao = z.object({
  nome: z.string().default(''),
  cidade: z.string().default(''),
  endereco: z.string().default(''),
  bairro: z.string().default(''),
  rede: z.string().default(''),
  nivelEnsino: z.union([z.string(), z.array(z.string())]).default([]),
  numAlunos: z.string().default(''),
  numPavimentos: z.string().default('1'),
  anoConstrucao: z.string().default(''),
  data: z.string().default(''),
  dataTermino: z.string().default(''),
  horarioInicio: z.string().default(''),
  horarioTermino: z.string().default(''),
  avaliadores: z.array(z.string()).default([]),
  idLegado: z.string().optional(),
}).passthrough().default({});

export const Triagem = z.object({
  nivelEnsino: z.enum(['infantil', 'fundamental', 'medio', 'superior', 'nao_aplicavel']).default('nao_aplicavel'),
  respostas: z.record(z.string(), z.boolean()).default({}),
});

export const SnapshotResultado = z.object({
  calculadoEm: z.string(),
  versaoClassificacao: z.string(),
  parcial: z.boolean(),
  percentualConformidade: z.number().min(0).max(100),
  itensRespondidos: z.number().int(),
  itensAplicaveis: z.number().int(),
  nota: z.number().nullable().optional(),
  rotulo: z.string().optional(),
});

export const Vistoria = z.object({
  vistoriaId: z.string().uuid(),
  versaoChecklist: z.string().default('1.0'),
  versaoClassificacao: z.string().default('1.0'),
  status: z.enum(['rascunho', 'em_andamento', 'concluida', 'arquivada']).default('rascunho'),
  revisao: z.number().int().nonnegative().default(0),
  dataCriacao: z.string(),
  dataUltimaEdicao: z.string(),
  sincronizada: z.boolean().default(false),
  dataUltimaSincronizacao: z.string().nullable().default(null),
  consentimento: Consentimento.default({ aceito: true, versaoTermo: '1.0', dataAceite: null }),
  blocoAvaliado: z.string().min(1),
  instituicao: FichaInstituicao.optional(),
  triagem: Triagem.default({ nivelEnsino: 'nao_aplicavel', respostas: {} }),
  dadosVistoria: z.record(z.string(), RespostaCriterio).default({}),
  resultadoSnapshot: SnapshotResultado.nullable().default(null),
});

export const EnvelopeExportacao = z.object({
  formato: z.literal('vistoria-ufca'),
  versaoFormato: z.number().int().default(1),
  exportadoEm: z.string(),
  versaoApp: z.string().default('0.4.2'),
  vistorias: z.array(Vistoria).min(1),
});
