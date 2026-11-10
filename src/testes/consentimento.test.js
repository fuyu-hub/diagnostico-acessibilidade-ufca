import { describe, it, expect } from 'vitest';
import { consentimentoParaNovaVistoria, podeEnviarParaPesquisa, VERSAO_TERMO } from '../dados/consentimento.js';
import { converterLegadoParaCanonica } from '../dados/migracoes.js';

const aceite = { aceito: true, versaoTermo: VERSAO_TERMO, data: '2026-11-10T10:00:00.000Z' };
const recusa = { ...aceite, aceito: false };
const novaVistoria = decisao => ({ consentimento: consentimentoParaNovaVistoria(decisao) });

describe('Consentimento para a pesquisa', () => {
  it('vistoria criada com aceite pode ser enviada', () => {
    expect(podeEnviarParaPesquisa(novaVistoria(aceite), aceite)).toBe(true);
  });

  it('vistoria criada sem decisão ou com recusa não pode', () => {
    expect(podeEnviarParaPesquisa(novaVistoria(null), aceite)).toBe(false);
    expect(podeEnviarParaPesquisa(novaVistoria(recusa), aceite)).toBe(false);
  });

  it('desligar em Ajustes bloqueia até as vistorias aceitas', () => {
    expect(podeEnviarParaPesquisa(novaVistoria(aceite), recusa)).toBe(false);
  });

  it('vistoria antiga nunca é enviada', () => {
    const antiga = converterLegadoParaCanonica({ nome: 'Bloco A', respostas: {} });
    expect(antiga.consentimento.aceito).toBe(false);
    expect(podeEnviarParaPesquisa(antiga, aceite)).toBe(false);
  });
});
