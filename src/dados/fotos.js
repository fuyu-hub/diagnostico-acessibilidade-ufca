// Fotos de evidência de um item.
// Formato atual: `fotos` (lista). Respostas antigas e versões anteriores do app usam `foto` (uma só);
// por isso `foto` continua sendo gravada com a primeira foto da lista, e as duas formas são lidas.

/** Lista de fotos de uma resposta, aceitando o formato antigo (`foto`) e o novo (`fotos`). */
export function listarFotos(resposta) {
  if (!resposta || typeof resposta !== 'object') return [];
  if (Array.isArray(resposta.fotos)) {
    return resposta.fotos.filter(f => typeof f === 'string' && f);
  }
  return typeof resposta.foto === 'string' && resposta.foto ? [resposta.foto] : [];
}

/** Campos a gravar para uma lista de fotos: a lista e, por compatibilidade, a primeira em `foto`. */
export function camposFotos(lista) {
  const fotos = (lista || []).filter(f => typeof f === 'string' && f);
  return { fotos, foto: fotos[0] || null };
}

/** Uma foto exibível (data URL de imagem), e não apenas o nome de um arquivo. */
export function ehFotoExibivel(foto) {
  return typeof foto === 'string' && foto.startsWith('data:image');
}
