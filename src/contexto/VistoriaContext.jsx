import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  listarIndice,
  obterVistoria,
  salvarVistoria,
  excluirVistoria as excluirVistoriaRepo,
  garantirMigracao,
  estimarUsoArmazenamento,
} from '../dados/repositorio.js';
import { Vistoria } from '../dados/esquema.js';
import {
  gerarUUID,
  normalizarValorResposta,
} from '../dados/migracoes.js';
import {
  criarEnvelopeExportacao,
  compartilharOuBaixarEnvelope,
  analisarArquivoImportacao,
} from '../dados/exportacao.js';
import { resolverConflito } from '../dados/conflito.js';
import { calcularStatusVistoria } from '../dados/checklist.js';
import ModalErroCota from '../componentes/ModalErroCota.jsx';

const VistoriaContext = createContext(null);

const CHAVE_STORAGE_BACKUP = 'nbr9050_vistorias';

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
      foto: d.foto || null,
      resposta: d.resposta,
      observacao: d.observacao || '',
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
    const foto = typeof item === 'object' ? (item.foto || null) : null;

    dadosVistoria[String(k)] = {
      resposta,
      observacao: typeof obs === 'string' ? obs : String(obs),
      foto: foto || null,
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
    consentimento: vistoriaUI.consentimento || { aceito: true, versaoTermo: '1.0', dataAceite: null },
    blocoAvaliado: (vistoriaUI.blocoAvaliado || vistoriaUI.nome || 'Instituição / Bloco').trim(),
    instituicao,
    triagem: vistoriaUI.triagem || { nivelEnsino: 'nao_aplicavel', respostas: {} },
    dadosVistoria,
    resultadoSnapshot: vistoriaUI.resultadoSnapshot || null,
  };

  return Vistoria.parse(canonica);
}

export function VistoriaProvider({ children }) {
  const [vistorias, setVistorias] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [alertaCota, setAlertaCota] = useState(null); // { usadoMB, cotaMB, percentualUso } se >= 80%
  const [erroCota, setErroCota] = useState(null); // objeto com vistoria para escape emergencial

  // Buffer de escritas pendentes para debounce e descarregamento imediato no pagehide
  const pendentesRef = useRef(new Map());
  const debounceTimerRef = useRef(null);

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
    setSalvando(true);

    try {
      const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('ufca_vistorias_sync') : null;

      for (const itemUI of listaParaGravar) {
        const canonica = converterUIParaCanonica(itemUI);
        try {
          await salvarVistoria(canonica);
          channel?.postMessage({ tipo: 'vistoria_salva', vistoriaId: canonica.vistoriaId });
        } catch (saveErr) {
          const isQuota = saveErr?.name === 'QuotaExceededError' ||
                          saveErr?.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
                          (saveErr?.message && /quota/i.test(saveErr.message));

          if (isQuota) {
            console.error('Estouro de cota detectado no IndexedDB (§3.4):', saveErr);
            setErroCota({
              vistoria: canonica,
              mensagem: 'O armazenamento do navegador está esgotado.',
            });
            // Re-insere para manter em memória e permitir exportação de emergência
            pendentesRef.current.set(itemUI.id || itemUI.vistoriaId, itemUI);
            break;
          }
          throw saveErr;
        }
      }

      channel?.close();

      // Sincroniza cópia de segurança no localStorage durante o período de transição
      try {
        const listaAtualizada = await Promise.all(
          listaParaGravar.map(async (v) => {
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
      setSalvando(false);
    }
  }, []);

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
      consentimento: { aceito: true, versaoTermo: '1.0', dataAceite: dataAgora },
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
    salvarVistoria(novaCanonica).catch(e => console.error('Erro ao salvar nova vistoria:', e));

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

        if (!resposta) {
          // Limpa a resposta
          dadosAtuais[idStr] = { resposta: null, observacao: '', foto: null };
        } else {
          const valorBruto = typeof resposta === 'object' ? (resposta.resposta || resposta.valor) : resposta;
          const respostaNorm = normalizarValorResposta(valorBruto);
          const obs = typeof resposta === 'object' ? (resposta.observacao || resposta.obs || '') : '';
          const foto = typeof resposta === 'object' ? (resposta.foto || null) : null;

          dadosAtuais[idStr] = {
            resposta: respostaNorm,
            observacao: obs,
            foto,
          };
        }

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
    const envelope = criarEnvelopeExportacao(canonicas);
    return compartilharOuBaixarEnvelope(envelope);
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
      }}
    >
      {alertaCota && (
        <div
          role="alert"
          style={{
            background: 'rgba(234, 179, 8, 0.15)',
            borderBottom: '1px solid rgba(234, 179, 8, 0.35)',
            color: '#ca8a04',
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
            alert('Falha ao exportar emergencialmente: ' + e.message);
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
