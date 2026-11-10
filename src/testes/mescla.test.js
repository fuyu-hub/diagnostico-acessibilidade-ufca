import { describe, it, expect } from 'vitest';
import {
  mesclarCopias,
  mesclarItem,
  carimbarResposta,
  listarDivergencias,
} from '../dados/mescla.js';
import { Vistoria } from '../dados/esquema.js';
import { converterLegadoParaCanonica } from '../dados/migracoes.js';
import { resolverConflito } from '../dados/conflito.js';

// Horários fixos para os testes ficarem legíveis
const h = minuto => `2026-11-10T14:${String(minuto).padStart(2, '0')}:00.000Z`;

function resp(resposta, autor, minuto, extra = {}) {
  return { resposta, observacao: '', fotos: [], foto: null, autor, atualizadaEm: h(minuto), ...extra };
}

const semFotos = ({ foto: _f, fotos: _fs, ...resto }) => resto;

describe('Mescla de cópias entre aparelhos (Escopo 09, Etapa 1)', () => {
  it('junta itens diferentes respondidos por pessoas diferentes', () => {
    const ana = { 1: resp('conforme', 'ana', 1) };
    const joao = { 2: resp('nao_conforme', 'joao', 2) };
    const m = mesclarCopias([ana, joao]);
    expect(m[1].resposta).toBe('conforme');
    expect(m[2].resposta).toBe('nao_conforme');
    expect(listarDivergencias(m)).toHaveLength(0);
  });

  it('quem respondeu depois de ver a resposta anterior a substitui, sem divergência', () => {
    const a1 = resp('conforme', 'ana', 1);
    const j1 = resp('nao_conforme', 'joao', 5, { base: h(1) });
    const m = mesclarCopias([{ 1: a1 }, { 1: j1 }]);
    expect(m[1].resposta).toBe('nao_conforme');
    expect(m[1].alternativas).toBeUndefined();
  });

  it('respostas diferentes dadas sem uma ver a outra viram divergência e nada se perde', () => {
    const a1 = resp('conforme', 'ana', 1);
    const j1 = resp('nao_conforme', 'joao', 5);
    const m = mesclarCopias([{ 1: a1 }, { 1: j1 }]);
    expect(m[1].resposta).toBe('nao_conforme'); // a mais recente aparece
    expect(m[1].alternativas.map(a => a.resposta)).toEqual(['conforme']);

    const divergencias = listarDivergencias(m);
    expect(divergencias).toHaveLength(1);
    expect(divergencias[0].itemId).toBe('1');
    expect(divergencias[0].opcoes.map(o => o.autor).sort()).toEqual(['ana', 'joao']);
  });

  it('responder de novo o item encerra a divergência, mesmo mesclando com as cópias antigas', () => {
    const a1 = resp('conforme', 'ana', 1);
    const j1 = resp('nao_conforme', 'joao', 5);
    const comDivergencia = mesclarCopias([{ 1: a1 }, { 1: j1 }]);

    const decisao = carimbarResposta(
      { resposta: 'conforme', observacao: 'Medido de novo: 8%' },
      comDivergencia[1],
      'ana',
      h(10),
    );
    expect(decisao.base).toBe(h(5));

    const m = mesclarCopias([{ 1: a1 }, { 1: j1 }, { 1: decisao }]);
    expect(m[1].resposta).toBe('conforme');
    expect(m[1].alternativas).toBeUndefined();
    expect(listarDivergencias(m)).toHaveLength(0);
  });

  it('o resultado não depende da ordem das cópias nem de mesclar de novo', () => {
    const ana = { 1: resp('conforme', 'ana', 1), 2: resp('nao_aplica', 'ana', 2) };
    const joao = { 1: resp('nao_conforme', 'joao', 3), 3: resp('conforme', 'joao', 4) };
    const maria = { 2: resp('conforme', 'maria', 6, { base: h(2) }), 1: resp('conforme', 'maria', 7) };

    const m1 = mesclarCopias([ana, joao, maria]);
    const m2 = mesclarCopias([maria, ana, joao]);
    expect(m2).toEqual(m1);
    expect(mesclarCopias([m1, ana])).toEqual(m1);
    expect(mesclarCopias([m1, m1])).toEqual(m1);
  });

  it('apagar uma resposta depois de vê-la propaga a remoção', () => {
    const a1 = resp('conforme', 'ana', 1);
    const limpa = resp(null, 'joao', 3, { base: h(1) });
    const m = mesclarCopias([{ 1: a1 }, { 1: limpa }]);
    expect(m[1].resposta).toBeNull();
    expect(m[1].alternativas).toBeUndefined();
  });

  it('N/A automático de triagem não apaga a resposta manual de outra pessoa', () => {
    const manual = resp('nao_conforme', 'ana', 1, { observacao: 'Corrimão solto' });
    const automatica = resp('nao_aplica', 'joao', 4, { base: h(1), automatico: true, origemTriagem: 1003 });
    const m = mesclarCopias([{ 21: manual }, { 21: automatica }]);
    expect(listarDivergencias(m)).toHaveLength(1);
    const todas = [m[21], ...m[21].alternativas];
    expect(todas.find(o => o.autor === 'ana').observacao).toBe('Corrimão solto');
  });

  it('N/A automático substitui a resposta manual da mesma pessoa', () => {
    const manual = resp('conforme', 'ana', 1);
    const automatica = resp('nao_aplica', 'ana', 4, { base: h(1), automatico: true });
    const m = mesclarCopias([{ 21: manual }, { 21: automatica }]);
    expect(m[21].resposta).toBe('nao_aplica');
    expect(m[21].alternativas).toBeUndefined();
  });

  it('mesma resposta com observações diferentes guarda as duas, sem contar como divergência', () => {
    const a1 = resp('nao_conforme', 'ana', 1, { observacao: 'Degrau quebrado' });
    const j1 = resp('nao_conforme', 'joao', 2, { observacao: 'Sem piso tátil' });
    const m = mesclarCopias([{ 1: a1 }, { 1: j1 }]);
    expect(m[1].observacao).toBe('Sem piso tátil');
    expect(m[1].alternativas.map(a => a.observacao)).toEqual(['Degrau quebrado']);
    expect(listarDivergencias(m)).toHaveLength(0);
  });

  it('mesma resposta sem observação a mais não guarda alternativa', () => {
    const m = mesclarCopias([{ 1: resp('conforme', 'ana', 1) }, { 1: resp('conforme', 'joao', 2) }]);
    expect(m[1].alternativas).toBeUndefined();
  });

  it('fotos de respostas simultâneas se somam, e uma foto removida depois não volta', () => {
    const a1 = resp('nao_conforme', 'ana', 1, { fotos: ['data:image/jpeg;a'] });
    const j1 = resp('nao_conforme', 'joao', 2, { fotos: ['data:image/jpeg;j'] });
    const juntas = mesclarCopias([{ 1: a1 }, { 1: j1 }]);
    expect([...juntas[1].fotos].sort()).toEqual(['data:image/jpeg;a', 'data:image/jpeg;j']);
    expect(juntas[1].foto).toBe(juntas[1].fotos[0]);

    const semA = carimbarResposta({ ...juntas[1], fotos: ['data:image/jpeg;j'] }, juntas[1], 'ana', h(5));
    const m = mesclarCopias([{ 1: a1 }, { 1: j1 }, { 1: semA }]);
    expect(m[1].fotos).toEqual(['data:image/jpeg;j']);
  });

  it('alternativas são guardadas sem fotos', () => {
    const a1 = resp('conforme', 'ana', 1, { fotos: ['data:image/jpeg;a'] });
    const j1 = resp('nao_conforme', 'joao', 2);
    const m = mesclarItem([a1, j1]);
    expect(m.alternativas[0].fotos).toBeUndefined();
    expect(m.fotos).toEqual(['data:image/jpeg;a']);
  });

  describe('respostas antigas, sem carimbo', () => {
    it('respostas iguais não viram divergência', () => {
      const m = mesclarCopias([{ 1: { resposta: 'conforme', observacao: '' } }, { 1: { resposta: 'conforme', observacao: '' } }]);
      expect(m[1].resposta).toBe('conforme');
      expect(listarDivergencias(m)).toHaveLength(0);
    });

    it('respostas diferentes viram divergência, e a última cópia da lista aparece', () => {
      const m = mesclarCopias([{ 1: { resposta: 'conforme', observacao: '' } }, { 1: { resposta: 'nao_conforme', observacao: '' } }]);
      expect(m[1].resposta).toBe('nao_conforme');
      expect(listarDivergencias(m)).toHaveLength(1);
    });

    it('resposta antiga vazia é ignorada', () => {
      const m = mesclarCopias([{ 1: { resposta: 'conforme', observacao: '' } }, { 1: { resposta: null, observacao: '' } }]);
      expect(m[1].resposta).toBe('conforme');
      expect(m[1].alternativas).toBeUndefined();
    });

    it('editar depois de uma resposta antiga a substitui', () => {
      const antiga = { resposta: 'conforme', observacao: '' };
      const nova = carimbarResposta({ resposta: 'nao_conforme', observacao: '' }, antiga, 'ana', h(1));
      expect(nova.base).toBe('');
      const m = mesclarCopias([{ 1: antiga }, { 1: nova }]);
      expect(m[1].resposta).toBe('nao_conforme');
      expect(m[1].alternativas).toBeUndefined();
    });
  });

  describe('carimbarResposta', () => {
    it('grava autor, hora e o carimbo que havia na tela, e descarta carimbos recebidos', () => {
      const anterior = resp('conforme', 'joao', 2, { alternativas: [semFotos(resp('nao_conforme', 'maria', 4))] });
      const nova = carimbarResposta({ resposta: 'conforme', observacao: '', autor: 'falso', alternativas: [] }, anterior, 'ana', h(9));
      expect(nova).toMatchObject({ autor: 'ana', atualizadaEm: h(9), base: h(4) });
      expect(nova.alternativas).toBeUndefined();
    });

    it('primeira resposta do item não tem base', () => {
      expect(carimbarResposta({ resposta: 'conforme' }, undefined, 'ana', h(1)).base).toBeUndefined();
    });

    it('avança o carimbo mesmo com o relógio do aparelho atrasado', () => {
      const anterior = resp('conforme', 'joao', 30);
      const nova = carimbarResposta({ resposta: 'nao_conforme' }, anterior, 'ana', h(10));
      expect(nova.atualizadaEm > h(30)).toBe(true);
      expect(mesclarCopias([{ 1: anterior }, { 1: nova }])[1].resposta).toBe('nao_conforme');
    });
  });

  describe('formato salvo', () => {
    it('o esquema mantém carimbos e alternativas', () => {
      const a = resp('conforme', 'ana', 1);
      const b = semFotos(resp('nao_conforme', 'joao', 2, { base: '' }));
      const v = Vistoria.parse({
        vistoriaId: '6f1c2b8e-3d4a-4b5c-8d6e-7f8091a2b3c4',
        dataCriacao: h(0),
        dataUltimaEdicao: h(0),
        blocoAvaliado: 'Bloco A',
        dadosVistoria: { 1: { ...a, alternativas: [b] } },
      });
      expect(v.dadosVistoria[1]).toMatchObject({ autor: 'ana', atualizadaEm: h(1) });
      expect(v.dadosVistoria[1].alternativas[0]).toMatchObject({ autor: 'joao', base: '' });
    });

    it('a conversão de formato antigo preserva os carimbos', () => {
      const v = converterLegadoParaCanonica({
        nome: 'Bloco B',
        respostas: { 1: { valor: 'conforme', obs: '', autor: 'ana', atualizadaEm: h(1), base: '' } },
      });
      expect(v.dadosVistoria[1]).toMatchObject({ resposta: 'conforme', autor: 'ana', atualizadaEm: h(1), base: '' });
    });

    it('importar com "mesclar" guarda a divergência em vez de descartar a resposta local', () => {
      const id = '6f1c2b8e-3d4a-4b5c-8d6e-7f8091a2b3c4';
      const base = { vistoriaId: id, dataCriacao: h(0), dataUltimaEdicao: h(0), blocoAvaliado: 'Bloco A' };
      const local = { ...base, revisao: 3, dadosVistoria: { 1: resp('conforme', 'ana', 1) } };
      const remota = { ...base, revisao: 2, dadosVistoria: { 1: resp('nao_conforme', 'joao', 2) } };
      const { vistoria } = resolverConflito(local, remota, 'mesclar');
      expect(vistoria.dadosVistoria[1].resposta).toBe('nao_conforme');
      expect(listarDivergencias(vistoria.dadosVistoria)).toHaveLength(1);
    });
  });
});
