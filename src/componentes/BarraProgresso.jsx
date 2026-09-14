import styles from './BarraProgresso.module.css';

export default function BarraProgresso({ pct, label }) {
  return (
    <div className={styles.wrap}>
      <div className="progresso-track">
        <div className="progresso-fill" style={{ width: `${pct}%` }} />
      </div>
      {label && <p className={styles.label}>{label}</p>}
    </div>
  );
}
