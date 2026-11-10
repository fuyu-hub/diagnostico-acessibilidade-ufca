import { gerarUUID } from './migracoes.js';

// Identificador aleatório deste aparelho, usado como autor das respostas na mescla.
// Não identifica a pessoa: o nome só é pedido ao entrar em uma vistoria em grupo.
const CHAVE_AUTOR = 'ufca:autor:v1';
let autorEmMemoria = null;

export function obterAutorLocal() {
  try {
    let id = localStorage.getItem(CHAVE_AUTOR);
    if (!id) {
      id = gerarUUID();
      localStorage.setItem(CHAVE_AUTOR, id);
    }
    return id;
  } catch {
    // Sem armazenamento (janela privada, testes): vale enquanto o app estiver aberto
    if (!autorEmMemoria) autorEmMemoria = gerarUUID();
    return autorEmMemoria;
  }
}
