import { useSyncExternalStore } from 'react';

// Preferências de uso guardadas no aparelho. Tema e alto contraste continuam em tema.js.
const CHAVE = 'nbr9050_preferencias';

export const PREFERENCIAS_PADRAO = Object.freeze({
  tamanhoTexto: 100,          // 100 | 115 | 130 | 150 (%)
  reduzirMovimento: false,
  avancarAoResponder: false,  // após Conforme ou N/A, vai ao próximo item
  atalhosTeclado: true,       // teclas de uma letra na tela de pergunta (WCAG 2.1.4)
  vibracao: true,
  lerAoAbrir: false,          // leitura em voz alta ao abrir cada item
  velocidadeVoz: 1,           // 0.8 | 1 | 1.25
});

export const TAMANHOS_TEXTO = [
  { valor: 100, rotulo: 'Padrão' },
  { valor: 115, rotulo: 'Grande' },
  { valor: 130, rotulo: 'Maior' },
  { valor: 150, rotulo: 'Máximo' },
];

export const VELOCIDADES_VOZ = [
  { valor: 0.8, rotulo: 'Devagar' },
  { valor: 1, rotulo: 'Normal' },
  { valor: 1.25, rotulo: 'Rápida' },
];

function ler() {
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE) || '{}');
    return { ...PREFERENCIAS_PADRAO, ...(salvo && typeof salvo === 'object' ? salvo : {}) };
  } catch {
    return { ...PREFERENCIAS_PADRAO };
  }
}

let atual = ler();
const ouvintes = new Set();

/** Aplica no documento as preferências que mudam a aparência. */
export function aplicarPreferencias(p = atual) {
  if (typeof document === 'undefined') return;
  const raiz = document.documentElement;
  raiz.style.setProperty('--escala', String(p.tamanhoTexto / 100));
  raiz.dataset.texto = String(p.tamanhoTexto);
  raiz.classList.toggle('reduzir-movimento', !!p.reduzirMovimento);
}

export function obterPreferencias() {
  return atual;
}

export function definirPreferencia(chave, valor) {
  if (!(chave in PREFERENCIAS_PADRAO)) return;
  atual = { ...atual, [chave]: valor };
  try {
    localStorage.setItem(CHAVE, JSON.stringify(atual));
  } catch (err) {
    console.warn('Não foi possível guardar a preferência:', err);
  }
  aplicarPreferencias(atual);
  ouvintes.forEach(fn => fn());
}

function assinar(fn) {
  ouvintes.add(fn);
  return () => ouvintes.delete(fn);
}

/** Preferências atuais, atualizadas quando mudam em qualquer tela. */
export function usePreferencias() {
  return useSyncExternalStore(assinar, obterPreferencias, obterPreferencias);
}

/** Respeita o pedido do sistema ou dos Ajustes para reduzir movimento. */
export function movimentoReduzido() {
  if (atual.reduzirMovimento) return true;
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}
