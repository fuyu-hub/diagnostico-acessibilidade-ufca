import { version } from '../../package.json';

/** Fonte única da versão do app: o campo `version` do package.json. */
export const VERSAO_APP = version;

const CHAVE_VERSAO = 'nbr9050_versao_app';

// Só caches de recursos do app, que o service worker volta a preencher.
// Vistorias, fotos e preferências ficam no IndexedDB e no localStorage, e nunca entram nesta lista.
const CACHES_DE_RECURSOS = ['images-cache'];

/**
 * Compara a versão em uso com a da última abertura e registra a atual.
 * `anterior` é nulo na primeira abertura com este controle.
 */
export function registrarVersao(armazenamento = localStorage, atual = VERSAO_APP) {
  try {
    const anterior = armazenamento.getItem(CHAVE_VERSAO);
    if (anterior !== atual) armazenamento.setItem(CHAVE_VERSAO, atual);
    return { anterior, mudou: anterior !== null && anterior !== atual };
  } catch {
    // Sem acesso ao armazenamento, o app segue normalmente, só sem o aviso de versão
    return { anterior: null, mudou: false };
  }
}

/** Remove os caches de recursos antigos. Uma falha aqui não atrapalha o uso do app. */
export async function limparCachesDeRecursos(api = globalThis.caches) {
  if (!api) return;
  await Promise.all(CACHES_DE_RECURSOS.map(nome => api.delete(nome).catch(() => false)));
}

/**
 * Soft reset: grava o que está pendente e só então troca a versão e recarrega a página.
 * Se a gravação falhar, nada é recarregado, e a troca fica para a próxima oportunidade.
 */
export async function aplicarAtualizacao({ descarregar, atualizar }) {
  const gravado = await descarregar();
  if (!gravado) return false;
  await atualizar();
  return true;
}
