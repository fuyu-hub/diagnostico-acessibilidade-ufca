import { createContext, useContext, useState, useEffect } from 'react';

const VistoriaContext = createContext(null);

const CHAVE = 'nbr9050_vistorias';

function carregarStorage() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE)) || [];
  } catch {
    return [];
  }
}

export function VistoriaProvider({ children }) {
  const [vistorias, setVistorias] = useState(carregarStorage);

  useEffect(() => {
    localStorage.setItem(CHAVE, JSON.stringify(vistorias));
  }, [vistorias]);

  function criarVistoria(dados) {
    const nova = {
      id: Date.now().toString(),
      nome: dados.nome,
      cidade: dados.cidade,
      data: dados.data,
      avaliadores: dados.avaliadores,
      respostas: {}, // { itemId: { valor: 'conforme'|'nao-conforme'|'nao-aplica'|'sim'|'nao', obs: '', foto: null } }
      criadaEm: new Date().toISOString(),
    };
    setVistorias(prev => [nova, ...prev]);
    return nova.id;
  }

  function responderItem(vistoriaId, itemId, resposta) {
    setVistorias(prev =>
      prev.map(v =>
        v.id === vistoriaId
          ? { ...v, respostas: { ...v.respostas, [itemId]: resposta } }
          : v
      )
    );
  }

  function getVistoria(id) {
    return vistorias.find(v => v.id === id) || null;
  }

  function removerVistoria(id) {
    setVistorias(prev => prev.filter(v => v.id !== id));
  }

  function atualizarVistoria(id, novosDados) {
    setVistorias(prev =>
      prev.map(v =>
        v.id === id ? { ...v, ...novosDados } : v
      )
    );
  }

  return (
    <VistoriaContext.Provider value={{ vistorias, criarVistoria, responderItem, getVistoria, removerVistoria, atualizarVistoria }}>
      {children}
    </VistoriaContext.Provider>
  );
}

export function useVistoria() {
  return useContext(VistoriaContext);
}
