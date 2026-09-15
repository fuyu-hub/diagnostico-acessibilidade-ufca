import { createContext, useContext, useState, useEffect } from 'react';

const VistoriaContext = createContext(null);

const CHAVE = 'nbr9050_vistorias';



function carregarStorage() {
  try {
    const dados = JSON.parse(localStorage.getItem(CHAVE));
    if (Array.isArray(dados)) {
      return dados.filter(v => v.id !== 'ufca-juazeiro-2026');
    }
    return [];
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
      nome: dados.nome || '',
      cidade: dados.cidade || '',
      data: dados.data || '',
      avaliadores: dados.avaliadores || [],
      // Ficha da Instituição (modelo oficial)
      endereco: dados.endereco || '',
      bairro: dados.bairro || '',
      rede: dados.rede || '',
      nivelEnsino: dados.nivelEnsino || '',
      numAlunos: dados.numAlunos || '',
      numPavimentos: dados.numPavimentos || '',
      anoConstrucao: dados.anoConstrucao || '',
      horarioInicio: dados.horarioInicio || '',
      horarioTermino: dados.horarioTermino || '',
      respostas: {},
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
