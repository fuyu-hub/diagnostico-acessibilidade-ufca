import { IconAlertTriangle, IconCheck } from '@tabler/icons-react';
import { useVistoria } from '../contexto/VistoriaContext';
import { useNotificacao } from '../contexto/NotificacaoContext';
import { nomeDoAutor } from '../dados/sincronizacao';
import { opcoesDoItem, temDivergencia } from '../dados/mescla';
import { listarFotos } from '../dados/fotos';
import styles from './DivergenciaItem.module.css';

const ROTULOS = {
  conforme: 'Conforme',
  nao_conforme: 'Não conforme',
  nao_aplica: 'Não se aplica',
};

function quando(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

/**
 * Mostra as respostas diferentes de um item e deixa escolher uma.
 * Escolher grava uma resposta nova, que conhece todas as anteriores e encerra a divergência.
 * Também mostra observações de outras pessoas quando a resposta é a mesma.
 */
export default function DivergenciaItem({ vistoria, itemId, compacto = false }) {
  const { responderItem, estadoGrupos } = useVistoria();
  const { mostrarToast } = useNotificacao();
  const valor = vistoria?.dadosVistoria?.[itemId];
  if (!valor?.alternativas?.length) return null;

  const participantes = estadoGrupos?.[vistoria.vistoriaId]?.participantes || [];
  const divergente = temDivergencia(valor);
  const opcoes = opcoesDoItem(valor);

  function escolher(opcao) {
    responderItem(vistoria.id || vistoria.vistoriaId, itemId, {
      resposta: opcao.resposta,
      observacao: opcao.observacao || '',
      fotos: listarFotos(valor),
      automatico: opcao.automatico,
      origemTriagem: opcao.origemTriagem,
    });
    mostrarToast(`Ficou "${ROTULOS[opcao.resposta] || 'Sem resposta'}"`, 'sucesso');
  }

  if (!divergente) {
    // Mesma resposta, observações diferentes: só informa
    const outras = opcoes.slice(1).filter(o => o.observacao);
    if (compacto || outras.length === 0) return null;
    return (
      <div className={styles.nota} role="note">
        <strong>Outras observações sobre este item</strong>
        <ul>
          {outras.map(o => (
            <li key={`${o.autor}-${o.atualizadaEm}`}>{nomeDoAutor(o.autor, participantes)}: {o.observacao}</li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <section className={styles.caixa} aria-labelledby={`divergencia-${itemId}`}>
      <h2 id={`divergencia-${itemId}`} className={styles.titulo}>
        <IconAlertTriangle size={18} aria-hidden="true" /> Respostas diferentes no grupo
      </h2>
      <p className={styles.texto}>Escolha a que vale. A outra fica de fora da nota.</p>
      <ul className={styles.opcoes}>
        {opcoes.map(o => (
          <li key={`${o.autor}-${o.atualizadaEm}-${o.resposta}`} className={styles.opcao}>
            <div>
              <span className={styles.resposta}>{ROTULOS[o.resposta] || 'Sem resposta'}{o.automatico ? ' (pela triagem)' : ''}</span>
              <span className={styles.meta}>{nomeDoAutor(o.autor, participantes)}{o.atualizadaEm ? ` · ${quando(o.atualizadaEm)}` : ''}</span>
              {o.observacao && <span className={styles.obs}>“{o.observacao}”</span>}
            </div>
            <button
              type="button"
              className={styles.btnEscolher}
              onClick={() => escolher(o)}
              aria-label={`Ficar com ${ROTULOS[o.resposta] || 'sem resposta'}, de ${nomeDoAutor(o.autor, participantes)}`}
            >
              <IconCheck size={18} aria-hidden="true" /> Ficar com esta
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
