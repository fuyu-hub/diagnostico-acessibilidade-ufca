import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  IconRefresh, IconDashboard, IconAlertTriangle, IconAlertCircle,
  IconArrowRight, IconCircleCheck, IconCamera,
} from '@tabler/icons-react';
import { useVistoria } from '../contexto/VistoriaContext';
import { SECOES, ITENS_POR_SECAO, ITENS_TECNICOS, TODOS_ITENS } from '../dados/checklist';
import { listarFotos, ehFotoExibivel } from '../dados/fotos.js';
import AnelNota, { SeloClassificacao } from '../componentes/AnelNota';
import AcoesRelatorio from '../componentes/AcoesRelatorio';
import { calcularIndiceItens, FAIXAS_INDICE } from '../dados/classificacao';
import Topbar from '../componentes/Topbar';
import styles from './Resultado.module.css';

export default function Resultado() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getVistoria, atualizarVistoria, carregando } = useVistoria();
  const vistoria = getVistoria(id);

  const respostas = vistoria?.respostas || {};

  // Índice Geral consolidado
  const indiceGeral = calcularIndiceItens(ITENS_TECNICOS, respostas);
  const { classificacao: classGeral } = indiceGeral;

  // Índices por seção
  const indicesPorSecao = SECOES.map(s => {
    const itensSecao = (ITENS_POR_SECAO[s.id] || []).filter(i => i.tipo === 'tecnico');
    const ind = calcularIndiceItens(itensSecao, respostas);
    return {
      ...s,
      ...ind,
    };
  });

  const totalContaveis = ITENS_TECNICOS.length;
  const respondidosCount = ITENS_TECNICOS.filter(i => respostas[i.id]?.valor).length;
  const ehParcial = respondidosCount < totalContaveis;

  // Persiste snapshot auditável para defensabilidade metodológica acadêmica (§2.2 e §7.3)
  useEffect(() => {
    if (!vistoria) return;
    const snapCalculado = {
      calculadoEm: new Date().toISOString(),
      versaoClassificacao: '1.0',
      parcial: ehParcial,
      percentualConformidade: indiceGeral.pct || 0,
      itensRespondidos: respondidosCount,
      itensAplicaveis: totalContaveis,
      nota: indiceGeral.nota,
      rotulo: classGeral.rotulo,
    };

    const snapAnterior = vistoria.resultadoSnapshot;
    if (
      !snapAnterior ||
      snapAnterior.parcial !== ehParcial ||
      snapAnterior.itensRespondidos !== respondidosCount ||
      snapAnterior.percentualConformidade !== (indiceGeral.pct || 0)
    ) {
      atualizarVistoria(id, { resultadoSnapshot: snapCalculado });
    }
  }, [id, vistoria, ehParcial, respondidosCount, totalContaveis, indiceGeral.pct, indiceGeral.nota, classGeral.rotulo, atualizarVistoria]);

  if (!vistoria) {
    if (carregando) {
      return (
        <div className="app-shell">
          <Topbar titulo="Carregando..." voltar="/" />
          <div className="tela-body" style={{ padding: '32px 20px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)' }}>Calculando resultados...</p>
          </div>
        </div>
      );
    }
    return (
      <div className="app-shell">
        <Topbar titulo="Vistoria não encontrada" voltar="/" />
        <div className="tela-body" style={{ padding: '48px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <IconAlertCircle size={56} color="var(--text-muted)" style={{ opacity: 0.6, marginBottom: 16 }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 8, color: 'var(--text-strong)' }}>
            Vistoria não encontrada
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24, maxWidth: 360, lineHeight: 1.5 }}>
            A vistoria solicitada não foi encontrada ou foi removida deste dispositivo.
          </p>
          <button
            type="button"
            className="btn-nav primario"
            style={{ maxWidth: 260 }}
            onClick={() => navigate('/')}
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  // Seções com nota, da pior para a melhor; as sem respostas vão para o fim
  const secoesComNota = indicesPorSecao.filter(s => s.total > 0).sort((a, b) => a.nota - b.nota);
  const secoesSemNota = indicesPorSecao.filter(s => s.total === 0);
  const ncs = ITENS_TECNICOS.filter(i => respostas[i.id]?.valor === 'nao-conforme');
  const ncSemFoto = ncs.filter(i => listarFotos(respostas[i.id]).length === 0).length;
  const ncSemObs = ncs.filter(i => !(respostas[i.id]?.obs || '').trim()).length;
  const proximoPendente = TODOS_ITENS.find(i => !respostas[i.id]?.valor);
  const posicao = item => TODOS_ITENS.indexOf(item) + 1;
  const faixaAtual = FAIXAS_INDICE.find(f => f.rotulo === classGeral.rotulo);
  const pendentesTotal = totalContaveis - respondidosCount;

  return (
    <div className="app-shell">
      <Topbar eyebrow={vistoria.nome} titulo={ehParcial ? 'Resultado (prévia)' : 'Resultado do Diagnóstico'} voltar={`/vistoria/${id}`} />

      <main className="tela-body" style={{ padding: '24px 20px 48px' }}>
        <div className={styles.container}>
          <section className={styles.cardNotaGeral} aria-labelledby="titulo-iaa">
            <h2 id="titulo-iaa" className={styles.tituloIaa}>Índice de Avaliação de Acessibilidade</h2>
            <p className={styles.subtitulo}>
              {vistoria.bairro ? `${vistoria.bairro}, ` : ''}{vistoria.cidade || 'Local não informado'} · {vistoria.data ? vistoria.data.split('-').reverse().join('/') : 'Data não informada'}
            </p>
            <AnelNota nota={indiceGeral.total > 0 ? indiceGeral.nota : null} classificacao={classGeral} parcial={ehParcial} grande />
            <SeloClassificacao classificacao={classGeral} parcial={ehParcial} />
            {faixaAtual && <p className={styles.descricaoFaixa}>{faixaAtual.descricao}.</p>}

            <div className={styles.gridContagem} role="group" aria-label="Resumo de conformidade dos itens">
              <div className={styles.statCardResumo}>
                <div className={styles.statValResumo} style={{ color: 'var(--text-success)' }}>{indiceGeral.conf}</div>
                <div className={styles.statLblResumo}>Conformes</div>
              </div>
              <div className={styles.statCardResumo}>
                <div className={styles.statValResumo} style={{ color: 'var(--text-danger)' }}>{indiceGeral.nc}</div>
                <div className={styles.statLblResumo}>Não conf.</div>
              </div>
              <div className={styles.statCardResumo}>
                <div className={styles.statValResumo} style={{ color: 'var(--text-na, var(--text-muted))' }}>{indiceGeral.na}</div>
                <div className={styles.statLblResumo}>N/A</div>
              </div>
              <div className={styles.statCardResumo}>
                <div className={styles.statValResumo}>{pendentesTotal}</div>
                <div className={styles.statLblResumo}>Pendentes</div>
              </div>
            </div>
          </section>

          {ehParcial ? (
            <section className={`${styles.cardRevisao} ${styles.cardRevisaoAviso}`} aria-labelledby="titulo-revisao">
              <h2 id="titulo-revisao" className={styles.tituloCard}>
                <IconAlertTriangle size={20} aria-hidden="true" /> Antes de concluir
              </h2>
              <p className={styles.textoCard}>
                Este índice é uma prévia com {respondidosCount} de {totalContaveis} itens. A classificação definitiva sai quando todos forem respondidos.
              </p>
              <ul className={styles.checagem}>
                <li><strong>{pendentesTotal}</strong> {pendentesTotal === 1 ? 'item ainda sem resposta' : 'itens ainda sem resposta'}</li>
                <li><strong>{ncSemFoto}</strong> {ncSemFoto === 1 ? 'não conformidade sem foto' : 'não conformidades sem foto'}</li>
                <li><strong>{ncSemObs}</strong> {ncSemObs === 1 ? 'não conformidade sem observação' : 'não conformidades sem observação'}</li>
              </ul>
              {proximoPendente && (
                <button type="button" className="btn-nav primario" onClick={() => navigate(`/checklist/${id}/item/${posicao(proximoPendente)}`)}>
                  Ir ao próximo pendente <IconArrowRight size={18} aria-hidden="true" />
                </button>
              )}
            </section>
          ) : (
            <section className={styles.cardRevisao} aria-labelledby="titulo-completa">
              <h2 id="titulo-completa" className={styles.tituloCard}>
                <IconCircleCheck size={20} aria-hidden="true" /> Vistoria completa
              </h2>
              <p className={styles.textoCard}>
                {ncSemFoto ? `${ncSemFoto} ${ncSemFoto === 1 ? 'não conformidade está' : 'não conformidades estão'} sem foto.` : 'Todas as não conformidades têm foto.'}
              </p>
            </section>
          )}

          <section className={styles.cardRevisao} aria-labelledby="titulo-relatorios">
            <h2 id="titulo-relatorios" className={styles.tituloCard}>Relatórios</h2>
            {ehParcial && <p className={styles.textoCard}>Sairão marcados como resultado parcial.</p>}
            <AcoesRelatorio vistoria={vistoria} variante="botoes" />
          </section>

          <section aria-labelledby="titulo-secoes-resultado">
            <h2 id="titulo-secoes-resultado" className="label-secao" style={{ marginBottom: 12 }}>
              Seções, da pior para a melhor
            </h2>
            <div className={styles.listaSecoes}>
              {secoesComNota.map(s => {
                const ncsSecao = (ITENS_POR_SECAO[s.id] || []).filter(i => i.tipo === 'tecnico' && respostas[i.id]?.valor === 'nao-conforme');
                return (
                  <details key={s.id} className={styles.secaoResultado}>
                    <summary>
                      <span className={styles.secaoNome}>{s.nome}</span>
                      <strong className={styles.secaoNota} style={{ color: s.classificacao.corNota || s.classificacao.cor }}>{s.classificacao.notaFormatada}</strong>
                      <span className={styles.barraNota} aria-hidden="true">
                        <span style={{ width: `${s.nota * 10}%`, background: s.classificacao.cor }} />
                      </span>
                      <span className={styles.secaoRotulo}>
                        {s.classificacao.rotulo.toLowerCase()} · {s.nc} {s.nc === 1 ? 'não conformidade' : 'não conformidades'}
                        {ncsSecao.length > 0 && <span className={styles.verMais}> · ver o que corrigir</span>}
                      </span>
                    </summary>
                    {ncsSecao.length > 0 ? (
                      <ul className={styles.listaNc}>
                        {ncsSecao.map(item => {
                          const r = respostas[item.id];
                          const fotos = listarFotos(r).filter(ehFotoExibivel);
                          return (
                            <li key={item.id} className={styles.itemNc}>
                              <span className={styles.miniatura} aria-hidden="true">
                                {fotos[0] ? <img src={fotos[0]} alt="" /> : <IconCamera size={20} />}
                              </span>
                              <div>
                                <button type="button" className={styles.linkItem} onClick={() => navigate(`/checklist/${id}/item/${posicao(item)}`)}>
                                  Item {ITENS_TECNICOS.indexOf(item) + 1}: {item.pergunta}
                                </button>
                                <p className={styles.obsNc}>
                                  {r?.obs ? r.obs : 'Sem observação'} · {fotos.length === 0 ? 'sem foto' : fotos.length === 1 ? '1 foto' : `${fotos.length} fotos`}
                                </p>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className={styles.semNc}>Nenhuma não conformidade nesta seção.</p>
                    )}
                  </details>
                );
              })}
              {secoesSemNota.map(s => (
                <div key={s.id} className={styles.secaoSemNota}>
                  <span>{s.nome}</span>
                  <span>Sem respostas</span>
                </div>
              ))}
            </div>
          </section>

          <details className={styles.secaoResultado}>
            <summary><span className={styles.secaoNome}>Como interpretar o índice</span></summary>
            <div className={styles.interpretacao}>
              <p className={styles.textoCard}>
                Nota = conformes ÷ (conformes + não conformes) × 10. Itens "Não se aplica" e pendentes ficam fora do cálculo.
              </p>
              <table className={styles.tabelaFaixas}>
                <caption className="sr-only">Faixas do Índice de Avaliação de Acessibilidade</caption>
                <thead>
                  <tr><th scope="col">Nota</th><th scope="col">Classificação</th><th scope="col">Significado</th></tr>
                </thead>
                <tbody>
                  {FAIXAS_INDICE.map(faixa => {
                    const atual = faixa.rotulo === classGeral.rotulo;
                    return (
                      <tr key={faixa.rotulo} aria-current={atual ? 'true' : undefined} style={{ background: atual ? faixa.bg : undefined }}>
                        <td>{faixa.faixaTexto}</td>
                        <td>
                          <span className={styles.tabelaDot} style={{ background: faixa.dot || faixa.cor }} aria-hidden="true" />
                          {faixa.rotulo}{atual && <span className="sr-only"> (faixa desta vistoria)</span>}
                        </td>
                        <td>{faixa.descricao}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </details>

          <div className={styles.botoesWrap}>
            <button className="btn-nav" onClick={() => navigate(`/vistoria/${id}`)}>
              <IconDashboard size={18} aria-hidden="true" /> Painel da vistoria
            </button>
            <button className="btn-nav" onClick={() => navigate(`/checklist/${id}/itens`)}>
              <IconRefresh size={18} aria-hidden="true" /> Revisar seções e itens
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
