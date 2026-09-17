import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconX, IconPhoto, IconNotes
} from '@tabler/icons-react';
import { TODOS_ITENS } from '../dados/checklist';
import { useTravaScroll } from '../utilitarios/travaScroll';
import ModalVisualizarFoto from './ModalVisualizarFoto';
import styles from './ModalGaleriaVistoria.module.css';

export default function ModalGaleriaVistoria({
  aberto,
  vistoria,
  onFechar,
}) {
  const navigate = useNavigate();
  const [filtro, setFiltro] = useState(null); // null | 'fotos' | 'obs' | 'nao-conforme' | 'conforme'
  const [itemSelecionado, setItemSelecionado] = useState(null);

  useTravaScroll(aberto);

  function alternarFiltro(tipo) {
    setFiltro((prev) => (prev === tipo ? null : tipo));
  }

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && !itemSelecionado) onFechar();
    }
    if (aberto) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [aberto, onFechar, itemSelecionado]);

  if (!aberto || !vistoria) return null;

  const respostas = vistoria.respostas || {};

  // Extrai itens com foto OU com observação (desconsidera anotações automáticas de triagem)
  const itensGaleria = TODOS_ITENS.reduce((acc, item, idx) => {
    const resp = respostas[item.id];
    const temFoto = resp?.foto && typeof resp.foto === 'string' && resp.foto.startsWith('data:image');
    const obsTexto = typeof resp?.obs === 'string' ? resp.obs.trim() : '';
    const ehObsAutomatica = obsTexto.startsWith('Triagem #') || obsTexto.startsWith('Triagem:');
    const temObs = obsTexto.length > 0 && !ehObsAutomatica;

    if (temFoto || temObs) {
      acc.push({
        item,
        indiceGlobal: idx + 1,
        resposta: resp?.valor || '',
        observacao: temObs ? obsTexto : '',
        foto: temFoto ? resp.foto : null,
        temFoto,
        temObs,
        apenasObs: !temFoto && temObs,
      });
    }
    return acc;
  }, []);

  // Filtragem (se nenhum filtro ativo, exibe todos)
  const itensFiltrados = itensGaleria.filter((entry) => {
    if (!filtro) return true;
    if (filtro === 'fotos') return entry.temFoto;
    if (filtro === 'obs') return entry.temObs;
    if (filtro === 'nao-conforme') return entry.resposta === 'nao-conforme' || entry.resposta === 'nao';
    if (filtro === 'conforme') return entry.resposta === 'conforme' || entry.resposta === 'sim';
    return true;
  });

  const totalFotos = itensGaleria.filter((e) => e.temFoto).length;
  const totalObs = itensGaleria.filter((e) => e.temObs).length;
  const totalNc = itensGaleria.filter((e) => e.resposta === 'nao-conforme' || e.resposta === 'nao').length;
  const totalConf = itensGaleria.filter((e) => e.resposta === 'conforme' || e.resposta === 'sim').length;

  // Tag estritamente "C" ou "NC"
  function obterSiglaInfo(resultado) {
    if (resultado === 'conforme' || resultado === 'sim') {
      return { sigla: 'C', classe: styles.tagVerde };
    }
    if (resultado === 'nao-conforme' || resultado === 'nao') {
      return { sigla: 'NC', classe: styles.tagVermelha };
    }
    if (resultado === 'nao-aplica') {
      return { sigla: 'NA', classe: styles.tagAmarela };
    }
    return { sigla: '–', classe: styles.tagCinza };
  }

  function handleIrParaItem(indiceGlobal) {
    setItemSelecionado(null);
    onFechar();
    navigate(`/checklist/${vistoria.id}/item/${indiceGlobal}`);
  }

  return (
    <>
      <div className={styles.overlay} onClick={onFechar} role="dialog" aria-modal="true">
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          {/* Cabeçalho */}
          <div className={styles.header}>
            <div className={styles.headerInfo}>
              <div className={styles.tituloLinha}>
                <div className={styles.iconeTitulo}>
                  <IconPhoto size={22} color="var(--accent, #3b82f6)" />
                </div>
                <div>
                  <h2 className={styles.titulo}>Galeria da Vistoria</h2>
                  <p className={styles.subtitulo}>
                    {itensGaleria.length === 1
                      ? '1 registro de campo (fotos e anotações)'
                      : `${itensGaleria.length} registros de campo (fotos e anotações)`}
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              className={styles.btnFechar}
              onClick={onFechar}
              aria-label="Fechar galeria"
              title="Fechar"
            >
              <IconX size={20} />
            </button>
          </div>

          {/* Filtros centralizados, sem a palavra 'filtrar' (clique para ativar/desativar) */}
          {itensGaleria.length > 0 && (
            <div className={styles.barraFiltros}>
              <button
                type="button"
                className={`${styles.btnFiltro} ${filtro === 'fotos' ? styles.filtroAtivo : ''}`}
                onClick={() => alternarFiltro('fotos')}
              >
                Fotos ({totalFotos})
              </button>
              {totalObs > 0 && (
                <button
                  type="button"
                  className={`${styles.btnFiltro} ${filtro === 'obs' ? styles.filtroAtivo : ''}`}
                  onClick={() => alternarFiltro('obs')}
                >
                  Obs ({totalObs})
                </button>
              )}
              <button
                type="button"
                className={`${styles.btnFiltro} ${filtro === 'nao-conforme' ? styles.filtroAtivo : ''}`}
                onClick={() => alternarFiltro('nao-conforme')}
              >
                NC ({totalNc})
              </button>
              <button
                type="button"
                className={`${styles.btnFiltro} ${filtro === 'conforme' ? styles.filtroAtivo : ''}`}
                onClick={() => alternarFiltro('conforme')}
              >
                C ({totalConf})
              </button>
            </div>
          )}

          {/* Grade mobile em 3 colunas */}
          <div className={styles.corpo}>
            {itensGaleria.length === 0 ? (
              <div className={styles.estadoVazio}>
                <div className={styles.vazioIconeWrap}>
                  <IconPhoto size={44} color="var(--text-muted, #64748b)" />
                </div>
                <h3 className={styles.vazioTitulo}>Nenhuma foto ou observação ainda</h3>
                <p className={styles.vazioDesc}>
                  As fotos anexadas e anotações registradas nos itens aparecerão aqui organizadas para consulta rápida e download.
                </p>
              </div>
            ) : itensFiltrados.length === 0 ? (
              <div className={styles.estadoVazio}>
                <p className={styles.vazioDesc}>Nenhum registro encontrado para o filtro selecionado.</p>
              </div>
            ) : (
              <div className={styles.grid}>
                {itensFiltrados.map((entry) => {
                  const tag = obterSiglaInfo(entry.resposta);

                  // Card para item COM FOTO
                  if (entry.temFoto) {
                    return (
                      <div
                        key={entry.item.id}
                        className={`${styles.card} ${styles.cardFoto}`}
                        onClick={() => setItemSelecionado(entry)}
                        title="Toque para expandir"
                      >
                        {/* Imagem */}
                        <div className={styles.fotoThumbWrap}>
                          <img
                            src={entry.foto}
                            alt={`Item ${entry.item.id}`}
                            className={styles.fotoThumb}
                          />

                          {/* Tag de número no canto superior esquerdo */}
                          <span className={styles.tagNumero}>#{entry.item.id}</span>

                          {/* Tag abreviada com sigla (C ou NC) no canto superior direito */}
                          <span className={`${styles.tagSigla} ${tag.classe}`}>
                            {tag.sigla}
                          </span>

                          {/* Indicador sutil se tiver observação */}
                          {entry.temObs && (
                            <div className={styles.badgeObsIcone} title="Possui observação">
                              <IconNotes size={13} color="#ffffff" />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }

                  // Card especial para item SÓ COM OBSERVAÇÃO
                  return (
                    <div
                      key={entry.item.id}
                      className={`${styles.card} ${styles.cardObservacao}`}
                      onClick={() => setItemSelecionado(entry)}
                      title="Toque para expandir observação"
                    >
                      {/* Topo do card com número e sigla */}
                      <div className={styles.obsCardTopo}>
                        <span className={styles.tagNumero}>#{entry.item.id}</span>
                        <span className={`${styles.tagSigla} ${tag.classe}`}>
                          {tag.sigla}
                        </span>
                      </div>

                      {/* Corpo com ícone e texto da observação */}
                      <div className={styles.obsCardCorpo}>
                        <IconNotes size={18} className={styles.obsCardIcone} />
                        <p className={styles.obsCardTexto}>
                          {entry.observacao}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Expansão (exibe pergunta, imagem/nota completa, obs e download) */}
      {itemSelecionado && (
        <ModalVisualizarFoto
          aberto={!!itemSelecionado}
          foto={itemSelecionado.foto}
          numero={itemSelecionado.item.id}
          subgrupo={itemSelecionado.item.subgrupo || 'Critério NBR'}
          pergunta={itemSelecionado.item.pergunta}
          resultado={itemSelecionado.resposta}
          observacao={itemSelecionado.observacao}
          nomeArquivo={`foto_item_${itemSelecionado.item.id}`}
          onIrParaItem={() => handleIrParaItem(itemSelecionado.indiceGlobal)}
          onFechar={() => setItemSelecionado(null)}
        />
      )}
    </>
  );
}
