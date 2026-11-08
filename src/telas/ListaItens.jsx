import { useParams, useSearchParams, useNavigationType } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  IconCheck, IconX, IconMinus, IconCircle, IconChevronRight,
  IconChevronDown, IconChevronUp, IconArrowRight, IconAlertCircle
} from '@tabler/icons-react';
import { useVistoria } from '../contexto/VistoriaContext';
import { TODOS_ITENS, SECOES, ITENS_POR_SECAO, ITENS_TECNICOS, numeroItem } from '../dados/checklist';
import { calcularIndiceItens } from '../dados/classificacao';
import Topbar from '../componentes/Topbar';
import { useNavegacao, lerEstadoLista, guardarEstadoLista } from '../utilitarios/navegacao';
import styles from './ListaItens.module.css';

const FILTROS = ['Todos', 'Pendentes', 'Não conforme'];

function obterTextoResposta(valor, automatico) {
  if (automatico) return 'Não se aplica por triagem';
  if (valor === 'conforme' || valor === 'sim') return 'Conforme';
  if (valor === 'nao-conforme' || valor === 'nao') return 'Não conforme';
  if (valor === 'nao-aplica') return 'Não se aplica';
  return 'Pendente';
}

function iconeResposta(valor) {
  if (valor === 'conforme' || valor === 'sim')     return <IconCheck size={22} color="var(--text-success)" />;
  if (valor === 'nao-conforme' || valor === 'nao') return <IconX size={22} color="var(--text-danger)" />;
  if (valor === 'nao-aplica')                     return <IconMinus size={22} color="var(--text-na, var(--text-muted))" />;
  return <IconCircle size={22} color="var(--border-strong)" />;
}

export default function ListaItens() {
  const { id } = useParams();
  const { navegar } = useNavegacao();
  const [searchParams] = useSearchParams();
  const tipoNavegacao = useNavigationType();
  const { getVistoria, carregando } = useVistoria();
  const vistoria = getVistoria(id);

  const secaoAberta = searchParams.get('secao') ? parseInt(searchParams.get('secao'), 10) : null;

  const [filtro, setFiltro] = useState('Todos');
  const [expandidos, setExpandidos] = useState({});

  const respostas = vistoria?.respostas || {};
  const respondidos = ITENS_TECNICOS.filter(i => respostas[i.id]?.valor).length;

  // Ao voltar, a seção reaparece como estava; ao entrar de novo, começa recolhida
  useEffect(() => {
    if (!secaoAberta) return;
    const salvo = tipoNavegacao === 'POP' ? lerEstadoLista(id, secaoAberta) : {};
    if (tipoNavegacao !== 'POP') guardarEstadoLista(id, secaoAberta, { filtro: 'Todos', expandidos: {}, ultimoItem: null });
    setFiltro(salvo.filtro || 'Todos');
    setExpandidos(salvo.expandidos || {});
    if (salvo.ultimoItem) {
      requestAnimationFrame(() => document.querySelector(`[data-item="${salvo.ultimoItem}"]`)?.scrollIntoView({ block: 'center' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, secaoAberta]);

  function abrirSecao(sId) {
    navegar(`/checklist/${id}/itens?secao=${sId}`);
  }

  function mudarExpandidos(novos) {
    setExpandidos(novos);
    guardarEstadoLista(id, secaoAberta, { expandidos: novos });
  }

  function recolherTodos() {
    mudarExpandidos({});
  }

  if (!vistoria) {
    if (carregando) {
      return (
        <div className="app-shell">
          <Topbar titulo="Carregando..." voltar="/" />
          <div className="tela-body" style={{ padding: '32px 20px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)' }}>Carregando itens da vistoria...</p>
          </div>
        </div>
      );
    }
    return (
      <div className="app-shell">
        <Topbar titulo="Vistoria não encontrada" voltar="/" />
        <main className="tela-body" style={{ padding: '48px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <IconAlertCircle size={56} color="var(--text-muted)" style={{ opacity: 0.6, marginBottom: 16 }} aria-hidden="true" />
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24, maxWidth: 360, lineHeight: 1.5 }}>
            A vistoria solicitada não foi encontrada ou foi removida deste aparelho.
          </p>
          <button type="button" className="btn-nav primario" style={{ maxWidth: 260 }} onClick={() => navegar('/')}>
            Voltar ao Início
          </button>
        </main>
      </div>
    );
  }

  function toggleSubgrupo(sg) {
    mudarExpandidos({ ...expandidos, [sg]: !expandidos[sg] });
  }

  const itensDaSecao = secaoAberta ? (ITENS_POR_SECAO[secaoAberta] || []) : [];

  function expandirTodos() {
    const exp = {};
    itensDaSecao.forEach(item => {
      if (item.subgrupo) exp[item.subgrupo] = true;
    });
    mudarExpandidos(exp);
  }

  function escolherFiltro(novo) {
    setFiltro(novo);
    guardarEstadoLista(id, secaoAberta, { filtro: novo });
    // Com filtro, o que interessa já aparece aberto
    if (novo !== 'Todos') expandirTodos();
  }

  const itensFiltrados = itensDaSecao.filter(item => {
    const resp = respostas[item.id]?.valor;
    if (filtro === 'Pendentes')     return !resp;
    if (filtro === 'Não conforme')  return resp === 'nao-conforme' && item.tipo === 'tecnico';
    return true;
  });

  // Agrupa por subgrupo
  const porSubgrupo = [];
  let sgAtual = null;
  for (const item of itensFiltrados) {
    if (item.subgrupo !== sgAtual) {
      sgAtual = item.subgrupo;
      porSubgrupo.push({ subgrupo: sgAtual, itens: [] });
    }
    porSubgrupo[porSubgrupo.length - 1].itens.push(item);
  }

  // Indice global do item em TODOS_ITENS (para navegacao)
  const idxGlobal = (item) => TODOS_ITENS.findIndex(i => i.id === item.id);

  // Primeiro pendente da seção aberta
  const primeiroPendenteSecao = itensDaSecao.find(item => !respostas[item.id]?.valor);
  const itensSecaoRespondidos = itensDaSecao.filter(i => respostas[i.id]?.valor).length;

  if (!secaoAberta) {
    return (
      <div className="app-shell">
        <Topbar titulo={`Seções — ${vistoria.nome}`} inicio />

        <main className="tela-body" style={{ padding: '0 0 32px' }}>
          <div style={{ padding: '20px 20px 0' }}>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: 20 }}>
              {respondidos} de {ITENS_TECNICOS.length} itens avaliados no total
            </p>

            <div className={styles.gridSecoes}>
              {SECOES.map(s => {
                const itensSecao = ITENS_POR_SECAO[s.id] || [];
                const itensSecaoTecnicos = itensSecao.filter(i => i.tipo === 'tecnico');
                const respondidosSecao = itensSecaoTecnicos.filter(i => respostas[i.id]?.valor).length;
                const pctSecao = itensSecaoTecnicos.length > 0 ? Math.round((respondidosSecao / itensSecaoTecnicos.length) * 100) : 0;
                const restaTecnico = itensSecaoTecnicos.some(item => !respostas[item.id]?.valor);
                const pendenteSecao = restaTecnico ? itensSecao.find(item => !respostas[item.id]?.valor) : null;
                const indiceSecao = calcularIndiceItens(itensSecaoTecnicos, respostas);
                const { classificacao } = indiceSecao;

                return (
                  <div
                    key={s.id}
                    className={styles.cardSecao}
                    onClick={() => abrirSecao(s.id)}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className={styles.cardSecaoTopo}>
                        <p className={styles.nomeSecao}>{s.nome}</p>

                        <span
                          className={styles.notaSecaoValor}
                          style={{
                            color: indiceSecao.total > 0 ? classificacao.cor : 'var(--text-muted)',
                            fontSize: indiceSecao.total > 0 ? undefined : '0.78rem',
                            fontWeight: indiceSecao.total > 0 ? undefined : 500,
                          }}
                          title={indiceSecao.total > 0 ? `Nota: ${classificacao.notaFormatada} (${classificacao.rotulo})` : 'Ainda sem itens avaliados'}
                        >
                          {indiceSecao.total > 0 ? classificacao.notaFormatada : 'Pendente'}
                        </span>
                      </div>

                      <p className={styles.progressoSecaoTxt}>
                        {respondidosSecao} de {itensSecaoTecnicos.length} respondidos ({pctSecao}%)
                      </p>

                      <div className="progresso-track" style={{ height: 4, marginTop: 10 }}>
                        <div className="progresso-fill" style={{ width: `${pctSecao}%` }} />
                      </div>

                      <div className={styles.cardSecaoRodape}>
                        {pendenteSecao ? (
                          <button
                            type="button"
                            className={styles.btnSecaoRapida}
                            onClick={(e) => {
                              e.stopPropagation();
                              navegar(`/checklist/${id}/item/${idxGlobal(pendenteSecao) + 1}`);
                            }}
                            aria-label={`${respondidosSecao > 0 ? 'Continuar' : 'Iniciar'} a seção ${s.nome}`}
                          >
                            {respondidosSecao > 0 ? 'Continuar' : 'Iniciar'}
                            <IconArrowRight size={14} />
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Seção concluída
                          </span>
                        )}
                        <button
                          type="button"
                          className={styles.verSubgruposLink}
                          aria-label={`Abrir a seção ${s.nome}. ${respondidosSecao} de ${itensSecaoTecnicos.length} respondidos.`}
                          onClick={e => { e.stopPropagation(); abrirSecao(s.id); }}
                        >
                          Ver subgrupos <IconChevronRight size={14} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    );
  }

  const secao = SECOES.find(s => s.id === secaoAberta) || SECOES[0];

  return (
    <div className="app-shell">
      <Topbar titulo={secao.nome} inicio />

      <main className={`tela-body ${styles.slideIn}`} style={{ padding: '0 0 32px' }}>

        {/* Card de Ação no Topo da Seção */}
        <div style={{ padding: '16px 20px 0' }}>
          {primeiroPendenteSecao ? (
            <div className={styles.cardAcaoTopo}>
              <div className={styles.cardAcaoTexto}>
                <div className={styles.cardAcaoTags}>
                  <span className={styles.tagProximo}>
                    {itensSecaoRespondidos > 0 ? 'Continuar de onde parou' : 'Iniciar Seção'}
                  </span>
                  <span className={styles.tagSubgrupoBadge}>
                    {primeiroPendenteSecao.subgrupo}
                  </span>
                </div>
                <p className={styles.proximoPergunta}>
                  <strong>
                    {primeiroPendenteSecao.tipo === 'triagem' ? 'Triagem:' : `Item ${numeroItem(primeiroPendenteSecao)}:`}
                  </strong> {primeiroPendenteSecao.pergunta}
                </p>
              </div>

              <button
                type="button"
                className={`btn-nav primario ${styles.btnContinuarSecao}`}
                onClick={() => navegar(`/checklist/${id}/item/${idxGlobal(primeiroPendenteSecao) + 1}`)}
              >
                {itensSecaoRespondidos > 0 ? 'Continuar' : 'Começar'}
                <IconArrowRight size={18} />
              </button>
            </div>
          ) : (
            <div className={styles.cardConcluidoTopo}>
              <div className={styles.concluidoEsquerda}>
                <div className={styles.iconeSucessoSecao}>
                  <IconCheck size={24} />
                </div>
                <div>
                  <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.98rem' }}>
                    Seção {secaoAberta} concluída!
                  </p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    Todos os {itensDaSecao.length} itens desta seção foram avaliados.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className={styles.btnProximaSecao}
                onClick={() => {
                  const proxSecao = SECOES.find(s => (ITENS_POR_SECAO[s.id] || []).some(i => !respostas[i.id]?.valor));
                  if (proxSecao) abrirSecao(proxSecao.id);
                  else navegar(`/checklist/${id}/resultado`);
                }}
              >
                Próxima Seção <IconArrowRight size={16} />
              </button>
            </div>
          )}

          {/* Chips de filtro e Toggle Expandir */}
          <div className={styles.chipsBarra}>
            <div className={styles.chips}>
              {FILTROS.map(f => (
                <button
                  key={f}
                  className={`chip ${filtro === f ? 'ativo' : ''}`}
                  aria-pressed={filtro === f}
                  onClick={() => escolherFiltro(f)}
                >
                  {f}
                </button>
              ))}
            </div>

            <button
              type="button"
              className={styles.btnToggleExpandidos}
              onClick={() => {
                const todosAbertos = porSubgrupo.every(sg => expandidos[sg.subgrupo]);
                if (todosAbertos) recolherTodos();
                else expandirTodos();
              }}
            >
              {porSubgrupo.every(sg => expandidos[sg.subgrupo]) ? 'Recolher todos' : 'Expandir todos'}
            </button>
          </div>
        </div>

        {/* Itens agrupados por subgrupo */}
        <div style={{ padding: '0 20px' }}>
          {porSubgrupo.length === 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', padding: '20px 0' }}>
              Nenhum item encontrado para este filtro.
            </p>
          )}

          {porSubgrupo.map(({ subgrupo, itens }) => {
            const isExpanded = expandidos[subgrupo];
            const itensPendentesNoSg = itens.filter(i => !respostas[i.id]?.valor).length;
            const todosRespondidosNoSg = itensPendentesNoSg === 0;

            return (
              <div key={subgrupo} style={{ marginBottom: 14 }}>
                {subgrupo && (
                  <button
                    type="button"
                    className={styles.subgrupoHeader}
                    onClick={() => toggleSubgrupo(subgrupo)}
                    aria-expanded={isExpanded}
                    aria-controls={`subgrupo-corpo-${encodeURIComponent(subgrupo)}`}
                    aria-label={`Subgrupo ${subgrupo}, ${itens.length} itens. ${filtro === 'Não conforme' ? 'Não conformes' : todosRespondidosNoSg ? 'Concluído' : `${itensPendentesNoSg} pendentes`}. ${isExpanded ? 'Toque para recolher' : 'Toque para expandir'}`}
                  >
                    <div className={styles.subgrupoHeaderEsquerda}>
                      <span className={styles.subgrupoLabel}>{subgrupo}</span>
                      <span className={styles.subgrupoContagem}>({itens.length})</span>
                    </div>

                    <div className={styles.subgrupoHeaderDireita}>
                      {filtro === 'Não conforme' ? (
                        <span className={`tag triagem ${styles.tagStatusSubgrupo}`}>
                          {itens.length} não {itens.length === 1 ? 'conforme' : 'conformes'}
                        </span>
                      ) : todosRespondidosNoSg ? (
                        <span className={`tag salva ${styles.tagStatusSubgrupo}`}>
                          <IconCheck size={13} color="var(--text-success)" /> Concluído
                        </span>
                      ) : (
                        <span className={`tag triagem ${styles.tagStatusSubgrupo}`}>
                          {itensPendentesNoSg} {itensPendentesNoSg === 1 ? 'pendente' : 'pendentes'}
                        </span>
                      )}
                      {isExpanded ? <IconChevronUp size={18} color="var(--text-muted)" /> : <IconChevronDown size={18} color="var(--text-muted)" />}
                    </div>
                  </button>
                )}
                {isExpanded && (
                  <div id={`subgrupo-corpo-${encodeURIComponent(subgrupo)}`}>
                    {itens.map(item => {
                      const resp = respostas[item.id]?.valor;
                      const idx = idxGlobal(item);
                      return (
                        <div
                          key={item.id}
                          data-item={item.id}
                          className={styles.listaLinhaResponsiva}
                          onClick={() => navegar(`/checklist/${id}/item/${idx + 1}`)}
                          role="button"
                          tabIndex={0}
                          aria-label={`${item.tipo === 'triagem' ? 'Triagem' : `Item ${numeroItem(item)}`}: ${item.pergunta}. Status: ${obterTextoResposta(resp, respostas[item.id]?.automatico)}`}
                          onKeyDown={e => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              navegar(`/checklist/${id}/item/${idx + 1}`);
                            }
                          }}
                        >
                          {iconeResposta(resp)}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: '0.92rem', fontWeight: 500, lineHeight: 1.4 }}>
                              {item.pergunta}
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: item.tipo === 'triagem' ? 600 : 400 }}>
                                {item.tipo === 'triagem' ? 'Triagem' : `Item ${numeroItem(item)}`}
                              </span>
                              {respostas[item.id]?.automatico && (
                                <span className={styles.badgeTriagemNA}>
                                  N/A por triagem
                                </span>
                              )}
                            </div>
                          </div>
                          <IconChevronRight size={18} color="var(--text-muted)" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
