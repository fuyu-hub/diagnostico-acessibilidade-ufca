import { useState, useEffect, useRef } from 'react';
import {
  IconX, IconPhoto, IconNotes
} from '@tabler/icons-react';
import { TODOS_ITENS, numeroItem } from '../dados/checklist';
import { listarFotos, ehFotoExibivel } from '../dados/fotos.js';
import { useTravaScroll } from '../utilitarios/travaScroll';
import { useFocusTrap } from '../utilitarios/focusTrap';
import ModalVisualizarFoto from './ModalVisualizarFoto';
import { useNavegacao, useFecharComVoltar } from '../utilitarios/navegacao';
import styles from './ModalGaleriaVistoria.module.css';

export default function ModalGaleriaVistoria({
  aberto,
  vistoria,
  onFechar,
  onExcluirFoto,
}) {
  const { navegar } = useNavegacao();
  const [filtro, setFiltro] = useState(null); // null | 'fotos' | 'obs' | 'nao-conforme' | 'conforme'
  const [itemSelecionado, setItemSelecionado] = useState(null);
  const modalRef = useRef(null);

  useTravaScroll(aberto);
  useFocusTrap(aberto && !itemSelecionado, modalRef);
  useFecharComVoltar(aberto, onFechar);

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

  // Um registro por foto (um item pode ter várias) e um para itens só com observação.
  // Anotações automáticas de triagem ficam de fora.
  const itensGaleria = TODOS_ITENS.reduce((acc, item, idx) => {
    const resp = respostas[item.id];
    const fotos = listarFotos(resp).filter(ehFotoExibivel);
    const obsTexto = typeof resp?.obs === 'string' ? resp.obs.trim() : '';
    const ehObsAutomatica = obsTexto.startsWith('Triagem #') || obsTexto.startsWith('Triagem:');
    const temObs = obsTexto.length > 0 && !ehObsAutomatica;
    const base = {
      item,
      indiceGlobal: idx + 1,
      resposta: resp?.valor || '',
      observacao: temObs ? obsTexto : '',
      temObs,
      totalFotos: fotos.length,
    };

    if (fotos.length) {
      fotos.forEach((foto, indiceFoto) => {
        acc.push({ ...base, chave: `${item.id}-${indiceFoto}`, foto, indiceFoto, temFoto: true, apenasObs: false });
      });
    } else if (temObs) {
      acc.push({ ...base, chave: `${item.id}-obs`, foto: null, indiceFoto: null, temFoto: false, apenasObs: true });
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
  const totalObs = new Set(itensGaleria.filter((e) => e.temObs).map((e) => e.item.id)).size;
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
    navegar(`/checklist/${vistoria.id}/item/${indiceGlobal}`);
  }

  return (
    <>
      <div className={styles.overlay} onClick={onFechar} role="dialog" aria-modal="true" aria-labelledby="titulo-galeria">
        <div ref={modalRef} className={styles.modal} onClick={(e) => e.stopPropagation()}>
          {/* Cabeçalho */}
          <div className={styles.header}>
            <div className={styles.headerInfo}>
              <div className={styles.tituloLinha}>
                <div className={styles.iconeTitulo}>
                  <IconPhoto size={22} color="var(--accent)" />
                </div>
                <div>
                  <h2 id="titulo-galeria" className={styles.titulo}>Galeria da Vistoria</h2>
                  <p className={styles.subtitulo}>
                    {totalFotos === 1 ? '1 foto' : `${totalFotos} fotos`} · {totalObs === 1 ? '1 observação' : `${totalObs} observações`}
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
            <div className={styles.barraFiltros} role="group" aria-label="Filtrar registros">
              <button
                type="button"
                className={`${styles.btnFiltro} ${filtro === 'fotos' ? styles.filtroAtivo : ''}`}
                aria-pressed={filtro === 'fotos'}
                onClick={() => alternarFiltro('fotos')}
              >
                Fotos ({totalFotos})
              </button>
              {totalObs > 0 && (
                <button
                  type="button"
                  className={`${styles.btnFiltro} ${filtro === 'obs' ? styles.filtroAtivo : ''}`}
                  aria-pressed={filtro === 'obs'}
                  onClick={() => alternarFiltro('obs')}
                >
                  Obs ({totalObs})
                </button>
              )}
              <button
                type="button"
                className={`${styles.btnFiltro} ${filtro === 'nao-conforme' ? styles.filtroAtivo : ''}`}
                aria-pressed={filtro === 'nao-conforme'}
                onClick={() => alternarFiltro('nao-conforme')}
              >
                NC ({totalNc})
              </button>
              <button
                type="button"
                className={`${styles.btnFiltro} ${filtro === 'conforme' ? styles.filtroAtivo : ''}`}
                aria-pressed={filtro === 'conforme'}
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
                  <IconPhoto size={44} color="var(--text-muted)" />
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
                        key={entry.chave}
                        role="button"
                        tabIndex={0}
                        aria-label={`Ver foto${entry.totalFotos > 1 ? ` ${entry.indiceFoto + 1} de ${entry.totalFotos}` : ''} do item ${numeroItem(entry.item) ?? 'de triagem'}, ${entry.resposta || 'sem resposta'}`}
                        className={`${styles.card} ${styles.cardFoto}`}
                        onClick={() => setItemSelecionado(entry)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setItemSelecionado(entry);
                          }
                        }}
                        title="Toque para expandir"
                      >
                        {/* Imagem */}
                        <div className={styles.fotoThumbWrap}>
                          <img
                            src={entry.foto}
                            alt={`Item ${numeroItem(entry.item) ?? 'de triagem'}`}
                            className={styles.fotoThumb}
                          />

                          {/* Tag de número no canto superior esquerdo */}
                          <span className={styles.tagNumero}>
                            {numeroItem(entry.item) ? `#${numeroItem(entry.item)}` : 'Triagem'}{entry.totalFotos > 1 ? ` · ${entry.indiceFoto + 1}/${entry.totalFotos}` : ''}
                          </span>

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
                      key={entry.chave}
                      role="button"
                      tabIndex={0}
                      aria-label={`Ver observação do item ${numeroItem(entry.item) ?? 'de triagem'}`}
                      className={`${styles.card} ${styles.cardObservacao}`}
                      onClick={() => setItemSelecionado(entry)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setItemSelecionado(entry);
                        }
                      }}
                      title="Toque para expandir observação"
                    >
                      {/* Topo do card com número e sigla */}
                      <div className={styles.obsCardTopo}>
                        <span className={styles.tagNumero}>{numeroItem(entry.item) ? `#${numeroItem(entry.item)}` : 'Triagem'}</span>
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
          numero={numeroItem(itemSelecionado.item) ?? ''}
          subgrupo={itemSelecionado.item.subgrupo || 'Critério NBR'}
          pergunta={itemSelecionado.item.pergunta}
          resultado={itemSelecionado.resposta}
          observacao={itemSelecionado.observacao}
          nomeArquivo={`foto_item_${itemSelecionado.item.id}${itemSelecionado.indiceFoto ? `_${itemSelecionado.indiceFoto + 1}` : ''}`}
          onIrParaItem={() => handleIrParaItem(itemSelecionado.indiceGlobal)}
          onFechar={() => setItemSelecionado(null)}
          onExcluir={onExcluirFoto && itemSelecionado.temFoto ? () => {
            onExcluirFoto(itemSelecionado.item.id, itemSelecionado.indiceFoto ?? 0);
            setItemSelecionado(null);
          } : null}
        />
      )}
    </>
  );
}
