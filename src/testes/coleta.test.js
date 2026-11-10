import { describe, it, expect, beforeEach } from 'vitest';
import { montarCopiaPesquisa, precisaEnviar, enviarPendentes, lerEnvios } from '../dados/coleta.js';
import { coletaParaCsv } from '../dados/coletaCsv.js';
import { VERSAO_TERMO } from '../dados/consentimento.js';

// localStorage mínimo para o ambiente de testes
beforeEach(() => {
  const dados = new Map();
  globalThis.localStorage = {
    getItem: k => (dados.has(k) ? dados.get(k) : null),
    setItem: (k, v) => dados.set(k, String(v)),
    removeItem: k => dados.delete(k),
  };
});

const vistoria = (extra = {}) => ({
  vistoriaId: 'v1',
  status: 'concluida',
  dataUltimaEdicao: '2026-11-10T14:00:00.000Z',
  versaoChecklist: '1.0',
  consentimento: { aceito: true, versaoTermo: VERSAO_TERMO, dataAceite: '2026-11-10T10:00:00.000Z' },
  instituicao: {
    nome: 'Escola Modelo', endereco: 'Rua A, 10', bairro: 'Centro', avaliadores: ['Ana'],
    cidade: 'Crato', rede: 'Municipal', nivelEnsino: ['Fundamental'],
  },
  dadosVistoria: {
    1: { resposta: 'conforme', observacao: 'Diretora Maria acompanhou', fotos: ['data:image/jpeg;x'] },
    2: { resposta: 'nao_conforme', observacao: '' },
  },
  ...extra,
});

// Firestore de mentira: guarda o que foi gravado
function servidor({ falha } = {}) {
  const gravados = [];
  const conectar = async () => ({
    db: {}, uid: 'aparelho-1',
    fs: {
      doc: (_db, colecao, id) => `${colecao}/${id}`,
      serverTimestamp: () => 'agora',
      setDoc: async (caminho, dados) => {
        if (falha) throw Object.assign(new Error(falha), { code: falha });
        gravados.push({ caminho, dados });
      },
    },
  });
  return { conectar, gravados };
}

describe('Coleta para pesquisa', () => {
  it('a cópia não leva nome, endereço, avaliadores, observações nem fotos', () => {
    const texto = JSON.stringify(montarCopiaPesquisa(vistoria()));
    for (const proibido of ['Escola Modelo', 'Rua A', 'Centro', 'Ana', 'Maria', 'data:image']) {
      expect(texto).not.toContain(proibido);
    }
  });

  it('a cópia leva respostas, ficha permitida e nota', () => {
    const copia = montarCopiaPesquisa(vistoria());
    expect(copia.respostas).toEqual({ 1: 'conforme', 2: 'nao_conforme' });
    expect(copia.ficha).toEqual({ cidade: 'Crato', rede: 'Municipal', nivelEnsino: ['Fundamental'] });
    expect(copia.resultado).toMatchObject({ nota: 5, conformes: 1, naoConformes: 1 });
  });

  it('só envia vistoria concluída e criada depois do aviso', () => {
    expect(precisaEnviar(vistoria())).toBe(true);
    expect(precisaEnviar(vistoria({ status: 'em_andamento' }))).toBe(false);
    expect(precisaEnviar(vistoria({ consentimento: { aceito: false, versaoTermo: '1.0', dataAceite: null } }))).toBe(false);
  });

  it('envia uma vez por versão, e reenvia se a vistoria for editada', async () => {
    const { conectar, gravados } = servidor();
    await enviarPendentes([vistoria()], conectar);
    await enviarPendentes([vistoria()], conectar);
    expect(gravados).toHaveLength(1);
    expect(gravados[0]).toMatchObject({ caminho: 'coleta/v1', dados: { uidAutor: 'aparelho-1', enviadaEm: 'agora' } });

    await enviarPendentes([vistoria({ dataUltimaEdicao: '2026-11-10T15:00:00.000Z' })], conectar);
    expect(gravados).toHaveLength(2);
  });

  it('sem internet, tenta de novo depois', async () => {
    await enviarPendentes([vistoria()], servidor({ falha: 'unavailable' }).conectar);
    expect(lerEnvios().v1).toBeUndefined();
  });

  it('recusa do servidor não é repetida', async () => {
    await enviarPendentes([vistoria()], servidor({ falha: 'permission-denied' }).conectar);
    expect(precisaEnviar(vistoria())).toBe(false);
  });

  it('planilha tem uma linha por vistoria e uma coluna por item', () => {
    const csv = coletaParaCsv([{ id: 'v1', enviadaEm: 'x', ...montarCopiaPesquisa(vistoria()) }]);
    const [cabecalho, linha] = csv.replace('﻿', '').trim().split('\r\n');
    expect(cabecalho.split(';')).toEqual(expect.arrayContaining(['vistoriaId', 'nota', 'item_1', 'item_2']));
    expect(linha).toContain('v1;x;');
    expect(linha).toContain('conforme;nao_conforme');
  });
});
