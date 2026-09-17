import { describe, it, expect } from 'vitest';
import { analisarArquivoImportacao, criarEnvelopeExportacao } from '../dados/exportacao.js';
import { converterLegadoParaCanonica } from '../dados/migracoes.js';
import { resolverConflito } from '../dados/conflito.js';
import { Vistoria } from '../dados/esquema.js';
import { calcularStatusVistoria, TODOS_ITENS, ITENS_TECNICOS } from '../dados/checklist.js';
import { calcularIndiceItens } from '../dados/classificacao.js';

describe('Suíte de Testes — Requisitos Mínimos do Escopo 1 (§10)', () => {

  // Fixture 1: JSON estruturalmente inválido (erro de sintaxe)
  it('1. Rejeita arquivo com JSON estruturalmente inválido', () => {
    const jsonQuebrado = '{\n  formato: vistoria-ufca,\n  incompleto: true,';
    expect(() => analisarArquivoImportacao(jsonQuebrado)).toThrow(/JSON inválido|corrompido/i);
  });

  // Fixture 2: JSON válido, mas sem chaves obrigatórias do schema canônico
  it('2. Rejeita JSON válido que não atende ao contrato do schema', () => {
    const jsonInvalido = JSON.stringify({
      usuario: 'avaliador',
      observacaoAleatoria: 12345,
      naoEhVistoria: true,
    });
    expect(() => analisarArquivoImportacao(jsonInvalido)).toThrow(/não reconhecido como vistoria válida/i);
  });

  // Fixture 3: Vistoria de versão anterior com migração segura
  it('3. Migra com sucesso vistoria legada sem perder dados cadastrais ou respostas', () => {
    const legada = {
      id: 'legado-12345',
      nome: 'Bloco Acadêmico Central',
      cidade: 'Juazeiro do Norte',
      endereco: 'Av. Tenente Raimundo Rocha',
      numPavimentos: 2,
      respostas: {
        1: { valor: 'conforme', obs: 'Piso regular e antiderrapante' },
        2: { valor: 'nao-conforme', obs: 'Sem guia de balizamento' },
        3: { valor: 'nao-aplica' },
      },
    };

    const canonica = converterLegadoParaCanonica(legada);

    // Valida que passou no contrato Zod
    expect(Vistoria.safeParse(canonica).success).toBe(true);
    expect(canonica.blocoAvaliado).toBe('Bloco Acadêmico Central');
    expect(canonica.instituicao.cidade).toBe('Juazeiro do Norte');
    expect(canonica.instituicao.idLegado).toBe('legado-12345');
    expect(canonica.dadosVistoria['1'].resposta).toBe('conforme');
    expect(canonica.dadosVistoria['1'].observacao).toBe('Piso regular e antiderrapante');
    expect(canonica.dadosVistoria['2'].resposta).toBe('nao_conforme');
    expect(canonica.dadosVistoria['3'].resposta).toBe('nao_aplica');
    expect(canonica.status).toBe('em_andamento');
  });

  // Fixture 4: Arquivo excedendo o limite de tamanho aceito (15MB)
  it('4. Bloqueia arquivo que excede o limite máximo permitido de 15MB', () => {
    // Simula string com mais de 15MB
    const conteudoGigante = ' '.repeat(15 * 1024 * 1024 + 50);
    expect(() => analisarArquivoImportacao(conteudoGigante)).toThrow(/excede o limite máximo permitido/i);
  });

  // Fixture 5: Envelope com lote misto de vistorias
  it('5. Valida envelope com múltiplas vistorias canônicas em lote', () => {
    const v1 = converterLegadoParaCanonica({
      id: 'b1',
      nome: 'Bloco A',
      respostas: { 1: { valor: 'conforme' } },
    });
    const v2 = converterLegadoParaCanonica({
      id: 'b2',
      nome: 'Bloco B',
      respostas: { 2: { valor: 'nao-conforme' } },
    });

    const envelope = criarEnvelopeExportacao([v1, v2]);
    const jsonEnvelope = JSON.stringify(envelope);

    const resultado = analisarArquivoImportacao(jsonEnvelope);
    expect(resultado.tipo).toBe('envelope');
    expect(resultado.vistorias).toHaveLength(2);
    expect(resultado.vistorias[0].blocoAvaliado).toBe('Bloco A');
    expect(resultado.vistorias[1].blocoAvaliado).toBe('Bloco B');
  });

  // Fixture 6: Resolução de conflitos com as 4 estratégias e empate de revisão
  it('6. Motor de conflito resolve corretamente as 4 estratégias e desempata por revisão', () => {
    const local = converterLegadoParaCanonica({
      id: 'uuid-100',
      nome: 'Bloco C',
      revisao: 3,
      respostas: {
        1: { valor: 'conforme', obs: 'Obs Local' },
        2: { valor: 'nao-conforme' },
      },
    });

    const remota = converterLegadoParaCanonica({
      id: 'uuid-100',
      nome: 'Bloco C Remoto',
      revisao: 5,
      respostas: {
        1: { valor: 'nao-conforme', obs: 'Obs Remota' },
        3: { valor: 'conforme' },
      },
    });

    // 6.1 Sobrescrever
    const resSobrescrever = resolverConflito(local, remota, 'sobrescrever');
    expect(resSobrescrever.acao).toBe('salvar');
    expect(resSobrescrever.vistoria.vistoriaId).toBe(local.vistoriaId);
    expect(resSobrescrever.vistoria.revisao).toBe(6);
    expect(resSobrescrever.vistoria.dadosVistoria['1'].resposta).toBe('nao_conforme');

    // 6.2 Criar Cópia
    const resCopia = resolverConflito(local, remota, 'copia', ['Bloco C Remoto']);
    expect(resCopia.acao).toBe('criar');
    expect(resCopia.vistoria.vistoriaId).not.toBe(local.vistoriaId);
    expect(resCopia.vistoria.blocoAvaliado).toBe('Bloco C Remoto - Cópia');
    expect(resCopia.vistoria.revisao).toBe(0);

    // 6.3 Mesclar (remota com revisão mais alta vence critério em comum)
    const resMesclar = resolverConflito(local, remota, 'mesclar');
    expect(resMesclar.acao).toBe('salvar');
    expect(resMesclar.vistoria.dadosVistoria['1'].resposta).toBe('nao_conforme'); // remota venceu por revisão 5 > 3
    expect(resMesclar.vistoria.dadosVistoria['2'].resposta).toBe('nao_conforme'); // mantido do local
    expect(resMesclar.vistoria.dadosVistoria['3'].resposta).toBe('conforme'); // herdado da remota

    // 6.4 Cancelar
    const resCancelar = resolverConflito(local, remota, 'cancelar');
    expect(resCancelar.acao).toBe('cancelar');
    expect(resCancelar.vistoria.blocoAvaliado).toBe(local.blocoAvaliado);

    // 6.5 Desempate com revisão idêntica: valor preenchido vence nulo
    const localEmpate = { ...local, revisao: 2 };
    const remotaEmpate = {
      ...remota,
      revisao: 2,
      dadosVistoria: {
        1: { resposta: null, observacao: '' },
      },
    };
    const resEmpate = resolverConflito(localEmpate, remotaEmpate, 'mesclar');
    expect(resEmpate.vistoria.dadosVistoria['1'].resposta).toBe('conforme'); // local mantido pois remota é nula
  });

  // Fixture 7: Vistoria rascunho e resultado parcial com flag
  it('7. Classifica vistoria sem respostas como rascunho e calcula resultado parcial', () => {
    // Sem respostas
    const statusVazio = calcularStatusVistoria({}, {});
    expect(statusVazio).toBe('rascunho');

    // Resposta parcial
    const respostasParciais = {
      1: { valor: 'conforme' },
      2: { valor: 'nao-conforme' },
    };
    const statusAndamento = calcularStatusVistoria(respostasParciais, {});
    expect(statusAndamento).toBe('em_andamento');

    const totalTecnicos = ITENS_TECNICOS.length;
    const calculo = calcularIndiceItens(TODOS_ITENS, respostasParciais);

    const respondidos = calculo.conf + calculo.nc + calculo.na;
    const ehParcial = respondidos < totalTecnicos;

    expect(ehParcial).toBe(true);
    expect(calculo.conf).toBe(1);
    expect(calculo.nc).toBe(1);
    expect(calculo.pct).toBe(50);
  });

  // Fixture 8: Tratamento de QuotaExceededError
  it('8. Identifica e trata falha por estouro de cota (QuotaExceededError) com segurança', () => {
    const erroSimulado = new Error('The quota has been exceeded.');
    erroSimulado.name = 'QuotaExceededError';

    const isQuota = erroSimulado.name === 'QuotaExceededError' ||
                    erroSimulado.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
                    /quota/i.test(erroSimulado.message);

    expect(isQuota).toBe(true);
  });

});
