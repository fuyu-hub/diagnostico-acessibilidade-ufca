import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  IconCheck, IconX, IconMinus, IconBulb, IconRuler2,
  IconChevronDown, IconChevronUp, IconCamera, IconTrash,
  IconListCheck, IconFilter, IconChevronLeft, IconChevronRight,
  IconPhoto,
} from '@tabler/icons-react';
import { useVistoria } from '../contexto/VistoriaContext';
import { TODOS_ITENS, ITENS_TECNICOS } from '../dados/checklist';
import Topbar from '../componentes/Topbar';
import BarraProgresso from '../componentes/BarraProgresso';
import { tocarSomResposta } from '../utilitarios/som';
import { comprimirImagem } from '../utilitarios/imagem.js';
import { vibrarResposta, vibrarSuave } from '../utilitarios/haptico';
import ModalVisualizarFoto from '../componentes/ModalVisualizarFoto';
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
  const [modalFotoAberto, setModalFotoAberto] = useState(false);
  const [mensagemAria, setMensagemAria] = useState('');

  const ehTriagem  = item?.tipo === 'triagem';
  let valorAtual = respostaAtual?.valor;
  if (ehTriagem) {
    if (valorAtual === 'conforme') valorAtual = 'sim';
    if (valorAtual === 'nao-conforme') valorAtual = 'nao';
  }
  const opcoes     = ehTriagem ? OPCOES_TRIAGEM : OPCOES_TECNICO;
  const temAnterior = itemIdx > 0;
  
  const numItemTecnico = ehTriagem ? null : ITENS_TECNICOS.findIndex(i => i.id === item.id) + 1;

  useEffect(() => {
    const rawObs = respostaAtual?.obs || '';
    const ehObsAutomatica = typeof rawObs === 'string' && (rawObs.startsWith('Triagem #') || rawObs.startsWith('Triagem:'));
    setObs(ehObsAutomatica ? '' : rawObs);
    setFoto(respostaAtual?.foto || null);
    setDicaAberta(false);
    setComoAberto(false);
    window.scrollTo(0, 0);
  }, [item?.id]);

  function aplicarDependencias(valor) {
    if (!item?.dependentes?.length) return null;
    if (valor === 'nao' || valor === 'nao-aplica') {
      item.dependentes.forEach(depId => {
        responderItem(id, depId, {
          valor: 'nao-aplica',
          obs: '', // Não coloca mais observação nos itens
          foto: null,
          automatico: true,
          origemTriagem: item.id,
        });
      });
      if (valor === 'nao' && item.acaoSeNao === 'gatilho_nc_dependentes_na') {
        return { valor: 'nao-conforme', obs, foto };
      }
    } else {
      item.dependentes.forEach(depId => {
        const respDep = vistoria?.respostas?.[depId];
        if (respDep?.automatico) responderItem(id, depId, null);
      });
    }
    return null;
  }

  function selecionar(valor) {
    if (!item) return;
    tocarSomResposta(valor);
    vibrarResposta(valor);
    const opcao = opcoes.find(o => o.valor === valor);
    const labelTexto = opcao ? opcao.label : valor;
    setMensagemAria(`Item #${item.id} avaliado como ${labelTexto}.`);
    const override = aplicarDependencias(valor);
    responderItem(id, item.id, override || { valor, obs, foto });
  }

  function salvarObs(val) {
    setObs(val);
    if (valorAtual && item) responderItem(id, item.id, { valor: valorAtual, obs: val, foto });
  }

  async function handleFoto(e) {
    const arquivo = e.target.files?.[0];
    if (!arquivo || !item) return;

    try {
      const res = await comprimirImagem(arquivo, { qualidade: 0.75 });
      setFoto(res.dataUrl);
      vibrarSuave();
      if (valorAtual) {
        responderItem(id, item.id, { valor: valorAtual, obs, foto: res.dataUrl });
      }
    } catch (err) {
      console.warn('Falha na compressão, salvando referência:', err);
      setFoto(arquivo.name);
      if (valorAtual) responderItem(id, item.id, { valor: valorAtual, obs, foto: arquivo.name });
    } finally {
      e.target.value = '';
    }
  }

  function proximoItem() {
    vibrarSuave();
    const proximo = itemIdx + 2;
    if (proximo <= TODOS_ITENS.length) navigate(`/checklist/${id}/item/${proximo}`);
    else navigate(`/checklist/${id}/resultado`);
  }

  function itemAnterior() {
    if (itemIdx > 0) {
      vibrarSuave();
      navigate(`/checklist/${id}/item/${itemIdx}`);
    }
  }

  // Atalhos de teclado para auditores de campo (WCAG 2.1.1):
  // 1 ou C: Conforme / Sim
  // 2 ou N: Não conforme / Não
  // 3 ou A: Não se aplica
  // Seta Direita: Próximo item
  // Seta Esquerda: Item anterior
  useEffect(() => {
    function handleKeyDown(e) {
      if (!vistoria || !item || modalFotoAberto) return;
      const tag = e.target.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;
      if (e.altKey || e.ctrlKey || e.metaKey) return;

      if (e.key === '1' || e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        selecionar(opcoes[0].valor);
      } else if (e.key === '2' || e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        selecionar(opcoes[1].valor);
      } else if (e.key === '3' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        selecionar(opcoes[2].valor);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        proximoItem();
      } else if (e.key === 'ArrowLeft') {
        if (temAnterior) {
          e.preventDefault();
          itemAnterior();
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [vistoria, item, modalFotoAberto, opcoes, valorAtual, obs, foto, itemIdx, temAnterior]);

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

  const respostasTecnicas = ITENS_CONTAVEIS.filter(item => vistoria.respostas?.[item.id]?.valor);
  const respondidos = respostasTecnicas.length;
  const pct = ITENS_CONTAVEIS.length > 0
    ? Math.round((respondidos / ITENS_CONTAVEIS.length) * 100)
    : 0;

  // Identifica se este item foi marcado como N/A por uma pergunta de triagem
  const triagemPai = TODOS_ITENS.find(it => it.dependentes && it.dependentes.includes(item.id));
  const foiMarcadoPorTriagem = respostaAtual?.automatico || (
    valorAtual === 'nao-aplica' &&
    triagemPai &&
    (vistoria.respostas?.[triagemPai.id]?.valor === 'nao' || vistoria.respostas?.[triagemPai.id]?.valor === 'nao-aplica')
  );
  const origemTriagemId = respostaAtual?.origemTriagem || triagemPai?.id;

  function classeResposta(valor) {
    if (valorAtual !== valor) return 'btn-resposta';
    if (valor === 'conforme' || valor === 'sim') return 'btn-resposta conforme';
    if (valor === 'nao-conforme' || valor === 'nao') return 'btn-resposta nao-conforme';
    if (valor === 'nao-aplica') return 'btn-resposta nao-aplica';
    return 'btn-resposta';
  }

  const imagemSrc = item.imagem ? `/imagens/${item.imagem}` : null;
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

            <p className={styles.pergunta} id="rotulo-pergunta-item">{item.pergunta}</p>

            {foiMarcadoPorTriagem && (
              <div className={styles.cardInfoTriagem}>
                <div className={styles.cardInfoTriagemHeader}>
                  <IconFilter size={16} />
                  <span>Definido pela Pergunta de Triagem {origemTriagemId ? `#${origemTriagemId}` : ''}</span>
                </div>
                <p>
                  Este item foi classificado automaticamente como <strong>Não se Aplica (N/A)</strong> em decorrência da resposta na triagem #{origemTriagemId}.
                </p>
              </div>
            )}

            {imagemSrc && (
              <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border-strong)', marginBottom: 14 }}>
                <img src={imagemSrc} alt={item.subgrupo || 'Referência NBR 9050'} style={{ width: '100%', height: 'auto', display: 'block' }} />
              </div>
            )}

            {item.referencia && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 16, lineHeight: 1.4 }}>
                <strong>Ref.:</strong> {item.referencia}
              </p>
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
                <button
                  type="button"
                  className={styles.accordionRow}
                  onClick={() => setDicaAberta(v => !v)}
                  aria-expanded={dicaAberta}
                  aria-controls="conteudo-dica-tecnica"
                >
                  <span><IconBulb size={18} /> Dica técnica</span>
                  {dicaAberta ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                </button>
                {dicaAberta && (
                  <p id="conteudo-dica-tecnica" className={styles.accordionBody}>
                    {item.dica}
                  </p>
                )}
              </>
            )}

            {item.comoAveriguar && (
              <>
                <button
                  type="button"
                  className={styles.accordionRow}
                  onClick={() => setComoAberto(v => !v)}
                  aria-expanded={comoAberto}
                  aria-controls="conteudo-como-averiguar"
                >
                  <span><IconRuler2 size={18} /> Como averiguar</span>
                  {comoAberto ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                </button>
                {comoAberto && (
                  <div id="conteudo-como-averiguar" className={styles.accordionBody}>
                    <p>{item.comoAveriguar}</p>
                  </div>
                )}
              </>
            )}
          </div>

          <div className={styles.colunaAcao}>
            {/* Botões de resposta em Fieldset semântico e Radiogroup (WCAG 1.3.1 e 4.1.2) */}
            <fieldset
              className={styles.grupoRespostas}
              role="radiogroup"
              aria-labelledby="rotulo-pergunta-item"
            >
              <legend className="sr-only">Opções de avaliação para o item #{item.id}</legend>
              {opcoes.map(({ valor, label, icone }) => {
                const selecionado = valorAtual === valor;
                return (
                  <button
                    key={valor}
                    type="button"
                    role="radio"
                    aria-checked={selecionado}
                    aria-label={`${label}${selecionado ? ' (selecionado)' : ''}`}
                    className={classeResposta(valor)}
                    onClick={() => selecionar(valor)}
                  >
                    <span className="icone">{icone}</span>
                    {label}
                  </button>
                );
              })}
            </fieldset>

            {/* Observação e foto — aparecem após selecionar */}
            {(!ehTriagem || valorAtual) && (
              <div className={styles.obsWrap}>
                <label htmlFor="obs-item-checklist" className={styles.obsLabel}>
                  {valorAtual === 'nao-conforme' ? 'Observação da não conformidade' :
                   valorAtual === 'nao-aplica'   ? 'Justificativa N/A' :
                   'Observações e fotos'}
                </label>
                <textarea
                  id="obs-item-checklist"
                  rows={3}
                  placeholder="Descreva observações adicionais..."
                  value={obs}
                  onChange={e => salvarObs(e.target.value)}
                />

                {valorAtual === 'nao-aplica' && (
                  <div className={styles.alertaNA}>
                    {foiMarcadoPorTriagem ? (
                      <p>
                        Item classificado como <strong>Não se Aplica</strong> automaticamente pela triagem #{origemTriagemId} (desconsiderado do cálculo do índice).
                      </p>
                    ) : (
                      <p>Item desconsiderado do cálculo do índice de conformidade (N/A).</p>
                    )}
                  </div>
                )}

                {foto ? (
                  <div className={styles.fotoAnexada}>
                    <div
                      role="button"
                      tabIndex={0}
                      aria-label="Ampliar foto anexada"
                      style={{ display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden', cursor: 'pointer' }}
                      onClick={() => setModalFotoAberto(true)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setModalFotoAberto(true);
                        }
                      }}
                      title="Toque para ampliar a foto"
                    >
                      {typeof foto === 'string' && foto.startsWith('data:image') ? (
                        <img src={foto} alt={`Foto comprobatória do item #${item.id}`} className={styles.miniaturaFoto} />
                      ) : (
                        <IconPhoto size={24} color="var(--accent, #3b82f6)" />
                      )}
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className={styles.fotoNome}>
                          {typeof foto === 'string' && foto.startsWith('data:image') ? 'Foto anexada' : foto}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--accent, #3b82f6)' }}>Toque para ampliar</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFoto(null);
                        if (valorAtual) responderItem(id, item.id, { valor: valorAtual, obs, foto: null });
                      }}
                      aria-label="Remover foto anexada do item"
                      title="Remover foto"
                    >
                      <IconTrash size={18} />
                    </button>
                  </div>
                ) : (
                  <div className={styles.grupoBotoesFoto}>
                    <label
                      className={styles.btnFotoAcao}
                      tabIndex={0}
                      role="button"
                      title="Tirar foto usando a câmera do dispositivo"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.currentTarget.querySelector('input')?.click();
                        }
                      }}
                    >
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

                    <label
                      className={styles.btnFotoAcao}
                      tabIndex={0}
                      role="button"
                      title="Escolher imagem da galeria ou arquivos"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.currentTarget.querySelector('input')?.click();
                        }
                      }}
                    >
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

      {/* Região ao vivo para leitores de tela anunciarem respostas e ações (WCAG 4.1.3) */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {mensagemAria}
      </div>

      {/* Barra de navegação fixa no rodapé — permite avançar e voltar livremente */}
      <div className={styles.barraNav}>
        <button
          type="button"
          className={styles.btnNav}
          onClick={itemAnterior}
          disabled={!temAnterior}
          aria-label="Ir para o item anterior"
          title="Item anterior"
        >
          <IconChevronLeft size={22} />
        </button>

        <div className={styles.navInfo} aria-live="polite" aria-atomic="true">
          {ehTriagem ? (
            <span className={styles.navNumero} style={{ fontSize: '1.3rem', fontWeight: 600 }}>Triagem</span>
          ) : (
            <>
              <span className={styles.navNumero}>{numItemTecnico}</span>
              <span className={styles.navTotal}>/ {ITENS_TECNICOS.length}</span>
            </>
          )}
        </div>

        <button
          type="button"
          className={`${styles.btnNav} ${respondido ? styles.btnNavPrimario : ''} ${itemIdx + 1 === TODOS_ITENS.length ? styles.btnResumo : ''}`}
          onClick={proximoItem}
          aria-label={itemIdx + 1 < TODOS_ITENS.length ? "Ir para o próximo item" : "Concluir e ver resumo do diagnóstico"}
          title={itemIdx + 1 < TODOS_ITENS.length ? "Próximo item" : "Ver resumo"}
        >
          {itemIdx + 1 < TODOS_ITENS.length ? (
            <IconChevronRight size={22} />
          ) : (
            <span>Resumo</span>
          )}
        </button>
      </div>

      {modalFotoAberto && foto && typeof foto === 'string' && foto.startsWith('data:image') && (
        <ModalVisualizarFoto
          aberto={modalFotoAberto}
          foto={foto}
          numero={item.id}
          subgrupo={item.subgrupo || 'Critério NBR'}
          pergunta={item.pergunta}
          resultado={valorAtual}
          observacao={obs}
          nomeArquivo={`foto_item_${item.id}`}
          onFechar={() => setModalFotoAberto(false)}
        />
      )}
    </div>
  );
}
