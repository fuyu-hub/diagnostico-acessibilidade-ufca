import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { VERSAO_APP as VERSAO_EXPORTADA } from '../dados/exportacao.js';
import {
  VERSAO_APP,
  aplicarAtualizacao,
  limparCachesDeRecursos,
  registrarVersao,
} from '../utilitarios/versaoApp.js';

function armazenamentoFalso(inicial = {}) {
  const dados = new Map(Object.entries(inicial));
  return {
    dados,
    getItem: chave => (dados.has(chave) ? dados.get(chave) : null),
    setItem: (chave, valor) => dados.set(chave, valor),
  };
}

describe('Versão do app', () => {
  it('1. A versão vem do package.json e é a mesma gravada nos backups', () => {
    const pacote = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url)));
    expect(VERSAO_APP).toBe(pacote.version);
    expect(VERSAO_EXPORTADA).toBe(pacote.version);
  });

  it('2. A primeira abertura registra a versão, sem avisar de atualização', () => {
    const armazenamento = armazenamentoFalso();
    expect(registrarVersao(armazenamento, '1.0.0')).toEqual({ anterior: null, mudou: false });
    expect(armazenamento.getItem('nbr9050_versao_app')).toBe('1.0.0');
  });

  it('3. Uma versão nova é detectada uma única vez e não altera os dados do usuário', () => {
    const armazenamento = armazenamentoFalso({
      nbr9050_versao_app: '1.0.0',
      nbr9050_tema: 'claro',
      nbr9050_vistorias: '[{"id":1}]',
    });
    expect(registrarVersao(armazenamento, '1.1.0')).toEqual({ anterior: '1.0.0', mudou: true });
    expect(registrarVersao(armazenamento, '1.1.0')).toEqual({ anterior: '1.1.0', mudou: false });
    expect(armazenamento.getItem('nbr9050_tema')).toBe('claro');
    expect(armazenamento.getItem('nbr9050_vistorias')).toBe('[{"id":1}]');
  });

  it('4. Armazenamento bloqueado não impede o app de abrir', () => {
    const bloqueado = { getItem: () => { throw new Error('bloqueado'); } };
    expect(registrarVersao(bloqueado, '1.0.0')).toEqual({ anterior: null, mudou: false });
  });

  it('5. A limpeza remove só o cache de imagens, nunca o de arquivos do app', async () => {
    const api = { delete: vi.fn(async () => true) };
    await limparCachesDeRecursos(api);
    expect(api.delete.mock.calls).toEqual([['images-cache']]);
    await expect(limparCachesDeRecursos(null)).resolves.toBeUndefined();
  });
});

describe('Soft reset', () => {
  it('6. Grava o que está pendente antes de trocar a versão', async () => {
    const ordem = [];
    const aplicou = await aplicarAtualizacao({
      descarregar: async () => { ordem.push('gravar'); return true; },
      atualizar: async () => { ordem.push('atualizar'); },
    });
    expect(aplicou).toBe(true);
    expect(ordem).toEqual(['gravar', 'atualizar']);
  });

  it('7. Não recarrega se a gravação falhar', async () => {
    const atualizar = vi.fn();
    const aplicou = await aplicarAtualizacao({ descarregar: async () => false, atualizar });
    expect(aplicou).toBe(false);
    expect(atualizar).not.toHaveBeenCalled();
  });
});
