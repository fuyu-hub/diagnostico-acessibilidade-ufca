// Testes das regras do Firestore no emulador: npm run test:regras
// Usa um projeto de demonstração, sem tocar no projeto real.
import { readFileSync } from 'node:fs';
import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, getDoc, getDocs, setDoc, updateDoc, collection, serverTimestamp } from 'firebase/firestore';
import { montarCopiaPesquisa } from '../src/dados/coleta.js';

let ambiente;
const CODIGO = 'codigo-secreto-do-grupo-123';

const banco = uid => (uid ? ambiente.authenticatedContext(uid) : ambiente.unauthenticatedContext()).firestore();
const comoAdmin = fn => ambiente.withSecurityRulesDisabled(ctx => fn(ctx.firestore()));

const copiaPesquisa = (uid, extra = {}) => ({
  uidAutor: uid, enviadaEm: serverTimestamp(), versaoTermo: '2.0',
  ficha: { cidade: 'Juazeiro do Norte', rede: 'Municipal' },
  respostas: { 1: 'conforme' },
  ...extra,
});

const copiaGrupo = (extra = {}) => ({ nome: 'Ana', autor: 'aparelho-ana', respostas: {}, ...extra });

beforeAll(async () => {
  ambiente = await initializeTestEnvironment({
    projectId: 'demo-rota',
    firestore: { rules: readFileSync(process.env.REGRAS || 'firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
  });
});

afterAll(() => ambiente.cleanup());

beforeEach(async () => {
  await ambiente.clearFirestore();
  await comoAdmin(async db => {
    await setDoc(doc(db, 'equipe/coordenacao'), {});
    await setDoc(doc(db, `grupos/${CODIGO}`), { criadoPor: 'ana', status: 'aberta', blocoAvaliado: 'Bloco A' });
    await setDoc(doc(db, `grupos/${CODIGO}/participantes/ana`), copiaGrupo());
  });
});

describe('coleta para pesquisa', () => {
  it('aparelho envia a própria cópia', () =>
    assertSucceeds(setDoc(doc(banco('ana'), 'coleta/v1'), copiaPesquisa('ana'))));

  it('a cópia montada pelo app passa nas regras', () =>
    assertSucceeds(setDoc(doc(banco('ana'), 'coleta/v2'), {
      ...montarCopiaPesquisa({
        versaoChecklist: '1.0', consentimento: { versaoTermo: '2.0' },
        instituicao: { cidade: 'Crato', rede: 'Municipal', nivelEnsino: ['Fundamental'], numAlunos: '300' },
        triagem: { nivelEnsino: 'fundamental', respostas: { 1001: true } },
        dadosVistoria: { 1: { resposta: 'conforme' }, 2: { resposta: 'nao_aplica' } },
      }),
      uidAutor: 'ana', enviadaEm: serverTimestamp(),
    })));

  it('sem login não envia', () =>
    assertFails(setDoc(doc(banco(null), 'coleta/v1'), copiaPesquisa('ana'))));

  it('não envia campo fora da lista, como fotos', () =>
    assertFails(setDoc(doc(banco('ana'), 'coleta/v1'), copiaPesquisa('ana', { fotos: ['x'] }))));

  it('não envia endereço na ficha', () =>
    assertFails(setDoc(doc(banco('ana'), 'coleta/v1'), copiaPesquisa('ana', { ficha: { endereco: 'Rua A' } }))));

  it('não envia em nome de outro aparelho', () =>
    assertFails(setDoc(doc(banco('ana'), 'coleta/v1'), copiaPesquisa('joao'))));

  it('não substitui o envio de outro aparelho', async () => {
    await setDoc(doc(banco('ana'), 'coleta/v1'), copiaPesquisa('ana'));
    await assertFails(setDoc(doc(banco('joao'), 'coleta/v1'), copiaPesquisa('joao')));
  });

  it('só a equipe lê', async () => {
    await setDoc(doc(banco('ana'), 'coleta/v1'), copiaPesquisa('ana'));
    await assertFails(getDoc(doc(banco('ana'), 'coleta/v1')));
    await assertSucceeds(getDoc(doc(banco('coordenacao'), 'coleta/v1')));
  });
});

describe('grupos', () => {
  it('cria um grupo com código longo', () =>
    assertSucceeds(setDoc(doc(banco('ana'), 'grupos/outro-codigo-longo-0123456'), {
      criadoPor: 'ana', status: 'aberta', blocoAvaliado: 'Bloco B',
    })));

  it('não cria com código curto', () =>
    assertFails(setDoc(doc(banco('ana'), 'grupos/curto'), { criadoPor: 'ana', status: 'aberta', blocoAvaliado: 'B' })));

  it('quem sabe o código abre o grupo, mas ninguém lista grupos', async () => {
    await assertSucceeds(getDoc(doc(banco('joao'), `grupos/${CODIGO}`)));
    await assertFails(getDocs(collection(banco('joao'), 'grupos')));
  });

  it('só quem criou conclui o grupo', async () => {
    await assertFails(updateDoc(doc(banco('joao'), `grupos/${CODIGO}`), { status: 'concluida' }));
    await assertSucceeds(updateDoc(doc(banco('ana'), `grupos/${CODIGO}`), { status: 'concluida' }));
  });
});

describe('participantes', () => {
  const copia = (quem, uid) => doc(banco(quem), `grupos/${CODIGO}/participantes/${uid}`);

  it('entra no grupo gravando a própria cópia', () =>
    assertSucceeds(setDoc(copia('joao', 'joao'), copiaGrupo({ nome: 'João' }))));

  it('não grava a cópia de outra pessoa', () =>
    assertFails(setDoc(copia('joao', 'ana'), copiaGrupo())));

  it('quem não entrou não lê as cópias', () =>
    assertFails(getDocs(collection(banco('joao'), `grupos/${CODIGO}/participantes`))));

  it('participante lê as cópias do grupo', () =>
    assertSucceeds(getDocs(collection(banco('ana'), `grupos/${CODIGO}/participantes`))));

  it('com o grupo concluído, ninguém grava', async () => {
    await updateDoc(doc(banco('ana'), `grupos/${CODIGO}`), { status: 'concluida' });
    await assertFails(setDoc(copia('ana', 'ana'), copiaGrupo({ respostas: { 1: {} } })));
  });
});
