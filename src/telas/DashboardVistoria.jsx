import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  IconMapPin, IconCalendar, IconUserPlus, IconTrash,
  IconArrowRight, IconListCheck, IconDeviceFloppy, IconCheck, IconChartBar,
  IconClock, IconPhoto, IconChevronRight, IconAlertTriangle,
} from '@tabler/icons-react';
import { useVistoria } from '../contexto/VistoriaContext';
import { useNotificacao } from '../contexto/NotificacaoContext';
import { TODOS_ITENS, ITENS_TECNICOS, SECOES, ITENS_POR_SECAO } from '../dados/checklist';
import { calcularIndiceItens } from '../dados/classificacao';
import Topbar from '../componentes/Topbar';
import SeletorNivel, { OPCOES_REDE, OPCOES_NIVEL_ENSINO } from '../componentes/SeletorNivel';
import ModalExcluirVistoria from '../componentes/ModalExcluirVistoria';
import ModalGaleriaVistoria from '../componentes/ModalGaleriaVistoria';
import AnelNota, { SeloClassificacao } from '../componentes/AnelNota';
import AcoesRelatorio from '../componentes/AcoesRelatorio';
import styles from './DashboardVistoria.module.css';
import { listarFotos, camposFotos } from '../dados/fotos.js';

const ABAS = [
  { id: 'resumo', rotulo: 'Resumo' },
  { id: 'ficha', rotulo: 'Ficha' },
  { id: 'relatorios', rotulo: 'Relatórios' },
];

export default function DashboardVistoria() {
  const { id } = useParams();
  const navigate = useNavigate();
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
          <button className="btn-nav primario" onClick={() => navigate('/')} style={{ marginTop: 20 }}>
            Voltar ao Painel
          </button>
        </div>
      </div>
    );
  }

  // Montado só com a vistoria já carregada: a ficha inicializa com os dados dela
  return <ConteudoVistoria key={id} id={id} vistoria={vistoria} />;
}

function ConteudoVistoria({ id, vistoria }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { atualizarVistoria, removerVistoria, exportarVistoria, responderItem } = useVistoria();
  const { mostrarToast, mostrarConfirmacao } = useNotificacao();

  const aba = ABAS.some(a => a.id === searchParams.get('aba')) ? searchParams.get('aba') : 'resumo';
  const [modalExcluirAberto, setModalExcluirAberto] = useState(false);
  const [modalGaleriaAberto, setModalGaleriaAberto] = useState(false);

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

  // Estatísticas de preenchimento e contagens
  const total = ITENS_TECNICOS.length;
  const respostas = vistoria.respostas || {};
  const respondidos = ITENS_TECNICOS.filter(item => respostas[item.id]?.valor).length;
  const pendentes = Math.max(0, total - respondidos);
  const pct = total > 0 ? Math.round((respondidos / total) * 100) : 0;
  const parcial = pendentes > 0;

  const indice = calcularIndiceItens(ITENS_TECNICOS, respostas);
  const temNota = indice.total > 0;

  const primeiroPendente = ITENS_TECNICOS.find(item => !respostas[item.id]?.valor);
  const primeiroPendenteIdx = primeiroPendente ? TODOS_ITENS.findIndex(i => i.id === primeiroPendente.id) : -1;
  const temPendente = primeiroPendenteIdx !== -1;
  const ativa = Object.keys(respostas).length > 0;

  const registros = ITENS_TECNICOS.filter(i => listarFotos(respostas[i.id]).length || (respostas[i.id]?.obs || '').trim()).length;

  // Seções com nota, da pior para a melhor (as 3 que mais precisam de atenção)
  const secoesCriticas = SECOES
    .map(s => ({ s, ind: calcularIndiceItens((ITENS_POR_SECAO[s.id] || []).filter(i => i.tipo === 'tecnico'), respostas) }))
    .filter(x => x.ind.total > 0)
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

  function handleContinuar() {
    if (temPendente) {
      navigate(`/checklist/${id}/item/${primeiroPendenteIdx + 1}`);
    } else {
      navigate(`/checklist/${id}/resultado`);
    }
  }

  function registrarTermino() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setCampo('horarioTermino', hm);
    setCampo('dataTermino', `${yyyy}-${mm}-${dd}`);
  }

  // ---------- Abas ----------
  const resumo = (
    <>
      <section className={styles.cardDashboard} aria-labelledby="titulo-nota">
        <h3 id="titulo-nota" className="sr-only">Nota e progresso</h3>
        <div className={styles.resumoNota}>
          <AnelNota nota={temNota ? indice.nota : null} classificacao={indice.classificacao} parcial={parcial} />
          <div className={styles.resumoNotaTexto}>
            <SeloClassificacao classificacao={indice.classificacao} parcial={parcial} />
            <p className={styles.secaoSubtitulo}>
              {!ativa
                ? 'A nota aparece quando os primeiros itens forem respondidos.'
                : parcial
                  ? `Prévia com ${respondidos} de ${total} itens. A classificação oficial sai ao concluir.`
                  : 'Todos os itens foram avaliados.'}
            </p>
          </div>
        </div>

        <div>
          <div className={styles.progressoHeader}>
            <span className={styles.progressoLabel}>Progresso do checklist</span>
            <span className={styles.progressoValor}>{pct}% ({respondidos}/{total})</span>
          </div>
          <div
            className="progresso-track"
            style={{ marginTop: 10 }}
            role="progressbar"
            aria-label="Progresso do checklist"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="progresso-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className={styles.gridMetricas}>
          <div className={`${styles.miniCard} ${styles.miniCardResultado}`}>
            <span className={styles.miniCardNumero} style={{ color: 'var(--text-success)' }}>{indice.conf}</span>
            <span className={styles.miniCardLabel}>Conformes</span>
          </div>
          <div className={`${styles.miniCard} ${styles.miniCardResultado}`}>
            <span className={styles.miniCardNumero} style={{ color: 'var(--text-danger)' }}>{indice.nc}</span>
            <span className={styles.miniCardLabel}>Não conf.</span>
          </div>
          <div className={`${styles.miniCard} ${styles.miniCardResultado}`}>
            <span className={styles.miniCardNumero} style={{ color: 'var(--text-na, var(--text-muted))' }}>{indice.na}</span>
            <span className={styles.miniCardLabel}>N/A</span>
          </div>
          <div className={`${styles.miniCard} ${styles.miniCardProgresso}`}>
            <span className={styles.miniCardNumero}>{pendentes}</span>
            <span className={styles.miniCardLabel}>Pendentes</span>
          </div>
        </div>

        <button type="button" className={`btn-nav primario ${styles.btnAcaoPrimario}`} onClick={handleContinuar}>
          {!ativa ? 'Iniciar checklist' : temPendente ? 'Continuar checklist' : 'Ver resultado'}
          <IconArrowRight size={18} aria-hidden="true" />
        </button>
      </section>

      <nav className={styles.atalhos} aria-label="Atalhos da vistoria">
        <button type="button" className={styles.atalho} onClick={() => navigate(`/checklist/${id}/itens`)}>
          <span className={styles.atalhoIcone} aria-hidden="true"><IconListCheck size={24} /></span>
          <span className={styles.atalhoTextos}><strong>Seções e itens</strong><span>12 seções · pendentes e respostas</span></span>
          <IconChevronRight size={20} aria-hidden="true" />
        </button>
        <button type="button" className={styles.atalho} onClick={() => navigate(`/checklist/${id}/resultado`)}>
          <span className={styles.atalhoIcone} aria-hidden="true"><IconChartBar size={24} /></span>
          <span className={styles.atalhoTextos}><strong>Resultado{parcial ? ' (prévia)' : ''}</strong><span>Nota por seção e o que corrigir</span></span>
          <IconChevronRight size={20} aria-hidden="true" />
        </button>
        <button type="button" className={styles.atalho} onClick={() => setModalGaleriaAberto(true)}>
          <span className={styles.atalhoIcone} aria-hidden="true"><IconPhoto size={24} /></span>
          <span className={styles.atalhoTextos}><strong>Galeria</strong><span>{registros} {registros === 1 ? 'item com foto ou observação' : 'itens com foto ou observação'}</span></span>
          <IconChevronRight size={20} aria-hidden="true" />
        </button>
      </nav>

      {secoesCriticas.length > 0 && (
        <section className={styles.cardDashboard} aria-labelledby="titulo-criticas">
          <h3 id="titulo-criticas" className={styles.secaoTitulo}>Seções que mais precisam de atenção</h3>
          <ul className={styles.listaCriticas}>
            {secoesCriticas.map(({ s, ind }) => (
              <li key={s.id}>
                <button type="button" className={styles.linhaCritica} onClick={() => navigate(`/checklist/${id}/itens?secao=${s.id}`)}>
                  <span className={styles.criticaNome}>{s.nome}</span>
                  <strong style={{ color: ind.classificacao.corNota || ind.classificacao.cor }}>{ind.classificacao.notaFormatada}</strong>
                  <span className={styles.barraNota} aria-hidden="true">
                    <span style={{ width: `${ind.nota * 10}%`, background: ind.classificacao.cor }} />
                  </span>
                  <span className={styles.criticaRotulo}>{ind.classificacao.rotulo.toLowerCase()}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );

  const campo = (idCampo, rotulo, props) => (
    <div>
      <label className="label-secao" htmlFor={`ficha-${idCampo}`}>{rotulo}</label>
      <input id={`ficha-${idCampo}`} {...props} />
    </div>
  );

  const ficha = (
    <>
      <section className={styles.cardParametros}>
        <div>
          <h3 className={styles.secaoTitulo}>Ficha da Instituição</h3>
          <p className={styles.secaoSubtitulo}>
            Atualize as informações cadastrais e estruturais da escola/edificação e a equipe técnica da vistoria.
          </p>
        </div>

        <form onSubmit={handleSalvar}>
          <div style={{ marginBottom: 16 }}>
            {campo('nome', 'Nome da escola / instituição *', {
              type: 'text', value: form.nome, required: true, autoComplete: 'organization',
              onChange: e => setCampo('nome', e.target.value),
            })}
          </div>

          <div className="form-grid-2" style={{ marginBottom: 16 }}>
            <div className="col-span-2">
              {campo('endereco', 'Endereço completo', {
                type: 'text', value: form.endereco, autoComplete: 'street-address',
                onChange: e => setCampo('endereco', e.target.value),
              })}
            </div>
            {campo('bairro', 'Bairro', { type: 'text', value: form.bairro, onChange: e => setCampo('bairro', e.target.value) })}
            {campo('cidade', 'Cidade / Município', { type: 'text', value: form.cidade, onChange: e => setCampo('cidade', e.target.value) })}
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
            {campo('alunos', 'Número de alunos (aprox.)', { type: 'number', inputMode: 'numeric', value: form.numAlunos, onChange: e => setCampo('numAlunos', e.target.value) })}
            {campo('pavimentos', 'Número de pavimentos', { type: 'number', inputMode: 'numeric', value: form.numPavimentos, onChange: e => setCampo('numPavimentos', e.target.value) })}
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 18, marginBottom: 20 }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 14, color: 'var(--text-primary)' }}>
              Horários e Equipe da Vistoria
            </h4>

            <div className={styles.gridHorarios}>
              <fieldset className={styles.cardHorario}>
                <legend className={styles.cardHorarioTitulo}>Início da Vistoria</legend>
                <div className={styles.cardHorarioInputs}>
                  {campo('data', 'Data', { type: 'date', value: form.data, onChange: e => setCampo('data', e.target.value) })}
                  {campo('horario-inicio', 'Horário', { type: 'time', value: form.horarioInicio, onChange: e => setCampo('horarioInicio', e.target.value) })}
                </div>
              </fieldset>

              <fieldset className={styles.cardHorario}>
                <legend className={styles.cardHorarioTitulo}>Término da Vistoria</legend>
                <div className={styles.cardHorarioInputs}>
                  {campo('data-termino', 'Data', { type: 'date', value: form.dataTermino, onChange: e => setCampo('dataTermino', e.target.value) })}
                  <div>
                    <label className="label-secao" htmlFor="ficha-horario-termino">Horário</label>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        id="ficha-horario-termino"
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
                          onClick={registrarTermino}
                        >
                          Registrar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </fieldset>
            </div>

            <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
              <legend className="label-secao">Equipe de Avaliadores</legend>
              {form.avaliadores.map((avaliador, i) => (
                <div key={i} className={styles.linhaAvaliador}>
                  <label className="sr-only" htmlFor={`ficha-avaliador-${i}`}>Avaliador {i + 1}</label>
                  <input
                    id={`ficha-avaliador-${i}`}
                    type="text"
                    placeholder={`Nome do avaliador ${i + 1}`}
                    value={avaliador}
                    autoComplete="name"
                    onChange={e => setAvaliador(i, e.target.value)}
                    style={{ flex: 1 }}
                  />
                  {form.avaliadores.length > 1 && (
                    <button
                      type="button"
                      className={styles.btnExcluirAvaliador}
                      onClick={() => removerAvaliador(i)}
                      aria-label={`Excluir avaliador ${i + 1}`}
                      title="Excluir avaliador"
                    >
                      <IconTrash size={18} />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" className={styles.btnAdicionarAvaliador} onClick={adicionarAvaliador}>
                <IconUserPlus size={18} aria-hidden="true" /> Adicionar outro avaliador
              </button>
            </fieldset>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
            <button type="submit" className={`btn-nav primario ${styles.btnSalvarParametros}`} disabled={!form.nome.trim()}>
              <IconDeviceFloppy size={18} aria-hidden="true" /> Salvar Dados Cadastrais
            </button>
            <span role="status" style={{ color: 'var(--text-success)', fontSize: '0.88rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6, paddingLeft: 4 }}>
              {salvoFeedback && <><IconCheck size={18} aria-hidden="true" /> Dados atualizados com sucesso!</>}
            </span>
          </div>
        </form>
      </section>

      <section className={styles.cardZonaPerigo}>
        <div className={styles.perigoConteudo}>
          <div className={styles.perigoInfo}>
            <h3 className={styles.perigoTitulo}>Excluir esta vistoria</h3>
            <p className={styles.perigoDesc}>
              Esta ação removerá permanentemente todos os dados da instituição, respostas e fotos deste diagnóstico.
            </p>
          </div>
          <button type="button" className={styles.btnExcluirVistoria} onClick={() => setModalExcluirAberto(true)} aria-label="Excluir vistoria">
            <IconTrash size={20} aria-hidden="true" />
            <span className={styles.btnExcluirTexto}>Excluir Vistoria</span>
          </button>
        </div>
      </section>
    </>
  );

  const relatorios = (
    <section className={styles.cardExportacao}>
      <div>
        <h3 className={styles.secaoTitulo}>Exportar e Relatórios</h3>
        <p className={styles.secaoSubtitulo}>Baixe os relatórios ou uma cópia de segurança desta vistoria.</p>
      </div>
      {parcial && ativa && (
        <p className={styles.avisoParcial} role="note">
          <IconAlertTriangle size={20} aria-hidden="true" />
          <span>Faltam <strong>{pendentes} itens</strong>. Os relatórios sairão marcados como resultado parcial.</span>
        </p>
      )}
      <AcoesRelatorio vistoria={vistoria} />
    </section>
  );

  return (
    <div className="app-shell">
      <Topbar titulo="Painel da Vistoria" voltar="/" />

      <main className="tela-body" style={{ padding: '24px 20px 48px' }}>
        <div className={styles.container}>
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
                  <IconMapPin size={15} aria-hidden="true" />
                  <span>{vistoria.bairro ? `${vistoria.bairro}, ` : ''}{vistoria.cidade || 'Local não informado'}</span>
                </span>
                <span className={styles.metaItem}>
                  <IconCalendar size={15} aria-hidden="true" />
                  <span>{vistoria.data ? vistoria.data.split('-').reverse().join('/') : 'Data não informada'}</span>
                </span>
                {vistoria.horarioInicio && (
                  <span className={styles.metaItem}>
                    <IconClock size={15} aria-hidden="true" />
                    <span>{vistoria.horarioInicio}{vistoria.horarioTermino ? ` às ${vistoria.horarioTermino}` : ''}</span>
                  </span>
                )}
              </div>
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
            {aba === 'resumo' ? resumo : aba === 'ficha' ? ficha : relatorios}
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
