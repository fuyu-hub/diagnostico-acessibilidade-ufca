import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconMapPin, IconArrowRight, IconListCheck, IconTrash } from '@tabler/icons-react';
import { useVistoria } from '../contexto/VistoriaContext';
import { TODOS_ITENS } from '../dados/checklist';
import ModalExcluirVistoria from './ModalExcluirVistoria';
import styles from './CartaoVistoria.module.css';

export default function CartaoVistoria({ vistoria }) {
  const navigate = useNavigate();
  const { removerVistoria, exportarVistoria } = useVistoria();
  const total = TODOS_ITENS.length;
  const respostas = vistoria.respostas || {};
  const respondidos = Object.keys(respostas).length;
  const pct = total > 0 ? Math.round((respondidos / total) * 100) : 0;
  const ativa = respondidos > 0;

  // Encontra o item mais anterior que não foi preenchido
  const primeiroPendenteIdx = TODOS_ITENS.findIndex(item => !respostas[item.id]?.valor);
  const temPendente = primeiroPendenteIdx !== -1;

  function handleAbrirDashboard(e) {
    e?.stopPropagation();
    navigate(`/vistoria/${vistoria.id}`);
  }

  function handleContinuar(e) {
    e?.stopPropagation();
    if (temPendente) {
      navigate(`/checklist/${vistoria.id}/item/${primeiroPendenteIdx + 1}`);
    } else {
      navigate(`/checklist/${vistoria.id}/resultado`);
    }
  }

  function handleVerSecoes(e) {
    e?.stopPropagation();
    navigate(`/checklist/${vistoria.id}/itens`);
  }

  const [modalAberto, setModalAberto] = useState(false);

  function handleExcluir(e) {
    e?.stopPropagation();
    setModalAberto(true);
  }

  function handleConfirmarExclusao() {
    setModalAberto(false);
    removerVistoria(vistoria.id);
  }

  return (
    <article
      className={`cartao ${ativa ? 'destaque' : ''} ${styles.card}`}
      aria-label={`Vistoria de ${vistoria.nome}`}
    >
      <div className={styles.cabecalho}>
        <div
          className={styles.info}
          onClick={handleAbrirDashboard}
          role="button"
          tabIndex={0}
          aria-label={`Acessar painel de vistoria de ${vistoria.nome}`}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleAbrirDashboard();
            }
          }}
          style={{ cursor: 'pointer' }}
        >
          <h3 className={styles.nome}>{vistoria.nome}</h3>
          <p className={styles.detalhe}>
            <IconMapPin size={14} /> {vistoria.cidade} · {vistoria.data ? vistoria.data.split('-').reverse().join('/') : ''}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className={`tag ${ativa ? (temPendente ? 'ativa' : 'salva') : 'salva'}`}>
            {ativa ? (temPendente ? 'Em andamento' : 'Concluída') : 'Nova'}
          </span>
          <button
            type="button"
            className={styles.btnExcluir}
            onClick={handleExcluir}
            aria-label={`Excluir vistoria de ${vistoria.nome}`}
            title="Excluir vistoria"
          >
            <IconTrash size={18} />
          </button>
        </div>
      </div>

      <div
        className={styles.progresso}
        onClick={handleAbrirDashboard}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progresso da vistoria: ${pct}%, ${respondidos} de ${total} itens respondidos`}
        style={{ cursor: 'pointer' }}
      >
        <div className="progresso-track" style={{ flex: 1 }}>
          <div className="progresso-fill" style={{ width: `${pct}%` }} />
        </div>
        <span className={styles.contagem}>{respondidos}/{total}</span>
      </div>

      <div className={styles.rodape}>
        <button
          type="button"
          className={styles.btnSecoes}
          onClick={handleVerSecoes}
          aria-label={`Ver seções da vistoria de ${vistoria.nome}`}
        >
          <IconListCheck size={16} /> Seções
        </button>

        <button
          type="button"
          className={`btn-nav ${ativa ? 'primario' : ''} ${styles.btnContinuar}`}
          onClick={handleContinuar}
          aria-label={`${!ativa ? 'Iniciar vistoria' : temPendente ? 'Continuar vistoria' : 'Ver resultado'} de ${vistoria.nome}`}
        >
          {!ativa
            ? 'Iniciar'
            : temPendente
              ? 'Continuar'
              : 'Ver Resultado'}
          <IconArrowRight size={16} />
        </button>
      </div>

      <ModalExcluirVistoria
        aberto={modalAberto}
        nomeVistoria={vistoria.nome}
        onExportar={() => exportarVistoria(vistoria.id)}
        onConfirmar={handleConfirmarExclusao}
        onCancelar={() => setModalAberto(false)}
      />
    </article>
  );
}
