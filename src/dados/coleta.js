// Coleta para pesquisa (Escopo 09, Etapa 4).
//
// Quando uma vistoria fica concluída, o app envia uma cópia reduzida para `coleta/{vistoriaId}`.
// Sem fotos, nomes, nome da escola, endereço, bairro nem observações. Editar uma vistoria
// concluída gera uma nova versão, que substitui a anterior no servidor.
//
// A fila offline é a do próprio Firestore: a gravação feita sem internet fica guardada no
// aparelho e segue sozinha depois. Aqui só se lembra qual versão de cada vistoria já foi
// confirmada pelo servidor, para não reenviar à toa e para mostrar o estado na tela.

import { ITENS_TECNICOS } from './checklist.js';
import { calcularIndiceItens } from './classificacao.js';
import { podeEnviarParaPesquisa } from './consentimento.js';
import { VERSAO_APP } from '../utilitarios/versaoApp.js';

const CHAVE_ENVIOS = 'ufca:coleta:enviadas:v1';
const CAMPOS_FICHA = ['cidade', 'rede', 'nivelEnsino', 'numAlunos', 'numPavimentos', 'anoConstrucao'];
const VALOR_TELA = { conforme: 'conforme', nao_conforme: 'nao-conforme', nao_aplica: 'nao-aplica' };

/** Cópia reduzida de uma vistoria, só com os campos que a pesquisa pode receber. */
export function montarCopiaPesquisa(vistoria) {
  const inst = vistoria.instituicao || {};
  const ficha = {};
  for (const campo of CAMPOS_FICHA) {
    if (inst[campo] !== undefined) ficha[campo] = inst[campo];
  }

  const respostas = {};
  for (const [id, dado] of Object.entries(vistoria.dadosVistoria || {})) {
    if (dado?.resposta) respostas[id] = dado.resposta;
  }

  const paraCalculo = Object.fromEntries(Object.entries(respostas).map(([id, r]) => [id, { valor: VALOR_TELA[r] }]));
  const indice = calcularIndiceItens(ITENS_TECNICOS, paraCalculo);

  return {
    versaoTermo: vistoria.consentimento?.versaoTermo,
    versaoChecklist: vistoria.versaoChecklist,
    versaoApp: VERSAO_APP,
    ficha,
    triagem: vistoria.triagem || {},
    respostas,
    resultado: {
      nota: indice.nota === null ? null : Number(indice.nota.toFixed(2)),
      faixa: indice.classificacao.rotulo,
      conformes: indice.conf,
      naoConformes: indice.nc,
      naoAplica: indice.na,
    },
  };
}

/** Envios confirmados neste aparelho: `{ vistoriaId: { edicao, enviadaEm } }`. */
export function lerEnvios() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_ENVIOS)) || {};
  } catch {
    return {};
  }
}

function registrarEnvio(vistoriaId, edicao, agora = new Date().toISOString()) {
  const envios = { ...lerEnvios(), [vistoriaId]: { edicao, enviadaEm: agora } };
  try {
    localStorage.setItem(CHAVE_ENVIOS, JSON.stringify(envios));
  } catch (err) {
    console.warn('Não foi possível registrar o envio à pesquisa:', err);
  }
  return envios;
}

/** A versão atual da vistoria deve ir para a pesquisa e ainda não foi confirmada. */
export function precisaEnviar(vistoria, envios = lerEnvios()) {
  return vistoria?.status === 'concluida'
    && podeEnviarParaPesquisa(vistoria)
    && envios[vistoria.vistoriaId]?.edicao !== vistoria.dataUltimaEdicao;
}

/** Estado do envio para mostrar na tela: 'enviada', 'pendente' ou `null` (não se aplica). */
export function estadoEnvio(vistoria, envios = lerEnvios()) {
  if (vistoria?.status !== 'concluida' || !podeEnviarParaPesquisa(vistoria)) return null;
  const envio = envios[vistoria.vistoriaId];
  return envio?.edicao === vistoria.dataUltimaEdicao
    ? { estado: 'enviada', enviadaEm: envio.enviadaEm }
    : { estado: 'pendente' };
}

const emAndamento = new Set();

/**
 * Envia as vistorias que precisam. A promessa de cada uma só termina quando o servidor
 * confirma; sem internet, ela espera, e a gravação fica na fila do Firestore.
 * @param {Function} conectar - `conectarNuvem` de nuvem.js (injetável nos testes)
 * @returns {Promise<object>} envios confirmados, atualizados
 */
export async function enviarPendentes(vistorias, conectar) {
  const pendentes = vistorias.filter(v => precisaEnviar(v) && !emAndamento.has(v.vistoriaId));
  if (pendentes.length === 0) return lerEnvios();

  const { db, uid, fs } = await conectar();

  await Promise.all(pendentes.map(async vistoria => {
    const chave = vistoria.vistoriaId;
    emAndamento.add(chave);
    try {
      await fs.setDoc(fs.doc(db, 'coleta', chave), {
        ...montarCopiaPesquisa(vistoria),
        uidAutor: uid,
        enviadaEm: fs.serverTimestamp(),
      });
      registrarEnvio(chave, vistoria.dataUltimaEdicao);
    } catch (err) {
      // Recusa das regras não se resolve tentando de novo (ex.: o envio original veio de
      // outra identificação deste aparelho). Registra para não insistir.
      if (err?.code === 'permission-denied') {
        console.warn('Envio à pesquisa recusado pelo servidor:', chave, err);
        registrarEnvio(chave, vistoria.dataUltimaEdicao);
      } else {
        console.warn('Envio à pesquisa adiado:', chave, err);
      }
    } finally {
      emAndamento.delete(chave);
    }
  }));

  return lerEnvios();
}
