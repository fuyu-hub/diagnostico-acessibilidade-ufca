import { describe, it, expect } from 'vitest';
import {
  montarPacoteFotos, lerPacoteFotos, juntarFotos, fotosFaltando, contarFotos, nomeDoAutor,
} from '../dados/sincronizacao.js';
import { temDivergencia, opcoesDoItem } from '../dados/mescla.js';

const foto = n => `data:image/jpeg;base64,${n}`;
const vistoria = {
  vistoriaId: 'v1',
  blocoAvaliado: 'Bloco A',
  dadosVistoria: {
    1: { resposta: 'nao_conforme', observacao: '', fotos: [foto('a'), foto('b')] },
    2: { resposta: 'conforme', observacao: '', fotos: [] },
  },
};

describe('Fechamento da vistoria em grupo (Etapa 6)', () => {
  it('o pacote leva só os itens com foto', () => {
    const pacote = montarPacoteFotos(vistoria, 'Ana');
    expect(pacote.fotos).toEqual({ 1: [foto('a'), foto('b')] });
    expect(lerPacoteFotos(pacote)).toBe(pacote);
    expect(lerPacoteFotos({ formato: 'vistoria-ufca' })).toBeNull();
  });

  it('receber fotos junta sem repetir e sem mexer na resposta', () => {
    const local = { 1: { resposta: 'nao_conforme', observacao: 'x', fotos: [foto('a')], autor: 'joao', atualizadaEm: 't1' } };
    const { dados, adicionadas } = juntarFotos(local, montarPacoteFotos(vistoria, 'Ana'));
    expect(adicionadas).toBe(1);
    expect(dados[1].fotos).toEqual([foto('a'), foto('b')]);
    expect(dados[1]).toMatchObject({ resposta: 'nao_conforme', observacao: 'x', autor: 'joao', atualizadaEm: 't1' });
  });

  it('foto de item sem resposta neste aparelho fica de fora, e texto que não é imagem é ignorado', () => {
    const pacote = { formato: 'fotos-vistoria-ufca', vistoriaId: 'v1', fotos: { 9: [foto('z')], 1: ['javascript:alert(1)'] } };
    const { dados, adicionadas, semResposta } = juntarFotos({ 1: { resposta: 'conforme', fotos: [] } }, pacote);
    expect(adicionadas).toBe(0);
    expect(semResposta).toBe(1);
    expect(dados[9]).toBeUndefined();
  });

  it('aponta os itens com foto em outro aparelho', () => {
    const participantes = [
      { voce: true, nome: 'Ana', fotos: contarFotos(vistoria.dadosVistoria) },
      { nome: 'João', fotos: { 1: 2, 2: 1 } },
    ];
    expect(fotosFaltando(vistoria.dadosVistoria, participantes)).toEqual([{ itemId: '2', nomes: ['João'] }]);
  });

  it('mostra o nome de quem respondeu', () => {
    const participantes = [{ autor: 'aparelho-joao', nome: 'João' }];
    expect(nomeDoAutor('aparelho-joao', participantes, 'eu')).toBe('João');
    expect(nomeDoAutor('eu', participantes, 'eu')).toBe('Você');
    expect(nomeDoAutor('desconhecido', participantes, 'eu')).toBe('Outra pessoa');
  });

  it('divergência só quando as respostas diferem', () => {
    const igual = { resposta: 'conforme', alternativas: [{ resposta: 'conforme', observacao: 'outra' }] };
    const diferente = { resposta: 'conforme', alternativas: [{ resposta: 'nao_conforme' }] };
    expect(temDivergencia(igual)).toBe(false);
    expect(temDivergencia(diferente)).toBe(true);
    expect(opcoesDoItem(diferente).map(o => o.resposta)).toEqual(['conforme', 'nao_conforme']);
  });
});
