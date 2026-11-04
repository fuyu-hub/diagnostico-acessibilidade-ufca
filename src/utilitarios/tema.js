const CHAVE_TEMA = 'nbr9050_tema';
const CHAVE_CONTRASTE = 'nbr9050_alto_contraste';
const COR_BARRA = { claro: '#f4f5f7', escuro: '#0a0a0a' };

export const PREFERENCIAS_TEMA = [
  { valor: 'auto', rotulo: 'Automático' },
  { valor: 'claro', rotulo: 'Claro' },
  { valor: 'escuro', rotulo: 'Escuro' },
];

function ler(chave) {
  try {
    return localStorage.getItem(chave);
  } catch {
    return null;
  }
}

function gravar(chave, valor) {
  try {
    localStorage.setItem(chave, valor);
  } catch (err) {
    console.warn('Não foi possível guardar a preferência de aparência:', err);
  }
}

/** O tema em uso, a partir da preferência salva e do sistema. */
export function resolverTema(preferencia, sistemaEscuro) {
  if (preferencia === 'claro' || preferencia === 'escuro') return preferencia;
  return sistemaEscuro ? 'escuro' : 'claro';
}

export function obterPreferenciaTema() {
  const salvo = ler(CHAVE_TEMA);
  return PREFERENCIAS_TEMA.some(p => p.valor === salvo) ? salvo : 'auto';
}

const consultaSistema = () => window.matchMedia('(prefers-color-scheme: dark)');

function aplicarTema() {
  const tema = resolverTema(obterPreferenciaTema(), consultaSistema().matches);
  document.documentElement.dataset.tema = tema;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', COR_BARRA[tema]);
}

export function definirPreferenciaTema(preferencia) {
  gravar(CHAVE_TEMA, preferencia);
  aplicarTema();
}

export function obterAltoContraste() {
  return ler(CHAVE_CONTRASTE) === '1';
}

export function definirAltoContraste(ativo) {
  gravar(CHAVE_CONTRASTE, ativo ? '1' : '0');
  document.documentElement.classList.toggle('alto-contraste', ativo);
}

/** Aplica as preferências e acompanha o sistema enquanto estiver em Automático. */
export function iniciarTema() {
  aplicarTema();
  document.documentElement.classList.toggle('alto-contraste', obterAltoContraste());
  consultaSistema().addEventListener('change', aplicarTema);
}
