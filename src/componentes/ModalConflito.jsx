import { useState, useEffect, useRef } from 'react';
import { IconAlertTriangle, IconReplace, IconCopy, IconGitMerge, IconX } from '@tabler/icons-react';
import { useTravaScroll } from '../utilitarios/travaScroll';
import { useFocusTrap } from '../utilitarios/focusTrap';
import styles from './ModalConflito.module.css';

/**
 * Modal para resolução interativa de conflitos de versão entre vistorias
 */
export default function ModalConflito({
  aberto,
  conflitoAtual,
  indiceConflito = 1,
  totalConflitos = 1,
  onResolver,
  onCancelarLote,
}) {
  const [aplicarParaTodos, setAplicarParaTodos] = useState(false);
  const modalRef = useRef(null);

  useTravaScroll(aberto);
  useFocusTrap(aberto, modalRef);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && onCancelarLote) {
        onCancelarLote();
      }
    }

    if (aberto) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [aberto, onCancelarLote]);

  if (!aberto || !conflitoAtual) return null;

  const { local, remota } = conflitoAtual;

  function handleEscolha(estrategia) {
    onResolver(estrategia, aplicarParaTodos);
  }

  function formatarData(iso) {
    if (!iso) return '–';
    try {
      return new Date(iso).toLocaleString('pt-BR');
    } catch {
      return iso;
    }
  }

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-modal-conflito"
    >
      <div ref={modalRef} className={styles.modal}>
        <div className={styles.iconeWrap}>
          <IconAlertTriangle size={32} />
        </div>

        <div className={styles.conteudo}>
          <div className={styles.tagProgresso}>
            Conflito {indiceConflito} de {totalConflitos}
          </div>

          <h3 id="titulo-modal-conflito" className={styles.titulo}>
            Vistoria com mesmo identificador encontrada
          </h3>

          <p className={styles.subtitulo}>
            O arquivo importado contém dados para <strong>"{local.blocoAvaliado || local.nome}"</strong> que já existe no seu dispositivo.
          </p>

          {/* Comparativo de Versão */}
          <div className={styles.tabelaComparativa}>
            <div className={styles.colunaVersao}>
              <div className={styles.cabecalhoVersao}>Versão Local</div>
              <div className={styles.dadoVersao}>
                <span>Revisão:</span> <strong>r{local.revisao}</strong>
              </div>
              <div className={styles.dadoVersao}>
                <span>Última edição:</span>
                <small>{formatarData(local.dataUltimaEdicao)}</small>
              </div>
            </div>

            <div className={`${styles.colunaVersao} ${styles.colunaRemota}`}>
              <div className={styles.cabecalhoVersao}>Versão do Arquivo</div>
              <div className={styles.dadoVersao}>
                <span>Revisão:</span> <strong>r{remota.revisao}</strong>
              </div>
              <div className={styles.dadoVersao}>
                <span>Última edição:</span>
                <small>{formatarData(remota.dataUltimaEdicao)}</small>
              </div>
            </div>
          </div>

          {/* Opção para aplicar a todos se houver múltiplos */}
          {totalConflitos > 1 && (
            <label className={styles.labelAplicarTodos}>
              <input
                type="checkbox"
                checked={aplicarParaTodos}
                onChange={e => setAplicarParaTodos(e.target.checked)}
              />
              <span>Aplicar esta mesma escolha aos {totalConflitos - indiceConflito} conflito(s) restante(s) deste lote</span>
            </label>
          )}

          {/* 4 Ações Estratégicas do Escopo 1 */}
          <div className={styles.gridAcoes}>
            <button
              type="button"
              className={styles.btnAcao}
              onClick={() => handleEscolha('mesclar')}
            >
              <IconGitMerge size={20} color="#3b82f6" />
              <div className={styles.textoAcao}>
                <strong>Mesclar Respostas (Recomendado)</strong>
                <span>Une as respostas de ambos. Em caso de conflito, a revisão maior vence.</span>
              </div>
            </button>

            <button
              type="button"
              className={styles.btnAcao}
              onClick={() => handleEscolha('copia')}
            >
              <IconCopy size={20} color="#22c55e" />
              <div className={styles.textoAcao}>
                <strong>Criar Nova Cópia</strong>
                <span>Importa como uma cópia independente com sufixo " - Cópia", mantendo a local intacta.</span>
              </div>
            </button>

            <button
              type="button"
              className={styles.btnAcao}
              onClick={() => handleEscolha('sobrescrever')}
            >
              <IconReplace size={20} color="#eab308" />
              <div className={styles.textoAcao}>
                <strong>Substituir Versão Local</strong>
                <span>Descarta a versão local e adota integralmente os dados do arquivo.</span>
              </div>
            </button>

            <button
              type="button"
              className={`${styles.btnAcao} ${styles.btnCancelar}`}
              onClick={() => handleEscolha('cancelar')}
            >
              <IconX size={20} color="#ef4444" />
              <div className={styles.textoAcao}>
                <strong>Ignorar Este Item</strong>
                <span>Não importa esta vistoria e preserva a versão local inalterada.</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
