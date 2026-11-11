import { describe, it, expect } from 'vitest';
import { gerarCodigoGrupo, copiaParaGrupo, aplicarCopiasRemotas, fichaDoGrupo } from '../dados/sincronizacao.js';
import { precisaEnviar } from '../dados/coleta.js';
import { VERSAO_TERMO } from '../dados/consentimento.js';

const h = m => `2026-11-10T14:${String(m).padStart(2, '0')}:00.000Z`;
const r = (resposta, autor, min, extra = {}) => ({ resposta, observacao: '', autor, atualizadaEm: h(min), ...extra });

describe('Vistoria em grupo', () => {
  it('código do link é longo, seguro para URL e diferente a cada vez', () => {
    const a = gerarCodigoGrupo();
    expect(a).toMatch(/^[A-Za-z0-9_-]{22}$/);
    expect(gerarCodigoGrupo()).not.toBe(a);
  });

  it('a cópia enviada ao grupo não leva fotos', () => {
    const copia = copiaParaGrupo({ 1: r('conforme', 'ana', 1, { fotos: ['data:image/jpeg;x'], foto: 'data:image/jpeg;x' }) });
    expect(copia[1]).not.toHaveProperty('fotos');
    expect(copia[1]).not.toHaveProperty('foto');
    expect(copia[1].resposta).toBe('conforme');
  });

  it('a ficha do grupo não leva os avaliadores deste aparelho', () => {
    expect(fichaDoGrupo({ instituicao: { nome: 'Escola', cidade: 'Crato', avaliadores: ['Ana'] } }))
      .toEqual({ nome: 'Escola', cidade: 'Crato' });
  });

  it('resposta nova de outra pessoa é aplicada', () => {
    const novo = aplicarCopiasRemotas({ 1: r('conforme', 'ana', 1) }, [{ 2: r('nao_conforme', 'joao', 2) }]);
    expect(novo[2].resposta).toBe('nao_conforme');
  });

  it('nada novo não gera gravação, para os aparelhos não ficarem reenviando', () => {
    const local = { 1: r('conforme', 'ana', 1, { fotos: ['data:image/jpeg;a'], foto: 'data:image/jpeg;a' }) };
    expect(aplicarCopiasRemotas(local, [copiaParaGrupo(local)])).toBeNull();
    expect(aplicarCopiasRemotas(local, [])).toBeNull();
  });

  it('a foto deste aparelho continua quando outra pessoa responde o item depois', () => {
    const local = { 1: r('conforme', 'ana', 1, { fotos: ['data:image/jpeg;a'] }) };
    const novo = aplicarCopiasRemotas(local, [{ 1: r('nao_conforme', 'joao', 5, { base: h(1) }) }]);
    expect(novo[1].resposta).toBe('nao_conforme');
    expect(novo[1].fotos).toEqual(['data:image/jpeg;a']);
  });

  it('só o responsável envia a vistoria em grupo para a pesquisa', () => {
    const base = {
      vistoriaId: 'v1', status: 'concluida', dataUltimaEdicao: h(9),
      consentimento: { aceito: true, versaoTermo: VERSAO_TERMO, dataAceite: h(0) },
    };
    const grupo = papel => ({ codigo: 'x'.repeat(22), nome: 'Ana', papel, entrouEm: h(0) });
    expect(precisaEnviar({ ...base, grupo: grupo('responsavel') }, {})).toBe(true);
    expect(precisaEnviar({ ...base, grupo: grupo('participante') }, {})).toBe(false);
  });
});
