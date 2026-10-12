import { useEffect, useRef } from 'react';
import { IconAlertTriangle, IconAlertCircle, IconInfoCircle } from '@tabler/icons-react';
import { useTravaScroll } from '../utilitarios/travaScroll';
import { useFocusTrap } from '../utilitarios/focusTrap';
import styles from './ModalDialogo.module.css';

export default function ModalDialogo({ dialogo }) {
  const modalRef = useRef(null);

  useTravaScroll(!!dialogo);
  useFocusTrap(!!dialogo, modalRef);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        if (dialogo.tipo === 'confirmacao') {
          dialogo.onCancelar?.();
        } else {
          dialogo.onConfirmar?.();
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [dialogo]);

  if (!dialogo) return null;

  const {
    tipo = 'alerta',
    titulo = 'Aviso',
    mensagem = '',
    textoConfirmar = 'OK',
    textoCancelar = 'Cancelar',
    perigo = false,
    onConfirmar,
    onCancelar,
  } = dialogo;

  return (
    <div
      className={styles.overlay}
      onClick={() => {
        if (tipo === 'confirmacao') onCancelar?.();
        else onConfirmar?.();
      }}
      role="presentation"
    >
      <div
        ref={modalRef}
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialogo-titulo"
        aria-describedby="dialogo-mensagem"
      >
        <div
          className={`${styles.iconeTopo} ${
            perigo
              ? styles.iconePerigo
              : tipo === 'alerta'
              ? styles.iconeAlerta
              : styles.iconeInfo
          }`}
        >
          {perigo ? (
            <IconAlertTriangle size={26} />
          ) : tipo === 'alerta' ? (
            <IconAlertCircle size={26} />
          ) : (
            <IconInfoCircle size={26} />
          )}
        </div>

        <h3 id="dialogo-titulo" className={styles.titulo}>
          {titulo}
        </h3>

        <p id="dialogo-mensagem" className={styles.mensagem}>
          {mensagem}
        </p>

        <div className={styles.botoes}>
          {tipo === 'confirmacao' && (
            <button
              type="button"
              className={styles.btnCancelar}
              onClick={onCancelar}
            >
              {textoCancelar}
            </button>
          )}
          <button
            type="button"
            className={`${styles.btnConfirmar} ${perigo ? styles.btnPerigo : ''}`}
            onClick={onConfirmar}
            autoFocus
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
