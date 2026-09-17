/**
 * Utilitário de feedback háptico (vibração de hardware)
 * Em conformidade com WCAG 2.2 e otimizado para auditores de campo (PCR, uso com uma mão, tremores)
 * Silencioso e seguro: não executa em dispositivos sem motor de vibração ou desktop.
 */

export function vibrarSuave() {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(30);
    } catch {
      // Silencioso em caso de restrições de permissão do navegador
    }
  }
}

export function vibrarConfirmacao() {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(45);
    } catch {
      // Silencioso
    }
  }
}

export function vibrarAlerta() {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate([40, 60, 40]);
    } catch {
      // Silencioso
    }
  }
}

export function vibrarResposta(tipo) {
  if (tipo === 'conforme' || tipo === 'sim') {
    vibrarConfirmacao();
  } else if (tipo === 'nao-conforme' || tipo === 'nao') {
    vibrarAlerta();
  } else if (tipo === 'nao-aplica') {
    vibrarSuave();
  } else {
    vibrarSuave();
  }
}
