import { useEffect, useRef } from 'react';
import { IconX, IconDownload, IconArrowRight, IconNotes, IconTrash } from '@tabler/icons-react';
import { baixarImagemJpg } from '../utilitarios/imagem';
import { useTravaScroll } from '../utilitarios/travaScroll';
import { useFocusTrap } from '../utilitarios/focusTrap';
import styles from './ModalVisualizarFoto.module.css';

export default function ModalVisualizarFoto({
  aberto,
  foto = null,
  numero = '',
  subgrupo = '',
  pergunta = '',
  titulo = '',
  subtitulo = '',
  resultado = '',
  observacao = '',
  nomeArquivo = 'foto_item',
  onIrParaItem = null,
  onExcluir = null,
  onFechar,
}) {
  const displayNumero = numero || (titulo.match(/#(\w+)/) ? titulo.match(/#(\w+)/)[1] : '');
  const displaySubgrupo = subgrupo || (titulo ? titulo.replace(/^Item\s*#\w+\s*—\s*/, '') : '');
  const displayPergunta = pergunta || subtitulo;
  const modalRef = useRef(null);

  useTravaScroll(aberto);
  useFocusTrap(aberto, modalRef);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onFechar();
    }
    if (aberto) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [aberto, onFechar]);

  if (!aberto) return null;

  // Tag de conforme/não-conforme: estritamente a sigla "C" e "NC"
  let sigla = '–';
  let tagClasse = styles.tagCinza;
  if (resultado === 'conforme' || resultado === 'sim') {
    sigla = 'C';
    tagClasse = styles.tagVerde;
  } else if (resultado === 'nao-conforme' || resultado === 'nao') {
    sigla = 'NC';
    tagClasse = styles.tagVermelha;
  } else if (resultado === 'nao-aplica') {
    sigla = 'NA';
    tagClasse = styles.tagAmarela;
  }

  function handleDownload() {
    if (foto) baixarImagemJpg(foto, nomeArquivo);
  }

  function calcularTamanhoFoto(base64Str) {
    if (!base64Str) return '';
    const index = base64Str.indexOf(',');
    if (index === -1) return '';
    const len = base64Str.length - (index + 1);
    const bytes = Math.ceil((len * 3) / 4);
    const kb = bytes / 1024;
    if (kb >= 1024) return (kb / 1024).toFixed(1) + ' MB';
    return Math.round(kb) + ' KB';
  }

  return (
    <div className={styles.overlay} onClick={onFechar} role="dialog" aria-modal="true">
      <div ref={modalRef} className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Cabeçalho */}
        <div className={styles.header}>
          <div className={styles.headerInfo}>
            <div className={styles.tituloLinha}>
              {displayNumero && <span className={styles.tagNumero}>#{displayNumero}</span>}
              <span className={`${styles.tagSigla} ${tagClasse}`}>{sigla}</span>
              {displaySubgrupo && <span className={styles.subgrupo}>{displaySubgrupo}</span>}
            </div>
            {/* A pergunta só é exibida ao expandir */}
            {displayPergunta && <p className={styles.pergunta}>{displayPergunta}</p>}
          </div>

          <button
            type="button"
            className={styles.btnFechar}
            onClick={onFechar}
            aria-label="Fechar"
            title="Fechar"
          >
            <IconX size={20} />
          </button>
        </div>

        {/* Corpo: Imagem com proporção 100% travada ou Bloco de Observação */}
        {foto ? (
          <div className={styles.corpoImagem}>
            <img src={foto} alt={`Item ${displayNumero}`} className={styles.imagem} />
          </div>
        ) : (
          <div className={styles.corpoSemFoto}>
            <div className={styles.iconeNotaWrap}>
              <IconNotes size={36} color="var(--accent, #3b82f6)" />
            </div>
            <span className={styles.semFotoAviso}>Registro de anotação de campo</span>
          </div>
        )}

        {/* Rodapé com Observação e Ações */}
        <div className={styles.footer}>
          <div className={styles.obsContainer}>
            <span className={styles.obsLabel}>Observação:</span>
            <p className={styles.obsTexto}>
              {observacao ? observacao : 'Nenhuma observação registrada.'}
            </p>
          </div>

          <div className={styles.acoesFooter}>
            {foto && (
              <span className={styles.tamanhoFoto} title="Tamanho estimado da imagem">
                {calcularTamanhoFoto(foto)}
              </span>
            )}

            {foto && onExcluir && (
              <button
                type="button"
                className={styles.btnExcluir}
                onClick={onExcluir}
                title="Excluir esta foto"
              >
                <IconTrash size={18} />
              </button>
            )}

            {foto && (
              <button
                type="button"
                className={styles.btnDownload}
                onClick={handleDownload}
                title="Baixar esta foto no dispositivo em formato JPG"
              >
                <IconDownload size={18} />
                <span>Baixar JPG</span>
              </button>
            )}

            {onIrParaItem && (
              <button
                type="button"
                className={styles.btnIrItem}
                onClick={onIrParaItem}
                title="Abrir este item no checklist"
              >
                <span>Abrir Item</span>
                <IconArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
