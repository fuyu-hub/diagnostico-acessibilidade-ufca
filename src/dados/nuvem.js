// Conexão com o Firebase (Escopo 09, Etapa 3). É o único arquivo que importa o SDK:
// as telas e os outros módulos de dados usam só as funções daqui.
//
// O SDK é carregado sob demanda, na primeira vez que alguma função de nuvem é usada,
// para não pesar na abertura do app. Sem as variáveis VITE_FIREBASE_* (.env.local),
// `nuvemDisponivel()` é falso e o app funciona como antes, só no aparelho.

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export function nuvemDisponivel() {
  return Boolean(config.apiKey && config.projectId && config.appId);
}

let conexao = null;

/**
 * Conecta ao Firebase e entra com a identificação anônima, reaproveitando a deste
 * aparelho se já existir. Devolve `{ db, uid, fs }`, em que `fs` são as funções do Firestore.
 */
export function conectarNuvem() {
  if (!nuvemDisponivel()) {
    return Promise.reject(new Error('O servidor não está configurado neste app.'));
  }

  if (!conexao) {
    conexao = (async () => {
      const [{ initializeApp }, auth, fs] = await Promise.all([
        import('firebase/app'),
        import('firebase/auth'),
        import('firebase/firestore'),
      ]);

      const app = initializeApp(config);
      // Cache em IndexedDB: guarda as escritas feitas sem internet e as envia depois
      const db = fs.initializeFirestore(app, {
        localCache: fs.persistentLocalCache({ tabManager: fs.persistentMultipleTabManager() }),
      });

      const autenticacao = auth.getAuth(app);
      await autenticacao.authStateReady();
      if (!autenticacao.currentUser) {
        await auth.signInAnonymously(autenticacao);
      }

      return { db, uid: autenticacao.currentUser.uid, fs };
    })();

    // Sem internet na primeira vez: permite tentar de novo depois
    conexao.catch(() => {
      conexao = null;
    });
  }

  return conexao;
}
