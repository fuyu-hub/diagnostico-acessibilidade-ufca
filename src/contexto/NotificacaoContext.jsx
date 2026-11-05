import { createContext, useContext, useState, useCallback, useRef } from 'react';
import ModalDialogo from '../componentes/ModalDialogo';
import ToastContainer from '../componentes/ToastContainer';

const NotificacaoContext = createContext(null);

export function NotificacaoProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [dialogo, setDialogo] = useState(null);

  const toastIdRef = useRef(0);

  // acao (opcional): { rotulo, fn } — um botão no aviso, como "Desfazer"
  const mostrarToast = useCallback((mensagem, tipo = 'info', duracao = 4000, acao = null) => {
    const id = ++toastIdRef.current;
    // Um aviso com ação substitui o anterior com ação, para não acumular "Desfazer" antigos
    setToasts((prev) => [...prev.filter((t) => !(acao && t.acao)), { id, mensagem, tipo, acao }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duracao);
    return id;
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
    },
    []
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
