import { createContext, useContext, useState, useCallback, useRef } from 'react';
import ModalDialogo from '../componentes/ModalDialogo';
import ToastContainer from '../componentes/ToastContainer';

const NotificacaoContext = createContext(null);

export function NotificacaoProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [dialogo, setDialogo] = useState(null);

  const toastIdRef = useRef(0);
  const temporizadoresRef = useRef(new Map());

  // acao (opcional): { rotulo, fn } — um botão no aviso, como "Desfazer"
  const mostrarToast = useCallback((mensagem, tipo = 'info', duracao = 4000, acao = null) => {
    const id = ++toastIdRef.current;
    // Um aviso com ação substitui o anterior com ação, para não acumular "Desfazer" antigos
    setToasts((prev) => [...prev.filter((t) => !(acao && t.acao)), { id, mensagem, tipo, acao }]);
    agendarRemocao(id, duracao);
    return id;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const removerToast = useCallback((id) => {
    clearTimeout(temporizadoresRef.current.get(id)?.tempo);
    temporizadoresRef.current.delete(id);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  function agendarRemocao(id, restante) {
    const tempo = setTimeout(() => removerToast(id), restante);
    temporizadoresRef.current.set(id, { tempo, restante, inicio: Date.now() });
  }

  // Mouse em cima ou foco no aviso: o tempo para de correr (WCAG 2.2.1)
  const pausarToasts = useCallback(() => {
    temporizadoresRef.current.forEach((t) => {
      clearTimeout(t.tempo);
      t.restante = Math.max(0, t.restante - (Date.now() - t.inicio));
      t.pausado = true;
    });
  }, []);

  const retomarToasts = useCallback(() => {
    temporizadoresRef.current.forEach((t, id) => {
      if (!t.pausado) return;
      agendarRemocao(id, Math.max(t.restante, 1500));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <ToastContainer toasts={toasts} onRemover={removerToast} onPausar={pausarToasts} onRetomar={retomarToasts} />
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
