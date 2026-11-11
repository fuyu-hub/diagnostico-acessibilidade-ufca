import { useState } from 'react';
import { IconMapPin, IconArrowRight, IconListCheck, IconTrash, IconShare } from '@tabler/icons-react';
import { nuvemDisponivel } from '../dados/nuvem';
import { useVistoria } from '../contexto/VistoriaContext';
import { resumoProgresso } from '../dados/checklist';
import ModalExcluirVistoria from './ModalExcluirVistoria';
import { useNavegacao } from '../utilitarios/navegacao';
import styles from './CartaoVistoria.module.css';

// semContinuar: a tela inicial já oferece "Continuar" para esta vistoria, no destaque do topo
export default function CartaoVistoria({ vistoria, semContinuar = false }) {
  const { navegar } = useNavegacao();
  const { removerVistoria, exportarVistoria } = useVistoria();
  const respostas = vistoria.respostas || {};
  const { total, respondidos, pct, proximoIndice: primeiroPendenteIdx } = resumoProgresso(respostas);
  const ativa = Object.keys(respostas).length > 0;
  const temPendente = primeiroPendenteIdx !== -1;

  function handleAbrirDashboard(e) {
    e?.stopPropagation();
    navegar(`/vistoria/${vistoria.id}`);
  }

  function handleContinuar(e) {
    e?.stopPropagation();
    if (temPendente) {
      navegar(`/checklist/${vistoria.id}/item/${primeiroPendenteIdx + 1}`);
    } else {
      navegar(`/checklist/${vistoria.id}/resultado`);
    }
  }

  function handleCompartilhar(e) {
    e?.stopPropagation();
    navegar(`/vistoria/${vistoria.id}?aba=grupo`);
  }

  function handleVerSecoes(e) {
    e?.stopPropagation();
    navegar(`/checklist/${vistoria.id}/itens`);
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
            {vistoria.grupo && <>{' '}<span className={`tag em-andamento ${styles.selo}`}>Em grupo</span></>}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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

        <div className={styles.acoesDireita}>
        {nuvemDisponivel() && (
          <button
            type="button"
            className={styles.btnCompartilhar}
            onClick={handleCompartilhar}
            aria-label={`${vistoria.grupo ? 'Ver o grupo' : 'Compartilhar'} da vistoria de ${vistoria.nome}`}
            title={vistoria.grupo ? 'Ver o grupo' : 'Compartilhar'}
          >
            <IconShare size={20} aria-hidden="true" />
          </button>
        )}

        {!semContinuar && <button
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
        </button>}
        </div>
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
