import { useEffect, useRef, useState } from 'react';
import { useTravaScroll } from '../utilitarios/travaScroll';
import { useFocusTrap } from '../utilitarios/focusTrap';
import { IconBuilding, IconClipboardCheck, IconChartBar } from '@tabler/icons-react';
import styles from './ModalBoasVindas.module.css';

// Aumentar a versão faz o popup reaparecer para todos quando o texto mudar de forma relevante
const CHAVE_BOAS_VINDAS = 'ufca:boasVindas:v2';

const PASSOS = [
  { Icone: IconBuilding, texto: 'Cadastre a escola' },
  { Icone: IconClipboardCheck, texto: 'Percorra e responda os itens' },
  { Icone: IconChartBar, texto: 'Veja a nota e gere o relatório' },
];

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
        <div className={styles.rolagem} tabIndex={0} role="region" aria-label="Como o app funciona">
          <span className={styles.eyebrow}>Boas-vindas ao Rota Acessível</span>
          <h2 id="boas-vindas-titulo" className={styles.titulo}>Avalie a acessibilidade da sua escola</h2>
          <p className={styles.intro}>
            Um guia de vistoria com base na NBR 9050, para mostrar o que já atende e o que precisa melhorar.
          </p>

          <ol className={styles.passos}>
            {PASSOS.map(({ Icone, texto }) => (
              <li key={texto}>
                <span className={styles.icone} aria-hidden="true"><Icone size={20} /></span>
                <span>{texto}</span>
              </li>
            ))}
          </ol>

          <p className={styles.nota}>Funciona sem internet, e os dados ficam só neste aparelho.</p>
        </div>
        <div className={styles.rodape}>
          <button type="button" className="btn-nav primario" onClick={fechar} autoFocus>
            Começar
          </button>
        </div>
      </div>
    </div>
  );
}
