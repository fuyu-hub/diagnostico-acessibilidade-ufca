import { useParams, useNavigate } from 'react-router-dom';
import { IconFlagCheck, IconCheck, IconX, IconMinus, IconArrowRight, IconListCheck } from '@tabler/icons-react';
import { useVistoria } from '../contexto/VistoriaContext';
import { TODOS_ITENS } from '../dados/checklist';
import Topbar from '../componentes/Topbar';
import styles from './ResumoBloco.module.css';

export default function ResumoBloco() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getVistoria } = useVistoria();
  const vistoria = getVistoria(id);

  if (!vistoria) return null;

  const respostas = vistoria.respostas || {};
  const conformes = TODOS_ITENS.filter(i => respostas[i.id]?.valor === 'conforme').length;
  const naoConformes = TODOS_ITENS.filter(i => respostas[i.id]?.valor === 'nao-conforme').length;
  const naoAplica = TODOS_ITENS.filter(i => respostas[i.id]?.valor === 'nao-aplica').length;
  const total = conformes + naoConformes; // N/A excluido do calculo
  const pct = total > 0 ? Math.round((conformes / total) * 100) : 0;
  const corPct = pct >= 70 ? 'var(--text-success)' : pct >= 50 ? 'var(--text-warning)' : 'var(--text-danger)';

  return (
    <div className="app-shell">
      <Topbar titulo="Resumo do Bloco" voltar={`/vistoria/${id}`} />

      <div className="tela-body" style={{ padding: '32px 20px' }}>
        <div className={styles.container}>
          <IconFlagCheck size={48} color="var(--text-muted)" />
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 12 }}>{vistoria.nome}</p>
          <p style={{ fontSize: '1.2rem', fontWeight: 600, marginTop: 4, marginBottom: 24 }}>1. Acesso Externo</p>

          <p className={styles.bigPct} style={{ color: corPct }}>{pct}%</p>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '8px 0 28px' }}>
            Índice de conformidade normativo
          </p>

          <div className={styles.gridMetricas}>
            {[
              { label: 'Conforme', val: conformes, icone: <IconCheck size={20} color="var(--text-success)" /> },
              { label: 'Não conforme', val: naoConformes, icone: <IconX size={20} color="var(--text-danger)" /> },
              { label: 'Não se aplica / N/A', val: naoAplica, icone: <IconMinus size={20} color="var(--text-warning)" /> },
            ].map(({ label, val, icone }) => (
              <div key={label} className={styles.cardMetrica}>
                <div className={styles.cardMetricaTopo}>
                  {icone}
                  <span>{label}</span>
                </div>
                <div className={styles.cardMetricaVal}>{val}</div>
              </div>
            ))}
          </div>

          <div className={styles.acoesWrap}>
            <button className="btn-nav primario" onClick={() => navigate(`/checklist/${id}/resultado`)}>
              Ver Resultado Geral <IconArrowRight size={18} />
            </button>
            <button className="btn-nav" onClick={() => navigate(`/checklist/${id}/itens`)}>
              <IconListCheck size={18} /> Revisar Respostas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
