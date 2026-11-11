import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  listarIndice,
  obterVistoria,
  salvarVistoria,
  excluirVistoria as excluirVistoriaRepo,
  garantirMigracao,
  estimarUsoArmazenamento,
  solicitarPersistenciaStorage,
  verificarPersistenciaStorage,
  registrarDataUltimoBackup,
  obterDataUltimoBackup,
} from '../dados/repositorio.js';
import { Vistoria } from '../dados/esquema.js';
import {
  gerarUUID,
  normalizarValorResposta,
  extrairMarcaTriagem,
} from '../dados/migracoes.js';
import {
  criarEnvelopeExportacao,
  compartilharOuBaixarEnvelope,
  analisarArquivoImportacao,
  dividirEmLotes,
  gerarNomeArquivoExportacao,
} from '../dados/exportacao.js';
import { gravarLote } from '../dados/gravacao.js';
import { resolverConflito } from '../dados/conflito.js';
import { calcularStatusVistoria } from '../dados/checklist.js';
import { listarFotos, camposFotos } from '../dados/fotos.js';
import { carimbarResposta, extrairCarimbos } from '../dados/mescla.js';
import { obterAutorLocal } from '../dados/identidade.js';
import { consentimentoParaNovaVistoria } from '../dados/consentimento.js';
import { enviarPendentes, lerEnvios } from '../dados/coleta.js';
import { nuvemDisponivel, conectarNuvem } from '../dados/nuvem.js';
import {
  criarGrupo, entrarNoGrupo, iniciarSincronizacao, aplicarCopiasRemotas,
  mudarStatusGrupo, montarPacoteFotos, lerPacoteFotos, juntarFotos,
} from '../dados/sincronizacao.js';
import { useNotificacao } from './NotificacaoContext.jsx';
import ModalErroCota from '../componentes/ModalErroCota.jsx';

const VistoriaContext = createContext(null);

const CHAVE_STORAGE_BACKUP = 'nbr9050_vistorias';
const INTERVALO_NOVA_TENTATIVA = 15000;

/**
 * Enriquece uma Vistoria canônica com getters e propriedades compatíveis com
 * o código das telas legadas (id, nome, respostas.valor, ficha institucional).
 */
function enriquecerParaUI(canonica) {
  if (!canonica) return null;

  const respostasLegadas = {};
  for (const [k, d] of Object.entries(canonica.dadosVistoria || {})) {
    if (!d) continue;
    let valor = d.resposta;
    if (valor === 'nao_conforme') valor = 'nao-conforme';
    if (valor === 'nao_aplica') valor = 'nao-aplica';

    respostasLegadas[k] = {
      valor,
      obs: d.observacao || '',
      ...camposFotos(listarFotos(d)),
      resposta: d.resposta,
      observacao: d.observacao || '',
      ...extrairMarcaTriagem(d),
      ...extrairCarimbos(d),
    };
  }

  const inst = canonica.instituicao || {};

  return {
    ...canonica,
    // Aliases compatíveis com telas legadas:
    id: canonica.vistoriaId,
    nome: canonica.blocoAvaliado,
    cidade: inst.cidade || '',
    data: inst.data || canonica.dataCriacao?.split('T')[0] || '',
    dataTermino: inst.dataTermino || '',
    endereco: inst.endereco || '',
    bairro: inst.bairro || '',
    rede: inst.rede || '',
    nivelEnsino: inst.nivelEnsino || [],
    numAlunos: inst.numAlunos || '',
    numPavimentos: inst.numPavimentos || '1',
    anoConstrucao: inst.anoConstrucao || '',
    horarioInicio: inst.horarioInicio || '',
    horarioTermino: inst.horarioTermino || '',
    avaliadores: inst.avaliadores || [],
    respostas: respostasLegadas,
  };
}

/**
 * Converte um objeto enriquecido de UI de volta para o schema canônico
 */
function converterUIParaCanonica(vistoriaUI) {
  const dataAgora = new Date().toISOString();

  const dadosVistoria = {};
  const respostas = vistoriaUI.respostas || vistoriaUI.dadosVistoria || {};

  for (const [k, item] of Object.entries(respostas)) {
    if (!item) continue;
    const valorBruto = typeof item === 'object' ? (item.resposta || item.valor) : item;
    const resposta = normalizarValorResposta(valorBruto);
    const obs = typeof item === 'object' ? (item.observacao || item.obs || '') : '';
    const fotos = listarFotos(item);

    dadosVistoria[String(k)] = {
      resposta,
      observacao: typeof obs === 'string' ? obs : String(obs),
      ...camposFotos(fotos),
      ...extrairMarcaTriagem(item),
      ...extrairCarimbos(item),
    };
  }

  const instituicao = {
    nome: vistoriaUI.nome || vistoriaUI.instituicao?.nome || '',
    cidade: vistoriaUI.cidade || vistoriaUI.instituicao?.cidade || '',
    endereco: vistoriaUI.endereco || vistoriaUI.instituicao?.endereco || '',
    bairro: vistoriaUI.bairro || vistoriaUI.instituicao?.bairro || '',
    rede: vistoriaUI.rede || vistoriaUI.instituicao?.rede || '',
    nivelEnsino: vistoriaUI.nivelEnsino || vistoriaUI.instituicao?.nivelEnsino || [],
    numAlunos: String(vistoriaUI.numAlunos || vistoriaUI.instituicao?.numAlunos || ''),
    numPavimentos: String(vistoriaUI.numPavimentos || vistoriaUI.instituicao?.numPavimentos || '1'),
    anoConstrucao: String(vistoriaUI.anoConstrucao || vistoriaUI.instituicao?.anoConstrucao || ''),
    data: vistoriaUI.data || vistoriaUI.instituicao?.data || '',
    dataTermino: vistoriaUI.dataTermino || vistoriaUI.instituicao?.dataTermino || '',
    horarioInicio: vistoriaUI.horarioInicio || vistoriaUI.instituicao?.horarioInicio || '',
    horarioTermino: vistoriaUI.horarioTermino || vistoriaUI.instituicao?.horarioTermino || '',
    avaliadores: Array.isArray(vistoriaUI.avaliadores) ? vistoriaUI.avaliadores : (vistoriaUI.instituicao?.avaliadores || []),
    idLegado: vistoriaUI.instituicao?.idLegado || undefined,
  };

  const canonica = {
    vistoriaId: vistoriaUI.vistoriaId || vistoriaUI.id,
    versaoChecklist: vistoriaUI.versaoChecklist || '1.0',
    versaoClassificacao: vistoriaUI.versaoClassificacao || '1.0',
    status: vistoriaUI.status || 'rascunho',
    revisao: typeof vistoriaUI.revisao === 'number' ? vistoriaUI.revisao : 0,
    dataCriacao: vistoriaUI.dataCriacao || dataAgora,
    dataUltimaEdicao: dataAgora,
    sincronizada: Boolean(vistoriaUI.sincronizada),
    dataUltimaSincronizacao: vistoriaUI.dataUltimaSincronizacao || null,
    consentimento: vistoriaUI.consentimento || { aceito: false, versaoTermo: '1.0', dataAceite: null },
    blocoAvaliado: (vistoriaUI.blocoAvaliado || vistoriaUI.nome || 'Instituição / Bloco').trim(),
    instituicao,
    triagem: vistoriaUI.triagem || { nivelEnsino: 'nao_aplicavel', respostas: {} },
    dadosVistoria,
    resultadoSnapshot: vistoriaUI.resultadoSnapshot || null,
    grupo: vistoriaUI.grupo || null,
  };

  return Vistoria.parse(canonica);
}

export function VistoriaProvider({ children }) {
  const { mostrarToast } = useNotificacao();
  const [vistorias, setVistorias] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [alertaCota, setAlertaCota] = useState(null); // { usadoMB, cotaMB, percentualUso } se >= 80%
  const [erroCota, setErroCota] = useState(null); // objeto com vistoria para escape emergencial
  const [armazenamentoPersistido, setArmazenamentoPersistido] = useState(false);
  const [ultimoBackup, setUltimoBackup] = useState(() => obterDataUltimoBackup());
  const [enviosPesquisa, setEnviosPesquisa] = useState(() => lerEnvios());
  const vistoriasRef = useRef(vistorias);

  useEffect(() => {
    vistoriasRef.current = vistorias;
  }, [vistorias]);

  /**
   * Envio das vistorias concluídas à pesquisa (Escopo 09, Etapa 4): alguns segundos depois
   * de cada mudança, ao abrir o app e quando a internet volta. Sem servidor configurado, nada.
   */
  const enviarParaPesquisa = useCallback(() => {
    if (!nuvemDisponivel()) return;
    enviarPendentes(vistoriasRef.current, conectarNuvem)
      .then(setEnviosPesquisa)
      .catch(err => console.warn('Envio à pesquisa adiado:', err));
  }, []);

  useEffect(() => {
    if (carregando) return undefined;
    const timer = setTimeout(enviarParaPesquisa, 5000);
    return () => clearTimeout(timer);
  }, [vistorias, carregando, enviarParaPesquisa]);

  useEffect(() => {
    window.addEventListener('online', enviarParaPesquisa);
    return () => window.removeEventListener('online', enviarParaPesquisa);
  }, [enviarParaPesquisa]);

  /**
   * Solicitação e verificação de persistência durável no navegador (§3.1/B5)
   */
  useEffect(() => {
    async function inicializarPersistencia() {
      try {
        const jaPersistido = await verificarPersistenciaStorage();
        if (jaPersistido) {
          setArmazenamentoPersistido(true);
        } else {
          const concedido = await solicitarPersistenciaStorage();
          setArmazenamentoPersistido(concedido);
        }
      } catch (err) {
        console.warn('Erro ao verificar/solicitar persistência de dados:', err);
      }
    }
    inicializarPersistencia();
  }, []);

  async function pedirPersistenciaManual() {
    const concedido = await solicitarPersistenciaStorage();
    setArmazenamentoPersistido(concedido);
    return concedido;
  }

  // Buffer de escritas pendentes para debounce e descarregamento imediato no pagehide
  const pendentesRef = useRef(new Map());
  const debounceTimerRef = useRef(null);
  const novaTentativaRef = useRef(null);
  const avisoFalhaRef = useRef(false);
  const gravacoesEmCursoRef = useRef(new Set());

  /**
   * Monitoramento preventivo de cota de armazenamento (aviso a 80% - §3.4)
   */
  useEffect(() => {
    async function monitorarArmazenamento() {
      try {
        const info = await estimarUsoArmazenamento();
        if (info && info.percentualUso >= 80) {
          setAlertaCota(info);
        } else {
          setAlertaCota(null);
        }
      } catch (err) {
        console.warn('Falha ao monitorar armazenamento:', err);
      }
    }

    monitorarArmazenamento();
    const timer = setInterval(monitorarArmazenamento, 60000);
    return () => clearInterval(timer);
  }, []);

  /**
   * Salva efetivamente todas as vistorias pendentes no IndexedDB
   */
  const flushPendentes = useCallback(async () => {
    if (pendentesRef.current.size === 0) return;

    const listaParaGravar = Array.from(pendentesRef.current.values());
    pendentesRef.current.clear();
    clearTimeout(novaTentativaRef.current);
    setSalvando(true);

    let concluirGravacao;
    const gravacaoEmCurso = new Promise(resolve => { concluirGravacao = resolve; });
    gravacoesEmCursoRef.current.add(gravacaoEmCurso);

    try {
      const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('ufca_vistorias_sync') : null;

      const { gravados, falhas } = await gravarLote(listaParaGravar, async (itemUI) => {
        const canonica = converterUIParaCanonica(itemUI);
        await salvarVistoria(canonica);
        channel?.postMessage({ tipo: 'vistoria_salva', vistoriaId: canonica.vistoriaId });
        return itemUI;
      });

      channel?.close();

      for (const { item, erro, cota } of falhas) {
        console.error('Falha ao gravar vistoria:', erro);
        const chave = item.id || item.vistoriaId;
        // Uma edição mais recente, feita durante a gravação, tem prioridade sobre a que falhou
        if (!pendentesRef.current.has(chave)) pendentesRef.current.set(chave, item);

        if (cota) {
          setErroCota({
            vistoria: converterUIParaCanonica(item),
            mensagem: 'O armazenamento do navegador está esgotado.',
          });
        }
      }

      if (falhas.length > 0) {
        if (!falhas.every(f => f.cota) && !avisoFalhaRef.current) {
          avisoFalhaRef.current = true;
          mostrarToast('Não foi possível salvar agora. Suas respostas continuam abertas e o app tentará de novo. Não feche esta página.', 'erro', 8000);
        }
        novaTentativaRef.current = setTimeout(() => flushPendentes(), INTERVALO_NOVA_TENTATIVA);
      } else if (avisoFalhaRef.current) {
        avisoFalhaRef.current = false;
        mostrarToast('Respostas salvas com sucesso.', 'sucesso');
      }

      // Sincroniza cópia de segurança no localStorage durante o período de transição
      try {
        const listaAtualizada = await Promise.all(
          gravados.map(async (v) => {
            const doc = await obterVistoria(v.id || v.vistoriaId);
            return doc;
          })
        );
        // Atualiza backup legado no localStorage
        const rawLocal = localStorage.getItem(CHAVE_STORAGE_BACKUP);
        if (rawLocal) {
          const arrLocal = JSON.parse(rawLocal);
          if (Array.isArray(arrLocal)) {
            const mapaNovos = new Map(listaAtualizada.filter(Boolean).map(x => [x.instituicao?.idLegado || x.vistoriaId, x]));
            const mesclado = arrLocal.map(item => {
              const novo = mapaNovos.get(String(item.id));
              if (novo) {
                // mantém formato compatível
                return {
                  ...item,
                  respostas: enriquecerParaUI(novo).respostas,
                };
              }
              return item;
            });
            localStorage.setItem(CHAVE_STORAGE_BACKUP, JSON.stringify(mesclado));
          }
        }
      } catch (errLocal) {
        console.warn('Backup secundário no localStorage:', errLocal);
      }
    } catch (err) {
      console.error('Erro ao descarregar vistorias no IndexedDB:', err);
    } finally {
      gravacoesEmCursoRef.current.delete(gravacaoEmCurso);
      concluirGravacao();
      setSalvando(pendentesRef.current.size > 0);
    }
  }, [mostrarToast]);

  /**
   * Grava o que está pendente e espera o término. Devolve falso se algo não pôde ser salvo.
   */
  const descarregarGravacoes = useCallback(async () => {
    clearTimeout(debounceTimerRef.current);
    await flushPendentes();
    await Promise.all(gravacoesEmCursoRef.current);
    return pendentesRef.current.size === 0;
  }, [flushPendentes]);

  /**
   * Agenda salvamento com debounce (500ms)
   */
  const agendarGravacao = useCallback((vistoriaUI) => {
    pendentesRef.current.set(vistoriaUI.id || vistoriaUI.vistoriaId, vistoriaUI);
    setSalvando(true);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      flushPendentes();
    }, 500);
  }, [flushPendentes]);

  /**
   * Vistorias em grupo (Escopo 09, Etapa 5): uma sessão de sincronização por vistoria
   * compartilhada, enquanto o app está aberto.
   */
  const [estadoGrupos, setEstadoGrupos] = useState({});
  const sessoesRef = useRef(new Map());

  const aplicarRespostasRemotas = useCallback((vistoriaId, dados) => {
    setVistorias(prev => prev.map(v => {
      if (v.vistoriaId !== vistoriaId) return v;
      const atualizada = {
        ...v,
        dadosVistoria: dados,
        status: calcularStatusVistoria(dados, v.triagem),
        revisao: (v.revisao || 0) + 1,
        dataUltimaEdicao: new Date().toISOString(),
      };
      const ui = enriquecerParaUI(atualizada);
      agendarGravacao(ui);
      return ui;
    }));
  }, [agendarGravacao]);

  const CAMPOS_FICHA_GRUPO = ['nome', 'cidade', 'endereco', 'bairro', 'rede', 'nivelEnsino', 'numAlunos',
    'numPavimentos', 'anoConstrucao', 'data', 'dataTermino', 'horarioInicio', 'horarioTermino'];

  // Ficha da escola editada por quem compartilhou: os avaliadores deste aparelho ficam como estão
  const aplicarFichaDoGrupo = useCallback((vistoriaId, ficha, bloco) => {
    setVistorias(prev => prev.map(v => {
      if (v.vistoriaId !== vistoriaId) return v;
      const inst = v.instituicao || {};
      const mudou = CAMPOS_FICHA_GRUPO.some(c => ficha[c] !== undefined && JSON.stringify(ficha[c]) !== JSON.stringify(inst[c]))
        || (bloco && bloco !== v.blocoAvaliado);
      if (!mudou) return v;
      const atualizada = {
        ...v,
        blocoAvaliado: bloco || v.blocoAvaliado,
        instituicao: { ...inst, ...ficha, avaliadores: inst.avaliadores || [] },
        dataUltimaEdicao: new Date().toISOString(),
      };
      const ui = enriquecerParaUI(atualizada);
      agendarGravacao(ui);
      return ui;
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agendarGravacao]);

  useEffect(() => {
    if (carregando || !nuvemDisponivel()) return;
    const sessoes = sessoesRef.current;
    const emGrupo = new Map(vistorias.filter(v => v.grupo).map(v => [v.vistoriaId, v]));

    for (const [id, sessao] of sessoes) {
      if (!emGrupo.has(id) || emGrupo.get(id).grupo.codigo !== sessao.codigo) {
        sessao.parar();
        sessoes.delete(id);
      }
    }

    for (const [id, v] of emGrupo) {
      const existente = sessoes.get(id);
      if (existente) {
        if (existente.edicao !== v.dataUltimaEdicao) {
          existente.edicao = v.dataUltimaEdicao;
          existente.avisarMudanca();
        }
        continue;
      }
      const sessao = iniciarSincronizacao({
        codigo: v.grupo.codigo,
        conectar: conectarNuvem,
        obterLocal: () => vistoriasRef.current.find(x => x.vistoriaId === id),
        aplicarRemoto: dados => aplicarRespostasRemotas(id, dados),
        aplicarFicha: (ficha, bloco) => aplicarFichaDoGrupo(id, ficha, bloco),
        aoMudarEstado: estado => setEstadoGrupos(prev => ({ ...prev, [id]: estado })),
      });
      sessao.codigo = v.grupo.codigo;
      sessao.edicao = v.dataUltimaEdicao;
      sessoes.set(id, sessao);
    }
  }, [vistorias, carregando, aplicarRespostasRemotas, aplicarFichaDoGrupo]);

  useEffect(() => {
    const sessoes = sessoesRef.current;
    const descarregar = () => {
      if (document.visibilityState === 'hidden') sessoes.forEach(s => s.descarregar());
    };
    document.addEventListener('visibilitychange', descarregar);
    return () => {
      document.removeEventListener('visibilitychange', descarregar);
      sessoes.forEach(s => s.parar());
      sessoes.clear();
    };
  }, []);

  /**
   * Descarrega dados no fechamento ou suspensão da aba (mobile)
   */
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        flushPendentes();
      }
    }

    function handlePageHide() {
      flushPendentes();
    }

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handlePageHide);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handlePageHide);
    };
  }, [flushPendentes]);

  /**
   * Carga inicial com garantia de migração e montagem de índice completo
   */
  useEffect(() => {
    let cancelado = false;

    async function carregar() {
      try {
        await garantirMigracao();
        const indice = await listarIndice();

        // Carrega os documentos completos em memória para respostas instantâneas na UI
        const docs = await Promise.all(
          indice.map(async (item) => {
            const doc = await obterVistoria(item.vistoriaId);
            return doc ? enriquecerParaUI(doc) : null;
          })
        );

        if (!cancelado) {
          setVistorias(docs.filter(Boolean));
        }
      } catch (err) {
        console.error('Falha ao carregar vistorias do repositório:', err);
      } finally {
        if (!cancelado) {
          setCarregando(false);
        }
      }
    }

    carregar();

    return () => {
      cancelado = true;
    };
  }, []);

  /**
   * Sincronização em tempo real entre abas no mesmo navegador
   */
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;

    const channel = new BroadcastChannel('ufca_vistorias_sync');

    channel.onmessage = async (event) => {
      if (event.data?.tipo === 'vistoria_salva' && event.data.vistoriaId) {
        const idAtualizado = event.data.vistoriaId;
        try {
          const doc = await obterVistoria(idAtualizado);
          if (doc) {
            const ui = enriquecerParaUI(doc);
            setVistorias(prev => {
              const existe = prev.some(p => p.id === ui.id || p.vistoriaId === ui.vistoriaId);
              if (existe) {
                return prev.map(p => (p.id === ui.id || p.vistoriaId === ui.vistoriaId ? ui : p));
              }
              return [ui, ...prev];
            });
          }
        } catch (err) {
          console.warn('Erro ao sincronizar aba com evento BroadcastChannel:', err);
        }
      }
    };

    return () => {
      channel.close();
    };
  }, []);

  /**
   * Cria nova vistoria no formato canônico
   */
  function criarVistoria(dados) {
    const dataAgora = new Date().toISOString();
    const novoId = gerarUUID();
    const bloco = (dados.nome || dados.blocoAvaliado || 'Nova Vistoria').trim();

    const instituicao = {
      nome: bloco,
      cidade: dados.cidade || '',
      endereco: dados.endereco || '',
      bairro: dados.bairro || '',
      rede: dados.rede || '',
      nivelEnsino: dados.nivelEnsino || [],
      numAlunos: String(dados.numAlunos || ''),
      numPavimentos: String(dados.numPavimentos || '1'),
      anoConstrucao: String(dados.anoConstrucao || ''),
      data: dados.data || dataAgora.split('T')[0],
      dataTermino: dados.dataTermino || '',
      horarioInicio: dados.horarioInicio || '',
      horarioTermino: dados.horarioTermino || '',
      avaliadores: Array.isArray(dados.avaliadores) ? dados.avaliadores : [],
      idLegado: undefined,
    };

    const novaCanonica = {
      vistoriaId: novoId,
      versaoChecklist: '1.0',
      versaoClassificacao: '1.0',
      status: 'rascunho',
      revisao: 0,
      dataCriacao: dataAgora,
      dataUltimaEdicao: dataAgora,
      sincronizada: false,
      dataUltimaSincronizacao: null,
      consentimento: consentimentoParaNovaVistoria(),
      blocoAvaliado: bloco,
      instituicao,
      triagem: { nivelEnsino: 'nao_aplicavel', respostas: {} },
      dadosVistoria: {},
      resultadoSnapshot: null,
    };

    const novaUI = enriquecerParaUI(novaCanonica);

    // Atualiza estado da UI imediatamente
    setVistorias(prev => [novaUI, ...prev]);

    // Persiste no repositório
    salvarVistoria(novaCanonica).catch(e => {
      console.error('Erro ao salvar nova vistoria:', e);
      agendarGravacao(novaUI);
    });

    return novoId;
  }

  /**
   * Registra a resposta de um item do checklist com compatibilidade total
   */
  function responderItem(vistoriaId, itemId, resposta) {
    setVistorias(prev =>
      prev.map(v => {
        if (v.id !== vistoriaId && v.vistoriaId !== vistoriaId) {
          return v;
        }

        const dadosAtuais = { ...(v.dadosVistoria || {}) };
        const idStr = String(itemId);
        const anterior = dadosAtuais[idStr];
        let nova;

        if (!resposta) {
          // Limpa a resposta. O registro vazio e carimbado leva a remoção aos outros aparelhos.
          nova = { resposta: null, observacao: '', ...camposFotos([]) };
        } else {
          const valorBruto = typeof resposta === 'object' ? (resposta.resposta || resposta.valor) : resposta;
          const respostaNorm = normalizarValorResposta(valorBruto);
          const obs = typeof resposta === 'object' ? (resposta.observacao || resposta.obs || '') : '';
          const fotos = listarFotos(resposta);

          nova = {
            resposta: respostaNorm,
            observacao: obs,
            ...camposFotos(fotos),
            ...extrairMarcaTriagem(resposta),
          };
        }

        // Responder de novo um item com divergência também a encerra
        dadosAtuais[idStr] = carimbarResposta(nova, anterior, obterAutorLocal());

        // Determina novo status canônico conforme §2.1 e §7.1 do Escopo 1
        const novoStatus = calcularStatusVistoria(dadosAtuais, v.triagem);

        const atualizada = {
          ...v,
          status: novoStatus,
          revisao: (v.revisao || 0) + 1,
          dataUltimaEdicao: new Date().toISOString(),
          dadosVistoria: dadosAtuais,
        };

        const atualizadaUI = enriquecerParaUI(atualizada);
        agendarGravacao(atualizadaUI);
        return atualizadaUI;
      })
    );
  }

  /**
   * Obtém uma vistoria por ID (suporta tanto UUID canônico quanto ID legado)
   */
  function getVistoria(idBuscado) {
    if (!idBuscado) return null;
    const str = String(idBuscado);
    return (
      vistorias.find(v => v.id === str || v.vistoriaId === str || v.instituicao?.idLegado === str) || null
    );
  }

  /**
   * Remove uma vistoria do estado e do repositório
   */
  function removerVistoria(id) {
    const vistoria = getVistoria(id);
    const uuid = vistoria?.vistoriaId || vistoria?.id || id;

    setVistorias(prev => prev.filter(v => v.id !== id && v.vistoriaId !== uuid));
    pendentesRef.current.delete(uuid);
    pendentesRef.current.delete(id);

    excluirVistoriaRepo(uuid).catch(e => console.error('Erro ao excluir do repositório:', e));
  }

  /**
   * Atualiza dados de cabeçalho ou metadados de uma vistoria
   */
  function atualizarVistoria(id, novosDados) {
    setVistorias(prev =>
      prev.map(v => {
        if (v.id !== id && v.vistoriaId !== id) {
          return v;
        }

        const bloco = novosDados.nome || novosDados.blocoAvaliado || v.blocoAvaliado;
        const instAtual = v.instituicao || {};

        const novaInstituicao = {
          ...instAtual,
          nome: bloco,
          cidade: novosDados.cidade !== undefined ? novosDados.cidade : instAtual.cidade,
          endereco: novosDados.endereco !== undefined ? novosDados.endereco : instAtual.endereco,
          bairro: novosDados.bairro !== undefined ? novosDados.bairro : instAtual.bairro,
          rede: novosDados.rede !== undefined ? novosDados.rede : instAtual.rede,
          nivelEnsino: novosDados.nivelEnsino !== undefined ? novosDados.nivelEnsino : instAtual.nivelEnsino,
          numAlunos: novosDados.numAlunos !== undefined ? String(novosDados.numAlunos) : instAtual.numAlunos,
          numPavimentos: novosDados.numPavimentos !== undefined ? String(novosDados.numPavimentos) : instAtual.numPavimentos,
          anoConstrucao: novosDados.anoConstrucao !== undefined ? String(novosDados.anoConstrucao) : instAtual.anoConstrucao,
          data: novosDados.data !== undefined ? novosDados.data : instAtual.data,
          dataTermino: novosDados.dataTermino !== undefined ? novosDados.dataTermino : instAtual.dataTermino,
          horarioInicio: novosDados.horarioInicio !== undefined ? novosDados.horarioInicio : instAtual.horarioInicio,
          horarioTermino: novosDados.horarioTermino !== undefined ? novosDados.horarioTermino : instAtual.horarioTermino,
          avaliadores: novosDados.avaliadores !== undefined ? novosDados.avaliadores : instAtual.avaliadores,
        };

        const atualizada = {
          ...v,
          ...novosDados,
          blocoAvaliado: bloco,
          instituicao: novaInstituicao,
          revisao: (v.revisao || 0) + 1,
          dataUltimaEdicao: new Date().toISOString(),
        };

        const atualizadaUI = enriquecerParaUI(atualizada);
        agendarGravacao(atualizadaUI);
        return atualizadaUI;
      })
    );
  }

  /**
   * Compartilha uma vistoria: cria o grupo e devolve o código do link.
   * Recebe a vistoria da tela, que pode ter acabado de ser criada.
   */
  async function compartilharVistoria(vistoria, nome) {
    const grupo = await criarGrupo(converterUIParaCanonica(vistoria), nome, conectarNuvem);
    atualizarVistoria(vistoria.vistoriaId, { grupo });
    return grupo.codigo;
  }

  /** Entra em uma vistoria em grupo pelo código do link e devolve o id da vistoria local. */
  async function entrarEmGrupo(codigo, nome) {
    const existente = vistoriasRef.current.find(x => x.grupo?.codigo === codigo);
    if (existente) return existente.vistoriaId;

    const { grupoDoc, copias, grupo } = await entrarNoGrupo(codigo, nome, conectarNuvem);
    const local = vistoriasRef.current.find(x => x.vistoriaId === grupoDoc.vistoriaId);
    if (local) {
      atualizarVistoria(local.vistoriaId, { grupo });
      return local.vistoriaId;
    }

    const agora = new Date().toISOString();
    const dadosVistoria = aplicarCopiasRemotas({}, copias) || {};
    const canonica = Vistoria.parse({
      vistoriaId: grupoDoc.vistoriaId,
      versaoChecklist: grupoDoc.versaoChecklist || '1.0',
      status: calcularStatusVistoria(dadosVistoria, {}),
      dataCriacao: agora,
      dataUltimaEdicao: agora,
      consentimento: consentimentoParaNovaVistoria(),
      blocoAvaliado: grupoDoc.blocoAvaliado || 'Vistoria em grupo',
      instituicao: { ...(grupoDoc.ficha || {}), avaliadores: [nome.trim()] },
      dadosVistoria,
      grupo,
    });
    setVistorias(prev => [enriquecerParaUI(canonica), ...prev]);
    await salvarVistoria(canonica);
    return canonica.vistoriaId;
  }

  /** Quem compartilhou conclui (fecha para edição) ou reabre o grupo. */
  async function mudarStatusDoGrupo(vistoriaId, status) {
    const v = vistoriasRef.current.find(x => x.vistoriaId === vistoriaId);
    if (!v?.grupo) throw new Error('Esta vistoria não está em grupo.');
    await mudarStatusGrupo(v.grupo.codigo, status, conectarNuvem);
  }

  /** Envia as fotos deste aparelho por arquivo (WhatsApp, Drive, proximidade...). */
  async function exportarFotosDoGrupo(vistoriaId) {
    const v = vistoriasRef.current.find(x => x.vistoriaId === vistoriaId);
    if (!v) throw new Error('Vistoria não encontrada.');
    const nome = v.grupo?.nome || v.avaliadores?.[0] || '';
    const pacote = montarPacoteFotos(v, nome);
    const total = Object.values(pacote.fotos).reduce((n, l) => n + l.length, 0);
    if (total === 0) throw new Error('Este aparelho ainda não tem fotos nesta vistoria.');
    const arquivo = new File(
      [JSON.stringify(pacote)],
      `Fotos - ${v.blocoAvaliado || 'Vistoria'}${nome ? ` - ${nome}` : ''}.json`,
      { type: 'application/json' },
    );
    if (navigator.canShare?.({ files: [arquivo] })) {
      try {
        await navigator.share({ title: `Fotos da vistoria ${v.blocoAvaliado}`, files: [arquivo] });
        return { total, metodo: 'share' };
      } catch (err) {
        if (err?.name === 'AbortError') return { total: 0, cancelado: true };
      }
    }
    const url = URL.createObjectURL(arquivo);
    const link = document.createElement('a');
    link.href = url;
    link.download = arquivo.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    return { total, metodo: 'download' };
  }

  /**
   * Recebe um pacote de fotos já lido como JSON. Devolve `null` se não for um pacote.
   * As fotos entram nos itens sem mudar as respostas nem os carimbos da mescla.
   */
  function importarFotosDoGrupo(json) {
    const pacote = lerPacoteFotos(json);
    if (!pacote) return null;
    const v = vistoriasRef.current.find(x => x.vistoriaId === pacote.vistoriaId);
    if (!v) throw new Error('A vistoria destas fotos não está neste aparelho. Entre no grupo antes de receber as fotos.');
    const { dados, adicionadas, semResposta } = juntarFotos(v.dadosVistoria, pacote);
    if (adicionadas > 0) {
      setVistorias(prev => prev.map(x => {
        if (x.vistoriaId !== pacote.vistoriaId) return x;
        const ui = enriquecerParaUI({ ...x, dadosVistoria: dados, dataUltimaEdicao: new Date().toISOString() });
        agendarGravacao(ui);
        return ui;
      }));
    }
    return { vistoriaId: pacote.vistoriaId, adicionadas, semResposta, enviadoPor: pacote.enviadoPor };
  }

  /** Botão "Sincronizar agora" de uma vistoria em grupo. */
  async function sincronizarGrupo(vistoriaId) {
    const sessao = sessoesRef.current.get(vistoriaId);
    if (!sessao) throw new Error('Esta vistoria não está em grupo.');
    await sessao.sincronizarAgora();
  }

  /**
   * Exporta uma vistoria individual em Envelope JSON
   */
  async function exportarVistoria(vistoriaId) {
    const v = getVistoria(vistoriaId);
    if (!v) throw new Error('Vistoria não encontrada para exportação.');
    const canonica = converterUIParaCanonica(v);
    const envelope = criarEnvelopeExportacao(canonica);
    return compartilharOuBaixarEnvelope(envelope);
  }

  /**
   * Exporta todas as vistorias em lote em Envelope JSON
   */
  async function exportarTodasVistorias() {
    if (vistorias.length === 0) {
      throw new Error('Nenhuma vistoria para exportar.');
    }
    const canonicas = vistorias.map(v => converterUIParaCanonica(v));
    const lotes = dividirEmLotes(canonicas);
    let res;

    for (const [i, lote] of lotes.entries()) {
      const envelope = criarEnvelopeExportacao(lote);
      const nome = lotes.length > 1
        ? gerarNomeArquivoExportacao(lote).replace(/\.json$/, ` - Parte ${i + 1} de ${lotes.length}.json`)
        : undefined;
      res = await compartilharOuBaixarEnvelope(envelope, nome);
      if (res.cancelado) return res;
    }

    const dataBackup = registrarDataUltimoBackup();
    setUltimoBackup(dataBackup);
    return res;
  }

  /**
   * Importa vistorias de um texto JSON com tratamento de colisões
   */
  async function importarConteudoJson(conteudoTexto, onConflito) {
    const resultado = analisarArquivoImportacao(conteudoTexto);
    const importadas = [];
    const conflitos = [];

    for (const remota of resultado.vistorias) {
      const local = getVistoria(remota.vistoriaId) || getVistoria(remota.instituicao?.idLegado);

      if (!local) {
        // Sem colisão: grava diretamente
        await salvarVistoria(remota);
        importadas.push(enriquecerParaUI(remota));
      } else {
        // Colisão: precisa de resolução
        conflitos.push({ local: converterUIParaCanonica(local), remota });
      }
    }

    // Atualiza estado com as sem conflito
    if (importadas.length > 0) {
      setVistorias(prev => [
        ...importadas,
        ...prev.filter(p => !importadas.some(i => i.id === p.id)),
      ]);
    }

    // Se houver callback de conflito e conflitos pendentes, devolve para a interface resolver
    if (conflitos.length > 0 && typeof onConflito === 'function') {
      return onConflito(conflitos);
    }

    return { importadasDiretas: importadas.length, conflitos: conflitos.length };
  }

  /**
   * Aplica a resolução de um conflito específico
   */
  async function aplicarResolucaoConflito(local, remota, estrategia) {
    const nomesExistentes = vistorias.map(v => v.blocoAvaliado || v.nome);
    const resolucao = resolverConflito(local, remota, estrategia, nomesExistentes);

    if (resolucao.acao === 'salvar' || resolucao.acao === 'criar') {
      await salvarVistoria(resolucao.vistoria);
      const ui = enriquecerParaUI(resolucao.vistoria);

      setVistorias(prev => {
        if (resolucao.acao === 'criar') {
          return [ui, ...prev];
        }
        return prev.map(p => (p.id === ui.id || p.vistoriaId === ui.vistoriaId ? ui : p));
      });
    }

    return resolucao;
  }

  return (
    <VistoriaContext.Provider
      value={{
        vistorias,
        carregando,
        salvando,
        descarregarGravacoes,
        alertaCota,
        erroCota,
        criarVistoria,
        responderItem,
        getVistoria,
        removerVistoria,
        atualizarVistoria,
        exportarVistoria,
        exportarTodasVistorias,
        importarConteudoJson,
        aplicarResolucaoConflito,
        estimarArmazenamento: estimarUsoArmazenamento,
        armazenamentoPersistido,
        solicitarPersistenciaManual: pedirPersistenciaManual,
        ultimoBackup,
        enviosPesquisa,
        estadoGrupos,
        compartilharVistoria,
        entrarEmGrupo,
        sincronizarGrupo,
        mudarStatusDoGrupo,
        exportarFotosDoGrupo,
        importarFotosDoGrupo,
        registrarBackupManual: () => {
          const d = registrarDataUltimoBackup();
          setUltimoBackup(d);
          return d;
        },
      }}
    >
      {alertaCota && (
        <div
          role="alert"
          style={{
            background: 'rgba(234, 179, 8, 0.15)',
            borderBottom: '1px solid rgba(234, 179, 8, 0.35)',
            color: 'var(--text-warning)',
            padding: '10px 16px',
            fontSize: '0.84rem',
            textAlign: 'center',
            fontWeight: 600,
            position: 'sticky',
            top: 0,
            zIndex: 9999,
          }}
        >
          Aviso preventivo: Seu dispositivo utilizou {alertaCota.percentualUso}% da cota de armazenamento ({alertaCota.usadoMB} MB de {(alertaCota.cotaMB / 1024).toFixed(1)} GB). Recomendamos fazer backup das suas vistorias.
        </div>
      )}
      {children}
      <ModalErroCota
        aberto={Boolean(erroCota)}
        erro={erroCota}
        onExportarEmergencia={async () => {
          try {
            if (erroCota?.vistoria) {
              await exportarVistoria(erroCota.vistoria.vistoriaId);
            } else if (vistorias.length > 0) {
              await exportarTodasVistorias();
            }
          } catch (e) {
            console.error('Falha ao exportar emergencialmente:', e);
          }
        }}
        onFechar={() => setErroCota(null)}
      />
    </VistoriaContext.Provider>
  );
}

export function useVistoria() {
  return useContext(VistoriaContext);
}
