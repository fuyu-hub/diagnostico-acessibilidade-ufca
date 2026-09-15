import { useState } from 'react';
import {
  IconVolume, IconVolumeOff, IconCheck, IconX, IconMinus, IconInfoCircle
} from '@tabler/icons-react';
import Topbar from '../componentes/Topbar';
import {
  isSomHabilitado,
  setSomHabilitado,
  tocarSomConforme,
  tocarSomNaoConforme,
  tocarSomNaoAplica
} from '../utilitarios/som';
import styles from './Ajustes.module.css';

export default function Ajustes() {
  const [somAtivo, setSomAtivo] = useState(isSomHabilitado);

  function handleToggleSom(e) {
    const novo = e.target.checked;
    setSomAtivo(novo);
    setSomHabilitado(novo);
    if (novo) {
      tocarSomConforme();
    }
  }

  return (
    <div className="app-shell">
      <Topbar titulo="Ajustes" voltar="/" />

      <div className="tela-body" style={{ padding: '24px 20px 48px' }}>
        <div className={styles.container}>
          {/* Card de Efeitos Sonoros */}
          <section className={styles.secaoCard}>
            <div className={styles.secaoHeader}>
              <div className={styles.secaoInfo}>
                <h3 className={styles.secaoTitulo}>
                  {somAtivo ? <IconVolume size={20} color="var(--accent)" /> : <IconVolumeOff size={20} color="var(--text-muted)" />}
                  Efeitos Sonoros
                </h3>
                <p className={styles.secaoDesc}>
                  Sons interativos com retorno auditivo imediato ao selecionar Conforme, Não Conforme e Não se Aplica.
                </p>
              </div>

              <label className={styles.switchLabel}>
                <input
                  type="checkbox"
                  className={styles.switchInput}
                  checked={somAtivo}
                  onChange={handleToggleSom}
                  aria-label="Ativar ou desativar efeitos sonoros"
                />
                <span className={styles.slider} />
              </label>
            </div>

            {/* Painel de Demonstração / Teste dos 3 sons */}
            <div className={styles.blocoTesteSons}>
              <p className={styles.tituloTeste}>
                {somAtivo ? 'Toque nos botões para testar cada som:' : 'Ative o som acima para testar:'}
              </p>

              <div className={styles.gradeTestes}>
                <button
                  type="button"
                  className={`${styles.btnTeste} ${styles.btnTesteConforme}`}
                  onClick={tocarSomConforme}
                  disabled={!somAtivo}
                  title="Testar som afirmativo (Kahoot)"
                >
                  <IconCheck size={18} /> Conforme
                </button>

                <button
                  type="button"
                  className={`${styles.btnTeste} ${styles.btnTesteNaoConforme}`}
                  onClick={tocarSomNaoConforme}
                  disabled={!somAtivo}
                  title="Testar som negativo"
                >
                  <IconX size={18} /> Não conforme
                </button>

                <button
                  type="button"
                  className={`${styles.btnTeste} ${styles.btnTesteNaoAplica}`}
                  onClick={tocarSomNaoAplica}
                  disabled={!somAtivo}
                  title="Testar som neutro"
                >
                  <IconMinus size={18} /> Não se aplica
                </button>
              </div>
            </div>
          </section>

          {/* Card informativo sobre o aplicativo */}
          <section className={styles.secaoCard}>
            <div className={styles.secaoHeader}>
              <div className={styles.secaoInfo}>
                <h3 className={styles.secaoTitulo}>
                  <IconInfoCircle size={20} color="var(--text-muted)" />
                  Sobre o Diagnóstico NBR 9050
                </h3>
                <p className={styles.secaoDesc}>
                  Aplicação web para levantamento técnico de acessibilidade espacial em edificações públicas de ensino, desenvolvida no âmbito do projeto de extensão da Universidade Federal do Cariri (UFCA).
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
