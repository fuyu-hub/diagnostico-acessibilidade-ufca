// Consentimento para enviar vistorias concluídas à pesquisa (Escopo 09, Etapa 2).
// Só um clique em "Li e concordo" registra o aceite. Fechar o aviso não decide nada.
// Cada vistoria nova guarda o aceite vigente; vistorias antigas, ou criadas sem aceite,
// nunca são enviadas. Desligar em Ajustes interrompe todos os envios seguintes.

export const VERSAO_TERMO = '2.0';
const CHAVE = 'ufca:consentimento:v2';

/** Decisão salva neste aparelho, ou `null` se a pessoa ainda não decidiu. */
export function lerConsentimento() {
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE));
    if (salvo && typeof salvo.aceito === 'boolean' && salvo.versaoTermo === VERSAO_TERMO) {
      return salvo;
    }
  } catch {
    // Sem armazenamento ou valor corrompido: tratado como sem decisão
  }
  return null;
}

/** Registra a decisão da pessoa, com a data e a versão do termo. */
export function registrarConsentimento(aceito, agora = new Date().toISOString()) {
  const decisao = { aceito: Boolean(aceito), versaoTermo: VERSAO_TERMO, data: agora };
  try {
    localStorage.setItem(CHAVE, JSON.stringify(decisao));
  } catch (err) {
    console.warn('Não foi possível registrar o consentimento:', err);
  }
  return decisao;
}

/** Campo `consentimento` de uma vistoria criada agora. */
export function consentimentoParaNovaVistoria(decisao = lerConsentimento()) {
  return decisao?.aceito
    ? { aceito: true, versaoTermo: decisao.versaoTermo, dataAceite: decisao.data }
    : { aceito: false, versaoTermo: VERSAO_TERMO, dataAceite: null };
}

/** A vistoria foi criada com aceite deste termo, e o aceite continua valendo. */
export function podeEnviarParaPesquisa(vistoria, decisao = lerConsentimento()) {
  const c = vistoria?.consentimento;
  return Boolean(
    decisao?.aceito &&
    c?.aceito === true &&
    c.dataAceite &&
    c.versaoTermo === VERSAO_TERMO
  );
}
