import { createContext, useContext, useState, useEffect } from 'react';

const VistoriaContext = createContext(null);

const CHAVE = 'nbr9050_vistorias';

const VISTORIA_EXEMPLO = {
  id: 'ufca-juazeiro-2026',
  nome: 'Universidade Federal do Cariri - UFCA (Campus Juazeiro do Norte)',
  endereco: 'Av. Tenente Raimundo Rocha, 1639',
  bairro: 'Cidade Universitária',
  cidade: 'Juazeiro do Norte, CE',
  inep: '23000001',
  rede: 'Federal',
  nivelEnsino: 'Superior',
  numAlunos: '2500',
  numPavimentos: '3',
  anoConstrucao: '2013',
  data: '2026-03-10',
  horarioInicio: '08:30',
  horarioTermino: '11:30',
  avaliadores: ['Samuel Sousa Santos', 'Camilo Erdos Viana da Silva', 'Danilo Ferreira da Silva'],
  respostas: {
    1: { valor: 'conforme', obs: '', foto: null },
    2: { valor: 'conforme', obs: '', foto: null },
    3: { valor: 'nao-conforme', obs: 'Piso com desnível superior a 5mm sem chanfro.', foto: null },
    4: { valor: 'conforme', obs: '', foto: null },
    5: { valor: 'conforme', obs: '', foto: null },
    6: { valor: 'conforme', obs: '', foto: null },
    7: { valor: 'sim', obs: '', foto: null },
    8: { valor: 'conforme', obs: '', foto: null },
    9: { valor: 'conforme', obs: '', foto: null },
    10: { valor: 'conforme', obs: '', foto: null },
  },
  criadaEm: '2026-03-10T08:30:00.000Z',
};

function carregarStorage() {
  try {
    const dados = JSON.parse(localStorage.getItem(CHAVE));
    if (Array.isArray(dados) && dados.length > 0) return dados;
    return [VISTORIA_EXEMPLO];
  } catch {
    return [VISTORIA_EXEMPLO];
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
      inep: dados.inep || '',
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
