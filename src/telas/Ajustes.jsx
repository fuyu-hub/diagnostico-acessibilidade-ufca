import { useState, useRef } from 'react';
import {
  IconVolume, IconVolumeOff, IconCheck, IconX, IconMinus, IconInfoCircle,
  IconShieldCheck, IconDownload, IconUpload
} from '@tabler/icons-react';
import Topbar from '../componentes/Topbar';
import ModalConflito from '../componentes/ModalConflito';
import { useVistoria } from '../contexto/VistoriaContext';
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
  const [feedbackBackup, setFeedbackBackup] = useState('');
  const fileInputRef = useRef(null);

  const { vistorias, exportarTodasVistorias, importarConteudoJson, aplicarResolucaoConflito, estimarArmazenamento } = useVistoria();
  const [conflitosFila, setConflitosFila] = useState([]);
  const [indiceConflito, setIndiceConflito] = useState(0);
  const [infoArmazenamento, setInfoArmazenamento] = useState(null);

  useEffect(() => {
    estimarArmazenamento?.().then(res => {
      if (res && res.cotaMB > 0) {
        setInfoArmazenamento(res);
      }
    });
  }, [estimarArmazenamento]);

  async function baixarBackup() {
    try {
      if (vistorias && vistorias.length > 0) {
        await exportarTodasVistorias();
        setFeedbackBackup('Backup salvo com sucesso!');
        setTimeout(() => setFeedbackBackup(''), 4000);
        return;
      }
      const raw = localStorage.getItem('nbr9050_vistorias');
      if (!raw || raw === '[]') {
        alert('Nenhuma vistoria encontrada para backup.');
        return;
      }
      const blob = new Blob([raw], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dataStr = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `backup_vistorias_${dataStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setFeedbackBackup('Backup salvo com sucesso!');
      setTimeout(() => setFeedbackBackup(''), 4000);
    } catch (err) {
      alert('Erro ao gerar backup: ' + err.message);
    }
  }

  async function handleImportarArquivo(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const texto = await file.text();
      const res = await importarConteudoJson(texto, (conflitos) => {
        setConflitosFila(conflitos);
        setIndiceConflito(0);
      });

      if (!conflitosFila.length) {
        setFeedbackBackup(`Importação concluída com sucesso! (${res?.importadasDiretas || 1} vistoria(s) importada(s))`);
        setTimeout(() => setFeedbackBackup(''), 5000);
      }
    } catch (err) {
      alert('Falha ao importar: ' + err.message);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleResolverConflito(estrategia, aplicarTodos) {
    if (!conflitosFila.length) return;

    try {
      if (aplicarTodos) {
        for (let i = indiceConflito; i < conflitosFila.length; i++) {
          const item = conflitosFila[i];
          await aplicarResolucaoConflito(item.local, item.remota, estrategia);
        }
        setConflitosFila([]);
        setFeedbackBackup('Todos os conflitos resolvidos e vistorias salvas!');
        setTimeout(() => setFeedbackBackup(''), 5000);
      } else {
        const item = conflitosFila[indiceConflito];
        await aplicarResolucaoConflito(item.local, item.remota, estrategia);

        if (indiceConflito + 1 < conflitosFila.length) {
          setIndiceConflito(prev => prev + 1);
        } else {
          setConflitosFila([]);
          setFeedbackBackup('Conflito resolvido com sucesso!');
          setTimeout(() => setFeedbackBackup(''), 5000);
        }
      }
    } catch (err) {
      alert('Erro ao resolver conflito: ' + err.message);
    }
  }

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
                  {somAtivo ? (
                    <IconVolume size={20} color="var(--accent, #3b82f6)" />
                  ) : (
                    <IconVolumeOff size={20} color="var(--text-muted)" />
                  )}
                  <span>Efeitos Sonoros</span>
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

          {/* Card de Backup */}
          <section className={styles.secaoCard}>
            <div className={styles.secaoHeader}>
              <div className={styles.secaoInfo}>
                <h3 className={styles.secaoTitulo}>
                  <IconShieldCheck size={20} color="var(--accent, #3b82f6)" />
                  <span>Backup das Vistorias</span>
                </h3>
                <p className={styles.secaoDesc}>
                  Salve uma cópia das vistorias no seu dispositivo ou restaure um backup anterior.
                </p>
              </div>
            </div>

            <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                type="button"
                className={styles.btnBackup}
                onClick={baixarBackup}
              >
                <IconDownload size={20} />
                <span>Fazer Backup</span>
              </button>

              <button
                type="button"
                className={styles.btnBackup}
                onClick={() => fileInputRef.current?.click()}
              >
                <IconUpload size={20} />
                <span>Restaurar Backup</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                style={{ display: 'none' }}
                onChange={handleImportarArquivo}
              />

              {feedbackBackup && (
                <p className={styles.feedbackSucesso}>{feedbackBackup}</p>
              )}

              {infoArmazenamento && (
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: 4 }}>
                  Armazenamento do dispositivo: {infoArmazenamento.usadoMB} MB usados de {(infoArmazenamento.cotaMB / 1024).toFixed(1)} GB ({infoArmazenamento.percentualUso}%)
                </p>
              )}
            </div>
          </section>

          {/* Card informativo sobre o aplicativo */}
          <section className={styles.secaoCard}>
            <div className={styles.secaoHeader}>
              <div className={styles.secaoInfo}>
                <h3 className={styles.secaoTitulo}>
                  <IconInfoCircle size={20} color="var(--text-muted)" />
                  <span>Sobre o Diagnóstico NBR 9050</span>
                </h3>
                <p className={styles.secaoDesc}>
                  Aplicação web para levantamento técnico de acessibilidade espacial em edificações públicas de ensino, desenvolvida no âmbito do projeto de extensão da Universidade Federal do Cariri (UFCA).
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>

      <ModalConflito
        aberto={conflitosFila.length > 0 && indiceConflito < conflitosFila.length}
        conflitoAtual={conflitosFila[indiceConflito]}
        indiceConflito={indiceConflito + 1}
        totalConflitos={conflitosFila.length}
        onResolver={handleResolverConflito}
        onCancelarLote={() => setConflitosFila([])}
      />
    </div>
  );
}
