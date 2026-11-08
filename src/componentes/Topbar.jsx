import { IconChevronLeft, IconHome } from '@tabler/icons-react';
import { useNavegacao } from '../utilitarios/navegacao';
import styles from './Topbar.module.css';

// A seta sobe um nível (regra em utilitarios/navegacao.js). inicio: atalho fixo para o Início
export default function Topbar({ eyebrow, titulo, voltar = true, acaoDireita, inicio = false }) {
  const { navegar, voltar: subirNivel } = useNavegacao();

  return (
    <header className={styles.topbar}>
      <div className={styles.conteudo}>
        {voltar ? (
          <button className={styles.btn} onClick={subirNivel} aria-label="Voltar">
            <IconChevronLeft size={24} />
          </button>
        ) : (
          <span className={styles.espacador} />
        )}

        <div className={styles.centro}>
          {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
          <h1 className={styles.titulo}>{titulo}</h1>
        </div>

        {acaoDireita ? (
          <button className={styles.btn} onClick={acaoDireita.fn} aria-label={acaoDireita.label}>
            {acaoDireita.icone}
          </button>
        ) : inicio ? (
          <button className={styles.btn} onClick={() => navegar('/')} aria-label="Ir para o Início" title="Início">
            <IconHome size={22} />
          </button>
        ) : (
          <span className={styles.espacador} />
        )}
      </div>
    </header>
  );
}
