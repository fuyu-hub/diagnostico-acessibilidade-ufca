import { describe, it, expect } from 'vitest';
import { classificarNota, FAIXAS_INDICE } from '../dados/classificacao.js';
import { dependentesEmCascata, dependentesParaLimpar, ITENS_POR_ID, TODOS_ITENS } from '../dados/checklist.js';
import { Vistoria } from '../dados/esquema.js';
import { converterLegadoParaCanonica, extrairMarcaTriagem } from '../dados/migracoes.js';

describe('Classificação da nota', () => {
  it('1. Nota arredondada para o limite de uma faixa recebe o rótulo dessa faixa', () => {
    expect(classificarNota((43 / 48) * 10)).toMatchObject({ notaFormatada: '9,0', rotulo: 'ADEQUADO' });
    expect(classificarNota(6.96)).toMatchObject({ notaFormatada: '7,0', rotulo: 'PARCIALMENTE ADEQUADO' });
    expect(classificarNota(3.96)).toMatchObject({ notaFormatada: '4,0', rotulo: 'INSUFICIENTE' });
  });

  it('2. Nota abaixo do limite após o arredondamento permanece na faixa inferior', () => {
    expect(classificarNota(8.94)).toMatchObject({ notaFormatada: '8,9', rotulo: 'PARCIALMENTE ADEQUADO' });
    expect(classificarNota(3.94)).toMatchObject({ notaFormatada: '3,9', rotulo: 'CRÍTICO' });
  });

  it('3. Toda combinação possível de respostas cai na faixa publicada para a nota exibida', () => {
    const faixaDaNota = valor => FAIXAS_INDICE.find(f => {
      const [min, max] = f.faixaTexto.split(' – ').map(t => Number(t.replace(',', '.')));
      return valor >= min && valor <= max;
    });

    for (let total = 1; total <= 179; total++) {
      for (let conf = 0; conf <= total; conf++) {
        const { notaFormatada, rotulo } = classificarNota((conf / total) * 10);
        expect(rotulo).toBe(faixaDaNota(Number(notaFormatada.replace(',', '.'))).rotulo);
      }
    }
  });
});

describe('Reversão do N/A por triagem', () => {
  const triagem = TODOS_ITENS.find(i => i.tipo === 'triagem' && i.dependentes?.length >= 2);
  const [dep1, dep2] = triagem.dependentes;
  const automatica = { valor: 'nao-aplica', automatico: true, origemTriagem: triagem.id };

  it('4. Limpa só os itens marcados automaticamente', () => {
    const respostas = {
      [triagem.id]: { valor: 'nao-conforme' },
      [dep1]: automatica,
      [dep2]: { valor: 'conforme', obs: '' },
    };
    expect(dependentesParaLimpar(triagem, respostas)).toEqual([dep1]);
  });

  it('5. Preserva N/A manual com observação ou foto em vistorias sem a marca', () => {
    const respostas = {
      [triagem.id]: { valor: 'nao-aplica' },
      [dep1]: { valor: 'nao-aplica', obs: 'Verificado em campo', foto: null },
      [dep2]: { valor: 'nao-aplica', obs: '', foto: 'data:image/webp;base64,AAAA' },
    };
    expect(dependentesParaLimpar(triagem, respostas)).toEqual([]);
  });

  it('6. Recupera N/A sem a marca em vistorias salvas antes da correção', () => {
    const respostas = {
      [triagem.id]: { valor: 'nao-conforme' },
      [dep1]: { valor: 'nao-aplica', obs: '', foto: null },
    };
    expect(dependentesParaLimpar(triagem, respostas)).toEqual([dep1]);
  });

  it('7. Não trata N/A manual como automático quando a triagem já era positiva', () => {
    const respostas = {
      [triagem.id]: { valor: 'conforme' },
      [dep1]: { valor: 'nao-aplica', obs: '', foto: null },
    };
    expect(dependentesParaLimpar(triagem, respostas)).toEqual([]);
  });

  it('8. Desce pelas triagens aninhadas', () => {
    const externa = TODOS_ITENS.find(i => i.dependentes?.some(d => ITENS_POR_ID[d].tipo === 'triagem'));
    const aninhada = ITENS_POR_ID[externa.dependentes.find(d => ITENS_POR_ID[d].tipo === 'triagem')];
    const neto = aninhada.dependentes[0];

    const respostas = {
      [externa.id]: { valor: 'nao-conforme' },
      [aninhada.id]: { valor: 'nao-aplica', automatico: true, origemTriagem: externa.id },
      [neto]: { valor: 'nao-aplica', automatico: true, origemTriagem: aninhada.id },
    };
    expect(dependentesParaLimpar(externa, respostas)).toEqual([aninhada.id, neto]);
  });

  it('10. A cascata alcança os netos e aponta a triagem que controla cada item', () => {
    const externa = TODOS_ITENS.find(i => i.dependentes?.some(d => ITENS_POR_ID[d].tipo === 'triagem'));
    const aninhada = ITENS_POR_ID[externa.dependentes.find(d => ITENS_POR_ID[d].tipo === 'triagem')];
    const cascata = dependentesEmCascata(externa);
    expect(cascata).toContainEqual({ id: aninhada.id, origemTriagem: externa.id });
    expect(cascata).toContainEqual({ id: aninhada.dependentes[0], origemTriagem: aninhada.id });
  });

  it('10b. Corrimãos externos só saem quando escada e rampa são negativas, e voltam se uma passar a existir', () => {
    const escada = ITENS_POR_ID[1002];
    const ids = alvo => dependentesEmCascata(alvo, { 1003: { valor: alvo.id === 1002 ? 'nao' : 'sim' } }).map(d => d.id);
    expect(ids(escada)).toEqual(expect.arrayContaining([1026, 23, 24, 29]));
    expect(dependentesEmCascata(escada, { 1003: { valor: 'sim' } }).map(d => d.id)).not.toContain(24);
    expect(dependentesEmCascata(escada, {}).map(d => d.id)).not.toContain(24);

    const respostas = {
      1002: { valor: 'sim' },
      24: { valor: 'nao-aplica', automatico: true, origemTriagem: 1003 },
      25: { valor: 'nao-aplica' },
    };
    expect(dependentesParaLimpar(escada, respostas)).toEqual([24]);
  });

  it('11. Nenhuma triagem do checklist repete itens na cascata ou aponta item inexistente', () => {
    for (const t of TODOS_ITENS.filter(i => i.tipo === 'triagem')) {
      const ids = dependentesEmCascata(t).map(dep => dep.id);
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids.every(id => ITENS_POR_ID[id])).toBe(true);
    }
  });

  it('9. A marca sobrevive ao schema e à migração; respostas manuais ficam sem ela', () => {
    const base = {
      vistoriaId: '11111111-1111-4111-8111-111111111111',
      dataCriacao: '2026-01-01T00:00:00.000Z',
      dataUltimaEdicao: '2026-01-01T00:00:00.000Z',
      blocoAvaliado: 'Bloco',
      dadosVistoria: {
        9: { resposta: 'nao_aplica', observacao: '', foto: null, automatico: true, origemTriagem: 1001 },
      },
    };
    expect(Vistoria.parse(base).dadosVistoria[9]).toMatchObject({ automatico: true, origemTriagem: 1001 });

    const legada = converterLegadoParaCanonica({
      id: 'legado-1',
      nome: 'Bloco',
      respostas: { 9: { valor: 'nao-aplica', automatico: true, origemTriagem: 1001 } },
    });
    expect(legada.dadosVistoria[9]).toMatchObject({ automatico: true, origemTriagem: 1001 });

    expect(extrairMarcaTriagem({ valor: 'conforme' })).toEqual({});
  });
});
