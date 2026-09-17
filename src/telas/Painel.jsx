import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconSettings, IconPlus, IconUpload } from '@tabler/icons-react';
import { useVistoria } from '../contexto/VistoriaContext';
import CartaoVistoria from '../componentes/CartaoVistoria';
import ModalConflito from '../componentes/ModalConflito';
import styles from './Painel.module.css';

export default function Painel() {
  const { vistorias, carregando, importarConteudoJson, aplicarResolucaoConflito } = useVistoria();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [feedback, setFeedback] = useState('');
  const [conflitosFila, setConflitosFila] = useState([]);
  const [indiceConflito, setIndiceConflito] = useState(0);
  const [arrastando, setArrastando] = useState(false);

  function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    setArrastando(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    setArrastando(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setArrastando(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      handleImportarArquivo({ target: { files: [file] } });
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

      if (!conflitosFila.length && res?.importadasDiretas > 0) {
        setFeedback(`${res.importadasDiretas === 1 ? 'Vistoria importada' : `${res.importadasDiretas} vistorias importadas`} com sucesso!`);
        setTimeout(() => setFeedback(''), 5000);
      }
    } catch (err) {
      alert('Falha ao importar vistoria: ' + err.message);
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
        setFeedback('Vistorias importadas e conflitos resolvidos!');
        setTimeout(() => setFeedback(''), 5000);
      } else {
        const item = conflitosFila[indiceConflito];
        await aplicarResolucaoConflito(item.local, item.remota, estrategia);

        if (indiceConflito + 1 < conflitosFila.length) {
          setIndiceConflito(prev => prev + 1);
        } else {
          setConflitosFila([]);
          setFeedback('Vistoria importada com sucesso!');
          setTimeout(() => setFeedback(''), 5000);
        }
      }
    } catch (err) {
      alert('Erro ao resolver conflito: ' + err.message);
    }
  }

  return (
    <div className="app-shell">
      <div className="tela-body" style={{ padding: '24px 20px' }}>
        {/* Cabeçalho */}
        <div className={styles.header}>
          <div>
            <span className={styles.eyebrow}>Diagnóstico NBR 9050</span>
            <h1 className={styles.titulo}>Vistorias</h1>
          </div>
          <button
            className={styles.btnSettings}
            aria-label="Ajustes"
            title="Ajustes"
            onClick={() => navigate('/ajustes')}
          >
            <IconSettings size={22} />
          </button>
        </div>

        {feedback && (
          <div className={styles.toastSucesso}>
            {feedback}
          </div>
        )}

        {/* Input invisível para arquivo */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          style={{ display: 'none' }}
          onChange={handleImportarArquivo}
        />

        {/* Criar nova */}
        <button className={`cartao ${styles.btnNova}`} onClick={() => navigate('/nova')}>
          <div className={styles.iconePlus}>
            <IconPlus size={28} />
          </div>
          <div>
            <p className={styles.novaLabel}>Criar Nova Vistoria</p>
            <p className={styles.novaDesc}>Cadastrar instituição e iniciar diagnóstico</p>
          </div>
        </button>

        {/* Importar Vistoria na tela principal com suporte a drag-and-drop (§6.1) */}
        <button
          type="button"
          className={`${styles.btnImportarPrincipal} ${arrastando ? styles.arrastando : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          title="Clique para selecionar ou arraste um arquivo de vistoria (.json) até aqui"
        >
          <IconUpload size={20} />
          <span>{arrastando ? 'Solte o arquivo para importar' : 'Importar Vistoria (ou arraste o arquivo aqui)'}</span>
        </button>

        {/* Lista */}
        {carregando ? (
          <div className={styles.vazio} style={{ marginTop: 24 }}>
            <p>Carregando diagnósticos salvos...</p>
          </div>
        ) : (
          <>
            {vistorias.length > 0 && (
              <>
                <p className="label-secao" style={{ marginTop: 8 }}>
                  Vistorias Registradas ({vistorias.length})
                </p>
                <div className={styles.gridVistorias}>
                  {vistorias.map(v => (
                    <CartaoVistoria key={v.id || v.vistoriaId} vistoria={v} />
                  ))}
                </div>
              </>
            )}

            {vistorias.length === 0 && (
              <div className={styles.vazio}>
                <p>Nenhuma vistoria registrada.</p>
                <p>Crie uma nova ou importe uma vistoria para começar.</p>
              </div>
            )}
          </>
        )}
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
