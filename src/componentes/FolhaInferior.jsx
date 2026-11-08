import { useEffect, useId, useRef } from 'react';
import { IconX } from '@tabler/icons-react';
import { useTravaScroll } from '../utilitarios/travaScroll';
import { useFocusTrap } from '../utilitarios/focusTrap';
import styles from './FolhaInferior.module.css';

/**
 * Painel que sobe do rodapé, usado para conteúdo de apoio sem tirar a pessoa da tela.
 * Diálogo modal: prende o foco, fecha com Esc ou tocando fora, e devolve o foco a quem o abriu.
 */
export default function FolhaInferior({ aberto, titulo, onFechar, children, rodape, largura = 640, focoInicial }) {
  const ref = useRef(null);
  const idTitulo = useId();

  useTravaScroll(aberto);
  useFocusTrap(aberto, ref);

  useEffect(() => {
    if (!aberto) return;
    function teclas(e) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onFechar();
      }
    }
    document.addEventListener('keydown', teclas);
    return () => document.removeEventListener('keydown', teclas);
  }, [aberto, onFechar]);

  // Foco num elemento específico (ex.: o campo de observação), depois do foco padrão do useFocusTrap
  useEffect(() => {
    if (!aberto || !focoInicial) return;
    const t = setTimeout(() => ref.current?.querySelector(focoInicial)?.focus(), 80);
    return () => clearTimeout(t);
  }, [aberto, focoInicial]);

  if (!aberto) return null;

  return (
    <div className={styles.fundo} onMouseDown={e => { if (e.target === e.currentTarget) onFechar(); }}>
      <div
        ref={ref}
        className={styles.folha}
        style={{ maxWidth: largura }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
      >
        <div className={styles.alca} aria-hidden="true" />
        <div className={styles.cabecalho}>
          <h2 id={idTitulo} className={styles.titulo}>{titulo}</h2>
          <button type="button" className={styles.fechar} onClick={onFechar} aria-label="Fechar">
            <IconX size={22} />
          </button>
        </div>
        <div className={styles.corpo}>{children}</div>
        {rodape && <div className={styles.rodape}>{rodape}</div>}
      </div>
    </div>
  );
}
