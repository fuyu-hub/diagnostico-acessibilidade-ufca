// Ciência do envio de vistorias concluídas à pesquisa (Escopo 09, Etapa 2).
// O envio é obrigatório: não há opção de recusar ou desligar. Só um clique em
// "Li e concordo" registra a ciência, e o app só segue depois dela.
// Cada vistoria nova guarda a ciência vigente; vistorias criadas antes do aviso,
// quando o app dizia que os dados ficavam só no aparelho, nunca são enviadas.

export const VERSAO_TERMO = '2.0';
const CHAVE = 'ufca:consentimento:v2';

/** Ciência registrada neste aparelho para o termo atual, ou `null`. */
export function lerConsentimento() {
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE));
    if (salvo?.aceito === true && salvo.versaoTermo === VERSAO_TERMO) return salvo;
  } catch {
    // Sem armazenamento ou valor corrompido: tratado como sem ciência
  }
  return null;
}

/** Registra a ciência, com a data e a versão do termo. */
export function registrarConsentimento(agora = new Date().toISOString()) {
  const decisao = { aceito: true, versaoTermo: VERSAO_TERMO, data: agora };
  try {
    localStorage.setItem(CHAVE, JSON.stringify(decisao));
  } catch (err) {
    console.warn('Não foi possível registrar a ciência do termo:', err);
  }
  return decisao;
}

/** Campo `consentimento` de uma vistoria criada agora. */
export function consentimentoParaNovaVistoria(decisao = lerConsentimento()) {
  return decisao
    ? { aceito: true, versaoTermo: decisao.versaoTermo, dataAceite: decisao.data }
    : { aceito: false, versaoTermo: VERSAO_TERMO, dataAceite: null };
}

/** A vistoria foi criada depois da ciência deste termo. */
export function podeEnviarParaPesquisa(vistoria) {
  const c = vistoria?.consentimento;
  return Boolean(c?.aceito === true && c.dataAceite && c.versaoTermo === VERSAO_TERMO);
}
