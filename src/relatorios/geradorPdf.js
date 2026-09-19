import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TODOS_ITENS, ITENS_TECNICOS } from '../dados/checklist.js';
import { calcularIndiceItens } from '../dados/classificacao.js';

/**
 * Extrai os dados cadastrais da instituição com regras dinâmicas:
 * - Campos obrigatórios sempre fixos ('Não informado' se vazio)
 * - Campos secundários aparecem somente se preenchidos
 */
export function extrairDadosInstituicao(vistoria) {
  const inst = vistoria.instituicao || {};
  const nome = (inst.nome || vistoria.nome || vistoria.blocoAvaliado || '').trim();
  const endereco = (inst.endereco || vistoria.endereco || '').trim();
  const cidade = (inst.cidade || vistoria.cidade || '').trim();
  const data = (inst.data || vistoria.data || '').trim();
  const avaliadores = Array.isArray(inst.avaliadores)
    ? inst.avaliadores.filter(Boolean)
    : (Array.isArray(vistoria.avaliadores) ? vistoria.avaliadores.filter(Boolean) : []);

  const obrigatorios = [
    { label: 'Instituição / Bloco Avaliado', valor: nome || 'Não informado' },
    { label: 'Endereço', valor: endereco || 'Não informado' },
    { label: 'Cidade / UF', valor: cidade || 'Não informado' },
    { label: 'Data da Vistoria', valor: data ? data.split('-').reverse().join('/') : 'Não informado' },
    { label: 'Equipe de Avaliadores', valor: avaliadores.length > 0 ? avaliadores.join(', ') : 'Não informado' },
  ];

  const opcionais = [];
  if (inst.bairro || vistoria.bairro) {
    opcionais.push({ label: 'Bairro', valor: (inst.bairro || vistoria.bairro).trim() });
  }
  if (inst.rede || vistoria.rede) {
    opcionais.push({ label: 'Rede Administrativa', valor: (inst.rede || vistoria.rede).trim() });
  }
  const nivel = inst.nivelEnsino || vistoria.nivelEnsino;
  if (nivel && (Array.isArray(nivel) ? nivel.length > 0 : String(nivel).trim())) {
    const valNivel = Array.isArray(nivel) ? nivel.join(', ') : String(nivel);
    opcionais.push({ label: 'Nível de Ensino', valor: valNivel });
  }
  if (inst.numAlunos || vistoria.numAlunos) {
    opcionais.push({ label: 'Número de Alunos', valor: String(inst.numAlunos || vistoria.numAlunos) });
  }
  if (inst.numPavimentos || vistoria.numPavimentos) {
    opcionais.push({ label: 'Número de Pavimentos', valor: String(inst.numPavimentos || vistoria.numPavimentos) });
  }
  if (inst.anoConstrucao || vistoria.anoConstrucao) {
    opcionais.push({ label: 'Ano de Construção', valor: String(inst.anoConstrucao || vistoria.anoConstrucao) });
  }
  if (inst.horarioInicio || vistoria.horarioInicio) {
    opcionais.push({ label: 'Horário de Início', valor: String(inst.horarioInicio || vistoria.horarioInicio) });
  }
  if (inst.horarioTermino || vistoria.horarioTermino) {
    opcionais.push({ label: 'Horário de Término', valor: String(inst.horarioTermino || vistoria.horarioTermino) });
  }

  return { obrigatorios, opcionais, todos: [...obrigatorios, ...opcionais] };
}

/**
 * Gera o Laudo Oficial de Acessibilidade em PDF com Tema Preto
 */
export async function gerarPdfVistoria(vistoria) {
  if (!vistoria) throw new Error('Vistoria não fornecida para geração de PDF.');

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margem = 14;
  const contentWidth = pageWidth - margem * 2;

  // Função utilitária para pintar o fundo escuro (Tema Preto / Dark Slate #0f172a)
  function pintarFundoEscuro() {
    doc.setFillColor(15, 23, 42); // #0f172a
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
  }

  // --- PÁGINA 1: DADOS DA INSTITUIÇÃO & INDICADORES IAA ---
  pintarFundoEscuro();

  // Cabeçalho Institucional
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(59, 130, 246); // azul destaque
  doc.text('DIAGNÓSTICO DE ACESSIBILIDADE ESPACIAL — NBR 9050', margem, 16);

  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184); // slate claro
  doc.text('UNIVERSIDADE FEDERAL DO CARIRI (UFCA) · PROJETO DE EXTENSÃO', margem, 20);

  // Título da Vistoria
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  const nomeInstituicao = vistoria.nome || vistoria.blocoAvaliado || 'Laudo de Vistoria';
  doc.text(nomeInstituicao, margem, 29);

  // Linha divisória fina
  doc.setDrawColor(51, 65, 85);
  doc.setLineWidth(0.4);
  doc.line(margem, 32, pageWidth - margem, 32);

  // Card 1: Ficha da Instituição (Dinâmica)
  const dados = extrairDadosInstituicao(vistoria);
  let curY = 38;

  doc.setFillColor(30, 41, 59); // surface #1e293b
  doc.roundedRect(margem, curY, contentWidth, 80, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('DADOS DA INSTITUIÇÃO E DA AVALIAÇÃO', margem + 4, curY + 7);

  doc.setFontSize(7.5);
  let itemY = curY + 14;

  // Imprime campos (fixos e opcionais)
  dados.todos.forEach((campo) => {
    if (itemY > curY + 74) return; // limite do card

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(148, 163, 184);
    doc.text(`${campo.label}:`, margem + 4, itemY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(241, 245, 249);
    const textoValor = doc.splitTextToSize(campo.valor, contentWidth - 55);
    doc.text(textoValor, margem + 52, itemY);

    itemY += 5.8;
  });

  // Card 2: Resumo do Índice de Avaliação de Acessibilidade (IAA)
  const respostas = vistoria.respostas || {};
  const indice = calcularIndiceItens(ITENS_TECNICOS, respostas);
  const classGeral = indice.classificacao;

  curY = 124;
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(margem, curY, contentWidth, 68, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('RESUMO GERAL DO DIAGNÓSTICO (IAA)', margem + 4, curY + 7);

  // Nota em destaque
  doc.setFontSize(26);
  if (indice.nota >= 7) doc.setTextColor(34, 197, 94);
  else if (indice.nota >= 4) doc.setTextColor(234, 179, 8);
  else doc.setTextColor(239, 68, 68);

  doc.text(classGeral.notaFormatada || '–', margem + 6, curY + 24);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`CLASSIFICAÇÃO: ${classGeral?.rotulo || 'NÃO AVALIADO'}`, margem + 38, curY + 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`Percentual de conformidade: ${indice.pct !== null ? indice.pct + '%' : '–'}`, margem + 38, curY + 23);

  // Quadrantes com números
  const boxW = (contentWidth - 12) / 3;
  const boxY = curY + 34;

  // Conformes
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(margem + 4, boxY, boxW, 26, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(34, 197, 94);
  doc.text(String(indice.conf), margem + 8, boxY + 12);
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Itens Conformes', margem + 8, boxY + 20);

  // Não conformes
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(margem + 6 + boxW, boxY, boxW, 26, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(239, 68, 68);
  doc.text(String(indice.nc), margem + 10 + boxW, boxY + 12);
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Não Conformes', margem + 10 + boxW, boxY + 20);

  // Não se aplica
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(margem + 8 + boxW * 2, boxY, boxW, 26, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(234, 179, 8);
  doc.text(String(indice.na), margem + 12 + boxW * 2, boxY + 12);
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Não se Aplica (N/A)', margem + 12 + boxW * 2, boxY + 20);

  // Rodapé da Capa
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Documento gerado automaticamente pelo Diagnóstico de Acessibilidade UFCA · NBR 9050', margem, pageHeight - 10);
  doc.text('Página 1', pageWidth - margem - 12, pageHeight - 10);

  // --- PÁGINAS SEGUINTES: TABELA DE ITENS COM TEMA PRETO ---
  doc.addPage();

  const colunas = [
    { header: 'Item', dataKey: 'item' },
    { header: 'Critério NBR 9050', dataKey: 'criterio' },
    { header: 'Resultado', dataKey: 'resultado' },
    { header: 'Observações', dataKey: 'obs' },
    { header: 'Foto', dataKey: 'foto' },
  ];

  const linhas = ITENS_TECNICOS.map(i => {
    const resp = respostas[i.id] || {};
    let resultadoTexto = 'Pendente';
    if (resp.valor === 'conforme' || resp.valor === 'sim') resultadoTexto = 'Conforme';
    else if (resp.valor === 'nao-conforme' || resp.valor === 'nao') resultadoTexto = 'Não Conforme';
    else if (resp.valor === 'nao-aplica') resultadoTexto = 'Não se Aplica';

    return {
      item: `#${i.id}`,
      criterio: i.pergunta,
      resultado: resultadoTexto,
      obs: resp.obs || '–',
      foto: '',
      fotoUrl: resp.foto || null,
    };
  });

  autoTable(doc, {
    columns: colunas,
    body: linhas,
    startY: 16,
    margin: { left: margem, right: margem, top: 16, bottom: 16 },
    theme: 'plain',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      lineWidth: 0.3,
      lineColor: [51, 65, 85],
    },
    bodyStyles: {
      fillColor: [15, 23, 42],
      textColor: [226, 232, 240],
      fontSize: 6.8,
      lineWidth: 0.2,
      lineColor: [51, 65, 85],
      valign: 'middle',
    },
    alternateRowStyles: {
      fillColor: [24, 32, 47],
    },
    columnStyles: {
      item: { cellWidth: 12, fontStyle: 'bold', halign: 'center' },
      criterio: { cellWidth: 70 },
      resultado: { cellWidth: 26, fontStyle: 'bold', halign: 'center' },
      obs: { cellWidth: 38 },
      foto: { cellWidth: 36, halign: 'center' },
    },
    didParseCell: (data) => {
      // Destaque colorido no resultado
      if (data.column.dataKey === 'resultado') {
        const val = data.cell.raw;
        if (val === 'Conforme') {
          data.cell.styles.textColor = [74, 222, 128]; // verde suave
        } else if (val === 'Não Conforme') {
          data.cell.styles.textColor = [248, 113, 113]; // vermelho suave
        } else if (val === 'Não se Aplica') {
          data.cell.styles.textColor = [250, 204, 21]; // amarelo suave
        }
      }

      // Coluna de foto: remove o texto para NUNCA imprimir o base64
      if (data.column.dataKey === 'foto') {
        data.cell.text = [];
        const fotoRaw = data.row.raw?.fotoUrl;
        if (fotoRaw && typeof fotoRaw === 'string' && fotoRaw.startsWith('data:image')) {
          data.cell.styles.minCellHeight = 24;
        }
      }
    },
    willDrawPage: () => {
      // Pinta o fundo da nova página antes de desenhar os itens
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
    },
    didDrawPage: () => {
      // Rodapé das páginas de tabela
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text('Documento gerado pelo Diagnóstico de Acessibilidade UFCA · NBR 9050', margem, pageHeight - 10);
      doc.text(`Página ${doc.internal.getNumberOfPages()}`, pageWidth - margem - 14, pageHeight - 10);
    },
    didDrawCell: (data) => {
      // Se for a coluna da foto e houver imagem anexada
      if (data.column.dataKey === 'foto') {
        const fotoRaw = data.row.raw?.fotoUrl;
        if (fotoRaw && typeof fotoRaw === 'string' && fotoRaw.startsWith('data:image')) {
          try {
            let formato = 'JPEG';
            if (fotoRaw.startsWith('data:image/png')) formato = 'PNG';
            else if (fotoRaw.startsWith('data:image/webp')) formato = 'WEBP';

            const cellW = data.cell.width;
            const cellH = data.cell.height;
            const imgW = Math.min(32, cellW - 4);
            const imgH = Math.min(20, cellH - 4);
            const posX = data.cell.x + (cellW - imgW) / 2;
            const posY = data.cell.y + (cellH - imgH) / 2;

            doc.addImage(
              fotoRaw,
              formato,
              posX,
              posY,
              imgW,
              imgH
            );
          } catch (e) {
            console.warn('Erro ao inserir miniatura da foto:', e);
          }
        }
      }
    },
  });

  // Salva o PDF no dispositivo
  const slug = (vistoria.nome || 'vistoria').toLowerCase().replace(/[^a-z0-9]/g, '_');
  const nomeArquivo = `laudo_acessibilidade_${slug || 'ufca'}.pdf`;
  if (typeof window !== 'undefined') {
    doc.save(nomeArquivo);
  }

  return { sucesso: true, nomeArquivo, doc };
}
