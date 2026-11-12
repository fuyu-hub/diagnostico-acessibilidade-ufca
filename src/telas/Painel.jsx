import { useEffect, useMemo, useState, useRef } from 'react';
import { IconSettings, IconPlus, IconUpload, IconInfoCircle, IconArrowRight, IconSearch, IconQrcode } from '@tabler/icons-react';
import { useVistoria } from '../contexto/VistoriaContext';
import { useNotificacao } from '../contexto/NotificacaoContext';
import MarcaCaminho from '../componentes/MarcaCaminho';
import CartaoVistoria from '../componentes/CartaoVistoria';
import { nuvemDisponivel } from '../dados/nuvem';
import ModalConflito from '../componentes/ModalConflito';
import { lerArquivoImportacao } from '../dados/exportacao';
import { resumoProgresso } from '../dados/checklist';
import { useAplicativo, instalarAplicativo, reservarOfertaInstalacao } from '../utilitarios/aplicativo';
import { useNavegacao } from '../utilitarios/navegacao';
import styles from './Painel.module.css';

const LIMITE_PARA_BUSCA = 6;
const GRUPOS = [
  { status: 'em_andamento', rotulo: 'Em andamento' },
  { status: 'concluida', rotulo: 'Concluídas' },
  { status: 'rascunho', rotulo: 'Não iniciadas' },
];

const normalizar = texto => String(texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export default function Painel() {
  const app = useAplicativo();
  const { vistorias, carregando, importarConteudoJson, aplicarResolucaoConflito, importarFotosDoGrupo } = useVistoria();
  const { mostrarToast, mostrarAlerta } = useNotificacao();
  const { navegar } = useNavegacao();
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

  // Oferta de instalação como notificação; não aparece por cima das boas-vindas
  useEffect(() => {
    if (!app.podeInstalar || app.instalado) return;
    if (document.body.classList.contains('modal-aberto')) return;
    if (!reservarOfertaInstalacao()) return;
    mostrarToast('Instale o app para usar mesmo sem internet.', 'info', 12000, {
      rotulo: 'Instalar',
      fn: async () => {
        if (await instalarAplicativo()) mostrarToast('App instalado. Ele aparece junto dos outros apps.', 'sucesso');
      },
    });
  }, [app.podeInstalar, app.instalado, mostrarToast]);

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

      // Pacote de fotos de uma vistoria em grupo: junta as fotos em vez de importar uma vistoria
      let json = null;
      try { json = JSON.parse(texto); } catch { /* o importador avisa sobre JSON inválido */ }
      const fotos = json ? importarFotosDoGrupo(json) : null;
      if (fotos) {
        mostrarToast(
          fotos.adicionadas > 0
            ? `${fotos.adicionadas} foto(s)${fotos.enviadoPor ? ` de ${fotos.enviadoPor}` : ''} adicionada(s) à vistoria`
            : 'Essas fotos já estavam neste aparelho',
          'sucesso'
        );
        return;
      }

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
            <span className={styles.marca}><MarcaCaminho tamanho={52} /></span>
            <div>
              <span className={styles.eyebrow}>Caminho Acessível</span>
              <h1 className={styles.titulo}>Vistorias</h1>
            </div>
          </div>
          <div className={styles.headerAcoes}>
            <button
              type="button"
              className={styles.btnSettings}
              aria-label="Ajustes"
              title="Ajustes"
              onClick={() => navegar('/ajustes')}
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
              <div className="progresso-track" style={{ flex: 1 }}>
                <div className="progresso-fill" style={{ width: `${progressoUltima.pct}%` }} />
              </div>
              <span>{progressoUltima.respondidos} de {progressoUltima.total}</span>
            </div>
            <button
              type="button"
              className={`btn-nav primario ${styles.btnContinuar}`}
              onClick={() => navegar(
                progressoUltima.proximoIndice >= 0
                  ? `/checklist/${ultimaEmAndamento.id}/item/${progressoUltima.proximoIndice + 1}`
                  : `/checklist/${ultimaEmAndamento.id}/resultado`
              )}
            >
              Continuar <IconArrowRight size={18} aria-hidden="true" />
            </button>
          </section>
        )}

        <div className={styles.acoes}>
          <button className={`cartao ${styles.btnNova}`} onClick={() => navegar('/nova')}>
            <div className={styles.iconePlus}>
              <IconPlus size={28} aria-hidden="true" />
            </div>
            <div>
              <p className={styles.novaLabel}>Nova vistoria</p>
              <p className={styles.novaDesc}>Cadastrar a instituição e iniciar o diagnóstico</p>
            </div>
          </button>

          <div className={styles.acoesArquivo}>
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
            <span>{arrastando ? 'Solte aqui' : 'Importar'}</span>
          </button>
          {nuvemDisponivel() && (
            <button
              type="button"
              className={styles.btnImportarPrincipal}
              onClick={() => navegar('/ler-qr')}
              aria-label="Ler QR code de uma vistoria em grupo"
            >
              <IconQrcode size={18} aria-hidden="true" />
              <span>Ler QR</span>
            </button>
          )}
          </div>
        </div>


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
                      <CartaoVistoria key={v.id || v.vistoriaId} vistoria={v} semContinuar={v === ultimaEmAndamento} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>

      <footer className={styles.rodape}>
        <button type="button" className={styles.btnSobre} aria-label="Sobre" title="Sobre" onClick={() => navegar('/sobre')}>
          <IconInfoCircle size={22} aria-hidden="true" />
        </button>
      </footer>

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
