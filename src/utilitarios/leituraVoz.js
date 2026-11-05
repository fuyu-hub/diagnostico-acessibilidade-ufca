import { useCallback, useEffect, useRef, useState } from 'react';
import { definirPreferencia, obterPreferencias, VELOCIDADES_VOZ } from './preferencias.js';

// Leitura em voz alta com a voz do próprio aparelho (Web Speech API), sem internet na maioria dos celulares.
// Complementa o leitor de tela (TalkBack, VoiceOver); não o substitui.

export const vozSuportada = () =>
  typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

/** Voz em português do Brasil, se o aparelho tiver; senão, qualquer voz em português. */
export function vozPortugues() {
  if (!vozSuportada()) return null;
  const vozes = window.speechSynthesis.getVoices();
  return vozes.find(v => /pt[-_]BR/i.test(v.lang)) || vozes.find(v => /^pt/i.test(v.lang)) || null;
}

/** Tira o marcador "[Visual]" do início do texto de "como averiguar" e o torna falável. */
export function textoFalavel(texto) {
  return String(texto || '')
    .replace(/^\[([^\]]+)\]\s*/, (_, metodo) => `Método: ${metodo}. `)
    .replace(/NBR 9050:2020/g, 'NBR 9050 de 2020');
}

/**
 * Lê uma sequência de trechos ({ chave, rotulo, texto }), um de cada vez, informando o trecho atual
 * para a tela destacá-lo. Pausar cancela o trecho e retomar o lê de novo do início: a pausa nativa
 * dos navegadores é instável.
 */
export function useLeituraVoz() {
  const [estado, setEstado] = useState({ ativo: false, pausado: false, indice: 0, trechos: [] });
  const ref = useRef(estado);
  const falaAtual = useRef(null);
  const falarRef = useRef(null);

  useEffect(() => {
    ref.current = estado;
  }, [estado]);

  const cancelarFala = () => {
    if (falaAtual.current) falaAtual.current.cancelada = true;
    falaAtual.current = null;
    if (vozSuportada()) window.speechSynthesis.cancel();
  };

  const falar = useCallback((trechos, indice) => {
    const trecho = trechos[indice];
    if (!trecho) {
      ref.current = { ativo: false, pausado: false, indice: 0, trechos: [] };
      setEstado(ref.current);
      return;
    }
    const fala = new SpeechSynthesisUtterance(trecho.texto);
    fala.lang = 'pt-BR';
    const voz = vozPortugues();
    if (voz) fala.voice = voz;
    fala.rate = obterPreferencias().velocidadeVoz;
    fala.onend = () => {
      if (fala.cancelada || !ref.current.ativo || ref.current.pausado) return;
      falarRef.current(trechos, indice + 1);
    };
    fala.onerror = () => {
      if (!fala.cancelada) setEstado({ ativo: false, pausado: false, indice: 0, trechos: [] });
    };
    falaAtual.current = fala;
    ref.current = { ativo: true, pausado: false, indice, trechos };
    setEstado(ref.current);
    window.speechSynthesis.speak(fala);
  }, []);

  useEffect(() => {
    falarRef.current = falar;
  }, [falar]);

  const iniciar = useCallback((trechos) => {
    if (!vozSuportada()) return false;
    cancelarFala();
    const validos = trechos.filter(t => t && t.texto);
    if (!validos.length) return false;
    falar(validos, 0);
    return true;
  }, [falar]);

  const parar = useCallback(() => {
    cancelarFala();
    ref.current = { ativo: false, pausado: false, indice: 0, trechos: [] };
    setEstado(ref.current);
  }, []);

  const pausar = useCallback(() => {
    cancelarFala();
    ref.current = { ...ref.current, pausado: true };
    setEstado(ref.current);
  }, []);

  const retomar = useCallback(() => {
    const { trechos, indice } = ref.current;
    falar(trechos, indice);
  }, [falar]);

  /** Passa para a próxima velocidade (Devagar → Normal → Rápida) e relê o trecho atual. */
  const alternarVelocidade = useCallback(() => {
    const valores = VELOCIDADES_VOZ.map(v => v.valor);
    const atual = obterPreferencias().velocidadeVoz;
    const proxima = valores[(valores.indexOf(atual) + 1) % valores.length];
    definirPreferencia('velocidadeVoz', proxima);
    const { ativo, pausado, trechos, indice } = ref.current;
    if (ativo && !pausado) {
      cancelarFala();
      falar(trechos, indice);
    }
    return proxima;
  }, [falar]);

  // Para a leitura ao sair da tela
  useEffect(() => () => cancelarFala(), []);

  // Algumas plataformas só listam as vozes depois de um evento
  useEffect(() => {
    if (vozSuportada()) window.speechSynthesis.getVoices();
  }, []);

  return {
    ...estado,
    trechoAtual: estado.ativo ? estado.trechos[estado.indice] : null,
    suportada: vozSuportada(),
    iniciar,
    parar,
    pausar,
    retomar,
    alternarVelocidade,
  };
}
