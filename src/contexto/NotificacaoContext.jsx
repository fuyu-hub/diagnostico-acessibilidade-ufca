import { createContext, useContext, useState, useCallback, useRef } from 'react';
import ModalDialogo from '../componentes/ModalDialogo';
import ToastContainer from '../componentes/ToastContainer';

const NotificacaoContext = createContext(null);

export function NotificacaoProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [dialogo, setDialogo] = useState(null);

  const toastIdRef = useRef(0);

  const mostrarToast = useCallback((mensagem, tipo = 'info', duracao = 4000) => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, mensagem, tipo }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duracao);
  }, []);

  const removerToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const mostrarAlerta = useCallback((titulo, mensagem) => {
    return new Promise((resolve) => {
      setDialogo({
        tipo: 'alerta',
        titulo,
        mensagem,
        textoConfirmar: 'Entendido',
        onConfirmar: () => {
          setDialogo(null);
          resolve(true);
        },
      });
    });
  }, []);

  const mostrarConfirmacao = useCallback(
    ({
      titulo = 'Confirmação',
      mensagem,
      textoConfirmar = 'Confirmar',
      textoCancelar = 'Cancelar',
      perigo = false,
    }) => {
      return new Promise((resolve) => {
        setDialogo({
          tipo: 'confirmacao',
          titulo,
          mensagem,
          textoConfirmar,
          textoCancelar,
          perigo,
          onConfirmar: () => {
            setDialogo(null);
            resolve(true);
          },
          onCancelar: () => {
            setDialogo(null);
            resolve(false);
          },
        });
      });
    }
  );

  return (
    <NotificacaoContext.Provider
      value={{
        mostrarToast,
        removerToast,
        mostrarAlerta,
        mostrarConfirmacao,
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onRemover={removerToast} />
      {dialogo && <ModalDialogo dialogo={dialogo} />}
    </NotificacaoContext.Provider>
  );
}

export function useNotificacao() {
  const ctx = useContext(NotificacaoContext);
  if (!ctx) {
    throw new Error('useNotificacao deve ser usado dentro de NotificacaoProvider');
  }
  return ctx;
}
