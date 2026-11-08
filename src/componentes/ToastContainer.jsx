import { IconCheck, IconAlertCircle, IconInfoCircle, IconX } from '@tabler/icons-react';
import styles from './ToastContainer.module.css';

// A região fica sempre montada, para o leitor de tela anunciar o que entrar nela
export default function ToastContainer({ toasts = [], onRemover, onPausar, onRetomar }) {
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
          <div key={toast.id} className={`${styles.toast} ${tipoClasse}`} onMouseEnter={onPausar} onMouseLeave={onRetomar} onFocus={onPausar} onBlur={onRetomar}>
            <div className={styles.icone}>
              {toast.tipo === 'sucesso' && <IconCheck size={20} />}
              {toast.tipo === 'erro' && <IconAlertCircle size={20} />}
              {toast.tipo !== 'sucesso' && toast.tipo !== 'erro' && <IconInfoCircle size={20} />}
            </div>
            <div className={styles.mensagem}>{toast.mensagem}</div>
            {toast.acao && (
              <button
                type="button"
                className={styles.btnAcao}
                onClick={() => {
                  onRemover(toast.id);
                  toast.acao.fn();
                }}
              >
                {toast.acao.rotulo}
              </button>
            )}
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
