import { IconCheck, IconAlertCircle, IconInfoCircle, IconX } from '@tabler/icons-react';
import styles from './ToastContainer.module.css';

export default function ToastContainer({ toasts, onRemover }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className={styles.container} role="region" aria-label="Notificações" aria-live="polite">
      {toasts.map((toast) => {
        const tipoClasse =
          toast.tipo === 'sucesso'
            ? styles.toastSucesso
            : toast.tipo === 'erro'
            ? styles.toastErro
            : styles.toastInfo;

        return (
          <div key={toast.id} className={`${styles.toast} ${tipoClasse}`}>
            <div className={styles.icone}>
              {toast.tipo === 'sucesso' && <IconCheck size={20} />}
              {toast.tipo === 'erro' && <IconAlertCircle size={20} />}
              {toast.tipo !== 'sucesso' && toast.tipo !== 'erro' && <IconInfoCircle size={20} />}
            </div>
            <div className={styles.mensagem}>{toast.mensagem}</div>
            <button
              type="button"
              className={styles.btnFechar}
              onClick={() => onRemover(toast.id)}
              aria-label="Fechar notificação"
            >
              <IconX size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
