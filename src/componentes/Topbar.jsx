import { useNavigate } from 'react-router-dom';
import { IconChevronLeft } from '@tabler/icons-react';
import styles from './Topbar.module.css';

// voltar: true | false | string (rota)
export default function Topbar({ eyebrow, titulo, voltar = true, acaoDireita }) {
  const navigate = useNavigate();

  function handleVoltar() {
    if (typeof voltar === 'function') voltar();
    else if (typeof voltar === 'string') navigate(voltar);
    else navigate(-1);
  }

  return (
    <header className={styles.topbar}>
      <div className={styles.conteudo}>
        {voltar ? (
          <button className={styles.btn} onClick={handleVoltar} aria-label="Voltar">
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
        ) : (
          <span className={styles.espacador} />
        )}
      </div>
    </header>
  );
}
