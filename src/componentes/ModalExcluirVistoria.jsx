import { useState, useEffect, useRef } from 'react';
import { IconTrash, IconDownload } from '@tabler/icons-react';
import { useTravaScroll } from '../utilitarios/travaScroll';
import { useFocusTrap } from '../utilitarios/focusTrap';
import styles from './ModalExcluirVistoria.module.css';

export default function ModalExcluirVistoria({
  aberto,
  nomeVistoria = '',
  onExportar,
  onConfirmar,
  onCancelar,
}) {
  const [exportadoComSucesso, setExportadoComSucesso] = useState(false);
  const modalRef = useRef(null);

  useTravaScroll(aberto);
  useFocusTrap(aberto, modalRef);

  useEffect(() => {
    if (aberto) {
      setExportadoComSucesso(false);
    }
  }, [aberto]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onCancelar();
      }
    }

    if (aberto) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [aberto, onCancelar]);

  if (!aberto) return null;

  async function handleBaixarCopia() {
    if (onExportar) {
      try {
        await onExportar();
        setExportadoComSucesso(true);
      } catch (err) {
        console.error('Erro ao exportar antes de excluir:', err);
      }
    }
  }

  return (
    <div
      className={styles.overlay}
      onClick={onCancelar}
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-modal-exclusao"
    >
      <div ref={modalRef} className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.iconeWrap}>
          <IconTrash size={32} />
        </div>

        <div className={styles.conteudo}>
          <h3 id="titulo-modal-exclusao" className={styles.titulo}>
            Excluir esta vistoria?
          </h3>
          <p className={styles.mensagem}>
            Esta ação é <strong>definitiva e irreversível</strong>. Todo o histórico, respostas e fotos serão apagados permanentemente.
          </p>

          {/* Sugestão de exportação preventiva */}
          {onExportar && (
            <div className={styles.blocoBackup}>
              <button
                type="button"
                className={styles.btnBackupPreventivo}
                onClick={handleBaixarCopia}
              >
                <IconDownload size={18} />
                <span>{exportadoComSucesso ? '✓ Cópia de segurança salva' : 'Baixar cópia de segurança'}</span>
              </button>
            </div>
          )}


        </div>

        <div className={styles.acoes}>
          <button
            type="button"
            className={styles.btnSim}
            onClick={onConfirmar}
          >
            Excluir Definitivamente
          </button>

          <button
            type="button"
            className={styles.btnNao}
            onClick={onCancelar}
          >
            Cancelar e Manter Vistoria
          </button>
        </div>
      </div>
    </div>
  );
}
