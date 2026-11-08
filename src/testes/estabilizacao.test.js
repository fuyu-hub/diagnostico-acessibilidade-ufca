import { describe, it, expect } from 'vitest';
import { analisarArquivoImportacao, dividirEmLotes, LIMITE_IMPORTACAO, LIMITE_LOTE_EXPORTACAO } from '../dados/exportacao.js';
import { gravarLote, isErroCota } from '../dados/gravacao.js';
import { dependentesComDados, resumoProgresso, ITENS_POR_ID, ITENS_TECNICOS, TODOS_ITENS } from '../dados/checklist.js';
import { calcularDimensoesFoto, LADO_MAXIMO_FOTO } from '../utilitarios/imagem.js';
import { resolverTema } from '../utilitarios/tema.js';

describe('Backup', () => {
  it('1. Um arquivo acima do antigo limite de 15 MB não é mais recusado por tamanho', () => {
    const grande = ' '.repeat(16 * 1024 * 1024);
    expect(() => analisarArquivoImportacao(grande)).not.toThrow(/limite máximo/i);
  });

  it('2. Todo lote exportado cabe no limite de importação', () => {
    expect(LIMITE_LOTE_EXPORTACAO).toBeLessThan(LIMITE_IMPORTACAO);
  });

  it('3. Divide em lotes sem separar nem perder vistorias', () => {
    const vistorias = [{ id: 1, d: 'x'.repeat(60) }, { id: 2, d: 'x'.repeat(60) }, { id: 3, d: 'x'.repeat(10) }];
    const lotes = dividirEmLotes(vistorias, 100);
    expect(lotes.map(l => l.map(v => v.id))).toEqual([[1], [2, 3]]);
  });

  it('4. Uma vistoria maior que o limite do lote segue sozinha', () => {
    const lotes = dividirEmLotes([{ id: 1, d: 'x'.repeat(200) }, { id: 2 }], 100);
    expect(lotes.map(l => l.map(v => v.id))).toEqual([[1], [2]]);
  });
});

describe('Gravação', () => {
  it('5. A falha de uma vistoria não impede as outras e a devolve para nova tentativa', async () => {
    const { gravados, falhas } = await gravarLote(['a', 'b', 'c'], async item => {
      if (item === 'b') throw new Error('falha de disco');
      return item;
    });
    expect(gravados).toEqual(['a', 'c']);
    expect(falhas.map(f => f.item)).toEqual(['b']);
    expect(falhas[0].cota).toBe(false);
  });

  it('6. Identifica estouro de cota por nome e por mensagem', () => {
    expect(isErroCota({ name: 'QuotaExceededError' })).toBe(true);
    expect(isErroCota(new Error('The quota has been exceeded.'))).toBe(true);
    expect(isErroCota(new Error('falha de disco'))).toBe(false);
  });
});

describe('Fotos', () => {
  it('7. Reduz o lado maior mantendo a proporção', () => {
    expect(calcularDimensoesFoto(4000, 3000)).toEqual({ largura: LADO_MAXIMO_FOTO, altura: 1440 });
    expect(calcularDimensoesFoto(3000, 4000)).toEqual({ largura: 1440, altura: LADO_MAXIMO_FOTO });
  });

  it('8. Não amplia fotos menores', () => {
    expect(calcularDimensoesFoto(800, 600)).toEqual({ largura: 800, altura: 600 });
  });
});

describe('Triagem', () => {
  const externa = TODOS_ITENS.find(i => i.dependentes?.some(d => ITENS_POR_ID[d].tipo === 'triagem'));
  const aninhada = ITENS_POR_ID[externa.dependentes.find(d => ITENS_POR_ID[d].tipo === 'triagem')];
  const [neto, comObs, comFoto] = aninhada.dependentes;

  it('9. Aponta respostas, observações e fotos que a triagem apagaria, inclusive em triagens aninhadas', () => {
    expect(dependentesComDados(externa, {
      [neto]: { valor: 'conforme' },
      [comObs]: { valor: 'nao-aplica', obs: 'Sem acesso' },
      [comFoto]: { valor: 'nao-aplica', foto: 'data:image/webp;base64,AA' },
    })).toEqual(expect.arrayContaining([neto, comObs, comFoto]));
  });

  it('10. N/A sem observação nem foto não exige confirmação', () => {
    expect(dependentesComDados(externa, { [comObs]: { valor: 'nao-aplica', obs: '', foto: null } })).toEqual([]);
  });
});

describe('Progresso e tema', () => {
  it('11. Resume o progresso e aponta o primeiro item técnico sem resposta', () => {
    const primeiro = ITENS_TECNICOS[0];
    const segundo = ITENS_TECNICOS[1];
    const resumo = resumoProgresso({ [primeiro.id]: { valor: 'conforme' } });

    expect(resumo.respondidos).toBe(1);
    expect(resumo.total).toBe(ITENS_TECNICOS.length);
    expect(TODOS_ITENS[resumo.proximoIndice].id).toBe(segundo.id);
  });

  it('12. Sem pendências, não aponta nenhum item', () => {
    const tudo = Object.fromEntries(ITENS_TECNICOS.map(i => [i.id, { valor: 'conforme' }]));
    expect(resumoProgresso(tudo)).toMatchObject({ pct: 100, proximoIndice: -1 });
  });

  it('13. Automático segue o sistema; a escolha manual prevalece', () => {
    expect(resolverTema('auto', true)).toBe('escuro');
    expect(resolverTema('auto', false)).toBe('claro');
    expect(resolverTema('claro', true)).toBe('claro');
    expect(resolverTema('escuro', false)).toBe('escuro');
  });
});
