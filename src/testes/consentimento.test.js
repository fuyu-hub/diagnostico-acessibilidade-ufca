import { describe, it, expect } from 'vitest';
import { consentimentoParaNovaVistoria, podeEnviarParaPesquisa, VERSAO_TERMO } from '../dados/consentimento.js';
import { converterLegadoParaCanonica } from '../dados/migracoes.js';

const ciencia = { aceito: true, versaoTermo: VERSAO_TERMO, data: '2026-11-10T10:00:00.000Z' };
const novaVistoria = decisao => ({ consentimento: consentimentoParaNovaVistoria(decisao) });

describe('Ciência do envio à pesquisa', () => {
  it('vistoria criada depois da ciência é enviada', () => {
    expect(podeEnviarParaPesquisa(novaVistoria(ciencia))).toBe(true);
  });

  it('vistoria criada sem ciência não é', () => {
    expect(podeEnviarParaPesquisa(novaVistoria(null))).toBe(false);
  });

  it('vistoria antiga nunca é enviada', () => {
    const antiga = converterLegadoParaCanonica({ nome: 'Bloco A', respostas: {} });
    expect(podeEnviarParaPesquisa(antiga)).toBe(false);
  });

  it('termo de outra versão não vale', () => {
    const v = { consentimento: { aceito: true, versaoTermo: '1.0', dataAceite: ciencia.data } };
    expect(podeEnviarParaPesquisa(v)).toBe(false);
  });
});
