import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  IconCheck, IconX, IconMinus, IconBulb, IconRuler2,
  IconChevronDown, IconChevronUp, IconCamera, IconTrash,
  IconListCheck, IconFilter, IconChevronLeft, IconChevronRight,
  IconPhoto,
} from '@tabler/icons-react';
import { useVistoria } from '../contexto/VistoriaContext';
import { TODOS_ITENS } from '../dados/checklist';
import Topbar from '../componentes/Topbar';
import BarraProgresso from '../componentes/BarraProgresso';
import { tocarSomResposta } from '../utilitarios/som';
import styles from './ItemChecklist.module.css';

const ITENS_CONTAVEIS = TODOS_ITENS.filter(i => i.tipo === 'tecnico');

const OPCOES_TECNICO = [
  { valor: 'conforme',     label: 'Conforme',      icone: <IconCheck size={20} /> },
  { valor: 'nao-conforme', label: 'Não conforme',  icone: <IconX size={20} /> },
  { valor: 'nao-aplica',   label: 'Não se aplica', icone: <IconMinus size={20} /> },
];

const OPCOES_TRIAGEM = [
  { valor: 'sim',        label: 'Sim',           icone: <IconCheck size={20} /> },
  { valor: 'nao',        label: 'Não',           icone: <IconX size={20} /> },
  { valor: 'nao-aplica', label: 'Não se aplica', icone: <IconMinus size={20} /> },
];

export default function ItemChecklist() {
  const { id, n } = useParams();
  const navigate = useNavigate();
  const { getVistoria, responderItem, salvando, carregando } = useVistoria();

  const vistoria = getVistoria(id);
  const itemIdx = parseInt(n, 10) - 1;
  const item = TODOS_ITENS[itemIdx];

  const [dicaAberta, setDicaAberta] = useState(false);
  const [comoAberto, setComoAberto] = useState(false);

  const respostaAtual = vistoria?.respostas?.[item?.id];
  const [obs, setObs]   = useState(respostaAtual?.obs  || '');
  const [foto, setFoto] = useState(respostaAtual?.foto || null);

  useEffect(() => {
    setObs(respostaAtual?.obs || '');
    setFoto(respostaAtual?.foto || null);
    setDicaAberta(false);
    setComoAberto(false);
    window.scrollTo(0, 0);
  }, [item?.id]);

  if (!vistoria || !item) {
    if (carregando) {
      return (
        <div className="app-shell">
          <Topbar titulo="Carregando..." voltar="/" />
          <div className="tela-body" style={{ padding: '32px 20px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)' }}>Carregando dados do checklist...</p>
          </div>
        </div>
      );
    }
    return null;
  }

  const respondidos = Object.keys(vistoria.respostas || {}).length;
  const pct = ITENS_CONTAVEIS.length > 0
    ? Math.round((respondidos / ITENS_CONTAVEIS.length) * 100)
    : 0;

  const valorAtual = respostaAtual?.valor;
  const ehTriagem  = item.tipo === 'triagem';
  const opcoes     = ehTriagem ? OPCOES_TRIAGEM : OPCOES_TECNICO;

  function classeResposta(valor) {
    if (valorAtual !== valor) return 'btn-resposta';
    if (valor === 'conforme' || valor === 'sim') return 'btn-resposta conforme';
    if (valor === 'nao-conforme' || valor === 'nao') return 'btn-resposta nao-conforme';
    if (valor === 'nao-aplica') return 'btn-resposta nao-aplica';
    return 'btn-resposta';
  }

  function aplicarDependencias(valor) {
    if (!item.dependentes?.length) return null;
    if (valor === 'nao' || valor === 'nao-aplica') {
      item.dependentes.forEach(depId => {
        responderItem(id, depId, {
          valor: 'nao-aplica',
          obs: `Triagem #${item.id}: resposta ${valor === 'nao-aplica' ? 'Não se aplica' : 'Não'} — aplicado automaticamente.`,
          foto: null,
          automatico: true,
        });
      });
      if (valor === 'nao' && item.acaoSeNao === 'gatilho_nc_dependentes_na') {
        return { valor: 'nao-conforme', obs, foto };
      }
    } else {
      item.dependentes.forEach(depId => {
        const respDep = vistoria.respostas?.[depId];
        if (respDep?.automatico) responderItem(id, depId, null);
      });
    }
    return null;
  }

  function selecionar(valor) {
    tocarSomResposta(valor);
    const override = aplicarDependencias(valor);
    responderItem(id, item.id, override || { valor, obs, foto });
  }

  function salvarObs(val) {
    setObs(val);
    if (valorAtual) responderItem(id, item.id, { valor: valorAtual, obs: val, foto });
  }

  function handleFoto(e) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;

    try {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (ev) => {
        img.onload = () => {
          const maxDim = 1280;
          let w = img.width;
          let h = img.height;

          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);

          let dataUrl = canvas.toDataURL('image/webp', 0.75);
          if (!dataUrl.startsWith('data:image/webp')) {
            dataUrl = canvas.toDataURL('image/jpeg', 0.75);
          }

          setFoto(dataUrl);
          if (valorAtual) {
            responderItem(id, item.id, { valor: valorAtual, obs, foto: dataUrl });
          }
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(arquivo);
    } catch (err) {
      console.warn('Falha na compressão, salvando referência:', err);
      setFoto(arquivo.name);
      if (valorAtual) responderItem(id, item.id, { valor: valorAtual, obs, foto: arquivo.name });
    } finally {
      e.target.value = '';
    }
  }

  function proximoItem() {
    const proximo = itemIdx + 2;
    if (proximo <= TODOS_ITENS.length) navigate(`/checklist/${id}/item/${proximo}`);
    else navigate(`/checklist/${id}/resultado`);
  }

  function itemAnterior() {
    if (itemIdx > 0) navigate(`/checklist/${id}/item/${itemIdx}`);
  }

  const imagemSrc = item.imagem ? `/imagens/${item.imagem}` : null;
  const temAnterior = itemIdx > 0;
  const respondido  = !!valorAtual;

  return (
    <div className="app-shell">
      <Topbar
        titulo={item.subgrupo || 'Item'}
        voltar={() => navigate(`/checklist/${id}/itens?secao=${item.secaoId || 1}&subgrupo=${encodeURIComponent(item.subgrupo || '')}`)}
        acaoDireita={{
          icone: <IconListCheck size={20} />,
          label: 'Ver itens',
          fn: () => navigate(`/checklist/${id}/itens`),
        }}
      />
      <BarraProgresso pct={Math.min(pct, 100)} label={`${respondidos} respondidos${salvando ? ' · Salvando...' : ''}`} />

      {/* Conteúdo com scroll — padding-bottom reserva espaço para a barra de nav */}
      <div className="tela-body" style={{ padding: '12px 20px 24px', paddingBottom: '84px' }}>
        <div className={styles.itemLayout}>
          <div className={styles.colunaInfo}>
            {ehTriagem && (
              <span className="tag triagem" style={{ marginBottom: 12, display: 'inline-flex' }}>
                <IconFilter size={14} /> Pergunta de triagem
              </span>
            )}

            <p className={styles.pergunta}>{item.pergunta}</p>

            {imagemSrc && (
              <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border-strong)', marginBottom: 14 }}>
                <img src={imagemSrc} alt={item.subgrupo || 'Referência NBR 9050'} style={{ width: '100%', height: 'auto', display: 'block' }} />
              </div>
            )}

            {ehTriagem && item.acaoSeNao === 'gatilho_nc_dependentes_na' && (
              <div className={styles.alertaNC}>
                <p>Se "Não": este item será marcado como <strong>Não Conforme</strong> (obrigatório por norma) e os itens dependentes como N/A.</p>
              </div>
            )}

            {ehTriagem && item.acaoSeNao === 'dependentes_na' && item.dependentes?.length > 0 && (
              <div className={styles.alertaInfo}>
                <p>Se "Não" ou "Não se aplica": itens {item.dependentes.join(', ')} serão marcados automaticamente como N/A.</p>
              </div>
            )}

            {item.dica && (
              <>
                <div className={styles.accordionRow} onClick={() => setDicaAberta(v => !v)}>
                  <span><IconBulb size={18} /> Dica</span>
                  {dicaAberta ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                </div>
                {dicaAberta && <p className={styles.accordionBody}>{item.dica}</p>}
              </>
            )}

            {item.comoAveriguar && (
              <>
                <div className={styles.accordionRow} onClick={() => setComoAberto(v => !v)}>
                  <span><IconRuler2 size={18} /> Como averiguar</span>
                  {comoAberto ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                </div>
                {comoAberto && (
                  <div className={styles.accordionBody}>
                    <p>{item.comoAveriguar}</p>
                    {item.referencia && (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 8 }}>
                        Ref.: {item.referencia}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <div className={styles.colunaAcao}>
            {/* Botões de resposta */}
            <div style={{ paddingTop: 4 }}>
              {opcoes.map(({ valor, label, icone }) => (
                <button
                  key={valor}
                  type="button"
                  className={classeResposta(valor)}
                  onClick={() => selecionar(valor)}
                >
                  <span className="icone">{icone}</span>
                  {label}
                </button>
              ))}
            </div>

            {/* Observação e foto — aparecem após selecionar */}
            {(!ehTriagem || valorAtual) && (
              <div className={styles.obsWrap}>
                <p className={styles.obsLabel}>
                  {valorAtual === 'nao-conforme' ? 'Observação da não conformidade' :
                   valorAtual === 'nao-aplica'   ? 'Justificativa N/A' :
                   'Observações e fotos'}
                </p>
                <textarea
                  rows={3}
                  placeholder="Descreva observações adicionais..."
                  value={obs}
                  onChange={e => salvarObs(e.target.value)}
                />

                {valorAtual === 'nao-aplica' && (
                  <div className={styles.alertaNA}>
                    <p>Item desconsiderado do cálculo do índice de conformidade (N/A).</p>
                  </div>
                )}

                {foto ? (
                  <div className={styles.fotoAnexada}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden' }}>
                      {typeof foto === 'string' && foto.startsWith('data:image') ? (
                        <img src={foto} alt="Evidência fotográfica" className={styles.miniaturaFoto} />
                      ) : (
                        <IconPhoto size={24} color="var(--accent, #3b82f6)" />
                      )}
                      <span className={styles.fotoNome}>
                        {typeof foto === 'string' && foto.startsWith('data:image') ? 'Foto anexada' : foto}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFoto(null);
                        if (valorAtual) responderItem(id, item.id, { valor: valorAtual, obs, foto: null });
                      }}
                      aria-label="Remover foto"
                      title="Remover foto"
                    >
                      <IconTrash size={18} />
                    </button>
                  </div>
                ) : (
                  <div className={styles.grupoBotoesFoto}>
                    <label className={styles.btnFotoAcao} title="Tirar foto usando a câmera do dispositivo">
                      <IconCamera size={20} color="var(--accent, #3b82f6)" />
                      <span>Câmera</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        style={{ display: 'none' }}
                        onChange={handleFoto}
                      />
                    </label>

                    <label className={styles.btnFotoAcao} title="Escolher imagem da galeria ou arquivos">
                      <IconPhoto size={20} color="var(--accent, #3b82f6)" />
                      <span>Galeria</span>
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleFoto}
                      />
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Barra de navegação fixa no rodapé — permite avançar e voltar livremente */}
      <div className={styles.barraNav}>
        <button
          type="button"
          className={styles.btnNav}
          onClick={itemAnterior}
          disabled={!temAnterior}
          aria-label="Item anterior"
        >
          <IconChevronLeft size={22} />
        </button>

        <div className={styles.navInfo}>
          <span className={styles.navNumero}>{itemIdx + 1}</span>
          <span className={styles.navTotal}>/ {TODOS_ITENS.length}</span>
        </div>

        <button
          type="button"
          className={`${styles.btnNav} ${respondido ? styles.btnNavPrimario : ''} ${itemIdx + 1 === TODOS_ITENS.length ? styles.btnResumo : ''}`}
          onClick={proximoItem}
          aria-label={itemIdx + 1 < TODOS_ITENS.length ? "Próximo item" : "Ver resumo"}
        >
          {itemIdx + 1 < TODOS_ITENS.length ? (
            <IconChevronRight size={22} />
          ) : (
            <span>Resumo</span>
          )}
        </button>
      </div>
    </div>
  );
}
