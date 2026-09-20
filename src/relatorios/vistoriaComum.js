/* =========================================================================
 * Regras compartilhadas entre a planilha (XLSX) e o relatório (PDF):
 * categorias do modelo, leitura dos dados cadastrais e classificação das respostas.
 * ========================================================================= */

// Categorias exatamente como aparecem na coluna B do modelo de planilha
export const CATEGORIAS = [
  'Acesso Externo (Calçadas, Estacionamento e Portão/Portaria)',
  'Circulação Horizontal Interna (Corredores e Pisos)',
  'Circulação Vertical Interna (Escadas, Rampas e Elevadores)',
  'Salas de Aula e Laboratórios',
  'Auditórios e Áreas de Reunião',
  'Refeitório',
  'Áreas de Lazer e Esporte (Pátios e Quadras)',
  'Sanitários e Vestiários',
  'Áreas Administrativas (Secretaria, Sala de Professores e Atendimento)',
  'Biblioteca',
  'Demais Questões (Aparelhos e Saídas de Emergência)',
];

// secaoId do checklist.json -> índice em CATEGORIAS
// (as seções 4 "Equipamentos de Uso Comum" e 12 "Rotas de Fuga" formam a última categoria)
export const CATEGORIA_POR_SECAO = { 1: 0, 2: 1, 3: 2, 5: 3, 7: 4, 8: 5, 11: 6, 10: 7, 9: 8, 6: 9, 4: 10, 12: 10 };

const norm = s => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

/** Procura um campo em `dados.todos` (de extrairDadosInstituicao) pelas palavras do rótulo. */
export function campo(dados, ...opcoes) {
  const lista = (dados && dados.todos) || [];
  for (const opcao of opcoes) {
    const palavras = [].concat(opcao).map(norm);
    const achado = lista.find(c => palavras.every(p => norm(c.label).includes(p)));
    if (achado && achado.valor !== undefined && achado.valor !== null && String(achado.valor).trim() !== '') {
      return Array.isArray(achado.valor) ? achado.valor.join(', ') : String(achado.valor);
    }
  }
  return 'Não informado';
}

/** AAAA-MM-DD -> DD/MM/AAAA (valores que já estão em outro formato passam direto). */
export function formatarData(dataStr) {
  if (!dataStr || dataStr === 'Não informado') return '';
  const partes = dataStr.split('-');
  if (partes.length >= 3) return `${partes[2].substring(0, 2)}/${partes[1]}/${partes[0]}`;
  return dataStr;
}

/** 'sim' | 'nao' | 'na' | null (pendente) */
export function classificarResposta(valor) {
  if (valor === 'conforme' || valor === 'sim') return 'sim';
  if (valor === 'nao-conforme' || valor === 'nao') return 'nao';
  if (valor === 'nao-aplica') return 'na';
  return null;
}

/**
 * Ordena os itens pelo N° da planilha e agrupa por categoria.
 * Retorna [{ chave, nome, itens: [{ item, numero }] }] na ordem em que as categorias aparecem.
 */
export function agruparItens(itensTecnicos = [], secoes = []) {
  const nomeSecao = Object.fromEntries(secoes.map(s => [s.id, s.nome]));
  const ordenados = itensTecnicos
    .map((item, idx) => ({ item, numero: item.numero ?? idx + 1 }))
    .sort((a, b) => a.numero - b.numero);

  const grupos = new Map();
  for (const entrada of ordenados) {
    const idxCat = CATEGORIA_POR_SECAO[entrada.item.secaoId];
    const chave = idxCat ?? `s${entrada.item.secaoId}`;
    if (!grupos.has(chave)) {
      grupos.set(chave, {
        chave,
        nome: idxCat !== undefined ? CATEGORIAS[idxCat] : (nomeSecao[entrada.item.secaoId] || `Seção ${entrada.item.secaoId}`),
        itens: [],
      });
    }
    grupos.get(chave).itens.push(entrada);
  }
  return [...grupos.values()].sort((a, b) => {
    const numA = typeof a.chave === 'number';
    const numB = typeof b.chave === 'number';
    if (numA && numB) return a.chave - b.chave;
    if (numA) return -1;
    if (numB) return 1;
    return String(a.chave).localeCompare(String(b.chave));
  });
}

export function extrairDadosInstituicao(vistoria) {
  const inst = vistoria.instituicao || {};
  const nome = (inst.nome || vistoria.nome || vistoria.blocoAvaliado || '').trim();
  const endereco = (inst.endereco || vistoria.endereco || '').trim();
  const cidade = (inst.cidade || vistoria.cidade || '').trim();
  const data = (inst.data || vistoria.data || '').trim();
  const avaliadores = Array.isArray(inst.avaliadores)
    ? inst.avaliadores.filter(Boolean)
    : (Array.isArray(vistoria.avaliadores) ? vistoria.avaliadores.filter(Boolean) : []);

  const obrigatorios = [
    { label: 'Instituição / Bloco Avaliado', valor: nome || 'Não informado' },
    { label: 'Endereço', valor: endereco || 'Não informado' },
    { label: 'Cidade / UF', valor: cidade || 'Não informado' },
    { label: 'Data da Vistoria', valor: data ? data.split('-').reverse().join('/') : 'Não informado' },
    { label: 'Equipe de Avaliadores', valor: avaliadores.length > 0 ? avaliadores.join(', ') : 'Não informado' },
  ];

  const opcionais = [];
  if (inst.bairro || vistoria.bairro) {
    opcionais.push({ label: 'Bairro', valor: (inst.bairro || vistoria.bairro).trim() });
  }
  if (inst.rede || vistoria.rede) {
    opcionais.push({ label: 'Rede Administrativa', valor: (inst.rede || vistoria.rede).trim() });
  }
  const nivel = inst.nivelEnsino || vistoria.nivelEnsino;
  if (nivel && (Array.isArray(nivel) ? nivel.length > 0 : String(nivel).trim())) {
    const valNivel = Array.isArray(nivel) ? nivel.join(', ') : String(nivel);
    opcionais.push({ label: 'Nível de Ensino', valor: valNivel });
  }
  if (inst.numAlunos || vistoria.numAlunos) {
    opcionais.push({ label: 'Número de Alunos', valor: String(inst.numAlunos || vistoria.numAlunos) });
  }
  if (inst.numPavimentos || vistoria.numPavimentos) {
    opcionais.push({ label: 'Número de Pavimentos', valor: String(inst.numPavimentos || vistoria.numPavimentos) });
  }
  if (inst.anoConstrucao || vistoria.anoConstrucao) {
    opcionais.push({ label: 'Ano de Construção', valor: String(inst.anoConstrucao || vistoria.anoConstrucao) });
  }
  if (inst.horarioInicio || vistoria.horarioInicio) {
    opcionais.push({ label: 'Horário de Início', valor: String(inst.horarioInicio || vistoria.horarioInicio) });
  }
  if (inst.horarioTermino || vistoria.horarioTermino) {
    opcionais.push({ label: 'Horário de Término', valor: String(inst.horarioTermino || vistoria.horarioTermino) });
  }

  return { obrigatorios, opcionais, todos: [...obrigatorios, ...opcionais] };
}
