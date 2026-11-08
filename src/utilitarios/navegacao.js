import { useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { TODOS_ITENS } from '../dados/checklist';

/**
 * Regra única de navegação: voltar sobe um nível, na seta do app e no voltar do aparelho.
 *
 *   Início ─ Ajustes ─ Sobre
 *          ─ Sobre
 *          ─ Nova vistoria
 *          ─ Painel da vistoria ─ Resultado
 *                               ─ Seções ─ Seção ─ Item
 *
 * O histórico do navegador acompanha essa árvore: ir a uma tela distante empilha os níveis
 * do meio, e cada entrada guarda em `nivel` quantos ancestrais reais tem atrás de si.
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
  if (resto === 'resultado') return [...base, pathname];
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

export function useNavegacao() {
  const navigate = useNavigate();
  const { pathname, search, state } = useLocation();
  const nivel = state?.nivel ?? 0;

  const navegar = useCallback((destino) => {
    const atual = cadeiaDaRota(pathname + search);
    const alvo = cadeiaDaRota(destino, pathname);

    let comuns = 0;
    while (comuns < Math.min(atual.length, alvo.length) && atual[comuns] === alvo[comuns]) comuns += 1;
    const subir = atual.length - comuns;
    const descer = alvo.slice(comuns);
    const urlDe = (nivelDaChave) => (nivelDaChave === alvo[alvo.length - 1] ? destino : nivelDaChave);

    const empilhar = (nivelInicial) => {
      descer.forEach((chave, i) => navigate(urlDe(chave), { state: { nivel: nivelInicial + i + 1 } }));
    };

    liberarJanelas(() => {
      if (subir === 0 && descer.length === 0) {
        if (destino !== pathname + search) navigate(destino, { replace: true, state: { nivel } });
      } else if (subir === 0) {
        empilhar(nivel);
      } else if (subir === 1 && descer.length === 1) {
        // Tela vizinha, com o mesmo pai (item a item, ou criar a vistoria): não acumula histórico
        navigate(urlDe(descer[0]), { replace: true, state: { nivel } });
      } else if (nivel < subir) {
        navigate(destino, { replace: true, state: { nivel: 0 } });
      } else if (descer.length === 0) {
        navigate(-subir);
      } else {
        window.addEventListener('popstate', () => setTimeout(() => empilhar(nivel - subir), 0), { once: true });
        navigate(-subir);
      }
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
