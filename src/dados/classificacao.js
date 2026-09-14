/**
 * Utilitários de cálculo e interpretação do Índice de Acessibilidade
 * Padrão oficial: Escala Decimal x,x (0,0 a 10,0) com classificação qualitativa
 */

export const FAIXAS_INDICE = [
  { minPct: 0,  maxPct: 40,  minNota: 0.0, maxNota: 4.0, rotulo: 'CRÍTICO',     cor: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)', borda: 'rgba(239, 68, 68, 0.35)', faixaTexto: '0,0 – 4,0' },
  { minPct: 40, maxPct: 70,  minNota: 4.0, maxNota: 7.0, rotulo: 'INSUFICIENTE', cor: '#F97316', bg: 'rgba(249, 115, 22, 0.15)', borda: 'rgba(249, 115, 22, 0.35)', faixaTexto: '4,0 – 7,0' },
  { minPct: 70, maxPct: 90,  minNota: 7.0, maxNota: 9.0, rotulo: 'ADEQUADO',     cor: '#EAB308', bg: 'rgba(234, 179, 8, 0.15)', borda: 'rgba(234, 179, 8, 0.35)', faixaTexto: '7,0 – 9,0' },
  { minPct: 90, maxPct: 100, minNota: 9.0, maxNota: 10.0, rotulo: 'EXCELENTE',   cor: '#22C55E', bg: 'rgba(34, 197, 94, 0.15)', borda: 'rgba(34, 197, 94, 0.35)', faixaTexto: '9,0 – 10,0' },
];

export function classificarNota(nota) {
  if (nota === null || nota === undefined || isNaN(nota)) {
    return {
      notaFormatada: '–',
      rotulo: 'SEM DADOS',
      cor: 'var(--text-muted)',
      bg: 'rgba(255, 255, 255, 0.05)',
      borda: 'var(--border)',
    };
  }

  const n = Math.max(0, Math.min(10, nota));
  const notaFormatada = n.toFixed(1).replace('.', ',');

  if (n >= 9.0) {
    return {
      notaFormatada,
      rotulo: 'EXCELENTE',
      cor: '#22C55E',
      bg: 'rgba(34, 197, 94, 0.15)',
      borda: 'rgba(34, 197, 94, 0.35)',
    };
  }
  if (n >= 7.0) {
    return {
      notaFormatada,
      rotulo: 'ADEQUADO',
      cor: '#EAB308',
      bg: 'rgba(234, 179, 8, 0.15)',
      borda: 'rgba(234, 179, 8, 0.35)',
    };
  }
  if (n >= 4.0) {
    return {
      notaFormatada,
      rotulo: 'INSUFICIENTE',
      cor: '#F97316',
      bg: 'rgba(249, 115, 22, 0.15)',
      borda: 'rgba(249, 115, 22, 0.35)',
    };
  }
  return {
    notaFormatada,
    rotulo: 'CRÍTICO',
    cor: '#EF4444',
    bg: 'rgba(239, 68, 68, 0.15)',
    borda: 'rgba(239, 68, 68, 0.35)',
  };
}

export function calcularIndiceItens(itens, respostas) {
  const contaveis = (itens || []).filter(i => i.tipo === 'tecnico');
  const conf = contaveis.filter(i => respostas[i.id]?.valor === 'conforme' || respostas[i.id]?.valor === 'sim').length;
  const nc = contaveis.filter(i => respostas[i.id]?.valor === 'nao-conforme' || respostas[i.id]?.valor === 'nao').length;
  const na = contaveis.filter(i => respostas[i.id]?.valor === 'nao-aplica').length;
  const total = conf + nc; // Apenas exigências ativas avaliadas (N/A é excluído do divisor)
  const pct = total > 0 ? (conf / total) * 100 : null;
  const nota = total > 0 ? (conf / total) * 10 : null;

  return {
    conf,
    nc,
    na,
    total,
    pct: pct !== null ? Math.round(pct) : null,
    nota,
    classificacao: classificarNota(nota),
  };
}
