import { useEffect } from 'react';
import { IconTrash } from '@tabler/icons-react';
import styles from './ModalExcluirVistoria.module.css';

export default function ModalExcluirVistoria({
  aberto,
  nomeVistoria,
  onConfirmar,
  onCancelar,
}) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onCancelar();
      }
    }

    if (aberto) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [aberto, onCancelar]);

  if (!aberto) return null;

  return (
    <div
      className={styles.overlay}
      onClick={onCancelar}
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-modal-exclusao"
    >
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.iconeWrap}>
          <IconTrash size={32} />
        </div>

        <div className={styles.conteudo}>
          <h3 id="titulo-modal-exclusao" className={styles.titulo}>
            Excluir esta vistoria?
          </h3>
          <p className={styles.mensagem}>
            Deseja realmente excluir a vistoria{' '}
            {nomeVistoria ? <strong>"{nomeVistoria}"</strong> : ''}?
            <br />
            Esta ação é permanente e removerá todas as informações, respostas do checklist e fotos deste diagnóstico.
          </p>
        </div>

        <div className={styles.acoes}>
          <button
            type="button"
            className={styles.btnSim}
            onClick={onConfirmar}
          >
            Sim, tenho certeza
          </button>

          <button
            type="button"
            className={styles.btnNao}
            onClick={onCancelar}
          >
            Não, manter vistoria
          </button>
        </div>
      </div>
    </div>
  );
}
