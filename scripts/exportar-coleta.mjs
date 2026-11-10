// Exporta a coleta para pesquisa do Firestore em CSV e JSON (Escopo 09, Etapa 4).
//
// Uso:  node scripts/exportar-coleta.mjs <chave-da-conta-de-servico.json> [pasta-de-saida]
//
// A chave da conta de serviço é SEGREDO: fica só no computador de quem exporta,
// nunca no repositório nem em mensagens. Gere em Configurações do projeto → Contas de serviço.
// Para testar no emulador: FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 e "emulador" no lugar da chave.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { coletaParaCsv } from '../src/dados/coletaCsv.js';

const [chave, pasta = '.'] = process.argv.slice(2);
if (!chave) {
  console.error('Uso: node scripts/exportar-coleta.mjs <chave-da-conta-de-servico.json> [pasta-de-saida]');
  process.exit(1);
}

const app = chave === 'emulador'
  ? initializeApp({ projectId: 'demo-rota' })
  : initializeApp({ credential: cert(JSON.parse(readFileSync(chave, 'utf8'))) });

const consulta = await getFirestore(app).collection('coleta').get();
const registros = consulta.docs
  .map(doc => {
    const dados = doc.data();
    return { id: doc.id, ...dados, enviadaEm: dados.enviadaEm?.toDate?.().toISOString() ?? '' };
  })
  .sort((a, b) => a.enviadaEm.localeCompare(b.enviadaEm));

const data = new Date().toISOString().slice(0, 10);
mkdirSync(pasta, { recursive: true });
writeFileSync(join(pasta, `coleta-${data}.csv`), coletaParaCsv(registros), 'utf8');
writeFileSync(join(pasta, `coleta-${data}.json`), JSON.stringify(registros, null, 2), 'utf8');

console.log(`${registros.length} vistoria(s) exportada(s) para ${join(pasta, `coleta-${data}.csv`)} e .json`);
