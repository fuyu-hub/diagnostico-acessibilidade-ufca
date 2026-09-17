import { useEffect, useRef } from 'react';

/**
 * Hook para contenção e restauração de foco em modais (WCAG 2.4.3 - Focus Order)
 * - Move o foco para o primeiro elemento interativo ao abrir.
 * - Concede ciclo fechado de navegação por Tab e Shift+Tab dentro do modal.
 * - Restaura o foco automaticamente para o gatilho original ao fechar.
 */
export function useFocusTrap(aberto, containerRef) {
  const elementoGatilhoRef = useRef(null);

  useEffect(() => {
    if (!aberto) {
      // Restaura o foco para o elemento original que abriu o modal
      if (elementoGatilhoRef.current && typeof elementoGatilhoRef.current.focus === 'function') {
        elementoGatilhoRef.current.focus();
      }
      return;
    }

    // Guarda o elemento atualmente focado antes da abertura do modal
    elementoGatilhoRef.current = document.activeElement;

    const container = containerRef.current;
    if (!container) return;

    // Seletor de elementos focáveis
    const seletorFocaveis = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    // Foca o primeiro elemento focável ou o próprio container do modal
    const timer = setTimeout(() => {
      const focaveis = container.querySelectorAll(seletorFocaveis);
      if (focaveis.length > 0) {
        focaveis[0].focus();
      } else if (typeof container.focus === 'function') {
        container.focus();
      }
    }, 50);

    function handleKeyDown(e) {
      if (e.key !== 'Tab') return;

      const focaveis = Array.from(container.querySelectorAll(seletorFocaveis));
      if (focaveis.length === 0) {
        e.preventDefault();
        return;
      }

      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];

      if (e.shiftKey) {
        // Shift + Tab: se estiver no primeiro, pula para o último
        if (document.activeElement === primeiro) {
          e.preventDefault();
          ultimo.focus();
        }
      } else {
        // Tab normal: se estiver no último, pula para o primeiro
        if (document.activeElement === ultimo) {
          e.preventDefault();
          primeiro.focus();
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [aberto, containerRef]);
}
