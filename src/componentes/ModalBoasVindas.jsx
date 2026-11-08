import { useEffect, useRef, useState } from 'react';
import { useTravaScroll } from '../utilitarios/travaScroll';
import { useFocusTrap } from '../utilitarios/focusTrap';
import ConteudoProjeto from './ConteudoProjeto';
import styles from './ModalBoasVindas.module.css';

// Aumentar a versão faz o popup reaparecer para todos quando o texto mudar de forma relevante
const CHAVE_BOAS_VINDAS = 'ufca:boasVindas:v1';

function jaVisto() {
  try {
    return localStorage.getItem(CHAVE_BOAS_VINDAS) !== null;
  } catch {
    return false;
  }
}

export default function ModalBoasVindas() {
  const [aberto, setAberto] = useState(() => !jaVisto());
  const modalRef = useRef(null);

  useTravaScroll(aberto);
  useFocusTrap(aberto, modalRef);

  function fechar() {
    try {
      localStorage.setItem(CHAVE_BOAS_VINDAS, new Date().toISOString());
    } catch (err) {
      console.warn('Não foi possível registrar as boas-vindas:', err);
    }
    setAberto(false);
    setTimeout(() => document.querySelector('h1')?.focus?.(), 0);
  }

  useEffect(() => {
    if (!aberto) return undefined;
    function aoTeclar(e) {
      if (e.key === 'Escape') fechar();
    }
    document.addEventListener('keydown', aoTeclar);
    return () => document.removeEventListener('keydown', aoTeclar);
  }, [aberto]);

  if (!aberto) return null;

  return (
    <div className={styles.overlay} role="presentation">
      <div
        ref={modalRef}
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="boas-vindas-titulo"
      >
        <div className={styles.rolagem} tabIndex={0} role="region" aria-label="Informações do projeto">
          <span className={styles.eyebrow}>Projeto de extensão · UFCA</span>
          <h2 id="boas-vindas-titulo" className={styles.titulo}>Boas-vindas ao Diagnóstico NBR 9050</h2>
          <ConteudoProjeto />
        </div>
        <div className={styles.rodape}>
          <button type="button" className="btn-nav primario" onClick={fechar} autoFocus>
            Começar
          </button>
          <p className={styles.dica}>Você pode rever estas informações em Sobre, na tela inicial.</p>
        </div>
      </div>
    </div>
  );
}
