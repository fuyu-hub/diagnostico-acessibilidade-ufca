import { useSyncExternalStore } from 'react';

/**
 * Estado do app instalável (PWA): instalação e versão nova pronta.
 * O navegador não mostra mais o próprio aviso de instalação: o app oferece
 * "Instalar" só em Ajustes e num botão discreto do Início, quando é possível.
 */

let estado = {
  podeInstalar: false,
  instalado: false,
  versaoPronta: false,
};
let pedidoInstalacao = null;
let aplicarVersao = null;
const ouvintes = new Set();

function definir(parcial) {
  estado = { ...estado, ...parcial };
  ouvintes.forEach(fn => fn());
}

function emModoApp() {
  try {
    return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
  } catch {
    return false;
  }
}

/** iPhone e iPad não têm o pedido de instalação: a instalação é pelo menu Compartilhar. */
export function ehIOS() {
  const ua = navigator.userAgent || '';
  return /iphone|ipad|ipod/i.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1);
}

/** Chamado uma vez, antes de montar o app, para não perder o evento do navegador. */
export function iniciarAplicativo() {
  if (typeof window === 'undefined') return;
  definir({ instalado: emModoApp() });

  window.addEventListener('beforeinstallprompt', (evento) => {
    // Sem a faixa automática do navegador: a oferta fica no app, sem interromper
    evento.preventDefault();
    pedidoInstalacao = evento;
    definir({ podeInstalar: true });
  });

  window.addEventListener('appinstalled', () => {
    pedidoInstalacao = null;
    definir({ podeInstalar: false, instalado: true });
  });
}

/** Abre o pedido de instalação do navegador. Devolve true se a pessoa aceitou. */
export async function instalarAplicativo() {
  if (!pedidoInstalacao) return false;
  const pedido = pedidoInstalacao;
  pedidoInstalacao = null;
  definir({ podeInstalar: false });
  await pedido.prompt();
  const { outcome } = await pedido.userChoice;
  return outcome === 'accepted';
}

/** Registra que há versão nova baixada e como aplicá-la agora. */
export function marcarVersaoPronta(aplicar) {
  aplicarVersao = aplicar;
  definir({ versaoPronta: true });
}

/** Aplica a versão nova já baixada (grava o que falta e recarrega). */
export async function atualizarAgora() {
  if (!aplicarVersao) return false;
  return aplicarVersao();
}

function assinar(fn) {
  ouvintes.add(fn);
  return () => ouvintes.delete(fn);
}

export function useAplicativo() {
  return useSyncExternalStore(assinar, () => estado, () => estado);
}
