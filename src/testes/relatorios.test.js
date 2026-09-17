import { describe, it, expect, vi } from 'vitest';
import { extrairDadosInstituicao, gerarPdfVistoria } from '../relatorios/geradorPdf.js';
import { gerarPlanilhaVistoria } from '../relatorios/geradorExcel.js';

describe('Relatórios e Exportação (Escopo 4)', () => {
  it('1. Extração dinâmica de dados da instituição com campos estritamente necessários sempre fixos', () => {
    const vistoriaVazia = { id: 'teste-1' };
    const dados = extrairDadosInstituicao(vistoriaVazia);

    // Campos obrigatórios fixos com Não informado
    expect(dados.obrigatorios).toHaveLength(5);
    expect(dados.obrigatorios.find(c => c.label.includes('Instituição'))?.valor).toBe('Não informado');
    expect(dados.obrigatorios.find(c => c.label.includes('Endereço'))?.valor).toBe('Não informado');
    expect(dados.obrigatorios.find(c => c.label.includes('Cidade'))?.valor).toBe('Não informado');
    expect(dados.obrigatorios.find(c => c.label.includes('Data'))?.valor).toBe('Não informado');
    expect(dados.obrigatorios.find(c => c.label.includes('Avaliadores'))?.valor).toBe('Não informado');

    // Campos secundários não devem aparecer se não preenchidos
    expect(dados.opcionais).toHaveLength(0);
  });

  it('2. Campos secundários aparecem apenas quando informados', () => {
    const vistoriaPreenchida = {
      id: 'teste-2',
      nome: 'Escola Modelo UFCA',
      endereco: 'Rua Central, 100',
      cidade: 'Juazeiro do Norte',
      data: '2026-09-17',
      avaliadores: ['Prof. Silva', 'Eng. Maria'],
      bairro: 'Centro',
      rede: 'Estadual',
      nivelEnsino: ['Fundamental', 'Médio'],
      numAlunos: 450,
      horarioInicio: '08:30',
    };

    const dados = extrairDadosInstituicao(vistoriaPreenchida);
    expect(dados.obrigatorios.find(c => c.label.includes('Instituição'))?.valor).toBe('Escola Modelo UFCA');
    expect(dados.obrigatorios.find(c => c.label.includes('Avaliadores'))?.valor).toBe('Prof. Silva, Eng. Maria');

    // Campos opcionais presentes
    const labelsOpcionais = dados.opcionais.map(o => o.label);
    expect(labelsOpcionais).toContain('Bairro');
    expect(labelsOpcionais).toContain('Rede Administrativa');
    expect(labelsOpcionais).toContain('Nível de Ensino');
    expect(labelsOpcionais).toContain('Número de Alunos');
    expect(labelsOpcionais).toContain('Horário de Início');

    // Pavimentos e horário término não foram informados, não devem aparecer
    expect(labelsOpcionais).not.toContain('Número de Pavimentos');
    expect(labelsOpcionais).not.toContain('Horário de Término');
  });

  it('3. Gera PDF com tema preto sem exceções', async () => {
    // Mock do ambiente de navegador se necessário
    if (typeof globalThis.document === 'undefined') {
      globalThis.document = {
        createElement: () => ({ click: vi.fn(), href: '', download: '' }),
        body: { appendChild: vi.fn(), removeChild: vi.fn() },
      };
    }

    const vistoria = {
      id: 'v-pdf-1',
      nome: 'Campus Juazeiro',
      cidade: 'Juazeiro do Norte',
      respostas: {
        1: { valor: 'conforme', obs: 'Dentro da NBR' },
        2: { valor: 'nao-conforme', obs: 'Degrau irregular' },
      },
    };

    const resultado = await gerarPdfVistoria(vistoria);
    expect(resultado.sucesso).toBe(true);
    expect(resultado.nomeArquivo).toContain('campus_juazeiro');
  });

  it('4. Gera Planilha Excel com bordas, fundo cinza e coluna de foto', async () => {
    if (typeof globalThis.URL === 'undefined' || !globalThis.URL.createObjectURL) {
      globalThis.URL = {
        createObjectURL: vi.fn(() => 'blob:mock-url'),
        revokeObjectURL: vi.fn(),
      };
    }

    const vistoria = {
      id: 'v-excel-1',
      nome: 'Campus Crato',
      cidade: 'Crato',
      respostas: {
        1: { valor: 'conforme', obs: 'Piso tátil instalado' },
      },
    };

    const resultado = await gerarPlanilhaVistoria(vistoria);
    expect(resultado.sucesso).toBe(true);
    expect(resultado.nomeArquivo).toContain('campus_crato');
  });

  it('5. Formata tamanho de bytes adequadamente para o usuário', async () => {
    const { formatarTamanhoBytes } = await import('../utilitarios/imagem.js');
    expect(formatarTamanhoBytes(0)).toBe('0 B');
    expect(formatarTamanhoBytes(512)).toBe('512 B');
    expect(formatarTamanhoBytes(102400)).toBe('100 KB');
    expect(formatarTamanhoBytes(2.5 * 1024 * 1024)).toBe('2.5 MB');
  });

  it('6. Converte Data URL para Blob JPEG para download', async () => {
    const { converterParaJpegBlob } = await import('../utilitarios/imagem.js');
    const blob = await converterParaJpegBlob('data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==');
    expect(blob).toBeDefined();
    expect(blob.type).toBe('image/jpeg');
  });
});
