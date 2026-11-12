import { useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { TODOS_ITENS } from '../dados/checklist';

/**
 * Regra única de navegação: voltar leva à tela anterior de verdade, na seta do app e no
 * voltar do aparelho. Cada entrada do histórico guarda em `nivel` quantas telas do app
 * existem atrás dela.
 *
 * Exceções:
 * - ir de um item a outro (Próximo, Anterior) substitui a entrada: voltar sai dos itens
 *   para a tela de antes deles;
 * - criar a vistoria substitui o formulário pelo painel;
 * - o Início não empilha: ir a ele volta no histórico até a primeira tela.
 *
 * A árvore abaixo só vale quando não há tela anterior (link aberto direto): aí o histórico
 * é montado pelos níveis acima, e voltar sobe um nível.
 *
 *   Início ─ Ajustes ─ Sobre
 *          ─ Sobre
 *          ─ Nova vistoria
 *          ─ Painel da vistoria ─ Resultado
 *                               ─ Divergências
 *                               ─ Seções ─ Seção ─ Item
 */
export function cadeiaDaRota(caminho, origem = '') {
  const [pathname, busca = ''] = caminho.split('?');
  if (pathname === '/') return ['/'];
  if (pathname === '/sobre') return origem === '/ajustes' ? ['/', '/ajustes', '/sobre'] : ['/', '/sobre'];
  if (pathname === '/ajustes' || pathname === '/nova') return ['/', pathname];

  const painel = pathname.match(/^\/vistoria\/([^/]+)$/);
  if (painel) return ['/', pathname];

  const checklist = pathname.match(/^\/checklist\/([^/]+)\/(.+)$/);
  if (!checklist) return ['/', pathname];

  const [, id, resto] = checklist;
  const base = ['/', `/vistoria/${id}`];
  const secoes = `/checklist/${id}/itens`;
  if (resto === 'resultado' || resto === 'divergencias') return [...base, pathname];
  if (resto === 'itens') {
    const secao = new URLSearchParams(busca).get('secao');
    return secao ? [...base, secoes, `${secoes}?secao=${secao}`] : [...base, secoes];
  }
  const item = resto.match(/^item\/(\d+)$/);
  if (!item) return ['/', pathname];
  const secaoDoItem = TODOS_ITENS[Number(item[1]) - 1]?.secaoId;
  return [...base, secoes, ...(secaoDoItem ? [`${secoes}?secao=${secaoDoItem}`] : []), pathname];
}

// ---------- Janelas sobrepostas: o voltar do aparelho fecha a de cima ----------
const abertas = [];
let voltasIgnoradas = 0;

if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    if (voltasIgnoradas > 0) {
      voltasIgnoradas -= 1;
      return;
    }
    abertas.pop()?.fechar();
  });
}

/** Fecha as janelas abertas (desfazendo as entradas delas no histórico) e então executa `continuar`. */
function liberarJanelas(continuar) {
  const quantidade = abertas.length;
  if (!quantidade) {
    continuar();
    return;
  }
  const janelas = abertas.splice(0);
  voltasIgnoradas += 1;
  window.addEventListener('popstate', () => setTimeout(continuar, 0), { once: true });
  janelas.reverse().forEach(janela => janela.fechar());
  window.history.go(-quantidade);
}

/** Enquanto `aberto`, o voltar do aparelho fecha esta janela em vez de sair da tela. */
export function useFecharComVoltar(aberto, onFechar) {
  const fecharRef = useRef(onFechar);

  useEffect(() => {
    fecharRef.current = onFechar;
  });

  useEffect(() => {
    if (!aberto) return undefined;
    const janela = { fechar: () => fecharRef.current?.() };
    let registrada = false;
    const espera = setTimeout(() => {
      abertas.push(janela);
      window.history.pushState(window.history.state, '');
      registrada = true;
    }, 0);

    return () => {
      clearTimeout(espera);
      if (!registrada) return;
      const posicao = abertas.indexOf(janela);
      if (posicao === -1) return;
      abertas.splice(posicao, 1);
      voltasIgnoradas += 1;
      window.history.back();
    };
  }, [aberto]);
}

/** Quantas telas do app existem atrás da atual (o react-router guarda o estado em `usr`). */
export const nivelNoHistorico = () => window.history.state?.usr?.nivel ?? 0;

const ITEM = /^\/checklist\/([^/]+)\/item\//;

/**
 * Link aberto direto (ou app aberto numa tela interna): sem tela anterior, o histórico
 * é montado com os níveis acima dela, para voltar subir um nível em vez de sair do app.
 * Roda uma vez, na primeira tela; ao recarregar, o histórico já tem `nivel`.
 */
export function useHistoricoInicial() {
  const navigate = useNavigate();
  const { pathname, search, state } = useLocation();
  const feito = useRef(false);

  useEffect(() => {
    if (feito.current) return;
    feito.current = true;
    if (state?.nivel !== undefined || pathname.startsWith('/grupo/')) return;
    const cadeia = cadeiaDaRota(pathname + search);
    if (cadeia.length < 2) return;
    const destino = pathname + search;
    navigate(cadeia[0], { replace: true, state: { nivel: 0 } });
    cadeia.slice(1).forEach((tela, i) => {
      navigate(i === cadeia.length - 2 ? destino : tela, { state: { nivel: i + 1 } });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export function useNavegacao() {
  const navigate = useNavigate();
  const { pathname, search, state } = useLocation();
  const nivel = state?.nivel ?? 0;

  const navegar = useCallback((destino) => {
    liberarJanelas(() => {
      if (destino === pathname + search) return;
      if (destino === '/') {
        // O Início é a primeira tela: volta até ela em vez de empilhar outra
        if (nivel > 0) navigate(-nivel);
        else navigate('/', { replace: true, state: { nivel: 0 } });
        return;
      }
      const itemAtual = pathname.match(ITEM);
      const itemAlvo = destino.match(ITEM);
      const trocaDeItem = itemAtual && itemAlvo && itemAtual[1] === itemAlvo[1];
      const criouVistoria = pathname === '/nova' && destino.startsWith('/vistoria/');
      if (trocaDeItem || criouVistoria) navigate(destino, { replace: true, state: { nivel } });
      else navigate(destino, { state: { nivel: nivel + 1 } });
    });
  }, [navigate, pathname, search, nivel]);

  const voltar = useCallback(() => {
    const cadeia = cadeiaDaRota(pathname + search);
    if (cadeia.length < 2) return;
    liberarJanelas(() => {
      if (nivel >= 1) navigate(-1);
      else navigate(cadeia[cadeia.length - 2], { replace: true, state: { nivel: 0 } });
    });
  }, [navigate, pathname, search, nivel]);

  return { navegar, voltar };
}

// ---------- Lista de itens: filtro, grupos abertos e último item, por seção ----------
const chaveLista = (id, secao) => `ufca:lista:${id}:${secao}`;

export function lerEstadoLista(id, secao) {
  try {
    return JSON.parse(sessionStorage.getItem(chaveLista(id, secao))) || {};
  } catch {
    return {};
  }
}

export function guardarEstadoLista(id, secao, parcial) {
  try {
    sessionStorage.setItem(chaveLista(id, secao), JSON.stringify({ ...lerEstadoLista(id, secao), ...parcial }));
  } catch {
    // Sem armazenamento da sessão, a lista só volta ao estado inicial
  }
}

/** Ao abrir um item, a lista da seção volta com o grupo dele aberto e o item à vista. */
export function lembrarItemNaLista(id, item) {
  if (!item?.secaoId) return;
  const estado = lerEstadoLista(id, item.secaoId);
  guardarEstadoLista(id, item.secaoId, {
    expandidos: { ...(estado.expandidos || {}), ...(item.subgrupo ? { [item.subgrupo]: true } : {}) },
    ultimoItem: item.id,
  });
}
