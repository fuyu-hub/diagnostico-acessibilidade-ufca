/**
 * Identifica estouro de cota do navegador, cujo nome varia entre motores
 */
export function isErroCota(erro) {
  return erro?.name === 'QuotaExceededError' ||
    erro?.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    /quota/i.test(erro?.message || '');
}

/**
 * Tenta gravar cada item de forma independente: a falha de um não impede os demais
 * e todo item que falhou é devolvido para nova tentativa.
 */
export async function gravarLote(lista, gravar) {
  const gravados = [];
  const falhas = [];

  for (const item of lista) {
    try {
      gravados.push(await gravar(item));
    } catch (erro) {
      falhas.push({ item, erro, cota: isErroCota(erro) });
    }
  }

  return { gravados, falhas };
}
