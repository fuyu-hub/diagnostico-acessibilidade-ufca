import { useEffect } from 'react';

/**
 * Gerenciador global de contagem de modais abertos.
 * Garante que múltiplos modais (ex: Galeria -> Visualizar Foto)
 * mantenham a rolagem externa travada até que o ÚLTIMO modal seja fechado.
 */
let modaisAbertosCount = 0;

export function travarScrollModal() {
  modaisAbertosCount++;
  if (modaisAbertosCount === 1) {
    document.documentElement.classList.add('modal-aberto');
    document.body.classList.add('modal-aberto');
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
  }
}

export function destravarScrollModal() {
  modaisAbertosCount = Math.max(0, modaisAbertosCount - 1);
  if (modaisAbertosCount === 0) {
    document.documentElement.classList.remove('modal-aberto');
    document.body.classList.remove('modal-aberto');
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  }
}

/**
 * Hook do React para sincronizar o bloqueio de rolagem com o estado do modal.
 * @param {boolean} aberto Indica se o modal está visível
 */
export function useTravaScroll(aberto) {
  useEffect(() => {
    if (!aberto) return;

    travarScrollModal();

    return () => {
      destravarScrollModal();
    };
  }, [aberto]);
}
