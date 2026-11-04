/**
 * Utilitários de cálculo e interpretação do Índice de Acessibilidade
 * Padrão oficial: Escala Decimal x,x (0,0 a 10,0) com classificação qualitativa
 */

export const FAIXAS_INDICE = [
  {
    minPct: 0,
    maxPct: 40,
    minNota: 0.0,
    maxNota: 4.0,
    rotulo: 'CRÍTICO',
    cor: 'var(--iaa-critico)',
    corNota: 'var(--iaa-critico-nota, var(--iaa-critico))',
    bg: 'var(--iaa-critico-bg)',
    borda: 'var(--iaa-critico-border)',
    dot: 'var(--iaa-critico-dot, var(--iaa-critico))',
    faixaTexto: '0,0 – 3,9',
    descricao: 'Necessita de medidas de adequação urgentes',
  },
  {
    minPct: 40,
    maxPct: 70,
    minNota: 4.0,
    maxNota: 7.0,
    rotulo: 'INSUFICIENTE',
    cor: 'var(--iaa-insuficiente)',
    corNota: 'var(--iaa-insuficiente-nota, var(--iaa-insuficiente))',
    bg: 'var(--iaa-insuficiente-bg)',
    borda: 'var(--iaa-insuficiente-border)',
    dot: 'var(--iaa-insuficiente-dot, var(--iaa-insuficiente))',
    faixaTexto: '4,0 – 6,9',
    descricao: 'Necessita de medidas de adequação a curto ou a médio prazo',
  },
  {
    minPct: 70,
    maxPct: 90,
    minNota: 7.0,
    maxNota: 9.0,
    rotulo: 'PARCIALMENTE ADEQUADO',
    cor: 'var(--iaa-parcial)',
    corNota: 'var(--iaa-parcial-nota, var(--iaa-parcial))',
    bg: 'var(--iaa-parcial-bg)',
    borda: 'var(--iaa-parcial-border)',
    dot: 'var(--iaa-parcial-dot, var(--iaa-parcial))',
    faixaTexto: '7,0 – 8,9',
    descricao: 'Apresenta pequenas não conformidades, com necessidade de ajustes pontuais',
  },
  {
    minPct: 90,
    maxPct: 100,
    minNota: 9.0,
    maxNota: 10.0,
    rotulo: 'ADEQUADO',
    cor: 'var(--iaa-adequado)',
    corNota: 'var(--iaa-adequado-nota, var(--iaa-adequado))',
    bg: 'var(--iaa-adequado-bg)',
    borda: 'var(--iaa-adequado-border)',
    dot: 'var(--iaa-adequado-dot, var(--iaa-adequado))',
    faixaTexto: '9,0 – 10,0',
    descricao: 'Com necessidade apenas de intervenções mínimas',
  },
];

export function classificarNota(nota) {
  if (nota === null || nota === undefined || isNaN(nota)) {
    return {
      notaFormatada: '–',
      rotulo: 'SEM DADOS',
      cor: 'var(--text-muted)',
      corNota: 'var(--text-muted)',
      bg: 'var(--tinta-suave)',
      borda: 'var(--border)',
      dot: 'var(--text-muted)',
    };
  }

  // A faixa é decidida pela nota com uma casa decimal, a mesma que é exibida
  const n = Number(Math.max(0, Math.min(10, nota)).toFixed(1));
  const notaFormatada = n.toFixed(1).replace('.', ',');

  if (n >= 9.0) {
    return {
      notaFormatada,
      rotulo: 'ADEQUADO',
      descricao: 'Com necessidade apenas de intervenções mínimas',
      cor: 'var(--iaa-adequado)',
      corNota: 'var(--iaa-adequado-nota, var(--iaa-adequado))',
      bg: 'var(--iaa-adequado-bg)',
      borda: 'var(--iaa-adequado-border)',
      dot: 'var(--iaa-adequado-dot, var(--iaa-adequado))',
    };
  }
  if (n >= 7.0) {
    return {
      notaFormatada,
      rotulo: 'PARCIALMENTE ADEQUADO',
      descricao: 'Apresenta pequenas não conformidades, com necessidade de ajustes pontuais',
      cor: 'var(--iaa-parcial)',
      corNota: 'var(--iaa-parcial-nota, var(--iaa-parcial))',
      bg: 'var(--iaa-parcial-bg)',
      borda: 'var(--iaa-parcial-border)',
      dot: 'var(--iaa-parcial-dot, var(--iaa-parcial))',
    };
  }
  if (n >= 4.0) {
    return {
      notaFormatada,
      rotulo: 'INSUFICIENTE',
      descricao: 'Necessita de medidas de adequação a curto ou a médio prazo',
      cor: 'var(--iaa-insuficiente)',
      corNota: 'var(--iaa-insuficiente-nota, var(--iaa-insuficiente))',
      bg: 'var(--iaa-insuficiente-bg)',
      borda: 'var(--iaa-insuficiente-border)',
      dot: 'var(--iaa-insuficiente-dot, var(--iaa-insuficiente))',
    };
  }
  return {
    notaFormatada,
    rotulo: 'CRÍTICO',
    descricao: 'Necessita de medidas de adequação urgentes',
    cor: 'var(--iaa-critico)',
    corNota: 'var(--iaa-critico-nota, var(--iaa-critico))',
    bg: 'var(--iaa-critico-bg)',
    borda: 'var(--iaa-critico-border)',
    dot: 'var(--iaa-critico-dot, var(--iaa-critico))',
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
