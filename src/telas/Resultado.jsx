import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  IconRefresh, IconArrowLeft,
  IconDashboard, IconAlertTriangle
} from '@tabler/icons-react';
import { useVistoria } from '../contexto/VistoriaContext';
import { TODOS_ITENS, SECOES, ITENS_POR_SECAO } from '../dados/checklist';
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
  const indiceGeral = calcularIndiceItens(TODOS_ITENS, respostas);
  const { classificacao: classGeral } = indiceGeral;

  // Índices por seção
  const indicesPorSecao = SECOES.map(s => {
    const itensSecao = ITENS_POR_SECAO[s.id] || [];
    const ind = calcularIndiceItens(itensSecao, respostas);
    return {
      ...s,
      ...ind,
    };
  });

  const totalContaveis = TODOS_ITENS.filter(i => i.tipo === 'tecnico').length;
  const respondidosCount = Object.values(respostas).filter(r => r && r.valor).length;
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
    return null;
  }

  return (
    <div className="app-shell">
      <Topbar titulo="Resultado do Diagnóstico" voltar={`/checklist/${id}/itens`} />

      <div className="tela-body" style={{ padding: '24px 20px 48px' }}>
        <div className={styles.container}>
          <div className={styles.cabecalho}>
            <h2 className={styles.titulo}>{vistoria.nome}</h2>
            <p className={styles.subtitulo}>
              {vistoria.bairro ? `${vistoria.bairro}, ` : ''}{vistoria.cidade || 'Local não informado'} · {vistoria.data ? vistoria.data.split('-').reverse().join('/') : 'Data não informada'}
            </p>
          </div>

          {ehParcial && (
            <div
              style={{
                background: 'rgba(234, 179, 8, 0.12)',
                border: '1.5px solid rgba(234, 179, 8, 0.35)',
                borderRadius: 14,
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                color: '#eab308',
                fontSize: '0.86rem',
                lineHeight: 1.5,
              }}
            >
              <IconAlertTriangle size={24} style={{ flexShrink: 0 }} />
              <div>
                <strong>Resultado Parcial:</strong> Este índice reflete os {respondidosCount} itens respondidos até o momento (de {totalContaveis} exigências técnicas).
              </div>
            </div>
          )}

          {/* Card Destaque Nota Geral */}
          <div className={styles.cardNotaGeral}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600 }}>
              Índice de Avaliação de Acessibilidade (IAA) Geral
            </span>

            <div className={styles.notaGeralValor} style={{ color: classGeral.cor }}>
              {classGeral.notaFormatada}
            </div>

            <span
              className={styles.badgeClassificacaoGeral}
              style={{
                color: classGeral.cor,
                background: classGeral.bg,
                borderColor: classGeral.borda,
              }}
            >
              {classGeral.rotulo}
            </span>

            {/* Cards de contagem */}
            <div className={styles.gridContagem}>
              <div className={styles.statCardResumo}>
                <div className={styles.statValResumo} style={{ color: 'var(--text-success)' }}>{indiceGeral.conf}</div>
                <div className={styles.statLblResumo}>Conformes</div>
              </div>
              <div className={styles.statCardResumo}>
                <div className={styles.statValResumo} style={{ color: 'var(--text-danger)' }}>{indiceGeral.nc}</div>
                <div className={styles.statLblResumo}>Não conf.</div>
              </div>
              <div className={styles.statCardResumo}>
                <div className={styles.statValResumo} style={{ color: 'var(--text-warning)' }}>{indiceGeral.na}</div>
                <div className={styles.statLblResumo}>N/A</div>
              </div>
            </div>
          </div>

          {/* Tabela Oficial de Interpretação do Índice (Imagem 2) */}
          <section className={styles.cardTabelaInterpretacao}>
            <h3 className={styles.tabelaTitulo}>Interpretação do Índice</h3>
            <div className={styles.tabelaGrid}>
              {FAIXAS_INDICE.map(faixa => (
                <div
                  key={faixa.rotulo}
                  className={styles.tabelaLinha}
                  style={{
                    background: faixa.rotulo === classGeral.rotulo ? faixa.bg : 'transparent',
                  }}
                >
                  <div className={styles.tabelaFaixa}>
                    <span className={styles.tabelaDot} style={{ background: faixa.cor }} />
                    <span>{faixa.faixaTexto}</span>
                  </div>
                  <span className={styles.tabelaRotulo} style={{ color: faixa.cor }}>
                    {faixa.rotulo}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Índice por Seção */}
          <div className={styles.cardSecoesContainer}>
            <p className="label-secao" style={{ marginBottom: 14 }}>Índice por Seção de Acessibilidade</p>
            <div className={styles.gridSecoesResultado}>
              {indicesPorSecao.map(s => (
                <div key={s.id} className={styles.cardSecaoResultado}>
                  <span className={styles.nomeSecao}>{s.nome}</span>
                  <div className={styles.badgeSecao} style={{ color: s.classificacao.cor }}>
                    <span className={styles.notaSecaoValor}>{s.classificacao.notaFormatada}</span>
                    {s.total > 0 && (
                      <span className={styles.notaSecaoRotulo}>{s.classificacao.rotulo}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.botoesWrap}>
            <button className="btn-nav primario" onClick={() => navigate(`/vistoria/${id}`)}>
              <IconDashboard size={18} /> Painel da Vistoria e Ficha
            </button>

            <button className="btn-nav" onClick={() => navigate(`/checklist/${id}/itens`)}>
              <IconRefresh size={18} /> Revisar Seções e Itens
            </button>

            <button
              className="btn-nav"
              style={{ border: 'none', color: 'var(--text-secondary)' }}
              onClick={() => navigate('/')}
            >
              <IconArrowLeft size={18} /> Voltar ao Início
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
