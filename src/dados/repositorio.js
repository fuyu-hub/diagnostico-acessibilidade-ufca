import { get, set, del, createStore } from 'idb-keyval';
import { Vistoria } from './esquema.js';
import { converterLegadoParaCanonica } from './migracoes.js';

// Store dedicado no IndexedDB para o projeto UFCA
const store = createStore('ufca_acessibilidade_db', 'vistorias_store_v1');

const CHAVE_INDICE = 'ufca:indice:v1';
const CHAVE_MAPA_LEGADO = 'ufca:mapa_ids_legados:v1';
const CHAVE_FLAG_MIGRADO = 'ufca:migracao_concluida:v1';
const PREFIXO_DOC = 'ufca:vistoria:';

/**
 * Calcula um resumo leve para constar no índice
 */
function gerarEntradaIndice(vistoria) {
  const dados = vistoria.dadosVistoria || {};
  const totalRespondidos = Object.values(dados).filter(d => d && d.resposta !== null).length;

  return {
    vistoriaId: vistoria.vistoriaId,
    idLegado: vistoria.instituicao?.idLegado || null,
    blocoAvaliado: vistoria.blocoAvaliado || 'Bloco sem nome',
    cidade: vistoria.instituicao?.cidade || '',
    status: vistoria.status,
    revisao: vistoria.revisao,
    dataCriacao: vistoria.dataCriacao,
    dataUltimaEdicao: vistoria.dataUltimaEdicao,
    itensRespondidos: totalRespondidos,
  };
}

/**
 * Lista o índice leve com todas as vistorias (rápido, sem carregar documentos completos)
 */
export async function listarIndice() {
  await garantirMigracao();
  const indice = await get(CHAVE_INDICE, store);
  return Array.isArray(indice) ? indice : [];
}

/**
 * Obtém uma vistoria completa pelo UUID (ou por ID legado caso antigo)
 */
export async function obterVistoria(idBuscado) {
  if (!idBuscado) return null;
  await garantirMigracao();

  // 1. Tentar busca direta pelo ID fornecido
  let doc = await get(`${PREFIXO_DOC}${idBuscado}`, store);

  // 2. Se não encontrar, verificar se o ID fornecido é um ID legado mapeado
  if (!doc) {
    const mapa = (await get(CHAVE_MAPA_LEGADO, store)) || {};
    const uuidMapeado = mapa[String(idBuscado)];
    if (uuidMapeado) {
      doc = await get(`${PREFIXO_DOC}${uuidMapeado}`, store);
    }
  }

  if (!doc) return null;

  try {
    return Vistoria.parse(doc);
  } catch (err) {
    console.warn('Documento no IndexedDB com schema divergente, normalizando:', err);
    return converterLegadoParaCanonica(doc);
  }
}

/**
 * Salva a vistoria no IndexedDB e atualiza o índice na mesma operação
 */
export async function salvarVistoria(vistoriaEntrada) {
  const vistoria = Vistoria.parse(vistoriaEntrada);
  const entradaIndice = gerarEntradaIndice(vistoria);

  // Grava o documento completo
  await set(`${PREFIXO_DOC}${vistoria.vistoriaId}`, vistoria, store);

  // Atualiza o índice leve
  const indiceAtual = (await get(CHAVE_INDICE, store)) || [];
  const novoIndice = [
    entradaIndice,
    ...indiceAtual.filter(item => item.vistoriaId !== vistoria.vistoriaId),
  ];
  await set(CHAVE_INDICE, novoIndice, store);

  // Registra no mapa de ID legado se houver
  if (vistoria.instituicao?.idLegado) {
    const mapa = (await get(CHAVE_MAPA_LEGADO, store)) || {};
    mapa[String(vistoria.instituicao.idLegado)] = vistoria.vistoriaId;
    await set(CHAVE_MAPA_LEGADO, mapa, store);
  }

  return vistoria;
}

/**
 * Exclui a vistoria do IndexedDB e remove a entrada do índice
 */
export async function excluirVistoria(vistoriaId) {
  if (!vistoriaId) return;
  await del(`${PREFIXO_DOC}${vistoriaId}`, store);

  const indiceAtual = (await get(CHAVE_INDICE, store)) || [];
  const novoIndice = indiceAtual.filter(item => item.vistoriaId !== vistoriaId);
  await set(CHAVE_INDICE, novoIndice, store);
}

/**
 * Estima o uso de armazenamento da aplicação via Storage API
 */
export async function estimarUsoArmazenamento() {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      const usadoMB = Number(((estimate.usage || 0) / (1024 * 1024)).toFixed(2));
      const cotaMB = Number(((estimate.quota || 0) / (1024 * 1024)).toFixed(2));
      const percentualUso = cotaMB > 0 ? Math.round((usadoMB / cotaMB) * 100) : 0;
      return { usadoMB, cotaMB, percentualUso };
    } catch {
      return { usadoMB: 0, cotaMB: 0, percentualUso: 0 };
    }
  }
  return { usadoMB: 0, cotaMB: 0, percentualUso: 0 };
}

/**
 * AUTO-MIGRAÇÃO TOTALMENTE SEGURA E NÃO-DESTRUTIVA:
 * Detecta se existem vistorias no localStorage (nbr9050_vistorias).
 * Se existirem e o IndexedDB ainda não tiver sido migrado:
 * 1. Faz uma cópia de segurança em 'nbr9050_vistorias_backup_seguranca'
 * 2. Converte todas as vistorias para o formato canônico Zod
 * 3. Salva uma a uma no IndexedDB e cria o índice
 * 4. NÃO apaga o localStorage original, permitindo testes seguros
 */
let migracaoPromise = null;

export function garantirMigracao() {
  if (!migracaoPromise) {
    migracaoPromise = (async () => {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return;
      }

      try {
        const jaMigrado = await get(CHAVE_FLAG_MIGRADO, store);
        if (jaMigrado) {
          return;
        }

        const rawLocal = localStorage.getItem('nbr9050_vistorias');
        if (!rawLocal) {
          await set(CHAVE_FLAG_MIGRADO, true, store);
          return;
        }

        let listaLegada = [];
        try {
          listaLegada = JSON.parse(rawLocal);
        } catch (e) {
          console.error('Falha ao ler JSON do localStorage durante migração:', e);
          return;
        }

        if (!Array.isArray(listaLegada) || listaLegada.length === 0) {
          await set(CHAVE_FLAG_MIGRADO, true, store);
          return;
        }

        console.info(`[Migração Segura] Iniciando migração de ${listaLegada.length} vistoria(s) do localStorage para IndexedDB...`);

        // 1. Cópia de segurança no localStorage
        localStorage.setItem('nbr9050_vistorias_backup_seguranca', rawLocal);

        const mapaLegado = {};
        const itensIndice = [];

        // 2. Converte e salva cada vistoria no IndexedDB
        for (const legada of listaLegada) {
          try {
            const canonica = converterLegadoParaCanonica(legada);
            await set(`${PREFIXO_DOC}${canonica.vistoriaId}`, canonica, store);
            itensIndice.push(gerarEntradaIndice(canonica));

            if (canonica.instituicao?.idLegado) {
              mapaLegado[String(canonica.instituicao.idLegado)] = canonica.vistoriaId;
            }
          } catch (itemErr) {
            console.error('[Migração Segura] Erro ao migrar item:', legada, itemErr);
          }
        }

        // 3. Salva o índice e mapa
        await set(CHAVE_INDICE, itensIndice, store);
        await set(CHAVE_MAPA_LEGADO, mapaLegado, store);
        await set(CHAVE_FLAG_MIGRADO, true, store);

        console.info(`[Migração Segura] Concluída com sucesso! ${itensIndice.length} vistoria(s) migradas para o IndexedDB.`);
      } catch (err) {
        console.error('[Migração Segura] Falha na rotina de migração:', err);
      }
    })();
  }
  return migracaoPromise;
}
