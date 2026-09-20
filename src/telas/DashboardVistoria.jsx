import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  IconMapPin, IconCalendar, IconUserPlus, IconTrash,
  IconArrowRight, IconListCheck, IconFileTypePdf, IconTable,
  IconDeviceFloppy, IconCheck, IconChartBar,
  IconClock, IconDownload, IconPhoto
} from '@tabler/icons-react';
import { useVistoria } from '../contexto/VistoriaContext';
import { TODOS_ITENS, ITENS_TECNICOS } from '../dados/checklist';
import { calcularIndiceItens } from '../dados/classificacao';
import Topbar from '../componentes/Topbar';
import SeletorNivel, { OPCOES_REDE, OPCOES_NIVEL_ENSINO } from '../componentes/SeletorNivel';
import ModalExcluirVistoria from '../componentes/ModalExcluirVistoria';
import ModalGaleriaVistoria from '../componentes/ModalGaleriaVistoria';
import { gerarPlanilhaVistoria } from '../relatorios/geradorExcel';
import { gerarPdfVistoria } from '../relatorios/geradorPdf';
import styles from './DashboardVistoria.module.css';

export default function DashboardVistoria() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getVistoria, atualizarVistoria, removerVistoria, exportarVistoria, carregando, responderItem } = useVistoria();

  if (carregando) {
    return <div style={{ padding: 20, textAlign: 'center' }}>Carregando dados da vistoria...</div>;
  }

  const vistoria = getVistoria(id);
  const [modalExcluirAberto, setModalExcluirAberto] = useState(false);
  const [modalGaleriaAberto, setModalGaleriaAberto] = useState(false);
  const [gerandoPlanilha, setGerandoPlanilha] = useState(false);
  const [gerandoPdf, setGerandoPdf] = useState(false);

  function handleExcluirFotoGaleria(itemId) {
    if (!window.confirm('Tem certeza que deseja remover a foto deste item? A ação não poderá ser desfeita.')) return;
    
    const respostaAtual = vistoria.respostas ? vistoria.respostas[itemId] : vistoria.dadosVistoria?.[itemId];
    if (respostaAtual) {
      responderItem(vistoria.id || id, itemId, { ...respostaAtual, foto: null });
    }
  }

  function handleConfirmarExclusao() {
    setModalExcluirAberto(false);
    removerVistoria(id);
    navigate('/');
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
    anoConstrucao: vistoria?.anoConstrucao || '',
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

  if (!vistoria) {
    if (carregando) {
      return (
        <div className="app-shell">
          <Topbar titulo="Carregando..." voltar="/" />
          <div className="tela-body" style={{ padding: '32px 20px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)' }}>Carregando dados da vistoria...</p>
          </div>
        </div>
      );
    }
    return (
      <div className="app-shell">
        <Topbar titulo="Vistoria não encontrada" voltar="/" />
        <div className="tela-body" style={{ padding: '32px 20px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)' }}>A vistoria solicitada não existe ou foi removida.</p>
          <button className="btn-nav primario" onClick={() => navigate('/')} style={{ marginTop: 20 }}>
            Voltar ao Painel
          </button>
        </div>
      </div>
    );
  }

  // Estatísticas de preenchimento e contagens
  const total = ITENS_TECNICOS.length;
  const respostas = vistoria.respostas || {};
  const respostasTecnicas = ITENS_TECNICOS.filter(item => respostas[item.id]?.valor);
  const respondidos = respostasTecnicas.length;
  const pendentes = Math.max(0, total - respondidos);
  const pct = total > 0 ? Math.round((respondidos / total) * 100) : 0;

  const indice = calcularIndiceItens(ITENS_TECNICOS, respostas);

  const primeiroPendente = ITENS_TECNICOS.find(item => !respostas[item.id]?.valor);
  const primeiroPendenteIdx = primeiroPendente ? TODOS_ITENS.findIndex(i => i.id === primeiroPendente.id) : -1;
  const temPendente = primeiroPendenteIdx !== -1;
  const ativa = Object.keys(respostas).length > 0;

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

  function handleContinuar() {
    if (temPendente) {
      navigate(`/checklist/${id}/item/${primeiroPendenteIdx + 1}`);
    } else {
      navigate(`/checklist/${id}/resultado`);
    }
  }

  return (
    <div className="app-shell">
      <Topbar titulo="Painel da Vistoria" voltar="/" />

      <div className="tela-body" style={{ padding: '24px 20px 48px' }}>
        <div className={styles.container}>
          {/* Cabeçalho da Vistoria */}
          <div className={styles.cabecalhoVistoria}>
            <div className={styles.cabecalhoConteudo}>
              <div className={styles.tituloLinha}>
                <h2 className={styles.titulo}>{vistoria.nome}</h2>
                <span className={`tag ${ativa ? (temPendente ? 'ativa' : 'salva') : 'salva'}`}>
                  {ativa ? (temPendente ? 'Em andamento' : 'Concluída') : 'Nova'}
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
            </div>
          </div>



          {/* Card de Métricas do Dashboard */}
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
                <span className={styles.miniCardNumero} style={{ color: 'var(--text-warning)' }}>{indice.na}</span>
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
                onClick={() => navigate(`/checklist/${id}/itens`)}
              >
                <IconListCheck size={18} />
                Seções
              </button>

              {ativa && (
                <button
                  type="button"
                  className={`btn-nav ${styles.btnAcaoSecundario}`}
                  onClick={() => navigate(`/checklist/${id}/resultado`)}
                >
                  <IconChartBar size={18} />
                  Índice
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

          {/* Card de Parâmetros e Ficha Completa da Instituição */}
          <section className={styles.cardParametros}>
            <div>
              <h3 className={styles.secaoTitulo}>Ficha da Instituição</h3>
              <p className={styles.secaoSubtitulo}>
                Atualize as informações cadastrais e estruturais da escola/edificação e a equipe técnica da vistoria.
              </p>
            </div>

            <form onSubmit={handleSalvar}>
              <div style={{ marginBottom: 16 }}>
                <label className="label-secao">Nome da escola / instituição *</label>
                <input
                  type="text"
                  placeholder="Ex: Universidade Federal do Cariri - UFCA"
                  value={form.nome}
                  onChange={e => setCampo('nome', e.target.value)}
                  required
                />
              </div>

              <div className="form-grid-2" style={{ marginBottom: 16 }}>
                <div className="col-span-2">
                  <label className="label-secao">Endereço completo</label>
                  <input
                    type="text"
                    placeholder="Ex: Av. Tenente Raimundo Rocha, 1639"
                    value={form.endereco}
                    onChange={e => setCampo('endereco', e.target.value)}
                  />
                </div>

                <div>
                  <label className="label-secao">Bairro</label>
                  <input
                    type="text"
                    placeholder="Ex: Cidade Universitária"
                    value={form.bairro}
                    onChange={e => setCampo('bairro', e.target.value)}
                  />
                </div>

                <div>
                  <label className="label-secao">Cidade / Município</label>
                  <input
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

              <div className="form-grid-3" style={{ marginBottom: 20 }}>
                <div>
                  <label className="label-secao">Número de alunos (aprox.)</label>
                  <input
                    type="number"
                    placeholder="Ex: 2500"
                    value={form.numAlunos}
                    onChange={e => setCampo('numAlunos', e.target.value)}
                  />
                </div>

                <div>
                  <label className="label-secao">Número de pavimentos</label>
                  <input
                    type="number"
                    placeholder="Ex: 3"
                    value={form.numPavimentos}
                    onChange={e => setCampo('numPavimentos', e.target.value)}
                  />
                </div>

                <div>
                  <label className="label-secao">Ano de construção</label>
                  <input
                    type="text"
                    placeholder="Ex: 2006"
                    value={form.anoConstrucao}
                    onChange={e => setCampo('anoConstrucao', e.target.value)}
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
                  <div className={styles.cardHorario}>
                    <label className={styles.cardHorarioTitulo}>Início da Vistoria</label>
                    <div className={styles.cardHorarioInputs}>
                      <div>
                        <label className="label-secao">Data</label>
                        <input
                          type="date"
                          value={form.data}
                          onChange={e => setCampo('data', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="label-secao">Horário</label>
                        <input
                          type="time"
                          value={form.horarioInicio}
                          onChange={e => setCampo('horarioInicio', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card: Término */}
                  <div className={styles.cardHorario}>
                    <label className={styles.cardHorarioTitulo}>Término da Vistoria</label>
                    <div className={styles.cardHorarioInputs}>
                      <div>
                        <label className="label-secao">Data</label>
                        <input
                          type="date"
                          value={form.dataTermino}
                          onChange={e => setCampo('dataTermino', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="label-secao">Horário</label>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <input
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
                  <label className="label-secao">Equipe de Avaliadores</label>
                  {form.avaliadores.map((avaliador, i) => (
                    <div key={i} className={styles.linhaAvaliador}>
                      <input
                        type="text"
                        placeholder={`Nome do avaliador ${i + 1}`}
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

          {/* Card de Exportação / Relatórios / Backup */}
          <section className={styles.cardExportacao}>
            <div>
              <h3 className={styles.secaoTitulo}>Exportar e Relatórios</h3>
              <p className={styles.secaoSubtitulo}>
                Baixe uma cópia de segurança ou visualize os relatórios desta vistoria.
              </p>
            </div>

            <div className={styles.gridExportacao}>
              <div
                className={styles.itemExportacaoAtivo}
                onClick={async () => {
                  try {
                    await exportarVistoria(vistoria.id);
                  } catch (err) {
                    console.error('Erro ao exportar:', err);
                  }
                }}
                role="button"
                tabIndex={0}
                title="Clique para baixar o backup desta vistoria"
              >
                <div className={styles.itemExportacaoHeader}>
                  <span className={styles.itemExportacaoTitulo}>
                    <IconDownload size={22} color="var(--accent, #3b82f6)" />
                    <span>Fazer Backup</span>
                  </span>
                </div>
                <p className={styles.itemExportacaoDesc}>
                  Baixa um arquivo com todas as respostas e dados preenchidos para não perder nada.
                </p>
              </div>

              <div 
                className={styles.itemExportacaoAtivo}
                onClick={async () => {
                  if (gerandoPdf) return;
                  setGerandoPdf(true);
                  try {
                    await gerarPdfVistoria(vistoria);
                  } catch (err) {
                    console.error('Erro ao gerar PDF:', err);
                    alert('Não foi possível gerar o relatório PDF.');
                  } finally {
                    setGerandoPdf(false);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className={styles.itemExportacaoHeader}>
                  <span className={styles.itemExportacaoTitulo}>
                    <IconFileTypePdf size={22} color="#ef4444" />
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
                onClick={async () => {
                  if (gerandoPlanilha) return;
                  setGerandoPlanilha(true);
                  try {
                    await gerarPlanilhaVistoria(vistoria);
                  } catch (err) {
                    console.error('Erro ao gerar planilha:', err);
                    alert('Não foi possível gerar a planilha.');
                  } finally {
                    setGerandoPlanilha(false);
                  }
                }}
                role="button"
                tabIndex={0}
                title="Clique para gerar a planilha executiva em Excel"
              >
                <div className={styles.itemExportacaoHeader}>
                  <span className={styles.itemExportacaoTitulo}>
                    <IconTable size={22} color="var(--text-success, #22c55e)" />
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

          {/* Zona de Perigo / Excluir Vistoria */}
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
        </div>
      </div>

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
