import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  IconMapPin, IconCalendar, IconUserPlus, IconTrash,
  IconArrowRight, IconListCheck, IconFileTypePdf, IconTable,
  IconDeviceFloppy, IconCheck, IconChartBar,
  IconClock, IconDownload, IconPhoto, IconCloudCheck, IconCloudUpload
} from '@tabler/icons-react';
import { estadoEnvio } from '../dados/coleta.js';
import { nuvemDisponivel } from '../dados/nuvem.js';
import { useVistoria } from '../contexto/VistoriaContext';
import { useNotificacao } from '../contexto/NotificacaoContext';
import { ITENS_TECNICOS, SECOES, ITENS_POR_SECAO, resumoProgresso } from '../dados/checklist';
import { listarFotos, camposFotos } from '../dados/fotos.js';
import { calcularIndiceItens } from '../dados/classificacao';
import Topbar from '../componentes/Topbar';
import SeletorNivel, { OPCOES_REDE, OPCOES_NIVEL_ENSINO } from '../componentes/SeletorNivel';
import ModalExcluirVistoria from '../componentes/ModalExcluirVistoria';
import ModalGaleriaVistoria from '../componentes/ModalGaleriaVistoria';
import { useNavegacao } from '../utilitarios/navegacao';
import styles from './DashboardVistoria.module.css';

const ABAS = [
  { id: 'resumo', rotulo: 'Resumo' },
  { id: 'ficha', rotulo: 'Ficha' },
  { id: 'relatorios', rotulo: 'Relatórios' },
];

// Cartões de exportação são divs clicáveis: Enter e Espaço também acionam
function teclaAcionar(fn) {
  return (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); }
  };
}

export default function DashboardVistoria() {
  const { id } = useParams();
  const { navegar } = useNavegacao();
  const { getVistoria, carregando } = useVistoria();

  if (carregando) {
    return <div style={{ padding: 20, textAlign: 'center' }}>Carregando dados da vistoria...</div>;
  }

  const vistoria = getVistoria(id);

  if (!vistoria) {
    return (
      <div className="app-shell">
        <Topbar titulo="Vistoria não encontrada" voltar="/" />
        <div className="tela-body" style={{ padding: '32px 20px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)' }}>A vistoria solicitada não existe ou foi removida.</p>
          <button className="btn-nav primario" onClick={() => navegar('/')} style={{ marginTop: 20 }}>
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  // Montado só com a vistoria já carregada: a ficha inicializa com os dados dela
  return <ConteudoVistoria key={id} id={id} vistoria={vistoria} />;
}

function ConteudoVistoria({ id, vistoria }) {
  const { navegar } = useNavegacao();
  const [searchParams, setSearchParams] = useSearchParams();
  const { atualizarVistoria, removerVistoria, exportarVistoria, responderItem, enviosPesquisa } = useVistoria();
  const envio = nuvemDisponivel() ? estadoEnvio(vistoria, enviosPesquisa) : null;
  const { mostrarToast, mostrarConfirmacao } = useNotificacao();

  const aba = ABAS.some(a => a.id === searchParams.get('aba')) ? searchParams.get('aba') : 'resumo';
  const [modalExcluirAberto, setModalExcluirAberto] = useState(false);
  const [modalGaleriaAberto, setModalGaleriaAberto] = useState(false);
  const [gerandoPlanilha, setGerandoPlanilha] = useState(false);
  const [gerandoPdf, setGerandoPdf] = useState(false);

  function trocarAba(nova, focar = false) {
    setSearchParams(nova === 'resumo' ? {} : { aba: nova }, { replace: true });
    if (focar) setTimeout(() => document.getElementById(`aba-${nova}`)?.focus(), 0);
  }

  function teclasAbas(e) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    const i = ABAS.findIndex(a => a.id === aba);
    const proxima = e.key === 'Home' ? 0 : e.key === 'End' ? ABAS.length - 1
      : (i + (e.key === 'ArrowRight' ? 1 : -1) + ABAS.length) % ABAS.length;
    trocarAba(ABAS[proxima].id, true);
  }

  async function handleExcluirFotoGaleria(itemId, indiceFoto = 0) {
    const confirmado = await mostrarConfirmacao({
      titulo: 'Remover Foto',
      mensagem: 'Tem certeza que deseja remover esta foto do item? A ação não poderá ser desfeita.',
      textoConfirmar: 'Remover foto',
      textoCancelar: 'Cancelar',
      perigo: true,
    });
    if (!confirmado) return;
    
    const respostaAtual = vistoria.respostas ? vistoria.respostas[itemId] : vistoria.dadosVistoria?.[itemId];
    if (respostaAtual) {
      const restantes = listarFotos(respostaAtual).filter((_, i) => i !== indiceFoto);
      responderItem(vistoria.id || id, itemId, { ...respostaAtual, ...camposFotos(restantes) });
      mostrarToast('Foto removida com sucesso', 'sucesso');
    }
  }

  function handleConfirmarExclusao() {
    setModalExcluirAberto(false);
    removerVistoria(id);
    navegar('/');
  }

  const [form, setForm] = useState({
    nome: vistoria?.nome || '',
    endereco: vistoria?.endereco || '',
    bairro: vistoria?.bairro || '',
    cidade: vistoria?.cidade || '',
    rede: vistoria?.rede || 'Municipal',
    nivelEnsino: Array.isArray(vistoria?.nivelEnsino)
      ? vistoria.nivelEnsino
      : vistoria?.nivelEnsino === 'Ambos'
        ? ['Fundamental', 'Médio']
        : vistoria?.nivelEnsino === 'Superior'
          ? ['Superior']
          : vistoria?.nivelEnsino
            ? [vistoria.nivelEnsino]
            : ['Fundamental'],
    numAlunos: vistoria?.numAlunos || '',
    numPavimentos: vistoria?.numPavimentos || '1',
    data: vistoria?.data || '',
    dataTermino: vistoria?.dataTermino || '',
    horarioInicio: vistoria?.horarioInicio || '',
    horarioTermino: vistoria?.horarioTermino || '',
    avaliadores: vistoria?.avaliadores?.length ? vistoria.avaliadores : [''],
  });

  const [salvoFeedback, setSalvoFeedback] = useState(false);

  useEffect(() => {
    if (vistoria && !vistoria.horarioInicio) {
      const now = new Date();
      const hm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      atualizarVistoria(id, { horarioInicio: hm });
      setForm(prev => ({ ...prev, horarioInicio: hm }));
    }
  }, [vistoria, id, atualizarVistoria]);

  // Estatísticas de preenchimento e contagens
  const total = ITENS_TECNICOS.length;
  const respostas = vistoria.respostas || {};
  const respostasTecnicas = ITENS_TECNICOS.filter(item => respostas[item.id]?.valor);
  const respondidos = respostasTecnicas.length;
  const pendentes = Math.max(0, total - respondidos);
  const pct = total > 0 ? Math.round((respondidos / total) * 100) : 0;

  const indice = calcularIndiceItens(ITENS_TECNICOS, respostas);

  const primeiroPendenteIdx = resumoProgresso(respostas).proximoIndice;
  const temPendente = primeiroPendenteIdx !== -1;
  const ativa = Object.keys(respostas).length > 0;

  // Só seções com não conformidade, da pior para a melhor (no máximo 3)
  const secoesCriticas = SECOES
    .map(s => {
      const itens = (ITENS_POR_SECAO[s.id] || []).filter(i => i.tipo === 'tecnico');
      return { s, ind: calcularIndiceItens(itens, respostas), parcial: itens.some(i => !respostas[i.id]?.valor) };
    })
    .filter(x => x.ind.nc > 0)
    .sort((a, b) => a.ind.nota - b.ind.nota)
    .slice(0, 3);

  function setCampo(campo, valor) {
    setForm(prev => ({ ...prev, [campo]: valor }));
    setSalvoFeedback(false);
  }

  function setAvaliador(idx, valor) {
    const lista = [...form.avaliadores];
    lista[idx] = valor;
    setForm(prev => ({ ...prev, avaliadores: lista }));
    setSalvoFeedback(false);
  }

  function adicionarAvaliador() {
    setForm(prev => ({ ...prev, avaliadores: [...prev.avaliadores, ''] }));
    setSalvoFeedback(false);
  }

  function removerAvaliador(idx) {
    if (form.avaliadores.length <= 1) {
      setForm(prev => ({ ...prev, avaliadores: [''] }));
    } else {
      setForm(prev => ({
        ...prev,
        avaliadores: prev.avaliadores.filter((_, i) => i !== idx),
      }));
    }
    setSalvoFeedback(false);
  }

  function handleSalvar(e) {
    e.preventDefault();
    if (!form.nome.trim()) return;

    atualizarVistoria(id, {
      ...form,
      nome: form.nome.trim(),
      cidade: form.cidade.trim(),
      avaliadores: form.avaliadores.filter(a => a.trim() !== ''),
    });

    setSalvoFeedback(true);
    setTimeout(() => setSalvoFeedback(false), 3000);
  }

  async function baixarBackup() {
    try {
      await exportarVistoria(vistoria.id);
      mostrarToast('Backup salvo na pasta Downloads.', 'sucesso', 6000);
    } catch (err) {
      console.error('Erro ao exportar:', err);
      mostrarToast('Não foi possível fazer o backup.', 'erro');
    }
  }

  async function baixarPdf() {
    if (gerandoPdf) return;
    setGerandoPdf(true);
    try {
      mostrarToast('Gerando o relatório em PDF…', 'info', 3000);
      const { gerarPdfVistoria } = await import('../relatorios/geradorPdf');
      await gerarPdfVistoria(vistoria);
      mostrarToast('Relatório PDF salvo na pasta Downloads.', 'sucesso', 6000);
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      mostrarToast('Não foi possível gerar o relatório PDF.', 'erro');
    } finally {
      setGerandoPdf(false);
    }
  }

  async function baixarPlanilha() {
    if (gerandoPlanilha) return;
    setGerandoPlanilha(true);
    try {
      mostrarToast('Gerando a planilha…', 'info', 3000);
      const { gerarPlanilhaVistoria } = await import('../relatorios/geradorExcel');
      await gerarPlanilhaVistoria(vistoria);
      mostrarToast('Planilha salva na pasta Downloads.', 'sucesso', 6000);
    } catch (err) {
      console.error('Erro ao gerar planilha:', err);
      mostrarToast('Não foi possível gerar a planilha.', 'erro');
    } finally {
      setGerandoPlanilha(false);
    }
  }

  function handleContinuar() {
    if (temPendente) {
      navegar(`/checklist/${id}/item/${primeiroPendenteIdx + 1}`);
    } else {
      navegar(`/checklist/${id}/resultado`);
    }
  }

  return (
    <div className="app-shell">
      <Topbar titulo="Painel da Vistoria" inicio />

      <main className="tela-body" style={{ padding: '24px 20px 48px' }}>
        <div className={styles.container}>
          {/* Cabeçalho da Vistoria */}
          <div className={styles.cabecalhoVistoria}>
            <div className={styles.cabecalhoConteudo}>
              <div className={styles.tituloLinha}>
                <h2 className={styles.titulo}>{vistoria.nome}</h2>
                <span className={`tag ${!ativa ? 'salva' : temPendente ? 'em-andamento' : 'concluida'}`}>
                  {ativa ? (temPendente ? 'Em andamento' : 'Concluída') : 'Não iniciada'}
                </span>
              </div>
              <div className={styles.metaInfo}>
                <span className={styles.metaItem}>
                  <IconMapPin size={15} />
                  <span>{vistoria.bairro ? `${vistoria.bairro}, ` : ''}{vistoria.cidade || 'Local não informado'}</span>
                </span>
                <span className={styles.metaItem}>
                  <IconCalendar size={15} />
                  <span>{vistoria.data ? vistoria.data.split('-').reverse().join('/') : 'Data não informada'}</span>
                </span>
                {vistoria.horarioInicio && (
                  <span className={styles.metaItem}>
                    <IconClock size={15} />
                    <span>{vistoria.horarioInicio}{vistoria.horarioTermino ? ` às ${vistoria.horarioTermino}` : ''}</span>
                  </span>
                )}
              </div>
              {envio && (
                <p className={styles.metaItem} role="status">
                  {envio.estado === 'enviada' ? <IconCloudCheck size={15} aria-hidden="true" /> : <IconCloudUpload size={15} aria-hidden="true" />}
                  <span>
                    {envio.estado === 'enviada'
                      ? `Enviada para a pesquisa em ${new Date(envio.enviadaEm).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}`
                      : 'Envio para a pesquisa pendente: segue sozinho quando houver internet'}
                  </span>
                </p>
              )}
            </div>
          </div>

          <div className={styles.abas} role="tablist" aria-label="Partes do painel" onKeyDown={teclasAbas}>
            {ABAS.map(a => (
              <button
                key={a.id}
                id={`aba-${a.id}`}
                type="button"
                role="tab"
                aria-selected={aba === a.id}
                aria-controls="painel-aba"
                tabIndex={aba === a.id ? 0 : -1}
                onClick={() => trocarAba(a.id)}
              >
                {a.rotulo}
              </button>
            ))}
          </div>

          <div id="painel-aba" role="tabpanel" aria-labelledby={`aba-${aba}`} className={styles.painelAba}>

          {/* Card de Métricas do Dashboard */}
          {aba === 'resumo' && (
          <section className={styles.cardDashboard}>
            <div>
              <div className={styles.progressoHeader}>
                <span className={styles.progressoLabel}>Progresso do Checklist</span>
                <span className={styles.progressoValor}>{pct}% ({respondidos}/{total})</span>
              </div>

              <div className="progresso-track" style={{ marginTop: 10 }}>
                <div className="progresso-fill" style={{ width: `${pct}%` }} />
              </div>
            </div>

            <div className={styles.gridMetricas}>
              <div className={`${styles.miniCard} ${styles.miniCardProgresso}`}>
                <span className={styles.miniCardNumero} style={{ color: 'var(--accent)' }}>{respondidos}</span>
                <span className={styles.miniCardLabel}>Respondidos</span>
              </div>
              <div className={`${styles.miniCard} ${styles.miniCardProgresso}`}>
                <span className={styles.miniCardNumero} style={{ color: 'var(--text-muted)' }}>{pendentes}</span>
                <span className={styles.miniCardLabel}>Pendentes</span>
              </div>
              <div className={`${styles.miniCard} ${styles.miniCardResultado}`}>
                <span className={styles.miniCardNumero} style={{ color: 'var(--text-success)' }}>{indice.conf}</span>
                <span className={styles.miniCardLabel}>Conf.</span>
              </div>
              <div className={`${styles.miniCard} ${styles.miniCardResultado}`}>
                <span className={styles.miniCardNumero} style={{ color: 'var(--text-danger)' }}>{indice.nc}</span>
                <span className={styles.miniCardLabel}>Não Conf.</span>
              </div>
              <div className={`${styles.miniCard} ${styles.miniCardResultado}`}>
                <span className={styles.miniCardNumero} style={{ color: 'var(--text-na, var(--text-muted))' }}>{indice.na}</span>
                <span className={styles.miniCardLabel}>N/A</span>
              </div>
            </div>

            {/* Ações de navegação do Checklist */}
            <div className={styles.acoesChecklist}>
              <button
                type="button"
                className={`btn-nav primario ${styles.btnAcaoPrimario}`}
                onClick={handleContinuar}
              >
                {!ativa ? 'Iniciar Checklist' : temPendente ? 'Continuar Checklist' : 'Ver Resultado'}
                <IconArrowRight size={18} />
              </button>

              <button
                type="button"
                className={`btn-nav ${styles.btnAcaoSecundario}`}
                onClick={() => navegar(`/checklist/${id}/itens`)}
              >
                <IconListCheck size={18} />
                Seções
              </button>

              {ativa && (
                <button
                  type="button"
                  className={`btn-nav ${styles.btnAcaoSecundario}`}
                  onClick={() => navegar(`/checklist/${id}/resultado`)}
                >
                  <IconChartBar size={18} />
                  Resultado
                </button>
              )}

              {ativa && (
                <button
                  type="button"
                  className={`btn-nav ${styles.btnAcaoSecundario}`}
                  onClick={() => setModalGaleriaAberto(true)}
                  title="Abrir galeria de fotos desta vistoria"
                >
                  <IconPhoto size={18} />
                  Galeria
                </button>
              )}
            </div>
          </section>
          )}

          {aba === 'resumo' && secoesCriticas.length > 0 && (
            <section className={styles.cardDashboard} aria-labelledby="titulo-criticas">
              <h3 id="titulo-criticas" className={styles.secaoTitulo}>Seções que mais precisam de atenção</h3>
              <ul className={styles.listaCriticas}>
                {secoesCriticas.map(({ s, ind, parcial }) => (
                  <li key={s.id}>
                    <button type="button" className={styles.linhaCritica} onClick={() => navegar(`/checklist/${id}/itens?secao=${s.id}`)}>
                      <span className={styles.criticaNome}>{s.nome}</span>
                      <strong style={{ color: ind.classificacao.corNota || ind.classificacao.cor }}>{ind.classificacao.notaFormatada}</strong>
                      <span className={styles.barraNota} aria-hidden="true">
                        <span style={{ width: `${ind.nota * 10}%`, background: ind.classificacao.cor }} />
                      </span>
                      <span className={styles.criticaRotulo}>{ind.classificacao.rotulo.toLowerCase()}{parcial ? ' · parcial' : ''}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Card de Parâmetros e Ficha Completa da Instituição */}
          {aba === 'ficha' && (
          <section className={styles.cardParametros}>
            <div>
              <h3 className={styles.secaoTitulo}>Ficha da Instituição</h3>
              <p className={styles.secaoSubtitulo}>
                Atualize as informações cadastrais e estruturais da escola/edificação e a equipe técnica da vistoria.
              </p>
            </div>

            <form onSubmit={handleSalvar}>
              <div style={{ marginBottom: 16 }}>
                <label className="label-secao" htmlFor="ficha-1">Nome da escola / instituição *</label>
                <input
                  id="ficha-1"
                  type="text"
                  placeholder="Ex: Universidade Federal do Cariri - UFCA"
                  value={form.nome}
                  onChange={e => setCampo('nome', e.target.value)}
                  required
                />
              </div>

              <div className="form-grid-2" style={{ marginBottom: 16 }}>
                <div className="col-span-2">
                  <label className="label-secao" htmlFor="ficha-2">Endereço completo</label>
                  <input
                  id="ficha-2"
                    type="text"
                    placeholder="Ex: Av. Tenente Raimundo Rocha, 1639"
                    value={form.endereco}
                    onChange={e => setCampo('endereco', e.target.value)}
                  />
                </div>

                <div>
                  <label className="label-secao" htmlFor="ficha-3">Bairro</label>
                  <input
                  id="ficha-3"
                    type="text"
                    placeholder="Ex: Cidade Universitária"
                    value={form.bairro}
                    onChange={e => setCampo('bairro', e.target.value)}
                  />
                </div>

                <div>
                  <label className="label-secao" htmlFor="ficha-4">Cidade / Município</label>
                  <input
                  id="ficha-4"
                    type="text"
                    placeholder="Ex: Juazeiro do Norte, CE"
                    value={form.cidade}
                    onChange={e => setCampo('cidade', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-grid-2" style={{ marginBottom: 16 }}>
                <SeletorNivel
                  label="Rede de Ensino"
                  valor={form.rede}
                  onChange={val => setCampo('rede', val)}
                  opcoes={OPCOES_REDE}
                  multi={false}
                />

                <SeletorNivel
                  label="Nível de Ensino"
                  valores={form.nivelEnsino}
                  onChange={novos => setCampo('nivelEnsino', novos)}
                  opcoes={OPCOES_NIVEL_ENSINO}
                  multi={true}
                />
              </div>

              <div className="form-grid-2" style={{ marginBottom: 20 }}>
                <div>
                  <label className="label-secao" htmlFor="ficha-5">Número de alunos (aprox.)</label>
                  <input
                  id="ficha-5"
                    type="number"
                    placeholder="Ex: 2500"
                    value={form.numAlunos}
                    onChange={e => setCampo('numAlunos', e.target.value)}
                  />
                </div>

                <div>
                  <label className="label-secao" htmlFor="ficha-6">Número de pavimentos</label>
                  <input
                  id="ficha-6"
                    type="number"
                    placeholder="Ex: 3"
                    value={form.numPavimentos}
                    onChange={e => setCampo('numPavimentos', e.target.value)}
                  />
                </div>
              </div>

              {/* Dados da Vistoria Técnica */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 18, marginBottom: 20 }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 14, color: 'var(--text-primary)' }}>
                  Horários e Equipe da Vistoria
                </h4>

                <div className={styles.gridHorarios}>
                  {/* Card: Início */}
                  <div className={styles.cardHorario} role="group" aria-labelledby="grupo-inicio">
                    <span id="grupo-inicio" className={styles.cardHorarioTitulo}>Início da Vistoria</span>
                    <div className={styles.cardHorarioInputs}>
                      <div>
                        <label className="label-secao" htmlFor="ficha-7">Data</label>
                        <input
                  id="ficha-7"
                          type="date"
                          value={form.data}
                          onChange={e => setCampo('data', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="label-secao" htmlFor="ficha-8">Horário</label>
                        <input
                  id="ficha-8"
                          type="time"
                          value={form.horarioInicio}
                          onChange={e => setCampo('horarioInicio', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card: Término */}
                  <div className={styles.cardHorario} role="group" aria-labelledby="grupo-termino">
                    <span id="grupo-termino" className={styles.cardHorarioTitulo}>Término da Vistoria</span>
                    <div className={styles.cardHorarioInputs}>
                      <div>
                        <label className="label-secao" htmlFor="ficha-9">Data</label>
                        <input
                  id="ficha-9"
                          type="date"
                          value={form.dataTermino}
                          onChange={e => setCampo('dataTermino', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="label-secao" htmlFor="ficha-hora-termino">Horário</label>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <input
                            id="ficha-hora-termino"
                            type="time"
                            value={form.horarioTermino}
                            onChange={e => setCampo('horarioTermino', e.target.value)}
                            style={{ flex: 1 }}
                          />
                          {!temPendente && ativa && !form.horarioTermino && (
                            <button
                              type="button"
                              className="btn-nav secudario"
                              style={{ padding: '0 12px', height: '44px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                              onClick={() => {
                                const now = new Date();
                                const yyyy = now.getFullYear();
                                const mm = String(now.getMonth() + 1).padStart(2, '0');
                                const dd = String(now.getDate()).padStart(2, '0');
                                const hm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                                setCampo('horarioTermino', hm);
                                setCampo('dataTermino', `${yyyy}-${mm}-${dd}`);
                              }}
                            >
                              Registrar
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <span className="label-secao">Equipe de Avaliadores</span>
                  {form.avaliadores.map((avaliador, i) => (
                    <div key={i} className={styles.linhaAvaliador}>
                      <input
                        type="text"
                        placeholder={`Nome do avaliador ${i + 1}`}
                        aria-label={`Nome do avaliador ${i + 1}`}
                        value={avaliador}
                        onChange={e => setAvaliador(i, e.target.value)}
                        style={{ flex: 1 }}
                      />
                      {form.avaliadores.length > 1 && (
                        <button
                          type="button"
                          className={styles.btnExcluirAvaliador}
                          onClick={() => removerAvaliador(i)}
                          aria-label="Excluir avaliador"
                          title="Excluir avaliador"
                        >
                          <IconTrash size={18} />
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    className={styles.btnAdicionarAvaliador}
                    onClick={adicionarAvaliador}
                  >
                    <IconUserPlus size={18} /> Adicionar outro avaliador
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
                <button
                  type="submit"
                  className={`btn-nav primario ${styles.btnSalvarParametros}`}
                  disabled={!form.nome.trim()}
                >
                  <IconDeviceFloppy size={18} /> Salvar Dados Cadastrais
                </button>

                {salvoFeedback && (
                  <span style={{ color: 'var(--text-success)', fontSize: '0.88rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6, paddingLeft: 4 }}>
                    <IconCheck size={18} /> Dados atualizados com sucesso!
                  </span>
                )}
              </div>
            </form>
          </section>
          )}

          {/* Card de Exportação / Relatórios / Backup */}
          {aba === 'relatorios' && (
          <section className={styles.cardExportacao}>
            <div>
              <h3 className={styles.secaoTitulo}>Exportar e Relatórios</h3>
              <p className={styles.secaoSubtitulo}>
                Baixe uma cópia de segurança ou gere os relatórios desta vistoria. Os arquivos vão para a pasta Downloads.
              </p>
            </div>

            <div className={styles.gridExportacao}>
              <div
                className={styles.itemExportacaoAtivo}
                onClick={baixarBackup}
                onKeyDown={teclaAcionar(baixarBackup)}
                role="button"
                tabIndex={0}
                title="Clique para baixar o backup desta vistoria"
              >
                <div className={styles.itemExportacaoHeader}>
                  <span className={styles.itemExportacaoTitulo}>
                    <IconDownload size={22} color="var(--accent)" />
                    <span>Fazer Backup</span>
                  </span>
                </div>
                <p className={styles.itemExportacaoDesc}>
                  Baixa um arquivo com todas as respostas e dados preenchidos para não perder nada.
                </p>
              </div>

              <div 
                className={styles.itemExportacaoAtivo}
                onClick={baixarPdf}
                onKeyDown={teclaAcionar(baixarPdf)}
                role="button"
                tabIndex={0}
              >
                <div className={styles.itemExportacaoHeader}>
                  <span className={styles.itemExportacaoTitulo}>
                    <IconFileTypePdf size={22} color="var(--text-danger)" />
                    <span>Relatório em PDF</span>
                  </span>
                  {gerandoPdf && <span className={styles.badgeProcessando}>Gerando...</span>}
                </div>
                <p className={styles.itemExportacaoDesc}>
                  Gera o laudo completo formatado para impressão com fotos e justificativas.
                </p>
              </div>

              <div 
                className={styles.itemExportacaoAtivo}
                onClick={baixarPlanilha}
                onKeyDown={teclaAcionar(baixarPlanilha)}
                role="button"
                tabIndex={0}
                title="Clique para gerar a planilha executiva em Excel"
              >
                <div className={styles.itemExportacaoHeader}>
                  <span className={styles.itemExportacaoTitulo}>
                    <IconTable size={22} color="var(--text-success)" />
                    <span>Planilha (Excel)</span>
                  </span>
                  {gerandoPlanilha && <span className={styles.badgeProcessando}>Gerando...</span>}
                </div>
                <p className={styles.itemExportacaoDesc}>
                  Exporta o questionário, respostas, fotos e o resumo IAA.
                </p>
              </div>
            </div>
          </section>
          )}

          {/* Zona de Perigo / Excluir Vistoria */}
          {aba === 'ficha' && (
          <section className={styles.cardZonaPerigo}>
            <div className={styles.perigoConteudo}>
              <div className={styles.perigoInfo}>
                <h4 className={styles.perigoTitulo}>Excluir esta vistoria</h4>
                <p className={styles.perigoDesc}>
                  Esta ação removerá permanentemente todos os dados da instituição, respostas e fotos deste diagnóstico.
                </p>
              </div>
              <button
                type="button"
                className={styles.btnExcluirVistoria}
                onClick={() => setModalExcluirAberto(true)}
                aria-label="Excluir vistoria"
                title="Excluir vistoria"
              >
                <IconTrash size={20} />
                <span className={styles.btnExcluirTexto}>Excluir Vistoria</span>
              </button>
            </div>
          </section>
          )}
          </div>
        </div>
      </main>

      <ModalExcluirVistoria
        aberto={modalExcluirAberto}
        nomeVistoria={vistoria.nome}
        onExportar={() => exportarVistoria(vistoria.id)}
        onConfirmar={handleConfirmarExclusao}
        onCancelar={() => setModalExcluirAberto(false)}
      />

      <ModalGaleriaVistoria
        aberto={modalGaleriaAberto}
        vistoria={vistoria}
        onFechar={() => setModalGaleriaAberto(false)}
        onExcluirFoto={handleExcluirFotoGaleria}
      />
    </div>
  );
}
