import styles from './AnelNota.module.css';

/**
 * Nota do IAA em anel. O anel é decorativo; o valor vai no nome acessível.
 * classificacao: retorno de calcularIndiceItens(...).classificacao
 */
export default function AnelNota({ nota, classificacao, parcial = false, grande = false }) {
  const raio = 52;
  const circunferencia = 2 * Math.PI * raio;
  const temNota = typeof nota === 'number';
  const fracao = temNota ? Math.max(0, Math.min(1, nota / 10)) : 0;
  const cor = temNota ? (classificacao?.corNota || classificacao?.cor) : 'var(--text-muted)';

  return (
    <div
      className={`${styles.anel} ${grande ? styles.grande : ''}`}
      role="img"
      aria-label={temNota ? `Nota ${classificacao.notaFormatada} de 10${parcial ? ', prévia' : ''}` : 'Ainda sem nota'}
    >
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle cx="60" cy="60" r={raio} fill="none" stroke="var(--surface-3)" strokeWidth="12" />
        <circle
          cx="60"
          cy="60"
          r={raio}
          fill="none"
          stroke={cor}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${circunferencia * fracao} ${circunferencia}`}
        />
      </svg>
      <div className={styles.valor} aria-hidden="true">
        <strong style={{ color: cor }}>{temNota ? classificacao.notaFormatada : '–'}</strong>
        <small>{temNota ? `de 10${parcial ? ' · prévia' : ''}` : 'sem nota'}</small>
      </div>
    </div>
  );
}

/** Selo da classificação, com "PRÉVIA" quando o resultado é parcial. */
export function SeloClassificacao({ classificacao, parcial = false }) {
  return (
    <span className={styles.selo} style={{ color: classificacao.cor, borderColor: classificacao.cor }}>
      {classificacao.rotulo}{parcial && classificacao.rotulo !== 'SEM DADOS' ? ' · PRÉVIA' : ''}
    </span>
  );
}
