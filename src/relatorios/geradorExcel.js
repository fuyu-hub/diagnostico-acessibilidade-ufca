import ExcelJS from 'exceljs';
import { TODOS_ITENS, SECOES } from '../dados/checklist.js';
import { calcularIndiceItens } from '../dados/classificacao.js';
import { extrairDadosInstituicao } from './geradorPdf.js';

/**
 * Converte Data URL Base64 para Buffer utilizável no ExcelJS
 */
function base64ParaArrayBuffer(dataUrl) {
  const base64 = dataUrl.split(',')[1] || dataUrl;
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Gera a Planilha Executiva em Excel (.xlsx) com:
 * - Aba 1: Dados da instituição dinâmicos e resumo do IAA
 * - Aba 2: Checklist com bordas pretas, cabeçalhos cinzas e fotos ancoradas
 */
export async function gerarPlanilhaVistoria(vistoria) {
  if (!vistoria) throw new Error('Vistoria não fornecida para planilha.');

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Diagnóstico Acessibilidade UFCA';
  workbook.created = new Date();

  const dados = extrairDadosInstituicao(vistoria);
  const respostas = vistoria.respostas || {};
  const indice = calcularIndiceItens(TODOS_ITENS, respostas);

  // Estilos padrão de borda preta
  const bordaPretaFina = {
    top: { style: 'thin', color: { argb: 'FF000000' } },
    left: { style: 'thin', color: { argb: 'FF000000' } },
    bottom: { style: 'thin', color: { argb: 'FF000000' } },
    right: { style: 'thin', color: { argb: 'FF000000' } },
  };

  const bordaPretaMedia = {
    top: { style: 'medium', color: { argb: 'FF000000' } },
    left: { style: 'medium', color: { argb: 'FF000000' } },
    bottom: { style: 'medium', color: { argb: 'FF000000' } },
    right: { style: 'medium', color: { argb: 'FF000000' } },
  };

  // --- ABA 1: DADOS DA INSTITUIÇÃO E RESUMO DO IAA ---
  const wsInst = workbook.addWorksheet('Dados da Instituição', {
    properties: { tabColor: { argb: 'FF3B82F6' } },
  });

  wsInst.columns = [
    { width: 32 },
    { width: 50 },
  ];

  // Título da Aba
  const rTitulo = wsInst.addRow(['DIAGNÓSTICO DE ACESSIBILIDADE NBR 9050 — DADOS CADASTRAIS', '']);
  wsInst.mergeCells('A1:B1');
  rTitulo.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
  rTitulo.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  rTitulo.alignment = { horizontal: 'center', vertical: 'middle' };
  rTitulo.height = 28;

  wsInst.addRow([]);

  // Subcabeçalho Institucional
  const rSub = wsInst.addRow(['Informação Cadastral', 'Valor Registrado']);
  rSub.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF000000' } };
  rSub.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCBD5E1' } }; // cinza
  rSub.eachCell(c => { c.border = bordaPretaMedia; });
  rSub.height = 22;

  // Imprime campos cadastrais dinâmicos (fixos + opcionais preenchidos)
  dados.todos.forEach(item => {
    const row = wsInst.addRow([item.label, item.valor]);
    row.font = { name: 'Arial', size: 9 };
    row.getCell(1).font = { name: 'Arial', size: 9, bold: true };
    row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }; // cinza bem claro
    row.eachCell(c => { c.border = bordaPretaFina; });
    row.height = 20;
  });

  wsInst.addRow([]);

  // Seção de Resumo do IAA
  const rIaHeader = wsInst.addRow(['Indicador de Desempenho (IAA)', 'Resultado']);
  rIaHeader.font = { name: 'Arial', size: 10, bold: true };
  rIaHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCBD5E1' } };
  rIaHeader.eachCell(c => { c.border = bordaPretaMedia; });
  rIaHeader.height = 22;

  const metricas = [
    { label: 'Nota Geral IAA (0,0 a 10,0)', valor: indice.classificacao.notaFormatada },
    { label: 'Classificação Qualitativa', valor: indice.classificacao.rotulo },
    { label: 'Percentual de Conformidade', valor: indice.pct !== null ? `${indice.pct}%` : '–' },
    { label: 'Itens Conformes', valor: indice.conf },
    { label: 'Itens Não Conformes', valor: indice.nc },
    { label: 'Itens Não se Aplica (N/A)', valor: indice.na },
    { label: 'Total de Exigências Ativas', valor: indice.total },
  ];

  metricas.forEach(m => {
    const r = wsInst.addRow([m.label, m.valor]);
    r.font = { name: 'Arial', size: 9 };
    r.getCell(1).font = { name: 'Arial', size: 9, bold: true };
    r.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    r.eachCell(c => { c.border = bordaPretaFina; });
    r.height = 20;
  });

  // --- ABA 2: CHECKLIST COM COLUNA FINAL PARA FOTO ---
  const wsItens = workbook.addWorksheet('Checklist e Fotos', {
    properties: { tabColor: { argb: 'FF22C55E' } },
  });

  wsItens.columns = [
    { header: 'Item', key: 'id', width: 8 },
    { header: 'Seção Normativa', key: 'secao', width: 28 },
    { header: 'Subgrupo', key: 'subgrupo', width: 24 },
    { header: 'Critério NBR 9050', key: 'pergunta', width: 48 },
    { header: 'Resultado', key: 'resultado', width: 18 },
    { header: 'Observações de Campo', key: 'obs', width: 34 },
    { header: 'Foto', key: 'foto', width: 22 }, // COLUNA FINAL PARA FOTO!
  ];

  // Estilização do cabeçalho da tabela: Fundo Cinza, Borda Preta, Negrito
  const headerRow = wsItens.getRow(1);
  headerRow.height = 24;
  headerRow.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FF000000' } };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFCBD5E1' }, // cinza elegante
  };
  headerRow.eachCell(cell => {
    cell.border = bordaPretaMedia;
  });

  // Mapeamento de seções para nome legível
  const mapaSecoes = Object.fromEntries(SECOES.map(s => [s.id, s.nome]));

  // Adiciona as linhas
  for (let i = 0; i < TODOS_ITENS.length; i++) {
    const item = TODOS_ITENS[i];
    const resp = respostas[item.id] || {};

    let resultadoTexto = 'Pendente';
    let corFundo = 'FFFFFFFF';

    if (resp.valor === 'conforme' || resp.valor === 'sim') {
      resultadoTexto = 'Conforme';
      corFundo = 'FFDCFCE7'; // verde suave
    } else if (resp.valor === 'nao-conforme' || resp.valor === 'nao') {
      resultadoTexto = 'Não Conforme';
      corFundo = 'FFFEE2E2'; // vermelho suave
    } else if (resp.valor === 'nao-aplica') {
      resultadoTexto = 'Não se Aplica';
      corFundo = 'FFFEF3C7'; // amarelo suave
    }

    const row = wsItens.addRow({
      id: item.id,
      secao: mapaSecoes[item.secaoId] || `Seção ${item.secaoId}`,
      subgrupo: item.subgrupo || '–',
      pergunta: item.pergunta,
      resultado: resultadoTexto,
      obs: resp.obs || '',
      foto: '', // conteúdo textual vazio, receberá a imagem ancorada
    });

    const temFoto = resp.foto && typeof resp.foto === 'string' && resp.foto.startsWith('data:image');
    row.height = temFoto ? 65 : 22; // expande linha para abrigar miniatura

    row.font = { name: 'Arial', size: 8.5 };
    row.alignment = { vertical: 'top', wrapText: true };

    row.eachCell(cell => {
      cell.border = bordaPretaFina;
    });

    // Destaque colorido no resultado
    const cellResultado = row.getCell('resultado');
    cellResultado.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: corFundo } };
    cellResultado.alignment = { horizontal: 'center', vertical: 'middle' };

    // Inserção da imagem ancorada na coluna Foto
    if (temFoto) {
      try {
        const buffer = base64ParaArrayBuffer(resp.foto);
        const imageId = workbook.addImage({
          buffer,
          extension: 'png',
        });

        wsItens.addImage(imageId, {
          tl: { col: 6.1, row: row.number - 0.9 },
          ext: { width: 85, height: 58 },
        });
      } catch (errImg) {
        console.warn('Falha ao ancorar foto no Excel:', errImg);
      }
    }
  }

  // Gera o arquivo .xlsx e dispara o download no navegador
  const bufferXlsx = await workbook.xlsx.writeBuffer();
  const blob = new Blob([bufferXlsx], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const slug = (vistoria.nome || 'vistoria').toLowerCase().replace(/[^a-z0-9]/g, '_');
  const nomeArquivo = `diagnostico_acessibilidade_${slug || 'ufca'}.xlsx`;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return { sucesso: true, nomeArquivo };
}
