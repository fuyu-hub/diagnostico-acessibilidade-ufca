import ExcelJS from 'exceljs';
import { ITENS_TECNICOS, SECOES } from '../dados/checklist.js';
import { calcularIndiceItens } from '../dados/classificacao.js';
import { CATEGORIAS, CATEGORIA_POR_SECAO, campo, formatarData, classificarResposta, extrairDadosInstituicao } from './vistoriaComum.js';

/* =========================================================================
 * Planilha de vistoria — reproduz o layout de "Modelo - Planilha Vistoria.xlsx"
 *
 *  Aba 1 "Questionário Definitivo": cabeçalho com dados da instituição e da
 *          vistoria + checklist (Categoria | N° | Item | Referência | SIM | NÃO | N/A | Foto)
 *  Aba 2 "Resumo IAA": indicadores calculados
 *  Aba 3 "Observações de Campo": só aparece se houver observações
 *
 *  A ordem e o N° dos itens seguem a planilha (campo `numero` do checklist.json).
 * ========================================================================= */

// ---------- Layout do modelo ----------
const LARGURAS_COLUNAS = [2.63, 27.63, 6.38, 90.13, 27.63, 6.38, 6.38, 6.38, 25.88]; // A..I
const COL_FOTO = 9;                 // coluna I
const LINHA_CABECALHO_TABELA = 12;
const PRIMEIRA_LINHA_ITENS = 13;
const ALTURA_LINHA_ITEM = 75;       // pt
const COLUNA_DO_RESULTADO = { sim: 6, nao: 7, na: 8 }; // F, G, H

// Cores da fonte das colunas SIM / NÃO / N/A no modelo
const COR = {
  preto: 'FF000000',
  sim: 'FF6AA84F',
  nao: 'FFFF0000',
  na: 'FFFBBC04',
};

// Constantes do layout do modelo
const LINHA_FINA = { style: 'thin', color: { argb: COR.preto } };
const BORDA = { top: LINHA_FINA, left: LINHA_FINA, bottom: LINHA_FINA, right: LINHA_FINA };
const CENTRO = { horizontal: 'center', vertical: 'middle', wrapText: true };
const ESQUERDA = { horizontal: 'left', vertical: 'middle', wrapText: true };
const fonte = (extra = {}) => ({ name: 'Arial', size: 12, color: { argb: COR.preto }, ...extra });

/** Aplica borda em todas as células do retângulo, mescla e escreve o valor na célula principal. */
function bloco(ws, l1, c1, l2, c2, valor, { font = fonte(), alignment = CENTRO, numFmt } = {}) {
  for (let l = l1; l <= l2; l++) {
    for (let c = c1; c <= c2; c++) {
      const cel = ws.getCell(l, c);
      cel.border = BORDA;
      cel.font = font;
      cel.alignment = alignment;
      if (numFmt) cel.numFmt = numFmt;
    }
  }
  if (l1 !== l2 || c1 !== c2) ws.mergeCells(l1, c1, l2, c2);
  ws.getCell(l1, c1).value = valor ?? '';
}

// ---------- Fotos ----------
function carregarImagem(dataUrl) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

function base64ParaArrayBuffer(dataUrl) {
  const base64 = dataUrl.split(',')[1] || dataUrl;
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

/** Descobre formato e dimensões da foto; converte para PNG se o formato não for suportado pelo Excel. */
async function prepararFoto(dataUrl) {
  const m = /^data:image\/([\w.+-]+);base64,/i.exec(dataUrl);
  let extensao = m ? m[1].toLowerCase() : 'png';
  if (extensao === 'jpg') extensao = 'jpeg';

  const img = typeof Image !== 'undefined' ? await carregarImagem(dataUrl) : null;
  let url = dataUrl;

  if (!['png', 'jpeg', 'gif'].includes(extensao)) {
    if (!img || typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    url = canvas.toDataURL('image/jpeg', 0.75);
    extensao = 'jpeg';
  }
  return {
    buffer: base64ParaArrayBuffer(url),
    extensao,
    largura: img ? img.naturalWidth : 0,
    altura: img ? img.naturalHeight : 0,
  };
}

// Área útil da célula da foto (px): coluna I ≈ 186 px, linha de 75 pt = 100 px
const CELULA_PX = { largura: LARGURAS_COLUNAS[COL_FOTO - 1] * 7 + 5, altura: (ALTURA_LINHA_ITEM * 96) / 72 };
const MOLDURA_PX = { largura: CELULA_PX.largura - 10, altura: CELULA_PX.altura - 8 };

/** Ancora a foto centralizada na célula, mantendo a proporção. */
function ancorarFoto(ws, imageId, foto, numeroLinha) {
  let w = MOLDURA_PX.largura;
  let h = MOLDURA_PX.altura;
  if (foto.largura && foto.altura) {
    const escala = Math.min(MOLDURA_PX.largura / foto.largura, MOLDURA_PX.altura / foto.altura);
    w = foto.largura * escala;
    h = foto.altura * escala;
  }
  ws.addImage(imageId, {
    tl: {
      col: COL_FOTO - 1 + (CELULA_PX.largura - w) / 2 / CELULA_PX.largura,
      row: numeroLinha - 1 + (CELULA_PX.altura - h) / 2 / CELULA_PX.altura,
    },
    ext: { width: w, height: h },
    editAs: 'oneCell',
  });
}

/* =========================================================================
 * Função principal
 * ========================================================================= */
export async function gerarPlanilhaVistoria(vistoria) {
  if (!vistoria) throw new Error('Vistoria não fornecida para planilha.');

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Diagnóstico Acessibilidade UFCA';
  workbook.created = new Date();

  const dados = extrairDadosInstituicao(vistoria);
  const respostas = vistoria.respostas || {};
  const mapaSecoes = Object.fromEntries((SECOES || []).map(s => [s.id, s.nome]));

  // ====================== ABA 1 — QUESTIONÁRIO ======================
  const ws = workbook.addWorksheet('Questionário', {
    views: [{ showGridLines: false }],
    pageSetup: {
      orientation: 'landscape',
      paperSize: 9, // A4
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      horizontalCentered: true,
    },
  });
  ws.columns = LARGURAS_COLUNAS.map(width => ({ width }));

  // --- Dados gerais da instituição (linhas 2 a 7) ---
  ws.getRow(2).height = 15;
  for (let l = 3; l <= 10; l++) ws.getRow(l).height = 22.5;
  ws.getRow(11).height = 27;
  ws.getRow(LINHA_CABECALHO_TABELA).height = 45;

  const rotulo = { font: fonte({ bold: true }) };
  const valor = { font: fonte() };

  bloco(ws, 2, 2, 2, 9, 'DADOS GERAIS DA INSTITUIÇÃO', rotulo);

  // coluna esquerda: rótulo em B:C, valor em D
  let nomeInst = campo(dados, 'institu', 'nome');
  if (nomeInst === 'Não informado' && vistoria.nome) nomeInst = vistoria.nome;
  
  bloco(ws, 3, 2, 3, 3, 'NOME DA INSTITUIÇÃO', rotulo);
  bloco(ws, 3, 4, 3, 4, nomeInst, valor);
  bloco(ws, 4, 2, 4, 3, 'ENDEREÇO COMPLETO', rotulo);
  bloco(ws, 4, 4, 4, 4, campo(dados, 'endereco'), valor);
  bloco(ws, 5, 2, 5, 3, 'BAIRRO', rotulo);
  bloco(ws, 5, 4, 5, 4, campo(dados, 'bairro'), valor);
  bloco(ws, 6, 2, 6, 3, 'CIDADE / MUNICÍPIO', rotulo);
  bloco(ws, 6, 4, 6, 4, campo(dados, 'cidade', 'municipio'), valor);
  bloco(ws, 7, 2, 7, 3, 'REDE DE ENSINO', rotulo);
  bloco(ws, 7, 4, 7, 4, campo(dados, 'rede'), valor);

  // coluna direita: rótulo em E:F, valor em G:I
  bloco(ws, 3, 5, 3, 6, 'N° DE ALUNOS', rotulo);
  bloco(ws, 3, 7, 3, 9, campo(dados, 'alunos'), valor);
  bloco(ws, 4, 5, 5, 6, 'N° MÁXIMO DE PAVIMENTOS (SE DIVIDIDO POR BLOCOS)', rotulo);
  bloco(ws, 4, 7, 5, 9, campo(dados, 'pavimento'), valor);
  bloco(ws, 6, 5, 6, 6, 'ANO DE CONSTRUÇÃO', rotulo);
  bloco(ws, 6, 7, 6, 9, campo(dados, ['ano', 'constru'], 'constru'), valor);
  bloco(ws, 7, 5, 7, 6, 'NÍVEL DE ENSINO', rotulo);
  bloco(ws, 7, 7, 7, 9, campo(dados, 'nivel'), valor);

  // --- Dados da vistoria (linhas 8 a 11) ---
  bloco(ws, 8, 2, 8, 9, 'DADOS DA VISTORIA', rotulo);
  
  const dataVistoriaRaw = campo(dados, ['data', 'vistoria'], 'data');
  const dataVistoriaFmt = dataVistoriaRaw !== 'Não informado' ? formatarData(dataVistoriaRaw) : 'Não informado';
  const dataTerminoRaw = campo(dados, ['termino', 'data']);
  const dataTerminoFmt = dataTerminoRaw !== 'Não informado' ? formatarData(dataTerminoRaw) : (dataVistoriaFmt !== 'Não informado' ? dataVistoriaFmt : 'Não informado');

  const horaInicioRaw = campo(dados, ['horario', 'inicio']);
  const horaFimRaw = campo(dados, ['horario', 'termino']);
  
  const strInicio = (dataVistoriaFmt !== 'Não informado' || horaInicioRaw !== 'Não informado') 
    ? `${dataVistoriaFmt !== 'Não informado' ? dataVistoriaFmt : ''} ${horaInicioRaw !== 'Não informado' ? horaInicioRaw : ''}`.trim()
    : 'Não informado';

  const strTermino = (dataTerminoFmt !== 'Não informado' || horaFimRaw !== 'Não informado') 
    ? `${dataTerminoFmt !== 'Não informado' ? dataTerminoFmt : ''} ${horaFimRaw !== 'Não informado' ? horaFimRaw : ''}`.trim()
    : 'Não informado';

  bloco(ws, 9, 2, 9, 3, 'DATA E HORA - INÍCIO', rotulo);
  bloco(ws, 9, 4, 9, 4, strInicio || 'Não informado', valor);
  bloco(ws, 9, 5, 9, 9, 'AVALIADORES', rotulo);
  bloco(ws, 10, 2, 10, 3, 'DATA E HORA - TÉRMINO', rotulo);
  bloco(ws, 10, 4, 10, 4, strTermino || 'Não informado', valor);
  bloco(ws, 10, 5, 10, 9, campo(dados, 'avaliador'), valor);

  // --- Cabeçalho da tabela (linha 13) ---
  ['Categoria/Ambiente', 'N°', 'Item a Verificar', 'Referência', 'SIM', 'NÃO', 'N/A', 'Foto'].forEach((titulo, i) => {
    bloco(ws, LINHA_CABECALHO_TABELA, i + 2, LINHA_CABECALHO_TABELA, i + 2, titulo, rotulo);
  });

  // --- Itens, na ordem e com o N° da planilha ---
  const itens = (ITENS_TECNICOS || [])
    .map((item, idx) => ({ item, numero: item.numero ?? idx + 1 }))
    .sort((a, b) => a.numero - b.numero);

  let linha = PRIMEIRA_LINHA_ITENS;
  let categoriaAtual = null;
  let inicioCategoria = linha;
  const fechaCategoria = (ate) => {
    if (categoriaAtual === null || ate < inicioCategoria) return;
    bloco(ws, inicioCategoria, 2, ate, 2, categoriaAtual.nome, { font: fonte(), alignment: CENTRO });
  };

  for (const { item, numero } of itens) {
    const idxCat = CATEGORIA_POR_SECAO[item.secaoId];
    const chave = idxCat ?? `s${item.secaoId}`;
    if (!categoriaAtual || categoriaAtual.chave !== chave) {
      fechaCategoria(linha - 1);
      categoriaAtual = {
        chave,
        nome: idxCat !== undefined ? CATEGORIAS[idxCat] : (mapaSecoes[item.secaoId] || `Seção ${item.secaoId}`),
      };
      inicioCategoria = linha;
    }

    const resp = respostas[item.id] || {};
    const resultado = classificarResposta(resp.valor);

    ws.getRow(linha).height = ALTURA_LINHA_ITEM;
    // coluna B é preenchida em bloco (fechaCategoria); aqui só a borda para não haver falhas
    ws.getCell(linha, 2).border = BORDA;
    bloco(ws, linha, 3, linha, 3, numero, { font: fonte(), alignment: CENTRO });
    bloco(ws, linha, 4, linha, 4, item.pergunta, { font: fonte(), alignment: ESQUERDA });
    bloco(ws, linha, 5, linha, 5, item.referencia || '', { font: fonte(), alignment: CENTRO });

    for (const [chaveRes, col] of Object.entries(COLUNA_DO_RESULTADO)) {
      const marcado = resultado === chaveRes;
      bloco(ws, linha, col, linha, col, marcado ? 'X' : '', {
        font: fonte({ bold: marcado, size: marcado ? 14 : 12, color: { argb: COR[chaveRes] } }),
        alignment: CENTRO,
      });
    }

    // Foto
    const celFoto = ws.getCell(linha, COL_FOTO);
    celFoto.border = BORDA;
    celFoto.alignment = CENTRO;
    if (resp.foto && typeof resp.foto === 'string' && resp.foto.startsWith('data:image')) {
      try {
        const foto = await prepararFoto(resp.foto);
        if (foto) {
          const imageId = workbook.addImage({ buffer: foto.buffer, extension: foto.extensao });
          ancorarFoto(ws, imageId, foto, linha);
        }
      } catch (errImg) {
        console.warn('Falha ao ancorar foto no Excel:', errImg);
      }
    }
    linha++;
  }
  fechaCategoria(linha - 1);

  // ====================== ABA 2 — RESUMO IAA ======================
  const wsIaa = workbook.addWorksheet('Resumo IAA');
  wsIaa.views = [{ showGridLines: false }];
  wsIaa.columns = [
    { width: 4 },   // A (margem)
    { width: 40 },  // B (Ambiente)
    { width: 12 },  // C (SIM)
    { width: 12 },  // D (NÃO)
    { width: 12 },  // E (N/A)
    { width: 12 },  // F (IA)
    { width: 4 },   // G (separador)
    { width: 15 },  // H (SIM)
    { width: 15 },  // I (NÃO)
    { width: 15 },  // J (N/A)
    { width: 15 },  // K (IA)
  ];

  const lcab = 2; // Linha do RESULTADO POR AMBIENTE
  bloco(wsIaa, lcab, 2, lcab, 6, 'RESULTADO POR AMBIENTE', { font: fonte({ bold: true }), alignment: CENTRO });
  bloco(wsIaa, lcab, 8, lcab, 11, 'RESULTADO GERAL', { font: fonte({ bold: true }), alignment: CENTRO });
  
  const lsub = 3;
  ['AMBIENTE', 'SIM', 'NÃO', 'N/A', 'IA'].forEach((t, i) => bloco(wsIaa, lsub, i + 2, lsub, i + 2, t, { font: fonte({ bold: true }), alignment: CENTRO }));
  ['SIM', 'NÃO', 'N/A', 'IA'].forEach((t, i) => bloco(wsIaa, lsub, i + 8, lsub, i + 8, t, { font: fonte({ bold: true }), alignment: CENTRO }));

  let linhaIaa = 4;
  let somaSimGeral = 0;
  let somaNaoGeral = 0;
  let somaNaGeral = 0;

  CATEGORIAS.forEach((categoria, idx) => {
    // Acha itens que pertencem a essa categoria
    const itensCat = ITENS_TECNICOS.filter(it => CATEGORIA_POR_SECAO[it.secaoId] === idx || (idx === CATEGORIAS.length - 1 && CATEGORIA_POR_SECAO[it.secaoId] === undefined));
    
    let sim = 0, nao = 0, na = 0;
    itensCat.forEach(it => {
      const resp = respostas[it.id];
      const r = resp ? classificarResposta(resp.valor) : null;
      if (r === 'sim') sim++;
      else if (r === 'nao') nao++;
      else if (r === 'na') na++;
    });

    somaSimGeral += sim;
    somaNaoGeral += nao;
    somaNaGeral += na;

    const totResp = sim + nao;
    let iaVal = 'SEM DADOS';
    if (totResp > 0) {
      iaVal = (sim / totResp) * 10;
    }

    bloco(wsIaa, linhaIaa, 2, linhaIaa, 2, categoria, { font: fonte({ size: 10 }), alignment: CENTRO });
    bloco(wsIaa, linhaIaa, 3, linhaIaa, 3, sim, { font: fonte({ size: 11 }), alignment: CENTRO });
    bloco(wsIaa, linhaIaa, 4, linhaIaa, 4, nao, { font: fonte({ size: 11 }), alignment: CENTRO });
    bloco(wsIaa, linhaIaa, 5, linhaIaa, 5, na, { font: fonte({ size: 11 }), alignment: CENTRO });
    if (iaVal === 'SEM DADOS') {
      bloco(wsIaa, linhaIaa, 6, linhaIaa, 6, iaVal, { font: fonte({ size: 11 }), alignment: CENTRO });
    } else {
      bloco(wsIaa, linhaIaa, 6, linhaIaa, 6, iaVal, { font: fonte({ size: 11 }), alignment: CENTRO, numFmt: '0.0' });
    }

    linhaIaa++;
  });

  // Resultado Geral preenchido na linha 4
  const totGeral = somaSimGeral + somaNaoGeral;
  let iaGeralVal = 'SEM DADOS';
  if (totGeral > 0) {
    iaGeralVal = (somaSimGeral / totGeral) * 10;
  }

  bloco(wsIaa, 4, 8, 4, 8, somaSimGeral, { font: fonte({ size: 12 }), alignment: CENTRO });
  bloco(wsIaa, 4, 9, 4, 9, somaNaoGeral, { font: fonte({ size: 12 }), alignment: CENTRO });
  bloco(wsIaa, 4, 10, 4, 10, somaNaGeral, { font: fonte({ size: 12 }), alignment: CENTRO });
  if (iaGeralVal === 'SEM DADOS') {
    bloco(wsIaa, 4, 11, 4, 11, iaGeralVal, { font: fonte({ size: 12 }), alignment: CENTRO });
  } else {
    bloco(wsIaa, 4, 11, 4, 11, iaGeralVal, { font: fonte({ size: 12 }), alignment: CENTRO, numFmt: '0.0' });
  }

  // ====================== ABA 3 — OBSERVAÇÕES ======================
  const comObs = itens.filter(({ item }) => {
    const rawObs = (respostas[item.id] || {}).obs || '';
    const isObsTriagem = typeof rawObs === 'string' && (rawObs.startsWith('Triagem #') || rawObs.startsWith('Triagem:'));
    return rawObs && !isObsTriagem;
  });
  if (comObs.length) {
    const wsObs = workbook.addWorksheet('Observações de Campo');
    wsObs.views = [{ showGridLines: false }];
    wsObs.columns = [{ width: 6.4 }, { width: 70 }, { width: 70 }];
    ['N°', 'Item a Verificar', 'Observações de Campo'].forEach((t, i) =>
      bloco(wsObs, 1, i + 1, 1, i + 1, t, { font: fonte({ bold: true }) }));
    wsObs.getRow(1).height = 30;
    comObs.forEach(({ item, numero }, i) => {
      const l = i + 2;
      bloco(wsObs, l, 1, l, 1, numero, { font: fonte({ size: 11 }), alignment: CENTRO });
      bloco(wsObs, l, 2, l, 2, item.pergunta, { font: fonte({ size: 11 }), alignment: ESQUERDA });
      bloco(wsObs, l, 3, l, 3, respostas[item.id].obs, { font: fonte({ size: 11 }), alignment: ESQUERDA });
    });
  }

  // ====================== DOWNLOAD ======================
  const bufferXlsx = await workbook.xlsx.writeBuffer();
  const blob = new Blob([bufferXlsx], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const nomeSanitizado = (vistoria.nome || 'Sem Nome').trim();
  const nomeArquivo = `Vistoria - ${nomeSanitizado}.xlsx`;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return { sucesso: true, nomeArquivo };
}