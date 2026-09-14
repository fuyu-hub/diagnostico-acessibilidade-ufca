import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  IconMapPin, IconCalendar, IconUserPlus, IconTrash,
  IconArrowRight, IconListCheck, IconFileTypePdf, IconTable,
  IconDeviceFloppy, IconCheck, IconChartBar, IconInfoCircle,
  IconBuilding, IconClock
} from '@tabler/icons-react';
import { useVistoria } from '../contexto/VistoriaContext';
import { TODOS_ITENS } from '../dados/checklist';
import { calcularIndiceItens, FAIXAS_INDICE } from '../dados/classificacao';
import Topbar from '../componentes/Topbar';
import styles from './DashboardVistoria.module.css';

export default function DashboardVistoria() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getVistoria, atualizarVistoria } = useVistoria();

  const vistoria = getVistoria(id);

  const [form, setForm] = useState({
    nome: vistoria?.nome || '',
    endereco: vistoria?.endereco || '',
    bairro: vistoria?.bairro || '',
    cidade: vistoria?.cidade || '',
    inep: vistoria?.inep || '',
    rede: vistoria?.rede || 'Municipal',
    nivelEnsino: vistoria?.nivelEnsino || 'Fundamental',
    numAlunos: vistoria?.numAlunos || '',
    numPavimentos: vistoria?.numPavimentos || '1',
    anoConstrucao: vistoria?.anoConstrucao || '',
    data: vistoria?.data || '',
    horarioInicio: vistoria?.horarioInicio || '',
    horarioTermino: vistoria?.horarioTermino || '',
    avaliadores: vistoria?.avaliadores?.length ? vistoria.avaliadores : [''],
  });

  const [salvoFeedback, setSalvoFeedback] = useState(false);

  if (!vistoria) {
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

  // Estatísticas e Índice em formato decimal x,x
  const total = TODOS_ITENS.length;
  const respostas = vistoria.respostas || {};
  const respondidos = Object.keys(respostas).length;
  const pendentes = Math.max(0, total - respondidos);
  const pct = total > 0 ? Math.round((respondidos / total) * 100) : 0;

  const indice = calcularIndiceItens(TODOS_ITENS, respostas);
  const { classificacao } = indice;

  const primeiroPendenteIdx = TODOS_ITENS.findIndex(item => !respostas[item.id]?.valor);
  const temPendente = primeiroPendenteIdx !== -1;
  const ativa = respondidos > 0;

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
            <div>
              <h2 className={styles.titulo}>{vistoria.nome}</h2>
              <p className={styles.subtitulo}>
                <IconMapPin size={16} /> {vistoria.bairro ? `${vistoria.bairro}, ` : ''}{vistoria.cidade || 'Local não informado'} ·
                <IconCalendar size={16} /> {vistoria.data ? vistoria.data.split('-').reverse().join('/') : 'Data não informada'}
                {vistoria.horarioInicio && (
                  <> · <IconClock size={16} /> {vistoria.horarioInicio}{vistoria.horarioTermino ? ` às ${vistoria.horarioTermino}` : ''}</>
                )}
              </p>
            </div>
            <span className={`tag ${ativa ? (temPendente ? 'ativa' : 'salva') : 'salva'}`} style={{ alignSelf: 'flex-start' }}>
              {ativa ? (temPendente ? 'Em andamento' : 'Concluída') : 'Nova'}
            </span>
          </div>

          {/* Card de Métricas do Dashboard com Índice Decimal */}
          <section className={styles.cardDashboard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <span className={styles.progressoLabel}>Índice de Avaliação de Acessibilidade (IAA)</span>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                  Baseado nas conformidades da norma ABNT NBR 9050
                </p>
              </div>

              {/* Destaque da Nota Decimal */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: classificacao.bg,
                border: `1.5px solid ${classificacao.borda}`,
                padding: '8px 16px',
                borderRadius: 14,
              }}>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Classificação
                  </span>
                  <strong style={{ color: classificacao.cor, fontSize: '0.92rem', letterSpacing: 0.5 }}>
                    {classificacao.rotulo}
                  </strong>
                </div>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: 800,
                  color: classificacao.cor,
                  lineHeight: 1,
                  fontFeatureSettings: '"tnum"',
                }}>
                  {classificacao.notaFormatada}
                </div>
              </div>
            </div>

            <div className={styles.progressoHeader}>
              <span className={styles.progressoLabel}>Preenchimento do Checklist</span>
              <span className={styles.progressoValor}>{pct}% ({respondidos}/{total} itens)</span>
            </div>

            <div className="progresso-track">
              <div className="progresso-fill" style={{ width: `${pct}%` }} />
            </div>

            <div className={styles.gridMetricas}>
              <div className={styles.miniCard}>
                <span className={styles.miniCardNumero} style={{ color: 'var(--accent)' }}>{respondidos}</span>
                <span className={styles.miniCardLabel}>Respondidos</span>
              </div>
              <div className={styles.miniCard}>
                <span className={styles.miniCardNumero} style={{ color: 'var(--text-muted)' }}>{pendentes}</span>
                <span className={styles.miniCardLabel}>Pendentes</span>
              </div>
              <div className={styles.miniCard}>
                <span className={styles.miniCardNumero} style={{ color: 'var(--text-success)' }}>{indice.conf}</span>
                <span className={styles.miniCardLabel}>Conformes</span>
              </div>
              <div className={styles.miniCard}>
                <span className={styles.miniCardNumero} style={{ color: 'var(--text-danger)' }}>{indice.nc}</span>
                <span className={styles.miniCardLabel}>Não Conf.</span>
              </div>
              <div className={styles.miniCard}>
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
            </div>
          </section>

          {/* Card de Parâmetros e Ficha Completa da Instituição */}
          <section className={styles.cardParametros}>
            <div>
              <h3 className={styles.secaoTitulo}>Ficha da Instituição e Parâmetros</h3>
              <p className={styles.secaoSubtitulo}>
                Atualize as informações cadastrais e estruturais da escola/edificação e a equipe técnica da vistoria.
              </p>
            </div>

            <form onSubmit={handleSalvar}>
              <div style={{ marginBottom: 16 }}>
                <label className="label-secao">Nome da escola / instituição *</label>
                <input
                  type="text"
                  placeholder="Ex: Escola Estadual Prof. Aníbal de Freitas"
                  value={form.nome}
                  onChange={e => setCampo('nome', e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 16 }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="label-secao">Endereço completo</label>
                  <input
                    type="text"
                    placeholder="Ex: Rua São Pedro, 1234"
                    value={form.endereco}
                    onChange={e => setCampo('endereco', e.target.value)}
                  />
                </div>

                <div>
                  <label className="label-secao">Bairro</label>
                  <input
                    type="text"
                    placeholder="Ex: Centro"
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

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 16 }}>
                <div>
                  <label className="label-secao">Código INEP</label>
                  <input
                    type="text"
                    placeholder="Ex: 23012345"
                    value={form.inep}
                    onChange={e => setCampo('inep', e.target.value)}
                  />
                </div>

                <div>
                  <label className="label-secao">Rede de Ensino</label>
                  <select
                    value={form.rede}
                    onChange={e => setCampo('rede', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      background: 'var(--surface-2)',
                      border: '1.5px solid var(--border)',
                      borderRadius: 12,
                      color: 'var(--text-primary)',
                      fontFamily: 'inherit',
                      fontSize: '0.95rem',
                      outline: 'none',
                    }}
                  >
                    <option value="Municipal">Municipal</option>
                    <option value="Estadual">Estadual</option>
                    <option value="Federal">Federal</option>
                    <option value="Privada">Privada</option>
                    <option value="Outra">Outra</option>
                  </select>
                </div>

                <div>
                  <label className="label-secao">Nível de Ensino</label>
                  <select
                    value={form.nivelEnsino}
                    onChange={e => setCampo('nivelEnsino', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      background: 'var(--surface-2)',
                      border: '1.5px solid var(--border)',
                      borderRadius: 12,
                      color: 'var(--text-primary)',
                      fontFamily: 'inherit',
                      fontSize: '0.95rem',
                      outline: 'none',
                    }}
                  >
                    <option value="Infantil">Educação Infantil</option>
                    <option value="Fundamental">Ensino Fundamental</option>
                    <option value="Médio">Ensino Médio</option>
                    <option value="Ambos">Ambos (Fundamental e Médio)</option>
                    <option value="Superior">Superior / Técnico</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
                <div>
                  <label className="label-secao">Número de alunos (aprox.)</label>
                  <input
                    type="number"
                    placeholder="Ex: 450"
                    value={form.numAlunos}
                    onChange={e => setCampo('numAlunos', e.target.value)}
                  />
                </div>

                <div>
                  <label className="label-secao">Número de pavimentos</label>
                  <input
                    type="number"
                    placeholder="Ex: 2"
                    value={form.numPavimentos}
                    onChange={e => setCampo('numPavimentos', e.target.value)}
                  />
                </div>

                <div>
                  <label className="label-secao">Ano de construção / reforma</label>
                  <input
                    type="text"
                    placeholder="Ex: 1998 / 2021"
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

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 16 }}>
                  <div>
                    <label className="label-secao">Data da vistoria</label>
                    <input
                      type="date"
                      value={form.data}
                      onChange={e => setCampo('data', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="label-secao">Horário de início</label>
                    <input
                      type="time"
                      value={form.horarioInicio}
                      onChange={e => setCampo('horarioInicio', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="label-secao">Horário de término</label>
                    <input
                      type="time"
                      value={form.horarioTermino}
                      onChange={e => setCampo('horarioTermino', e.target.value)}
                    />
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

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  type="submit"
                  className={`btn-nav primario ${styles.btnSalvarParametros}`}
                  disabled={!form.nome.trim()}
                >
                  <IconDeviceFloppy size={18} /> Salvar Ficha e Parâmetros
                </button>

                {salvoFeedback && (
                  <span style={{ color: 'var(--text-success)', fontSize: '0.88rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <IconCheck size={18} /> Ficha atualizada com sucesso!
                  </span>
                )}
              </div>
            </form>
          </section>

          {/* Card de Exportação (Desativado / Em breve) */}
          <section className={styles.cardExportacao}>
            <div>
              <h3 className={styles.secaoTitulo}>Exportação de Relatórios</h3>
              <p className={styles.secaoSubtitulo}>
                Gere documentos técnicos padronizados para compor laudos e processos de adequação de acessibilidade.
              </p>
            </div>

            <div className={styles.gridExportacao}>
              <div className={styles.itemExportacaoDesativado}>
                <div className={styles.itemExportacaoHeader}>
                  <span className={styles.itemExportacaoTitulo}>
                    <IconFileTypePdf size={22} color="var(--text-muted)" /> Relatório Técnico (PDF)
                  </span>
                  <span className={styles.badgeEmBreve}>Em breve</span>
                </div>
                <p className={styles.itemExportacaoDesc}>
                  Emissão de laudo diagnóstico consolidado em PDF, com fotografias anexadas, índices por setor e justificativas de não conformidade.
                </p>
              </div>

              <div className={styles.itemExportacaoDesativado}>
                <div className={styles.itemExportacaoHeader}>
                  <span className={styles.itemExportacaoTitulo}>
                    <IconTable size={22} color="var(--text-muted)" /> Planilha de Levantamento
                  </span>
                  <span className={styles.badgeEmBreve}>Em breve</span>
                </div>
                <p className={styles.itemExportacaoDesc}>
                  Exportação de dados tabulados em formato compatível com Excel e CSV para pesquisas, análises estatísticas e relatórios da extensão.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              <IconInfoCircle size={16} />
              <span>Os módulos de exportação automática em PDF e planilha estão em fase de homologação técnica.</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
