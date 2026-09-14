import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  IconMapPin, IconCalendar, IconUserPlus, IconTrash,
  IconArrowRight, IconListCheck, IconFileTypePdf, IconTable,
  IconDeviceFloppy, IconCheck, IconChartBar, IconInfoCircle
} from '@tabler/icons-react';
import { useVistoria } from '../contexto/VistoriaContext';
import { TODOS_ITENS } from '../dados/checklist';
import Topbar from '../componentes/Topbar';
import styles from './DashboardVistoria.module.css';

export default function DashboardVistoria() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getVistoria, atualizarVistoria } = useVistoria();

  const vistoria = getVistoria(id);

  const [form, setForm] = useState({
    nome: vistoria?.nome || '',
    cidade: vistoria?.cidade || '',
    data: vistoria?.data || '',
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

  // Estatísticas de preenchimento
  const total = TODOS_ITENS.length;
  const respostas = vistoria.respostas || {};
  const respondidos = Object.keys(respostas).length;
  const pendentes = Math.max(0, total - respondidos);
  const pct = total > 0 ? Math.round((respondidos / total) * 100) : 0;

  const valores = Object.values(respostas).map(r => r?.valor);
  const conformes = valores.filter(v => v === 'conforme' || v === 'sim').length;
  const naoConformes = valores.filter(v => v === 'nao-conforme' || v === 'nao').length;
  const naoAplica = valores.filter(v => v === 'nao-aplica').length;

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
      nome: form.nome.trim(),
      cidade: form.cidade.trim(),
      data: form.data,
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
                <IconMapPin size={16} /> {vistoria.cidade || 'Local não informado'} ·
                <IconCalendar size={16} /> {vistoria.data ? vistoria.data.split('-').reverse().join('/') : 'Data não informada'}
              </p>
            </div>
            <span className={`tag ${ativa ? (temPendente ? 'ativa' : 'salva') : 'salva'}`} style={{ alignSelf: 'flex-start' }}>
              {ativa ? (temPendente ? 'Em andamento' : 'Concluída') : 'Nova'}
            </span>
          </div>

          {/* Card de Métricas do Dashboard */}
          <section className={styles.cardDashboard}>
            <div className={styles.progressoHeader}>
              <span className={styles.progressoLabel}>Progresso do Diagnóstico</span>
              <span className={styles.progressoValor}>{pct}% ({respondidos}/{total})</span>
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
                <span className={styles.miniCardNumero} style={{ color: 'var(--text-success)' }}>{conformes}</span>
                <span className={styles.miniCardLabel}>Conformes</span>
              </div>
              <div className={styles.miniCard}>
                <span className={styles.miniCardNumero} style={{ color: 'var(--text-danger)' }}>{naoConformes}</span>
                <span className={styles.miniCardLabel}>Não Conf.</span>
              </div>
              <div className={styles.miniCard}>
                <span className={styles.miniCardNumero} style={{ color: 'var(--text-warning)' }}>{naoAplica}</span>
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

          {/* Card de Parâmetros e Configurações da Vistoria */}
          <section className={styles.cardParametros}>
            <div>
              <h3 className={styles.secaoTitulo}>Parâmetros da Vistoria</h3>
              <p className={styles.secaoSubtitulo}>
                Atualize as informações cadastrais do estabelecimento e os avaliadores responsáveis.
              </p>
            </div>

            <form onSubmit={handleSalvar}>
              <div style={{ marginBottom: 16 }}>
                <label className="label-secao">Nome do Estabelecimento *</label>
                <input
                  type="text"
                  placeholder="Ex: Escola Estadual Prof. Aníbal de Freitas"
                  value={form.nome}
                  onChange={e => setCampo('nome', e.target.value)}
                  required
                />
              </div>

              <div className={styles.gridCampos} style={{ marginBottom: 16 }}>
                <div>
                  <label className="label-secao">Cidade / Município</label>
                  <input
                    type="text"
                    placeholder="Ex: Juazeiro do Norte, CE"
                    value={form.cidade}
                    onChange={e => setCampo('cidade', e.target.value)}
                  />
                </div>

                <div>
                  <label className="label-secao">Data da Vistoria</label>
                  <input
                    type="date"
                    value={form.data}
                    onChange={e => setCampo('data', e.target.value)}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label className="label-secao">Avaliadores da Equipe</label>
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

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  type="submit"
                  className={`btn-nav primario ${styles.btnSalvarParametros}`}
                  disabled={!form.nome.trim()}
                >
                  <IconDeviceFloppy size={18} /> Salvar Parâmetros
                </button>

                {salvoFeedback && (
                  <span style={{ color: 'var(--text-success)', fontSize: '0.88rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <IconCheck size={18} /> Alterações salvas!
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
