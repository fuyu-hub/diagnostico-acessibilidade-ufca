// Vistoria em grupo (Escopo 09, Etapa 5).
//
// Cada aparelho grava a própria cópia das respostas em grupos/{codigo}/participantes/{uid},
// sem fotos, e escuta as cópias dos outros. O que chega é mesclado no aparelho (mescla.js)
// e só é salvo se algo mudou de fato, para dois aparelhos não ficarem reenviando a mesma
// coisa um para o outro. As fotos ficam em cada aparelho: a mescla nunca as apaga.
// O código do grupo é o segredo do link: quem o tem pode entrar e editar.

import { mesclarCopias } from './mescla.js';
import { listarFotos, camposFotos } from './fotos.js';
import { obterAutorLocal } from './identidade.js';

const ESPERA_ENVIO = 3000;
const PRAZO_REDE = 15000;

/** Código aleatório de 128 bits em base64url (22 caracteres). */
export function gerarCodigoGrupo() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function linkDoGrupo(codigo, origem = globalThis.location?.origin || '') {
  return `${origem}/grupo/${codigo}`;
}

/** Código do grupo dentro de um link `/grupo/<codigo>` (lido no QR code ou colado), ou `null`. */
export function extrairCodigoGrupo(texto) {
  const achado = String(texto || '').match(/\/grupo\/([A-Za-z0-9_-]{22,})/);
  return achado ? achado[1] : null;
}

const CAMPOS_FICHA = ['nome', 'cidade', 'endereco', 'bairro', 'rede', 'nivelEnsino', 'numAlunos',
  'numPavimentos', 'anoConstrucao', 'data', 'dataTermino', 'horarioInicio', 'horarioTermino'];

/** Ficha da escola compartilhada com o grupo. Os avaliadores de cada aparelho ficam de fora. */
export function fichaDoGrupo(vistoria) {
  const inst = vistoria.instituicao || {};
  const ficha = {};
  for (const campo of CAMPOS_FICHA) {
    if (inst[campo] !== undefined && inst[campo] !== null) ficha[campo] = inst[campo];
  }
  return ficha;
}

/** Respostas como vão para o servidor: sem fotos e sem campos indefinidos. */
export function copiaParaGrupo(dadosVistoria = {}) {
  const respostas = {};
  for (const [id, valor] of Object.entries(dadosVistoria)) {
    if (!valor) continue;
    const { foto: _foto, fotos: _fotos, ...resto } = valor;
    respostas[id] = JSON.parse(JSON.stringify(resto));
  }
  return respostas;
}

function estavel(valor) {
  if (Array.isArray(valor)) return valor.map(estavel);
  if (valor && typeof valor === 'object') {
    return Object.fromEntries(Object.keys(valor).sort().map(k => [k, estavel(valor[k])]));
  }
  return valor;
}

function comFotosLocais(mesclado, dadosLocais) {
  for (const id of Object.keys(mesclado)) {
    mesclado[id] = { ...mesclado[id], ...camposFotos(listarFotos(dadosLocais?.[id])) };
  }
  return mesclado;
}

/**
 * Junta as cópias recebidas às respostas deste aparelho.
 * @returns {object|null} as respostas novas, ou `null` se nada mudou
 */
export function aplicarCopiasRemotas(dadosLocais = {}, copiasRemotas = []) {
  const atual = comFotosLocais(mesclarCopias([dadosLocais]), dadosLocais);
  const novo = comFotosLocais(mesclarCopias([dadosLocais, ...copiasRemotas]), dadosLocais);
  return JSON.stringify(estavel(novo)) === JSON.stringify(estavel(atual)) ? null : novo;
}

function comPrazo(promessa, mensagem) {
  let timer;
  const prazo = new Promise((_, rejeitar) => {
    timer = setTimeout(() => rejeitar(new Error(mensagem)), PRAZO_REDE);
  });
  return Promise.race([promessa, prazo]).finally(() => clearTimeout(timer));
}

const SEM_INTERNET = 'Sem resposta do servidor. Confira a internet e tente de novo.';

function exigirInternet() {
  if (globalThis.navigator?.onLine === false) {
    throw new Error('Para compartilhar ou entrar em uma vistoria em grupo, é preciso internet.');
  }
}

function copiaDoParticipante(nome, dadosVistoria, fs, inicial = false) {
  return {
    nome: String(nome).trim().slice(0, 60),
    autor: obterAutorLocal(),
    respostas: copiaParaGrupo(dadosVistoria),
    ultimaSincronizacao: fs.serverTimestamp(),
    ...(inicial ? { entrouEm: fs.serverTimestamp() } : {}),
  };
}

/** Cria o grupo de uma vistoria. Devolve o campo `grupo` a gravar na vistoria. */
export async function criarGrupo(vistoria, nome, conectar) {
  exigirInternet();
  const { db, fs, uid } = await comPrazo(conectar(), SEM_INTERNET);
  const codigo = gerarCodigoGrupo();

  await comPrazo(fs.setDoc(fs.doc(db, 'grupos', codigo), {
    vistoriaId: vistoria.vistoriaId,
    criadoPor: uid,
    criadoEm: fs.serverTimestamp(),
    status: 'aberta',
    versaoChecklist: vistoria.versaoChecklist || '1.0',
    ficha: fichaDoGrupo(vistoria),
    blocoAvaliado: String(vistoria.blocoAvaliado || 'Vistoria').slice(0, 200),
  }), SEM_INTERNET);

  await comPrazo(fs.setDoc(
    fs.doc(db, 'grupos', codigo, 'participantes', uid),
    copiaDoParticipante(nome, vistoria.dadosVistoria, fs, true),
  ), SEM_INTERNET);

  return { codigo, nome: String(nome).trim(), papel: 'responsavel', entrouEm: new Date().toISOString() };
}

/** Lê os dados públicos do grupo para mostrar antes de entrar. */
export async function lerGrupo(codigo, conectar) {
  exigirInternet();
  const { db, fs } = await comPrazo(conectar(), SEM_INTERNET);
  const snap = await comPrazo(fs.getDoc(fs.doc(db, 'grupos', codigo)), SEM_INTERNET);
  if (!snap.exists()) throw new Error('Este link não leva a nenhuma vistoria. Peça um novo link a quem compartilhou.');
  return snap.data();
}

/**
 * Entra no grupo: grava a própria cópia e baixa as dos outros.
 * @returns {{ grupoDoc, copias, grupo }} `grupo` é o campo a gravar na vistoria local
 */
export async function entrarNoGrupo(codigo, nome, conectar, dadosLocais = {}) {
  const grupoDoc = await lerGrupo(codigo, conectar);
  if (grupoDoc.status !== 'aberta') {
    throw new Error('Esta vistoria já foi concluída por quem a compartilhou.');
  }

  const { db, fs, uid } = await conectar();
  await comPrazo(fs.setDoc(
    fs.doc(db, 'grupos', codigo, 'participantes', uid),
    copiaDoParticipante(nome, dadosLocais, fs, true),
  ), SEM_INTERNET);

  const snap = await comPrazo(fs.getDocs(fs.collection(db, 'grupos', codigo, 'participantes')), SEM_INTERNET);
  const copias = snap.docs.filter(d => d.id !== uid).map(d => d.data().respostas || {});

  return {
    grupoDoc,
    copias,
    grupo: {
      codigo,
      nome: String(nome).trim(),
      papel: grupoDoc.criadoPor === uid ? 'responsavel' : 'participante',
      entrouEm: new Date().toISOString(),
    },
  };
}

/**
 * Mantém uma vistoria em grupo sincronizada enquanto o app está aberto.
 * @param {object} opcoes
 * @param {Function} opcoes.obterLocal - devolve a vistoria atual deste aparelho
 * @param {Function} opcoes.aplicarRemoto - recebe as respostas mescladas para salvar
 * @param {Function} opcoes.aoMudarEstado - recebe o estado para a tela
 */
export function iniciarSincronizacao({ codigo, conectar, obterLocal, aplicarRemoto, aoMudarEstado }) {
  let parado = false;
  let nuvem = null;
  let timer = null;
  let ultimaEnviada = null;
  const cancelar = [];
  const estado = { participantes: [], pendente: false, semInternet: false, ultimaSincronizacao: null, erro: null };

  function emitir(parcial) {
    Object.assign(estado, parcial);
    if (!parado) aoMudarEstado({ ...estado });
  }

  function receber(docs, uid) {
    const copias = docs.filter(d => d.id !== uid).map(d => d.data().respostas || {});
    const local = obterLocal();
    if (!local || copias.length === 0) return;
    const novo = aplicarCopiasRemotas(local.dadosVistoria, copias);
    if (novo) aplicarRemoto(novo);
  }

  function enviar() {
    clearTimeout(timer);
    timer = null;
    const local = obterLocal();
    if (!nuvem || !local?.grupo || local.dataUltimaEdicao === ultimaEnviada) return Promise.resolve();
    const { db, fs, uid } = nuvem;
    ultimaEnviada = local.dataUltimaEdicao;
    emitir({ pendente: true });
    // mergeFields substitui as respostas inteiras e preserva `entrouEm`
    return fs.setDoc(
      fs.doc(db, 'grupos', codigo, 'participantes', uid),
      copiaDoParticipante(local.grupo.nome, local.dadosVistoria, fs),
      { mergeFields: ['nome', 'autor', 'respostas', 'ultimaSincronizacao'] },
    ).catch(err => {
      ultimaEnviada = null;
      emitir({ erro: err.code || err.message });
    });
  }

  (async () => {
    try {
      nuvem = await conectar();
      if (parado) return;
      const { db, fs, uid } = nuvem;
      const participantes = fs.collection(db, 'grupos', codigo, 'participantes');

      cancelar.push(fs.onSnapshot(participantes, { includeMetadataChanges: true }, snap => {
        const confirmado = !snap.metadata.fromCache && !snap.metadata.hasPendingWrites;
        emitir({
          erro: null,
          pendente: snap.metadata.hasPendingWrites || timer !== null,
          semInternet: snap.metadata.fromCache && globalThis.navigator?.onLine === false,
          ultimaSincronizacao: confirmado ? new Date().toISOString() : estado.ultimaSincronizacao,
          participantes: snap.docs.map(d => {
            const dados = d.data({ serverTimestamps: 'estimate' });
            return {
              uid: d.id,
              nome: dados.nome,
              voce: d.id === uid,
              ultimaSincronizacao: dados.ultimaSincronizacao?.toDate?.().toISOString() ?? null,
            };
          }),
        });
        receber(snap.docs, uid);
      }, err => emitir({ erro: err.code || err.message })));

      cancelar.push(fs.onSnapshot(fs.doc(db, 'grupos', codigo), snap => {
        if (snap.exists()) emitir({ status: snap.data().status, responsavel: snap.data().criadoPor === uid });
      }, () => {}));

      enviar();
    } catch (err) {
      emitir({ erro: err.code || err.message, semInternet: globalThis.navigator?.onLine === false });
    }
  })();

  return {
    /** Avisa que a vistoria mudou neste aparelho: envia depois de alguns segundos sem mudanças. */
    avisarMudanca() {
      clearTimeout(timer);
      timer = setTimeout(enviar, ESPERA_ENVIO);
      emitir({ pendente: true });
    },

    /** Botão "Sincronizar agora": envia já e busca as cópias no servidor. */
    async sincronizarAgora() {
      if (!nuvem) nuvem = await comPrazo(conectar(), SEM_INTERNET);
      const { db, fs, uid } = nuvem;
      ultimaEnviada = null;
      await comPrazo(enviar(), SEM_INTERNET);
      const snap = await comPrazo(fs.getDocsFromServer(fs.collection(db, 'grupos', codigo, 'participantes')), SEM_INTERNET);
      receber(snap.docs, uid);
      emitir({ erro: null, ultimaSincronizacao: new Date().toISOString() });
    },

    /** Envia o que estiver esperando, sem aguardar (ao esconder ou fechar o app). */
    descarregar() {
      if (timer) enviar();
    },

    parar() {
      parado = true;
      clearTimeout(timer);
      cancelar.forEach(fn => fn());
    },
  };
}
