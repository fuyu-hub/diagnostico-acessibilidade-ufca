import { describe, it, expect } from 'vitest';
import { listarFotos, camposFotos, ehFotoExibivel } from '../dados/fotos.js';
import { Vistoria } from '../dados/esquema.js';

const A = 'data:image/jpeg;base64,AAA';
const B = 'data:image/jpeg;base64,BBB';

describe('fotos de evidência', () => {
  it('lê o formato antigo, com uma foto só', () => {
    expect(listarFotos({ foto: A })).toEqual([A]);
    expect(listarFotos({ foto: null })).toEqual([]);
    expect(listarFotos(null)).toEqual([]);
  });

  it('prefere a lista nova quando existe', () => {
    expect(listarFotos({ foto: A, fotos: [A, B] })).toEqual([A, B]);
    expect(listarFotos({ foto: A, fotos: [] })).toEqual([]);
  });

  it('grava a lista e repete a primeira em `foto` para versões anteriores do app', () => {
    expect(camposFotos([A, B])).toEqual({ fotos: [A, B], foto: A });
    expect(camposFotos([])).toEqual({ fotos: [], foto: null });
    expect(camposFotos([null, '', B])).toEqual({ fotos: [B], foto: B });
  });

  it('o esquema mantém a lista de fotos ao validar', () => {
    const agora = new Date().toISOString();
    const v = Vistoria.parse({
      vistoriaId: '3f1c1b2a-6d1e-4c1a-9f3e-2b1a0c9d8e7f',
      dataCriacao: agora,
      dataUltimaEdicao: agora,
      blocoAvaliado: 'Escola',
      dadosVistoria: { 1: { resposta: 'nao_conforme', observacao: '', ...camposFotos([A, B]) } },
    });
    expect(v.dadosVistoria['1'].fotos).toEqual([A, B]);
    expect(v.dadosVistoria['1'].foto).toBe(A);
  });

  it('só considera exibível uma imagem em data URL', () => {
    expect(ehFotoExibivel(A)).toBe(true);
    expect(ehFotoExibivel('foto.jpg')).toBe(false);
  });
});
