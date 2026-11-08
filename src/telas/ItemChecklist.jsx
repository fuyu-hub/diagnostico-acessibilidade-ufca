import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  IconCheck, IconX, IconMinus, IconBulb, IconRuler2, IconBook,
  IconCamera, IconTrash, IconListCheck, IconFilter, IconChevronLeft, IconChevronRight,
  IconPhoto, IconAlertCircle, IconZoomIn, IconVolume, IconPlayerStopFilled,
  IconPlayerPauseFilled, IconPlayerPlayFilled, 
} from '@tabler/icons-react';
import { useVistoria } from '../contexto/VistoriaContext';
import { useNotificacao } from '../contexto/NotificacaoContext';
import DESCRICOES_IMAGENS from '../dados/imagens.json';
import {
  TODOS_ITENS, ITENS_TECNICOS, SECOES,
  dependentesComDados, dependentesEmCascata, dependentesParaLimpar,
} from '../dados/checklist';
import { listarFotos, ehFotoExibivel } from '../dados/fotos.js';
import { tocarSomResposta } from '../utilitarios/som';
import { comprimirImagem } from '../utilitarios/imagem.js';
import { vibrarResposta, vibrarSuave } from '../utilitarios/haptico';
import { usePreferencias, movimentoReduzido } from '../utilitarios/preferencias.js';
import { useLeituraVoz, textoFalavel } from '../utilitarios/leituraVoz.js';
import FolhaInferior from '../componentes/FolhaInferior';
import VisualizadorImagem from '../componentes/VisualizadorImagem';
import ModalVisualizarFoto from '../componentes/ModalVisualizarFoto';
import Topbar from '../componentes/Topbar';
import { escolherIlustracao, useDuasColunas } from '../dados/ilustracoes.js';
import styles from './ItemChecklist.module.css';

// Abaixo desta altura, a ilustração vira um botão "Ver ilustração" para tudo caber na tela
const ALTURA_MINIMA_FIGURA = 120;

const OPCOES_TECNICO = [
  { valor: 'conforme',     label: 'Conforme',      Icone: IconCheck, tecla: '1' },
  { valor: 'nao-conforme', label: 'Não conforme',  Icone: IconX,     tecla: '2' },
  { valor: 'nao-aplica',   label: 'Não se aplica', Icone: IconMinus, tecla: '3' },
];

const OPCOES_TRIAGEM = [
  { valor: 'sim',        label: 'Sim',           Icone: IconCheck, tecla: '1' },
  { valor: 'nao',        label: 'Não',           Icone: IconX,     tecla: '2' },
  { valor: 'nao-aplica', label: 'Não se aplica', Icone: IconMinus, tecla: '3' },
];

const ROTULO_VALOR = {
  conforme: 'Conforme', 'nao-conforme': 'Não conforme', 'nao-aplica': 'Não se aplica', sim: 'Sim', nao: 'Não',
};

const ehObsAutomatica = obs => typeof obs === 'string' && (obs.startsWith('Triagem #') || obs.startsWith('Triagem:'));

/** Valor exibido: nas triagens, "conforme" e "não conforme" aparecem como Sim e Não. */
function valorExibido(item, valor) {
  if (item?.tipo !== 'triagem') return valor;
  if (valor === 'conforme') return 'sim';
  if (valor === 'nao-conforme') return 'nao';
  return valor;
}

export default function ItemChecklist() {
  const { id, n } = useParams();
  const navigate = useNavigate();
  const { getVistoria, responderItem, salvando, carregando } = useVistoria();
  const { mostrarConfirmacao, mostrarToast } = useNotificacao();
  const prefs = usePreferencias();
  const voz = useLeituraVoz();
  const duasColunas = useDuasColunas();

  const vistoria = getVistoria(id);
  const itemIdx = parseInt(n, 10) - 1;
  const item = TODOS_ITENS[itemIdx];
  const respostaAtual = vistoria?.respostas?.[item?.id];

  const [obs, setObs] = useState('');
  const [fotos, setFotos] = useState([]);
  const [folha, setFolha] = useState(null); // 'apoio' | 'evidencia'
  const [abaApoio, setAbaApoio] = useState('como');
  const [evidenciaAposNC, setEvidenciaAposNC] = useState(false);
  const [ampliada, setAmpliada] = useState(false);
  const [fotoAberta, setFotoAberta] = useState(null);
  const [mensagemAria, setMensagemAria] = useState('');
  const [salvoVisivel, setSalvoVisivel] = useState(false);
  const [figuraPequena, setFiguraPequena] = useState(false);

  const timerAvanco = useRef(null);
  const timerSalvo = useRef(null);
  const figuraRef = useRef(null);
  const perguntaRef = useRef(null);
  const btnEvidenciaRef = useRef(null);

  const ehTriagem = item?.tipo === 'triagem';
  const valorAtual = valorExibido(item, respostaAtual?.valor);
  const opcoes = ehTriagem ? OPCOES_TRIAGEM : OPCOES_TECNICO;
  const temAnterior = itemIdx > 0;
  const ehUltimo = itemIdx + 1 === TODOS_ITENS.length;
  const numItemTecnico = item && !ehTriagem ? ITENS_TECNICOS.findIndex(i => i.id === item.id) + 1 : null;
  const nomeItem = ehTriagem ? 'Triagem' : `Item ${numItemTecnico}`;
  const secao = SECOES.find(s => s.id === item?.secaoId);
  const dependentes = useMemo(() => (ehTriagem ? dependentesEmCascata(item) : []), [ehTriagem, item]);

  // Ao trocar de item: carrega observação e fotos, fecha painéis, para a leitura e põe o foco na pergunta
  useEffect(() => {
    setObs(ehObsAutomatica(respostaAtual?.obs) ? '' : (respostaAtual?.obs || ''));
    setFotos(listarFotos(respostaAtual));
    setFolha(null);
    setAmpliada(false);
    setFotoAberta(null);
    setEvidenciaAposNC(false);
    voz.parar();
    window.scrollTo(0, 0);
    perguntaRef.current?.focus({ preventScroll: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id, vistoria?.id]);

  useEffect(() => () => {
    clearTimeout(timerAvanco.current);
    clearTimeout(timerSalvo.current);
  }, []);

  // A ilustração encolhe com o espaço livre; muito pequena, vira um botão
  useEffect(() => {
    const el = figuraRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => setFiguraPequena(el.clientHeight < ALTURA_MINIMA_FIGURA));
    ro.observe(el);
    return () => ro.disconnect();
  }, [item?.id, vistoria?.id]);

  // ---------- Leitura em voz alta ----------
  const trechosLeitura = useMemo(() => {
    if (!item) return [];
    const t = [{ chave: 'pergunta', rotulo: 'Pergunta', texto: `${ehTriagem ? 'Pergunta de triagem' : nomeItem}. ${item.pergunta}` }];
    if (item.imagem && DESCRICOES_IMAGENS[item.imagem]) {
      t.push({ chave: 'figura', rotulo: 'Ilustração', texto: `Ilustração: ${DESCRICOES_IMAGENS[item.imagem]}` });
    }
    if (ehTriagem && dependentes.length) {
      t.push({ chave: 'efeito', rotulo: 'Efeito', texto: `Se a resposta for Não ou Não se aplica, ${dependentes.length} ${dependentes.length === 1 ? 'item passa' : 'itens passam'} a Não se aplica.` });
    }
    if (item.comoAveriguar) t.push({ chave: 'como', rotulo: 'Como medir', texto: `Como medir. ${textoFalavel(item.comoAveriguar)}` });
    if (item.referencia) t.push({ chave: 'referencia', rotulo: 'Referência', texto: `Referência: ${textoFalavel(item.referencia)}` });
    if (valorAtual) t.push({ chave: 'resposta', rotulo: 'Resposta', texto: `Resposta registrada: ${ROTULO_VALOR[valorAtual]}.` });
    return t;
  }, [item, ehTriagem, nomeItem, dependentes, valorAtual]);

  const lendo = chave => (voz.trechoAtual?.chave === chave ? styles.lendo : '');

  function alternarLeitura() {
    if (voz.ativo) {
      voz.parar();
      return;
    }
    if (!voz.suportada) {
      mostrarToast('Este navegador não oferece leitura em voz alta.', 'info');
      return;
    }
    voz.iniciar(trechosLeitura);
  }

  // Leitura automática ao abrir o item (Ajustes)
  useEffect(() => {
    if (!prefs.lerAoAbrir || !item || !vistoria || !voz.suportada) return;
    const t = setTimeout(() => voz.iniciar(trechosLeitura), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id, vistoria?.id, prefs.lerAoAbrir]);

  // ---------- Respostas ----------
  function marcarSalvo() {
    setSalvoVisivel(true);
    clearTimeout(timerSalvo.current);
    timerSalvo.current = setTimeout(() => setSalvoVisivel(false), 3000);
  }

  /** Grava a resposta atual do item preservando observação, fotos e a marca de N/A automático. */
  function gravar(campos) {
    responderItem(id, item.id, {
      valor: respostaAtual?.valor || null,
      obs,
      fotos,
      automatico: respostaAtual?.automatico,
      origemTriagem: respostaAtual?.origemTriagem,
      ...campos,
    });
    marcarSalvo();
  }

  /** Estado do item e dos itens abaixo dele, para o "Desfazer". */
  function capturar() {
    const ids = [item.id, ...dependentes.map(d => d.id)];
    return ids.map(i => [i, vistoria?.respostas?.[i] ? { ...vistoria.respostas[i] } : null]);
  }

  function restaurar(instantaneo) {
    for (const [i, r] of instantaneo) {
      if (!r) {
        responderItem(id, i, null);
        continue;
      }
      responderItem(id, i, {
        valor: r.valor || null,
        obs: r.obs || '',
        fotos: listarFotos(r),
        automatico: r.automatico,
        origemTriagem: r.origemTriagem,
      });
    }
  }

  function aplicarDependencias(valor) {
    if (!item?.dependentes?.length) return null;
    if (valor === 'nao' || valor === 'nao-aplica') {
      dependentesEmCascata(item).forEach(({ id: depId, origemTriagem }) => {
        responderItem(id, depId, { valor: 'nao-aplica', obs: '', fotos: [], automatico: true, origemTriagem });
      });
      if (valor === 'nao' && item.acaoSeNao === 'gatilho_nc_dependentes_na') {
        return 'nao-conforme';
      }
    } else {
      dependentesParaLimpar(item, vistoria?.respostas).forEach(depId => responderItem(id, depId, null));
    }
    return null;
  }

  const irPara = useCallback((posicao1) => {
    vibrarSuave();
    if (posicao1 > TODOS_ITENS.length) navigate(`/checklist/${id}/resultado`);
    else navigate(`/checklist/${id}/item/${posicao1}`);
  }, [id, navigate]);

  function proximoItem() {
    clearTimeout(timerAvanco.current);
    irPara(itemIdx + 2);
  }

  function itemAnterior() {
    clearTimeout(timerAvanco.current);
    if (itemIdx > 0) irPara(itemIdx);
  }

  async function selecionar(valor) {
    if (!item) return;
    clearTimeout(timerAvanco.current);

    if (ehTriagem && (valor === 'nao' || valor === 'nao-aplica')) {
      const afetados = dependentesComDados(item, vistoria?.respostas).length;
      if (afetados > 0) {
        const confirmado = await mostrarConfirmacao({
          titulo: 'Apagar respostas registradas?',
          mensagem: `${afetados === 1 ? '1 item abaixo desta pergunta já tem' : `${afetados} itens abaixo desta pergunta já têm`} resposta, observação ou foto. Ao continuar, eles passam a "Não se aplica" e esses registros são apagados. Isso não pode ser desfeito.`,
          textoConfirmar: 'Apagar e continuar',
          textoCancelar: 'Manter registros',
          perigo: true,
        });
        if (!confirmado) return;
      }
    }

    const instantaneo = capturar();
    tocarSomResposta(valor);
    vibrarResposta(valor);
    const forcado = aplicarDependencias(valor);
    const final = forcado || valor;
    responderItem(id, item.id, { valor: final, obs, fotos });
    marcarSalvo();

    const rotulo = ROTULO_VALOR[final] || final;
    const posicao = itemIdx + 1;
    const desfazer = () => {
      clearTimeout(timerAvanco.current);
      restaurar(instantaneo);
      navigate(`/checklist/${id}/item/${posicao}`);
      setMensagemAria('Resposta desfeita.');
    };

    // Não conforme: fica no item e abre a evidência (observação e fotos)
    if (final === 'nao-conforme') {
      setMensagemAria(`${nomeItem}: ${rotulo}. Registre a evidência.`);
      setEvidenciaAposNC(true);
      setFolha('evidencia');
      return;
    }

    const aviso = () => mostrarToast(`${nomeItem}: ${rotulo}.`, 'sucesso', 6000, { rotulo: 'Desfazer', fn: desfazer });
    if (prefs.avancarAoResponder) {
      setMensagemAria(`${nomeItem}: ${rotulo}. Indo para o próximo item.`);
      timerAvanco.current = setTimeout(() => {
        irPara(itemIdx + 2);
        aviso();
      }, movimentoReduzido() ? 250 : 600);
    } else {
      setMensagemAria(`${nomeItem}: ${rotulo}.`);
      aviso();
    }
  }

  // ---------- Observação e fotos ----------
  function salvarObs(valor) {
    setObs(valor);
    gravar({ obs: valor });
  }

  async function adicionarFotos(e) {
    const arquivos = Array.from(e.target.files || []);
    e.target.value = '';
    if (!arquivos.length || !item) return;
    const novas = [];
    for (const arquivo of arquivos) {
      try {
        const res = await comprimirImagem(arquivo, { qualidade: 0.75 });
        novas.push(res.dataUrl);
      } catch (err) {
        console.warn('Falha na compressão, salvando referência:', err);
        novas.push(arquivo.name);
      }
    }
    const lista = [...fotos, ...novas];
    setFotos(lista);
    gravar({ fotos: lista });
    vibrarSuave();
    setMensagemAria(novas.length === 1 ? 'Foto adicionada.' : `${novas.length} fotos adicionadas.`);
  }

  function removerFoto(indice) {
    const removida = fotos[indice];
    const lista = fotos.filter((_, i) => i !== indice);
    setFotos(lista);
    gravar({ fotos: lista });
    setFotoAberta(null);
    mostrarToast('Foto removida.', 'info', 6000, {
      rotulo: 'Desfazer',
      fn: () => {
        const devolvida = [...lista.slice(0, indice), removida, ...lista.slice(indice)];
        setFotos(devolvida);
        gravar({ fotos: devolvida });
      },
    });
  }

  function fecharEvidencia() {
    setFolha(null);
    setEvidenciaAposNC(false);
  }

  // ---------- Atalhos de teclado (WCAG 2.1.1) ----------
  // 1/C, 2/N, 3/A respondem; ← → navegam; O ouve; Z amplia
  useEffect(() => {
    function teclas(e) {
      if (!vistoria || !item || folha || ampliada || fotoAberta !== null) return;
      if (document.querySelector('[role="alertdialog"], [role="dialog"]')) return;
      const tag = e.target.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable) return;
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const k = e.key.toLowerCase();
      const indice = { 1: 0, c: 0, s: 0, 2: 1, n: 1, 3: 2, a: 2 }[k];
      if (indice !== undefined) {
        e.preventDefault();
        selecionar(opcoes[indice].valor);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        proximoItem();
      } else if (e.key === 'ArrowLeft' && temAnterior) {
        e.preventDefault();
        itemAnterior();
      } else if (k === 'o') {
        e.preventDefault();
        alternarLeitura();
      } else if (k === 'z' && item.imagem) {
        e.preventDefault();
        setAmpliada(true);
      }
    }
    window.addEventListener('keydown', teclas);
    return () => window.removeEventListener('keydown', teclas);
  });

  // ---------- Estados sem dados ----------
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
    return (
      <div className="app-shell">
        <Topbar titulo="Não encontrado" voltar={vistoria ? `/checklist/${vistoria.id}/itens` : '/'} />
        <div className="tela-body" style={{ padding: '48px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <IconAlertCircle size={56} color="var(--text-muted)" style={{ opacity: 0.6, marginBottom: 16 }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 8, color: 'var(--text-strong)' }}>
            {!vistoria ? 'Vistoria não encontrada' : 'Item não encontrado'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24, maxWidth: 360, lineHeight: 1.5 }}>
            {!vistoria
              ? 'A vistoria solicitada não foi encontrada ou foi removida.'
              : 'O item especificado não faz parte deste checklist.'}
          </p>
          <button
            type="button"
            className="btn-nav primario"
            style={{ maxWidth: 260 }}
            onClick={() => navigate(vistoria ? `/checklist/${vistoria.id}/itens` : '/')}
          >
            {vistoria ? 'Voltar para a lista de itens' : 'Voltar ao Início'}
          </button>
        </div>
      </div>
    );
  }

  // ---------- Dados derivados ----------
  const triagemPai = TODOS_ITENS.find(it => it.dependentes && it.dependentes.includes(item.id));
  const foiMarcadoPorTriagem = respostaAtual?.automatico || (
    valorAtual === 'nao-aplica' &&
    triagemPai &&
    (vistoria.respostas?.[triagemPai.id]?.valor === 'nao' || vistoria.respostas?.[triagemPai.id]?.valor === 'nao-aplica')
  );
  const origemTriagemId = respostaAtual?.origemTriagem || triagemPai?.id;
  const posicaoTriagem = TODOS_ITENS.findIndex(i => i.id === origemTriagemId) + 1;

  const descricaoImagem = item.imagem ? (DESCRICOES_IMAGENS[item.imagem] || item.subgrupo || 'Referência NBR 9050') : '';
  // Quadrada no celular e em pé; deitada nas telas de duas colunas (src/dados/ilustracoes.js)
  const ilustracao = escolherIlustracao(item.imagem, duasColunas);
  const imagemSrc = ilustracao?.src || null;
  const totalEvidencias = fotos.length + (obs ? 1 : 0);
  const semEvidencia = valorAtual === 'nao-conforme' && !obs && fotos.length === 0;
  const perguntaLonga = item.pergunta.length > 150 ? styles.longa : '';
  const toque = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;

  const rotuloObs = valorAtual === 'nao-conforme' ? 'Descreva a não conformidade'
    : valorAtual === 'nao-aplica' ? 'Justificativa do "Não se aplica"'
    : 'Observação';

  const textosApoio = {
    como: textoFalavel(item.comoAveriguar) || 'Sem orientação cadastrada para este item.',
    dica: item.dica || 'Sem dica cadastrada para este item.',
    norma: item.referencia ? `${item.referencia}. Consulte o texto da norma no item indicado.` : 'Este item não tem referência normativa cadastrada.',
  };
  const ABAS_APOIO = [
    { id: 'como', rotulo: 'Como medir', Icone: IconRuler2 },
    { id: 'dica', rotulo: 'Dica', Icone: IconBulb },
    { id: 'norma', rotulo: 'Norma', Icone: IconBook },
  ];

  function teclasAbas(e) {
    if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    e.preventDefault();
    const ids = ABAS_APOIO.map(a => a.id);
    const proxima = ids[(ids.indexOf(abaApoio) + (e.key === 'ArrowRight' ? 1 : -1) + ids.length) % ids.length];
    setAbaApoio(proxima);
    document.getElementById(`aba-apoio-${proxima}`)?.focus();
  }

  // ---------- Peças da tela ----------
  const figura = imagemSrc ? (
    <div className={`${styles.figura} ${figuraPequena ? styles.figuraPequena : ''} ${lendo('figura')}`}>
      <img src={imagemSrc} alt={descricaoImagem} draggable="false" />
      <button type="button" className={styles.ampliar} onClick={() => setAmpliada(true)} aria-keyshortcuts="Z">
        <span className={styles.lupa}>
          <IconZoomIn size={18} aria-hidden="true" />
          {figuraPequena ? 'Ver ilustração' : 'Ampliar'}
          <span className="sr-only"> a ilustração</span>
        </span>
      </button>
    </div>
  ) : ehTriagem ? (
    <section className={`${styles.painelTexto} ${lendo('efeito')}`} tabIndex={0} aria-labelledby="titulo-efeito-triagem">
      <h2 id="titulo-efeito-triagem">Se responder Não ou Não se aplica</h2>
      {item.acaoSeNao === 'gatilho_nc_dependentes_na' && (
        <p className={styles.alertaNC}>Se "Não": este item será marcado como <strong>Não conforme</strong> (obrigatório por norma).</p>
      )}
      {dependentes.length > 0 ? (
        <>
          <p>Estes <strong>{dependentes.length} {dependentes.length === 1 ? 'item passa' : 'itens passam'}</strong> a <strong>Não se aplica</strong> e saem do cálculo:</p>
          <ul>
            {dependentes.map(d => {
              const dep = TODOS_ITENS.find(i => i.id === d.id);
              return <li key={d.id}>{dep?.pergunta}</li>;
            })}
          </ul>
        </>
      ) : (
        <p>Nenhum outro item depende desta resposta.</p>
      )}
      <p className={styles.notaPequena}>Se algum deles já tiver resposta, foto ou observação, o app pede confirmação antes de apagar.</p>
    </section>
  ) : (
    <section className={`${styles.painelTexto} ${lendo('como')}`} tabIndex={0} aria-labelledby="titulo-como-medir">
      <h2 id="titulo-como-medir"><IconRuler2 size={16} aria-hidden="true" /> Como medir</h2>
      <p>{textosApoio.como}</p>
      {item.dica && (<><h2><IconBulb size={16} aria-hidden="true" /> Dica</h2><p>{item.dica}</p></>)}
    </section>
  );

  return (
    <div className={styles.tela}>
      <header className={styles.topo}>
        <button
          type="button"
          className={styles.btnIcone}
          aria-label="Voltar para a lista de itens"
          onClick={() => navigate(`/checklist/${id}/itens?secao=${item.secaoId || 1}&subgrupo=${encodeURIComponent(item.subgrupo || '')}`)}
        >
          <IconChevronLeft size={26} />
        </button>
        <div className={styles.titulos}>
          <span className={styles.rotuloSecao}>{secao?.nome}</span>
          <h1 className={styles.tituloSubgrupo}>{item.subgrupo || 'Item'}</h1>
        </div>
        <button type="button" className={styles.btnTexto} onClick={() => navigate(`/checklist/${id}/itens`)}>
          <IconListCheck size={20} aria-hidden="true" /> Itens
        </button>
      </header>

      <main
        className={`${styles.principal} ${imagemSrc ? styles.comImagem : ''}`}
        style={imagemSrc ? { '--proporcao-figura': ilustracao.altura / ilustracao.largura } : undefined}
      >
        <div className={styles.blocoPergunta}>
          {ehTriagem && (
            <span className={styles.faixaTriagem}>
              <IconFilter size={16} aria-hidden="true" />
              <span><strong>Pergunta de triagem</strong> · define quais itens se aplicam</span>
            </span>
          )}
          <p
            ref={perguntaRef}
            tabIndex={-1}
            id="rotulo-pergunta-item"
            className={`${styles.pergunta} ${perguntaLonga} ${lendo('pergunta')}`}
          >
            {!ehTriagem && <span className="sr-only">{nomeItem}. </span>}
            {item.pergunta}
          </p>
          {foiMarcadoPorTriagem && (
            <div className={styles.faixaAuto} role="note">
              <span><IconFilter size={16} aria-hidden="true" /> Definido pela Pergunta de Triagem {origemTriagemId ? `#${origemTriagemId}` : ''}: marcado como Não se aplica.</span>
              {posicaoTriagem > 0 && (
                <button type="button" className={styles.btnPequeno} onClick={() => irPara(posicaoTriagem)}>Alterar</button>
              )}
            </div>
          )}
        </div>

        <div className={styles.areaFigura} ref={figuraRef}>
          {figura}
          {voz.ativo && !ampliada && (
            <div className={styles.playerVoz} role="region" aria-label="Leitura em voz alta">
              <span className={styles.playerEstado}>
                {voz.pausado ? 'Pausado' : 'Lendo'}: <span>{voz.trechoAtual?.rotulo}</span> ({voz.indice + 1} de {voz.trechos.length})
              </span>
              <button
                type="button"
                className={styles.btnIcone}
                onClick={() => (voz.pausado ? voz.retomar() : voz.pausar())}
                aria-label={voz.pausado ? 'Continuar leitura' : 'Pausar leitura'}
              >
                {voz.pausado ? <IconPlayerPlayFilled size={20} /> : <IconPlayerPauseFilled size={20} />}
              </button>
              <button
                type="button"
                className={`${styles.btnIcone} ${styles.velocidade}`}
                onClick={() => {
                  const v = voz.alternarVelocidade();
                  setMensagemAria(`Velocidade ${String(v).replace('.', ',')}`);
                }}
                aria-label={`Velocidade ${String(prefs.velocidadeVoz).replace('.', ',')} vezes. Alterar`}
              >
                {String(prefs.velocidadeVoz).replace('.', ',')}×
              </button>
              <button type="button" className={styles.btnIcone} onClick={voz.parar} aria-label="Parar leitura">
                <IconPlayerStopFilled size={20} />
              </button>
            </div>
          )}
        </div>

        <div className={styles.apoio}>
          <button type="button" className={styles.btnApoio} onClick={alternarLeitura} aria-pressed={voz.ativo} aria-keyshortcuts="O">
            {voz.ativo ? <IconPlayerStopFilled size={20} aria-hidden="true" /> : <IconVolume size={20} aria-hidden="true" />}
            <span>{voz.ativo ? 'Parar' : 'Ouvir'}</span>
          </button>
          <button type="button" className={`${styles.btnApoio} ${lendo('como')}`} onClick={() => setFolha('apoio')} aria-haspopup="dialog">
            <IconRuler2 size={20} aria-hidden="true" />
            <span>Como medir</span>
          </button>
          <button
            type="button"
            ref={btnEvidenciaRef}
            className={`${styles.btnApoio} ${semEvidencia ? styles.btnApoioPendente : ''}`}
            onClick={() => setFolha('evidencia')}
            aria-haspopup="dialog"
            aria-describedby={semEvidencia ? 'aviso-sem-evidencia' : undefined}
          >
            <IconCamera size={20} aria-hidden="true" />
            <span>{semEvidencia ? 'Registrar evidência' : 'Foto e obs.'}</span>
            {totalEvidencias > 0 && (
              <span className={styles.contador} aria-label={`${fotos.length} ${fotos.length === 1 ? 'foto' : 'fotos'}${obs ? ' e observação' : ''}`}>
                {totalEvidencias}
              </span>
            )}
          </button>
          {semEvidencia && <span id="aviso-sem-evidencia" className="sr-only">Não conformidade sem foto nem observação.</span>}
        </div>

        <div className={styles.respostas}>
          {/* Opções em grupo de rádio (WCAG 1.3.1 e 4.1.2) */}
          <fieldset role="radiogroup" aria-labelledby="rotulo-pergunta-item" className={styles.grupoRespostas}>
            <legend className="sr-only">Opções de avaliação para o item #{item.id}</legend>
            {opcoes.map(({ valor, label, Icone, tecla }) => {
              const selecionado = valorAtual === valor;
              return (
                <button
                  key={valor}
                  type="button"
                  role="radio"
                  aria-checked={selecionado}
                  aria-label={`${label}${selecionado ? ' (selecionado)' : ''}`}
                  aria-keyshortcuts={tecla}
                  data-valor={valor}
                  className={`${styles.btnResposta} ${selecionado ? styles[`sel_${valor.replace('-', '_').replace('-', '_')}`] : ''} ${lendo('resposta') && selecionado ? styles.lendo : ''}`}
                  onClick={() => selecionar(valor)}
                >
                  <Icone size={24} aria-hidden="true" />
                  <span>{label}</span>
                  <span className={styles.tecla} aria-hidden="true">{tecla}</span>
                </button>
              );
            })}
          </fieldset>
        </div>
      </main>

      {/* Região ao vivo para leitores de tela anunciarem respostas e ações (WCAG 4.1.3) */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {mensagemAria}
      </div>

      <nav className={styles.navegacao} aria-label="Navegação entre itens">
        <button
          type="button"
          className={styles.btnNav}
          onClick={itemAnterior}
          disabled={!temAnterior}
          aria-label="Ir para o item anterior"
          aria-keyshortcuts="ArrowLeft"
        >
          <IconChevronLeft size={22} aria-hidden="true" />
          <span>Anterior</span>
        </button>
        <div className={styles.navInfo}>
          {ehTriagem ? <span>Triagem</span> : <span>Item <strong>{numItemTecnico}</strong> de {ITENS_TECNICOS.length}</span>}
          {(salvando || salvoVisivel) && (
            <span className={styles.salvo}>{salvando ? 'Salvando…' : <><IconCheck size={14} aria-hidden="true" /> Salvo</>}</span>
          )}
        </div>
        <button
          type="button"
          className={`${styles.btnNav} ${valorAtual ? styles.btnNavPrimario : ''}`}
          onClick={proximoItem}
          aria-label={ehUltimo ? 'Concluir e ver resumo do diagnóstico' : 'Ir para o próximo item'}
          aria-keyshortcuts="ArrowRight"
        >
          <span>{ehUltimo ? 'Resumo' : 'Próximo'}</span>
          <IconChevronRight size={22} aria-hidden="true" />
        </button>
      </nav>

      {/* ---------- Folhas ---------- */}
      <FolhaInferior aberto={folha === 'apoio'} titulo="Orientações do item" onFechar={() => setFolha(null)}>
        <div className={styles.abas} role="tablist" aria-label="Tipo de orientação" onKeyDown={teclasAbas}>
          {ABAS_APOIO.map(({ id: idAba, rotulo, Icone }) => (
            <button
              key={idAba}
              id={`aba-apoio-${idAba}`}
              type="button"
              role="tab"
              aria-selected={abaApoio === idAba}
              aria-controls="painel-apoio"
              tabIndex={abaApoio === idAba ? 0 : -1}
              onClick={() => setAbaApoio(idAba)}
            >
              <Icone size={18} aria-hidden="true" /> {rotulo}
            </button>
          ))}
        </div>
        <div id="painel-apoio" role="tabpanel" aria-labelledby={`aba-apoio-${abaApoio}`} tabIndex={0} className={styles.textoApoio}>
          <p className={voz.trechoAtual?.chave === 'apoio' ? styles.lendo : ''}>{textosApoio[abaApoio]}</p>
        </div>
        {voz.suportada && (
          <button
            type="button"
            className={styles.btnSecundario}
            onClick={() => (voz.ativo ? voz.parar() : voz.iniciar([{ chave: 'apoio', rotulo: ABAS_APOIO.find(a => a.id === abaApoio).rotulo, texto: textosApoio[abaApoio] }]))}
          >
            {voz.ativo ? <IconPlayerStopFilled size={18} aria-hidden="true" /> : <IconVolume size={18} aria-hidden="true" />}
            {voz.ativo ? 'Parar leitura' : 'Ouvir este texto'}
          </button>
        )}
      </FolhaInferior>

      <FolhaInferior
        aberto={folha === 'evidencia'}
        titulo="Observação e fotos"
        onFechar={fecharEvidencia}
        focoInicial="#obs-item-checklist"
        rodape={
          <>
            <button type="button" className={styles.btnSecundario} onClick={fecharEvidencia}>Concluir</button>
            {evidenciaAposNC && prefs.avancarAoResponder && (
              <button type="button" className={styles.btnPrimario} onClick={() => { fecharEvidencia(); proximoItem(); }}>
                Salvar e ir ao próximo <IconChevronRight size={18} aria-hidden="true" />
              </button>
            )}
          </>
        }
      >
        {evidenciaAposNC && (
          <p className={styles.aviso} role="note">
            <IconAlertCircle size={18} aria-hidden="true" />
            <span>Não conforme registrado. Descreva o que encontrou e, se possível, a medida, e anexe uma foto.</span>
          </p>
        )}
        {valorAtual === 'nao-aplica' && (
          <p className={styles.notaPequena}>
            {foiMarcadoPorTriagem
              ? <>Item classificado como <strong>Não se aplica</strong> automaticamente pela triagem #{origemTriagemId} (fora do cálculo do índice).</>
              : 'Item desconsiderado do cálculo do índice de conformidade (N/A).'}
          </p>
        )}
        <div className={styles.campo}>
          <label htmlFor="obs-item-checklist">{rotuloObs}</label>
          <textarea
            id="obs-item-checklist"
            rows={3}
            placeholder="Ex.: largura livre de 1,32 m junto ao bebedouro"
            value={obs}
            onChange={e => salvarObs(e.target.value)}
            aria-describedby="ajuda-obs"
          />
          <span id="ajuda-obs" className={styles.ajuda}>Salvo automaticamente. Vai para o relatório.</span>
        </div>
        <div>
          <h3 className={styles.subtitulo}>Fotos ({fotos.length})</h3>
          <ul className={styles.fotos}>
            {fotos.map((f, i) => (
              <li key={`${i}-${f.length}`} className={styles.fotoMini}>
                {ehFotoExibivel(f) ? (
                  <button type="button" className={styles.fotoAbrir} onClick={() => setFotoAberta(i)} aria-label={`Ampliar foto ${i + 1}`}>
                    <img src={f} alt="" />
                  </button>
                ) : (
                  <span className={styles.fotoNome}><IconPhoto size={20} aria-hidden="true" />{f}</span>
                )}
                <button type="button" className={styles.fotoRemover} onClick={() => removerFoto(i)} aria-label={`Remover foto ${i + 1}`}>
                  <IconTrash size={18} />
                </button>
              </li>
            ))}
            {toque && (
              <li>
                <label className={styles.addFoto}>
                  <IconCamera size={26} aria-hidden="true" />
                  Câmera
                  <input type="file" accept="image/*" capture="environment" className={styles.inputArquivo} onChange={adicionarFotos} />
                </label>
              </li>
            )}
            <li>
              <label className={styles.addFoto}>
                <IconPhoto size={26} aria-hidden="true" />
                {toque ? 'Galeria' : 'Escolher imagem'}
                <input type="file" accept="image/*" multiple className={styles.inputArquivo} onChange={adicionarFotos} />
              </label>
            </li>
          </ul>
          <p className={styles.ajuda}>Evite fotografar pessoas, principalmente crianças.</p>
        </div>
      </FolhaInferior>

      <VisualizadorImagem
        aberto={ampliada}
        src={imagemSrc}
        titulo={item.subgrupo}
        descricao={descricaoImagem}
        larguraBase={ilustracao?.largura}
        alturaBase={ilustracao?.altura}
        voz={voz}
        trechosLeitura={descricaoImagem ? [{ chave: 'figura', rotulo: 'Ilustração', texto: `Ilustração: ${descricaoImagem}` }] : []}
        onFechar={() => setAmpliada(false)}
      />

      {fotoAberta !== null && ehFotoExibivel(fotos[fotoAberta]) && (
        <ModalVisualizarFoto
          aberto
          foto={fotos[fotoAberta]}
          numero={item.id}
          subgrupo={item.subgrupo || 'Critério NBR'}
          pergunta={item.pergunta}
          resultado={valorAtual}
          observacao={obs}
          nomeArquivo={`foto_item_${item.id}_${fotoAberta + 1}`}
          onExcluir={() => removerFoto(fotoAberta)}
          onFechar={() => setFotoAberta(null)}
        />
      )}
    </div>
  );
}
