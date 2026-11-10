import { describe, it, expect } from 'vitest';
import { mesclarCopias, carimbarResposta, listarDivergencias } from '../dados/mescla.js';
import { resolverConflito } from '../dados/conflito.js';

// Resposta de `quem` no minuto `min`. `viu` = minuto da resposta que a pessoa tinha na tela.
function r(resposta, quem, min, extra = {}) {
  const hora = m => `2026-11-10T14:${String(m).padStart(2, '0')}:00.000Z`;
  const { viu, ...resto } = extra;
  return {
    resposta, observacao: '', autor: quem, atualizadaEm: hora(min),
    ...(viu !== undefined ? { base: hora(viu) } : {}),
    ...resto,
  };
}

// Mescla o item 1 de várias cópias
const mesclar = (...respostas) => mesclarCopias(respostas.map(x => ({ 1: x })))[1];

describe('Mescla entre aparelhos', () => {
  it('junta itens diferentes', () => {
    const m = mesclarCopias([{ 1: r('conforme', 'ana', 1) }, { 2: r('nao_conforme', 'joao', 2) }]);
    expect(Object.keys(m)).toEqual(['1', '2']);
  });

  it('quem viu a resposta anterior a substitui', () => {
    const m = mesclar(r('conforme', 'ana', 1), r('nao_conforme', 'joao', 5, { viu: 1 }));
    expect(m.resposta).toBe('nao_conforme');
    expect(m.alternativas).toBeUndefined();
  });

  it('respostas diferentes ao mesmo tempo viram divergência', () => {
    const m = mesclar(r('conforme', 'ana', 1), r('nao_conforme', 'joao', 5));
    expect(m.resposta).toBe('nao_conforme');
    expect(m.alternativas[0].resposta).toBe('conforme');
    expect(listarDivergencias({ 1: m })).toHaveLength(1);
  });

  it('responder de novo encerra a divergência', () => {
    const ana = r('conforme', 'ana', 1);
    const joao = r('nao_conforme', 'joao', 5);
    const decisao = carimbarResposta({ resposta: 'conforme' }, mesclar(ana, joao), 'ana');
    expect(listarDivergencias({ 1: mesclar(ana, joao, decisao) })).toHaveLength(0);
  });

  it('a ordem das cópias não muda o resultado', () => {
    const a = r('conforme', 'ana', 1);
    const b = r('nao_conforme', 'joao', 3);
    expect(mesclar(a, b)).toEqual(mesclar(b, a));
    expect(mesclar(mesclar(a, b), a)).toEqual(mesclar(a, b));
  });

  it('apagar depois de ver também se propaga', () => {
    expect(mesclar(r('conforme', 'ana', 1), r(null, 'joao', 3, { viu: 1 })).resposta).toBeNull();
  });

  it('N/A de triagem não apaga a resposta manual de outra pessoa', () => {
    const m = mesclar(r('nao_conforme', 'ana', 1), r('nao_aplica', 'joao', 4, { viu: 1, automatico: true }));
    expect(listarDivergencias({ 1: m })).toHaveLength(1);
  });

  it('mesma resposta com observação diferente não é divergência', () => {
    const m = mesclar(
      r('nao_conforme', 'ana', 1, { observacao: 'Degrau quebrado' }),
      r('nao_conforme', 'joao', 2, { observacao: 'Sem piso tátil' }),
    );
    expect(m.alternativas[0].observacao).toBe('Degrau quebrado');
    expect(listarDivergencias({ 1: m })).toHaveLength(0);
  });

  it('fotos de respostas ao mesmo tempo se somam', () => {
    const m = mesclar(r('nao_conforme', 'ana', 1, { fotos: ['a'] }), r('nao_conforme', 'joao', 2, { fotos: ['j'] }));
    expect([...m.fotos].sort()).toEqual(['a', 'j']);
  });

  it('resposta antiga, sem carimbo e vazia, é ignorada', () => {
    expect(mesclar({ resposta: 'conforme' }, { resposta: null }).resposta).toBe('conforme');
  });

  it('o carimbo avança mesmo com o relógio do aparelho atrasado', () => {
    const anterior = r('conforme', 'joao', 30);
    const nova = carimbarResposta({ resposta: 'nao_conforme' }, anterior, 'ana', '2026-11-10T14:10:00.000Z');
    expect(nova.atualizadaEm > anterior.atualizadaEm).toBe(true);
    expect(mesclar(anterior, nova).resposta).toBe('nao_conforme');
  });

  it('importar com "mesclar" não descarta a resposta local', () => {
    const vistoria = (revisao, resposta) => ({
      vistoriaId: '6f1c2b8e-3d4a-4b5c-8d6e-7f8091a2b3c4', revisao,
      dataCriacao: 'x', dataUltimaEdicao: 'x', blocoAvaliado: 'Bloco A',
      dadosVistoria: { 1: resposta },
    });
    const { vistoria: m } = resolverConflito(
      vistoria(3, r('conforme', 'ana', 1)),
      vistoria(2, r('nao_conforme', 'joao', 2)),
      'mesclar',
    );
    expect(listarDivergencias(m.dadosVistoria)).toHaveLength(1);
  });
});
