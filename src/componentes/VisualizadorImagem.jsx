import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { IconX, IconZoomIn, IconZoomOut, IconMaximize, IconNotes, IconVolume, IconPlayerStopFilled } from '@tabler/icons-react';
import { useTravaScroll } from '../utilitarios/travaScroll';
import { useFocusTrap } from '../utilitarios/focusTrap';
import styles from './VisualizadorImagem.module.css';

const ZOOM_MAXIMO = 6; // relativo ao tamanho ajustado à tela

/**
 * Imagem em tela cheia com zoom e deslocamento por pinça, roda do mouse, toque duplo,
 * botões (+, −, Ajustar) e teclado (+, −, 0 e setas), como alternativa aos gestos (WCAG 2.5.7).
 * A imagem é redimensionada (e não escalada por transform) para o SVG continuar nítido.
 */
export default function VisualizadorImagem({ aberto, src, titulo, descricao, larguraBase, alturaBase, voz, trechosLeitura, onFechar }) {
  const ref = useRef(null);
  const palcoRef = useRef(null);
  const idTitulo = useId();
  const idDescricao = useId();
  const [mostrarDescricao, setMostrarDescricao] = useState(true);
  const [vista, setVista] = useState({ s: 1, x: 0, y: 0, ajuste: 1 });
  const vistaRef = useRef(vista);
  // Atualiza a referência na hora, para toques seguidos no zoom somarem
  const definirVista = useCallback((v) => {
    vistaRef.current = v;
    setVista(v);
  }, []);
  const base = useRef({ w: larguraBase || 1376, h: alturaBase || 768 });

  useTravaScroll(aberto);
  useFocusTrap(aberto, ref);

  const limitar = useCallback((v) => {
    const palco = palcoRef.current;
    if (!palco) return v;
    const W = palco.clientWidth, H = palco.clientHeight;
    const w = base.current.w * v.s, h = base.current.h * v.s;
    const x = w <= W ? (W - w) / 2 : Math.min(0, Math.max(W - w, v.x));
    const y = h <= H ? (H - h) / 2 : Math.min(0, Math.max(H - h, v.y));
    return { ...v, x, y };
  }, []);

  const ajustar = useCallback(() => {
    const palco = palcoRef.current;
    if (!palco || !palco.clientWidth) return;
    const ajuste = Math.min(palco.clientWidth / base.current.w, palco.clientHeight / base.current.h);
    definirVista(limitar({ s: ajuste, x: 0, y: 0, ajuste }));
  }, [limitar, definirVista]);

  const zoomEm = useCallback((fator, cx, cy) => {
    const palco = palcoRef.current;
    if (!palco) return;
    const v = vistaRef.current;
    const novo = Math.min(v.ajuste * ZOOM_MAXIMO, Math.max(v.ajuste, v.s * fator));
    const px = cx ?? palco.clientWidth / 2;
    const py = cy ?? palco.clientHeight / 2;
    definirVista(limitar({
      ...v,
      s: novo,
      x: px - (px - v.x) * (novo / v.s),
      y: py - (py - v.y) * (novo / v.s),
    }));
  }, [limitar, definirVista]);

  const mover = useCallback((dx, dy) => {
    const v = vistaRef.current;
    definirVista(limitar({ ...v, x: v.x + dx, y: v.y + dy }));
  }, [limitar, definirVista]);

  // Ajusta ao abrir e quando a tela muda de tamanho (ex.: girar o celular)
  useEffect(() => {
    if (!aberto) return;
    const palco = palcoRef.current;
    const img = palco?.querySelector('img');
    const iniciar = () => {
      if (!larguraBase && img?.naturalWidth > 0) base.current = { w: img.naturalWidth, h: img.naturalHeight };
      ajustar();
    };
    if (img?.complete) setTimeout(iniciar, 0);
    else img?.addEventListener('load', iniciar, { once: true });
    const ro = new ResizeObserver(() => ajustar());
    if (palco) ro.observe(palco);
    return () => ro.disconnect();
  }, [aberto, src, larguraBase, ajustar]);

  // Gestos: arrastar com um dedo/mouse, pinça com dois, toque duplo alterna o zoom
  useEffect(() => {
    if (!aberto) return;
    const palco = palcoRef.current;
    if (!palco) return;
    const ponteiros = new Map();
    let pinca = null;
    let ultimoToque = 0;
    const relativo = (e) => {
      const r = palco.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top];
    };
    function baixar(e) {
      palco.setPointerCapture(e.pointerId);
      ponteiros.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ponteiros.size === 2) {
        const [a, b] = [...ponteiros.values()];
        pinca = { d: Math.hypot(a.x - b.x, a.y - b.y), s: vistaRef.current.s };
      }
      const agora = Date.now();
      if (ponteiros.size === 1 && agora - ultimoToque < 300) {
        const v = vistaRef.current;
        if (v.s > v.ajuste * 1.05) ajustar();
        else zoomEm(2.5, ...relativo(e));
      }
      ultimoToque = agora;
    }
    function moverPonteiro(e) {
      if (!ponteiros.has(e.pointerId)) return;
      const anterior = ponteiros.get(e.pointerId);
      ponteiros.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ponteiros.size === 1) mover(e.clientX - anterior.x, e.clientY - anterior.y);
      else if (ponteiros.size === 2 && pinca) {
        const [a, b] = [...ponteiros.values()];
        const r = palco.getBoundingClientRect();
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        zoomEm((pinca.s * d / pinca.d) / vistaRef.current.s, (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top);
      }
    }
    function soltar(e) {
      ponteiros.delete(e.pointerId);
      if (ponteiros.size < 2) pinca = null;
    }
    function roda(e) {
      e.preventDefault();
      zoomEm(e.deltaY < 0 ? 1.15 : 1 / 1.15, ...relativo(e));
    }
    palco.addEventListener('pointerdown', baixar);
    palco.addEventListener('pointermove', moverPonteiro);
    palco.addEventListener('pointerup', soltar);
    palco.addEventListener('pointercancel', soltar);
    palco.addEventListener('wheel', roda, { passive: false });
    return () => {
      palco.removeEventListener('pointerdown', baixar);
      palco.removeEventListener('pointermove', moverPonteiro);
      palco.removeEventListener('pointerup', soltar);
      palco.removeEventListener('pointercancel', soltar);
      palco.removeEventListener('wheel', roda);
    };
  }, [aberto, ajustar, mover, zoomEm]);

  useEffect(() => {
    if (!aberto) return;
    function teclas(e) {
      if (e.key === 'Escape') { e.stopPropagation(); onFechar(); return; }
      if (e.target.closest?.('button') && (e.key === 'Enter' || e.key === ' ')) return;
      if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomEm(1.25); }
      else if (e.key === '-') { e.preventDefault(); zoomEm(0.8); }
      else if (e.key === '0') { e.preventDefault(); ajustar(); }
      else if (e.target === palcoRef.current && e.key.startsWith('Arrow')) {
        e.preventDefault();
        const p = 60;
        mover(e.key === 'ArrowLeft' ? p : e.key === 'ArrowRight' ? -p : 0, e.key === 'ArrowUp' ? p : e.key === 'ArrowDown' ? -p : 0);
      }
    }
    document.addEventListener('keydown', teclas);
    return () => document.removeEventListener('keydown', teclas);
  }, [aberto, onFechar, zoomEm, ajustar, mover]);

  // A leitura iniciada aqui termina ao fechar
  useEffect(() => {
    if (!aberto && voz?.ativo) voz.parar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto]);

  if (!aberto) return null;

  const pct = Math.round((vista.s / vista.ajuste) * 100);
  const lendo = !!voz?.ativo;

  return (
    <div ref={ref} className={styles.visualizador} role="dialog" aria-modal="true" aria-labelledby={idTitulo}>
      <div className={styles.cabecalho}>
        <h2 id={idTitulo} className={styles.titulo}>{titulo}</h2>
        {voz?.suportada && trechosLeitura?.length > 0 && (
          <button
            type="button"
            className={`${styles.botao} ${styles.ouvir}`}
            aria-pressed={lendo}
            onClick={() => (lendo ? voz.parar() : voz.iniciar(trechosLeitura))}
          >
            {lendo ? <IconPlayerStopFilled size={20} /> : <IconVolume size={20} />}
            <span>{lendo ? 'Parar' : 'Ouvir'}</span>
          </button>
        )}
        {descricao && (
          <button
            type="button"
            className={styles.botao}
            aria-expanded={mostrarDescricao}
            aria-controls={idDescricao}
            aria-label="Mostrar ou ocultar descrição"
            onClick={() => setMostrarDescricao(v => !v)}
          >
            <IconNotes size={22} />
          </button>
        )}
        <button type="button" className={styles.botao} onClick={onFechar} aria-label="Fechar visualização">
          <IconX size={24} />
        </button>
      </div>

      <div
        ref={palcoRef}
        className={styles.palco}
        tabIndex={0}
        role="img"
        aria-roledescription="área de zoom"
        aria-label={`${descricao ? 'Ilustração' : 'Imagem'} ampliada. Use mais e menos para o zoom e as setas para mover.`}
      >
        <img
          src={src}
          alt=""
          draggable="false"
          style={{ width: base.current.w * vista.s, height: base.current.h * vista.s, left: vista.x, top: vista.y }}
        />
      </div>

      <div className={styles.ferramentas} role="toolbar" aria-label="Zoom">
        <button type="button" className={styles.botao} onClick={() => zoomEm(0.8)} aria-label="Diminuir zoom" aria-keyshortcuts="-">
          <IconZoomOut size={24} />
        </button>
        <span className={styles.zoom} aria-live="polite">{pct}%</span>
        <button type="button" className={styles.botao} onClick={() => zoomEm(1.25)} aria-label="Aumentar zoom" aria-keyshortcuts="+">
          <IconZoomIn size={24} />
        </button>
        <button type="button" className={styles.botao} onClick={ajustar} aria-keyshortcuts="0">
          <IconMaximize size={20} /> <span>Ajustar</span>
        </button>
      </div>

      {descricao && mostrarDescricao && (
        <div id={idDescricao} className={`${styles.descricao} ${voz?.trechoAtual?.chave === 'figura' ? styles.lendo : ''}`}>
          <strong>Descrição:</strong> {descricao}
        </div>
      )}
    </div>
  );
}
