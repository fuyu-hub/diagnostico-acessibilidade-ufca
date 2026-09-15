// Sistema de efeitos sonoros sintetizados via Web Audio API (estilo Kahoot / Duolingo)
// Não requer arquivos de áudio externos, funciona 100% offline e com latência zero.

let audioCtx = null;
const CHAVE_SOM = 'nbr9050_efeitos_sonoros';

function obterAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function isSomHabilitado() {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(CHAVE_SOM) !== 'false';
}

export function setSomHabilitado(ativo) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CHAVE_SOM, ativo ? 'true' : 'false');
}

/**
 * Som Conforme (Afirmativo / Acerto estilo Kahoot)
 * Arpejo brilhante em duas notas ascendentes (G5 -> C6) com sino suave.
 */
export function tocarSomConforme() {
  const ctx = obterAudioContext();
  if (!ctx || !isSomHabilitado()) return;

  const now = ctx.currentTime;

  // 1ª nota: G5 (784 Hz)
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'triangle';
  osc1.frequency.setValueAtTime(783.99, now);
  gain1.gain.setValueAtTime(0, now);
  gain1.gain.linearRampToValueAtTime(0.16, now + 0.02);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + 0.16);

  // 2ª nota: C6 (1046.5 Hz) — nota principal cintilante
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(1046.5, now + 0.08);
  gain2.gain.setValueAtTime(0, now + 0.08);
  gain2.gain.linearRampToValueAtTime(0.24, now + 0.10);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(now + 0.08);
  osc2.stop(now + 0.38);
}

/**
 * Som Não Conforme (Negativo / Alerta suave)
 * Dois tons graves descendentes com harmônicos reforçados para excelente audibilidade em celulares e PCs.
 */
export function tocarSomNaoConforme() {
  const ctx = obterAudioContext();
  if (!ctx || !isSomHabilitado()) return;

  const now = ctx.currentTime;

  // 1ª nota: D4 (~294 Hz)
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'triangle';
  osc1.frequency.setValueAtTime(293.66, now);
  gain1.gain.setValueAtTime(0, now);
  gain1.gain.linearRampToValueAtTime(0.38, now + 0.02);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + 0.16);

  // Harmônico para clareza em alto-falantes de celular (587 Hz)
  const osc1H = ctx.createOscillator();
  const gain1H = ctx.createGain();
  osc1H.type = 'sine';
  osc1H.frequency.setValueAtTime(587.33, now);
  gain1H.gain.setValueAtTime(0, now);
  gain1H.gain.linearRampToValueAtTime(0.14, now + 0.02);
  gain1H.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
  osc1H.connect(gain1H);
  gain1H.connect(ctx.destination);
  osc1H.start(now);
  osc1H.stop(now + 0.16);

  // 2ª nota descendente: A3 (220 Hz)
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(220, now + 0.10);
  gain2.gain.setValueAtTime(0, now + 0.10);
  gain2.gain.linearRampToValueAtTime(0.42, now + 0.12);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.36);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(now + 0.10);
  osc2.stop(now + 0.36);

  // Harmônico da 2ª nota (440 Hz)
  const osc2H = ctx.createOscillator();
  const gain2H = ctx.createGain();
  osc2H.type = 'sine';
  osc2H.frequency.setValueAtTime(440, now + 0.10);
  gain2H.gain.setValueAtTime(0, now + 0.10);
  gain2H.gain.linearRampToValueAtTime(0.15, now + 0.12);
  gain2H.gain.exponentialRampToValueAtTime(0.001, now + 0.36);
  osc2H.connect(gain2H);
  gain2H.connect(ctx.destination);
  osc2H.start(now + 0.10);
  osc2H.stop(now + 0.36);
}

/**
 * Som Não se Aplica (Neutro / Pop tátil)
 * Deslize nítido e encorpado (680 Hz -> 260 Hz) com volume equilibrado.
 */
export function tocarSomNaoAplica() {
  const ctx = obterAudioContext();
  if (!ctx || !isSomHabilitado()) return;

  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(680, now);
  osc.frequency.exponentialRampToValueAtTime(260, now + 0.09);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.42, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.12);
}

/**
 * Helper unificado para disparar o som baseado no valor da resposta
 */
export function tocarSomResposta(valor) {
  if (valor === 'conforme' || valor === 'sim') {
    tocarSomConforme();
  } else if (valor === 'nao-conforme' || valor === 'nao') {
    tocarSomNaoConforme();
  } else if (valor === 'nao-aplica') {
    tocarSomNaoAplica();
  }
}
