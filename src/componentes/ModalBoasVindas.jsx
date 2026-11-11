import { useRef, useState } from 'react';
import { useTravaScroll } from '../utilitarios/travaScroll';
import { useFocusTrap } from '../utilitarios/focusTrap';
import { IconBuilding, IconClipboardCheck, IconChartBar } from '@tabler/icons-react';
import { lerConsentimento, registrarConsentimento } from '../dados/consentimento';
import TermoPesquisa, { RESUMO_PESQUISA } from './TermoPesquisa';
import styles from './ModalBoasVindas.module.css';

// Aumentar a versão faz o popup reaparecer para todos quando o texto mudar de forma relevante.
// v3: termo da pesquisa. O aviso também volta enquanto não houver ciência do termo atual.
const CHAVE_BOAS_VINDAS = 'ufca:boasVindas:v3';

const PASSOS = [
  { Icone: IconBuilding, texto: 'Cadastre a escola' },
  { Icone: IconClipboardCheck, texto: 'Percorra e responda os itens' },
  { Icone: IconChartBar, texto: 'Veja a nota e gere o relatório' },
];

function jaVisto() {
  try {
    return localStorage.getItem(CHAVE_BOAS_VINDAS) !== null && lerConsentimento() !== null;
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
    setAberto(false);
    setTimeout(() => document.querySelector('h1')?.focus?.(), 0);
  }

  // O envio à pesquisa é obrigatório: o aviso só fecha com a ciência, e Esc não o fecha.
  function concordar() {
    registrarConsentimento();
    try {
      localStorage.setItem(CHAVE_BOAS_VINDAS, new Date().toISOString());
    } catch (err) {
      console.warn('Não foi possível registrar as boas-vindas:', err);
    }
    fechar();
  }

  if (!aberto) return null;

  return (
    <div className={styles.overlay} role="presentation">
      <div
        ref={modalRef}
        className={styles.modal}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="boas-vindas-titulo"
      >
        <div className={styles.rolagem} tabIndex={0} role="region" aria-label="Como o app funciona">
          <span className={styles.eyebrow}>Boas-vindas ao Percurso Acessível</span>
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

          <p className={styles.nota}>Funciona sem internet, e as vistorias ficam salvas neste aparelho.</p>

          <TermoPesquisa className={styles.termo} />
        </div>
        <div className={styles.rodape}>
          {/* Fica fora da rolagem: o que se aceita está sempre visível junto do botão */}
          <div className={styles.pesquisa}>
            <h3 id="boas-vindas-pesquisa" className={styles.pesquisaTitulo}>Pesquisa da UFCA</h3>
            <p className={styles.pesquisaTexto}>{RESUMO_PESQUISA} O termo fica disponível em Ajustes.</p>
          </div>
          <button
            type="button"
            className="btn-nav primario"
            onClick={concordar}
            aria-describedby="boas-vindas-pesquisa"
            autoFocus
          >
            Li e concordo
          </button>
        </div>
      </div>
    </div>
  );
}
