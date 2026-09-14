import { useParams, useNavigate } from 'react-router-dom';
import { IconFileTypePdf, IconRefresh, IconArrowLeft } from '@tabler/icons-react';
import { useVistoria } from '../contexto/VistoriaContext';
import { TODOS_ITENS, SECOES, ITENS_POR_SECAO } from '../dados/checklist';
import Topbar from '../componentes/Topbar';
import styles from './Resultado.module.css';

// Calcula indice de uma lista de itens dado o mapa de respostas
function calcularIndice(itens, respostas) {
  // Apenas itens tecnicos nao-automaticos entram no calculo
  const contaveis = itens.filter(i => i.tipo === 'tecnico');
  const conf  = contaveis.filter(i => respostas[i.id]?.valor === 'conforme').length;
  const nc    = contaveis.filter(i => respostas[i.id]?.valor === 'nao-conforme').length;
  const total = conf + nc; // N/A excluido
  return { conf, nc, na: contaveis.filter(i => respostas[i.id]?.valor === 'nao-aplica').length, total, pct: total > 0 ? Math.round((conf / total) * 100) : null };
}

function corPct(pct) {
  if (pct === null) return 'var(--text-muted)';
  if (pct >= 70) return 'var(--text-success)';
  if (pct >= 50) return 'var(--text-warning)';
  return 'var(--text-danger)';
}

export default function Resultado() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getVistoria } = useVistoria();
  const vistoria = getVistoria(id);

  if (!vistoria) return null;

  const respostas = vistoria.respostas || {};

  // Indice geral (media dos indices de secao)
  const indicesPorSecao = SECOES.map(s => ({
    ...s,
    ...calcularIndice(ITENS_POR_SECAO[s.id] || [], respostas),
  }));

  const secoesAvaliadas = indicesPorSecao.filter(s => s.total > 0);
  const mediaGeral = secoesAvaliadas.length > 0
    ? Math.round(secoesAvaliadas.reduce((acc, s) => acc + (s.pct ?? 0), 0) / secoesAvaliadas.length)
    : null;

  const totalConf = indicesPorSecao.reduce((a, s) => a + s.conf, 0);
  const totalNC   = indicesPorSecao.reduce((a, s) => a + s.nc, 0);
  const totalNA   = indicesPorSecao.reduce((a, s) => a + s.na, 0);

  return (
    <div className="app-shell">
      <Topbar titulo="Resultado do Diagnóstico" voltar={`/checklist/${id}/resumo-bloco`} />

      <div className="tela-body" style={{ padding: '24px 20px' }}>
        <div className={styles.container}>
          <p style={{ fontSize: '1.2rem', fontWeight: 600, textAlign: 'center', marginBottom: 4 }}>
            {vistoria.nome}
          </p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: 28 }}>
            {vistoria.cidade} · {vistoria.data ? vistoria.data.split('-').reverse().join('/') : ''}
          </p>

          {/* Cards de stat gerais */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
            <div className="stat-card">
              <div className="stat-val" style={{ color: corPct(mediaGeral) }}>
                {mediaGeral !== null ? `${mediaGeral}%` : '--'}
              </div>
              <div className="stat-lbl">Média Geral</div>
            </div>
            <div className="stat-card">
              <div className="stat-val" style={{ color: 'var(--text-danger)' }}>{totalNC}</div>
              <div className="stat-lbl">Não conf.</div>
            </div>
            <div className="stat-card">
              <div className="stat-val" style={{ color: 'var(--text-warning)' }}>{totalNA}</div>
              <div className="stat-lbl">N/A</div>
            </div>
          </div>

          {/* Indice por secao */}
          <div className="cartao" style={{ marginBottom: 24, padding: '20px 24px' }}>
            <p className="label-secao" style={{ marginBottom: 16 }}>Índice por Seção</p>
            <div className={styles.gridSecoesResultado}>
              {indicesPorSecao.map(s => (
                <div key={s.id} className={styles.cardSecaoResultado}>
                  <span className={styles.nomeSecao}>{s.nome}</span>
                  <span style={{ fontWeight: 700, color: corPct(s.pct) }}>
                    {s.pct !== null ? `${s.pct}%` : '--'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.botoesWrap}>
            <button className="btn-nav primario">
              <IconFileTypePdf size={20} /> Exportar PDF (Relatório Vistoria)
            </button>

            <button className="btn-nav" onClick={() => navigate(`/checklist/${id}/itens`)}>
              <IconRefresh size={18} /> Revisar Respostas
            </button>

            <button
              className="btn-nav"
              style={{ border: 'none', color: 'var(--text-secondary)' }}
              onClick={() => navigate('/')}
            >
              <IconArrowLeft size={18} /> Voltar ao Painel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
