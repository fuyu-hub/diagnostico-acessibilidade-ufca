import { IconAlertTriangle, IconDownload, IconX } from '@tabler/icons-react';
import { useTravaScroll } from '../utilitarios/travaScroll';
import styles from './ModalConflito.module.css';

export default function ModalErroCota({ aberto, erro: _erro, onExportarEmergencia, onFechar }) {
  useTravaScroll(aberto);

  if (!aberto) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="titulo-cota">
      <div className={styles.modal} style={{ maxWidth: 480, borderTop: '4px solid #ef4444' }}>
        <div className={styles.cabecalho}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <IconAlertTriangle size={24} color="#ef4444" />
            <h2 id="titulo-cota" className={styles.titulo} style={{ color: '#ef4444' }}>
              Espaço de Armazenamento Esgotado
            </h2>
          </div>
          <button type="button" className={styles.btnFechar} onClick={onFechar} aria-label="Fechar">
            <IconX size={20} />
          </button>
        </div>

        <div className={styles.corpo}>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-primary)', marginBottom: 12, lineHeight: 1.6 }}>
            O espaço reservado pelo navegador para este aplicativo foi totalmente ocupado. O salvamento automático foi pausado para proteger seus dados.
          </p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.5 }}>
            Para não perder as respostas preenchidas nesta sessão, salve um backup manual de emergência agora mesmo.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              type="button"
              className={styles.btnEstrategia}
              style={{ background: 'var(--accent, #3b82f6)', color: '#fff', justifyContent: 'center' }}
              onClick={onExportarEmergencia}
            >
              <IconDownload size={20} />
              <span>Salvar Backup de Emergência</span>
            </button>

            <button
              type="button"
              className={styles.btnCancelar}
              onClick={onFechar}
            >
              Continuar navegando sem salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
