import { useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconSettings, IconPlus, IconUpload, IconInfoCircle, IconShieldCheck, IconArrowRight, IconSearch, IconBuilding } from '@tabler/icons-react';
import { useVistoria } from '../contexto/VistoriaContext';
import { useNotificacao } from '../contexto/NotificacaoContext';
import CartaoVistoria from '../componentes/CartaoVistoria';
import ModalConflito from '../componentes/ModalConflito';
import { lerArquivoImportacao } from '../dados/exportacao';
import { resumoProgresso, TODOS_ITENS, ITENS_TECNICOS, SECOES } from '../dados/checklist';
import styles from './Painel.module.css';

const LIMITE_PARA_BUSCA = 6;
const GRUPOS = [
  { status: 'em_andamento', rotulo: 'Em andamento' },
  { status: 'concluida', rotulo: 'Concluídas' },
  { status: 'rascunho', rotulo: 'Não iniciadas' },
];

const normalizar = texto => String(texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export default function Painel() {
  const { vistorias, carregando, importarConteudoJson, aplicarResolucaoConflito, ultimoBackup } = useVistoria();
  const { mostrarToast, mostrarAlerta } = useNotificacao();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [conflitosFila, setConflitosFila] = useState([]);
  const [indiceConflito, setIndiceConflito] = useState(0);
  const [arrastando, setArrastando] = useState(false);
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState('todas');

  const ultimaEmAndamento = useMemo(() => (
    vistorias
      .filter(v => v.status === 'em_andamento')
      .sort((a, b) => String(b.dataUltimaEdicao).localeCompare(String(a.dataUltimaEdicao)))[0]
  ), [vistorias]);

  const visiveis = useMemo(() => {
    const termo = normalizar(busca.trim());
    return vistorias.filter(v => (
      (filtro === 'todas' || v.status === filtro) &&
      (!termo || normalizar(`${v.nome} ${v.cidade}`).includes(termo))
    ));
  }, [vistorias, busca, filtro]);

  const progressoUltima = ultimaEmAndamento ? resumoProgresso(ultimaEmAndamento.respostas) : null;
  const proximoItem = progressoUltima && progressoUltima.proximoIndice >= 0 ? TODOS_ITENS[progressoUltima.proximoIndice] : null;
  const secaoProximo = proximoItem ? SECOES.find(s => s.id === proximoItem.secaoId) : null;
  const temVistorias = vistorias.length > 0;

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
      const texto = await lerArquivoImportacao(file);
      const res = await importarConteudoJson(texto, (conflitos) => {
        setConflitosFila(conflitos);
        setIndiceConflito(0);
      });

      if (!conflitosFila.length && res?.importadasDiretas > 0) {
        mostrarToast(
          `${res.importadasDiretas === 1 ? 'Vistoria importada' : `${res.importadasDiretas} vistorias importadas`} com sucesso!`,
          'sucesso'
        );
      }
    } catch (err) {
      mostrarAlerta('Falha na Importação', 'Não foi possível importar a vistoria: ' + err.message);
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
        mostrarToast('Vistorias importadas e conflitos resolvidos!', 'sucesso');
      } else {
        const item = conflitosFila[indiceConflito];
        await aplicarResolucaoConflito(item.local, item.remota, estrategia);

        if (indiceConflito + 1 < conflitosFila.length) {
          setIndiceConflito(prev => prev + 1);
        } else {
          setConflitosFila([]);
          mostrarToast('Vistoria importada com sucesso!', 'sucesso');
        }
      }
    } catch (err) {
      mostrarAlerta('Erro de Resolução', 'Erro ao resolver conflito: ' + err.message);
    }
  }

  return (
    <div className="app-shell">
      <main className="tela-body" style={{ padding: '24px 20px' }}>
        <header className={styles.header}>
          <div className={styles.marcaTitulo}>
            {/* Marca provisória até a logo oficial do app */}
            <span className={styles.marca} aria-hidden="true"><IconBuilding size={26} /></span>
            <div>
              <span className={styles.eyebrow}>Diagnóstico NBR 9050 · UFCA</span>
              <h1 className={styles.titulo}>Vistorias</h1>
            </div>
          </div>
          <div className={styles.headerAcoes}>
            <button type="button" className={styles.btnSobre} onClick={() => navigate('/sobre')}>
              <IconInfoCircle size={20} aria-hidden="true" />
              <span>Sobre</span>
            </button>
            <button
              type="button"
              className={styles.btnSettings}
              aria-label="Ajustes"
              title="Ajustes"
              onClick={() => navigate('/ajustes')}
            >
              <IconSettings size={22} aria-hidden="true" />
            </button>
          </div>
        </header>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          style={{ display: 'none' }}
          onChange={handleImportarArquivo}
        />

        {ultimaEmAndamento && (
          <section className={styles.continuar} aria-labelledby="continuar-titulo">
            <p id="continuar-titulo" className="label-secao">Continuar de onde parou</p>
            <h2 className={styles.continuarNome}>{ultimaEmAndamento.nome}</h2>
            <div className={styles.continuarProgresso}>
              <div className="progresso-track" style={{ flex: 1 }} aria-hidden="true">
                <div className="progresso-fill" style={{ width: `${progressoUltima.pct}%` }} />
              </div>
              <span>{progressoUltima.respondidos} de {progressoUltima.total} itens</span>
            </div>
            {proximoItem && (
              <p className={styles.proximo}>
                <span className={styles.proximoRotulo}>
                  Próximo: {secaoProximo?.nome}{proximoItem.tipo === 'tecnico' ? ` · item ${ITENS_TECNICOS.indexOf(proximoItem) + 1}` : ' · triagem'}
                </span>
                <span className={styles.proximoPergunta}>{proximoItem.pergunta}</span>
              </p>
            )}
            <button
              type="button"
              className={`btn-nav primario ${styles.btnContinuar}`}
              onClick={() => navigate(
                progressoUltima.proximoIndice >= 0
                  ? `/checklist/${ultimaEmAndamento.id}/item/${progressoUltima.proximoIndice + 1}`
                  : `/checklist/${ultimaEmAndamento.id}/resultado`
              )}
            >
              Continuar <IconArrowRight size={18} aria-hidden="true" />
            </button>
          </section>
        )}

        <div className={`${styles.acoes} ${temVistorias ? styles.acoesCompactas : ''}`}>
          {temVistorias ? (
            <button type="button" className={styles.btnNovaCompacto} onClick={() => navigate('/nova')}>
              <IconPlus size={20} aria-hidden="true" />
              <span>Nova vistoria</span>
            </button>
          ) : (
            <button className={`cartao ${styles.btnNova}`} onClick={() => navigate('/nova')}>
              <div className={styles.iconePlus}>
                <IconPlus size={28} aria-hidden="true" />
              </div>
              <div>
                <p className={styles.novaLabel}>Nova vistoria</p>
                <p className={styles.novaDesc}>Cadastrar a instituição e iniciar o diagnóstico</p>
              </div>
            </button>
          )}

          <button
            type="button"
            className={`${styles.btnImportarPrincipal} ${arrastando ? styles.arrastando : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            title="Clique para selecionar ou arraste um arquivo de vistoria (.json) até aqui"
          >
            <IconUpload size={18} aria-hidden="true" />
            <span>{arrastando ? 'Solte o arquivo para importar' : 'Importar arquivo'}</span>
          </button>
        </div>

        {/* Lembrete preventivo de backup (§3.1/B4) */}
        {vistorias.length > 0 && (!ultimoBackup || (Date.now() - new Date(ultimoBackup).getTime()) > 7 * 24 * 60 * 60 * 1000) && (
          <div role="status" className={styles.avisoBackup}>
            <IconShieldCheck size={18} color="var(--accent)" aria-hidden="true" />
            <span>
              {ultimoBackup
                ? 'Mais de 7 dias sem backup.'
                : 'Sem backup: os dados estão só neste aparelho.'}
            </span>
            <button type="button" onClick={() => navigate('/ajustes')}>Fazer backup</button>
          </div>
        )}

        {carregando ? (
          <div className={styles.vazio} style={{ marginTop: 24 }}>
            <p>Carregando diagnósticos salvos...</p>
          </div>
        ) : vistorias.length === 0 ? (
          <section className={styles.boasVindasVazio} aria-labelledby="vazio-titulo">
            <h2 id="vazio-titulo">Comece a primeira vistoria</h2>
            <ol className={styles.passos}>
              <li><strong>Cadastre</strong> a instituição e a equipe</li>
              <li><strong>Responda</strong> o checklist, mesmo sem internet</li>
              <li><strong>Gere</strong> o resultado e os relatórios</li>
            </ol>
          </section>
        ) : (
          <div className={styles.lista}>
            {vistorias.length > LIMITE_PARA_BUSCA && (
              <div className={styles.filtros}>
                <label className={styles.busca}>
                  <IconSearch size={18} aria-hidden="true" />
                  <span className="sr-only">Buscar por nome ou cidade</span>
                  <input
                    type="text"
                    placeholder="Buscar por nome ou cidade"
                    value={busca}
                    onChange={e => setBusca(e.target.value)}
                  />
                </label>
                <div className={styles.chips} role="group" aria-label="Filtrar por estado">
                  {[{ status: 'todas', rotulo: 'Todas' }, ...GRUPOS].map(g => (
                    <button
                      key={g.status}
                      type="button"
                      className={`chip ${filtro === g.status ? 'ativo' : ''}`}
                      aria-pressed={filtro === g.status}
                      onClick={() => setFiltro(g.status)}
                    >
                      {g.rotulo}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {visiveis.length === 0 && (
              <p className={styles.vazio} role="status">Nenhuma vistoria encontrada.</p>
            )}

            {GRUPOS.map(({ status, rotulo }) => {
              const doGrupo = visiveis.filter(v => v.status === status);
              if (doGrupo.length === 0) return null;
              return (
                <section key={status} style={{ marginBottom: 32 }}>
                  <h2 className="label-secao">{rotulo}</h2>
                  <div className={styles.gridVistorias}>
                    {doGrupo.map(v => (
                      <CartaoVistoria key={v.id || v.vistoriaId} vistoria={v} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>

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
