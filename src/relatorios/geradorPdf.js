import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ITENS_TECNICOS, SECOES } from '../dados/checklist.js';
import { calcularIndiceItens } from '../dados/classificacao.js';
import { campo, formatarData, classificarResposta, agruparItens, extrairDadosInstituicao } from './vistoriaComum.js';

/* =========================================================================
 * Relatório técnico de vistoria — PDF A4, fundo branco, texto preto.
 *
 *  Pág. 1   Capa: somente dados da vistoria
 *  Pág. 2   1  Índice de Avaliação de Acessibilidade (IAA)
 *  Pág. 3+  2  Levantamento dos itens (uma tabela por categoria)
 *           3  Observações de campo (só quando observacoes = 'apendice')
 *
 *  Margens e numeração de páginas seguem a ABNT NBR 14724 / 6024:
 *  margens 3 / 3 / 2 / 2 cm (esq. / sup. / dir. / inf.), número da página no canto
 *  superior direito a 2 cm da borda, a partir da segunda folha.
 *  Arial: o jsPDF só traz 'helvetica' embutida, que é métrica e visualmente idêntica.
 *
 *  Uso: gerarRelatorioPdf(vistoria, { observacoes: 'coluna' | 'apendice' })
 * ========================================================================= */

// ---------- Página ----------
const FONTE = 'helvetica';
const PAGINA = { largura: 210, altura: 297 };
const M = { esq: 30, topo: 30, dir: 20, base: 20 };
const LARGURA = PAGINA.largura - M.esq - M.dir; // 160 mm
const X_DIR = PAGINA.largura - M.dir;
const Y_MAX = PAGINA.altura - M.base;

// Linha de créditos opcional no rodapé da capa (ex.: 'Desenvolvido por ...'). Vazia = não aparece.
const CREDITOS = '';

// Só tons de cinza: o relatório continua legível impresso em preto e branco.
const PRETO = [0, 0, 0];
const BRANCO = [255, 255, 255];
const CINZA_TEXTO = [85, 85, 85];
const CINZA_MEDIO = [125, 125, 125];
const CINZA_LINHA = [195, 195, 195];
const CINZA_CLARO = [222, 222, 222];
const CINZA_FUNDO = [238, 238, 238];

const FOTO_MAX_PX = 900; // fotos maiores são reduzidas para o PDF não ficar gigante

// ---------- Utilitários de desenho ----------
const nota = n => (Number.isFinite(n) ? n.toFixed(1).replace('.', ',') : '–');

function poligono(doc, pontos, estilo = 'F') {
  const [x0, y0] = pontos[0];
  const segmentos = pontos.slice(1).map(([x, y], i) => [x - pontos[i][0], y - pontos[i][1]]);
  doc.lines(segmentos, x0, y0, [1, 1], estilo, true);
}

/** Faixa de coroa circular entre os raios r1 e r2, de aIni a aFim (radianos). */
function arco(doc, cx, cy, r1, r2, aIni, aFim, rgb) {
  const passos = Math.max(2, Math.ceil(Math.abs(aFim - aIni) / (Math.PI / 90)));
  const externo = [];
  const interno = [];
  for (let i = 0; i <= passos; i++) {
    const a = aIni + ((aFim - aIni) * i) / passos;
    externo.push([cx + r2 * Math.cos(a), cy + r2 * Math.sin(a)]);
    interno.push([cx + r1 * Math.cos(a), cy + r1 * Math.sin(a)]);
  }
  doc.setFillColor(...rgb);
  poligono(doc, [...externo, ...interno.reverse()], 'F');
}

function tituloSecao(doc, numero, texto, y = M.topo) {
  doc.setFont(FONTE, 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...PRETO);
  doc.text(String(numero), M.esq, y);
  doc.text(texto.toUpperCase(), M.esq + 8, y);
  doc.setDrawColor(...PRETO);
  doc.setLineWidth(0.5);
  doc.line(M.esq, y + 2.5, X_DIR, y + 2.5);
  return y + 10;
}

function linhaInferior(doc, cell, rgb = CINZA_LINHA, espessura = 0.2) {
  doc.setDrawColor(...rgb);
  doc.setLineWidth(espessura);
  doc.line(cell.x, cell.y + cell.height, cell.x + cell.width, cell.y + cell.height);
}

const ESTILOS_CONDICAO = {
  sim: { rotulo: 'Conforme', borda: PRETO, fundo: null, texto: PRETO },
  nao: { rotulo: 'Não conforme', borda: null, fundo: PRETO, texto: BRANCO },
  na: { rotulo: 'Não se aplica', borda: null, fundo: CINZA_CLARO, texto: CINZA_TEXTO },
  pendente: { rotulo: 'Pendente', borda: CINZA_MEDIO, fundo: null, texto: CINZA_TEXTO, tracejado: true },
};

/** Etiqueta arredondada com a condição do item (por extenso, legível também em P&B). */
function etiquetaCondicao(doc, cell, resultado) {
  const e = ESTILOS_CONDICAO[resultado || 'pendente'];
  const w = Math.min(cell.width - 3, 22);
  const h = 5.6;
  const x = cell.x + (cell.width - w) / 2;
  const y = cell.y + (cell.height - h) / 2;

  if (e.fundo) {
    doc.setFillColor(...e.fundo);
    doc.roundedRect(x, y, w, h, h / 2, h / 2, 'F');
  }
  if (e.borda) {
    doc.setDrawColor(...e.borda);
    doc.setLineWidth(0.3);
    if (e.tracejado) doc.setLineDashPattern([0.8, 0.8], 0);
    doc.roundedRect(x, y, w, h, h / 2, h / 2, 'S');
    if (e.tracejado) doc.setLineDashPattern([], 0);
  }
  doc.setFont(FONTE, 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(...e.texto);
  doc.text(e.rotulo, x + w / 2, y + h / 2 + 0.95, { align: 'center' });
}

/** Barra dividida em partes proporcionais ao valor de cada uma. */
function barraEmpilhada(doc, x, y, w, h, partes) {
  const total = partes.reduce((s, p) => s + p.valor, 0);
  if (total <= 0) {
    doc.setFillColor(...CINZA_FUNDO);
    doc.rect(x, y, w, h, 'F');
  } else {
    let cursor = x;
    partes.forEach(p => {
      const largura = (p.valor / total) * w;
      if (largura <= 0) return;
      doc.setFillColor(...p.cor);
      doc.rect(cursor, y, largura, h, 'F');
      cursor += largura;
    });
  }
  doc.setDrawColor(...PRETO);
  doc.setLineWidth(0.3);
  doc.rect(x, y, w, h, 'S');
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

/** Devolve { url, formato, w, h } pronto para addImage, reduzindo/convertendo quando necessário. */
async function prepararFoto(doc, dataUrl) {
  if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image')) return null;
  const m = /^data:image\/([\w.+-]+);base64,/i.exec(dataUrl);
  let ext = m ? m[1].toLowerCase() : 'jpeg';
  if (ext === 'jpg') ext = 'jpeg';
  const nativo = ext === 'png' || ext === 'jpeg';

  if (typeof Image !== 'undefined' && typeof document !== 'undefined') {
    const img = await carregarImagem(dataUrl);
    if (!img) return null;
    const maior = Math.max(img.naturalWidth, img.naturalHeight);
    if (nativo && maior <= FOTO_MAX_PX) {
      return { url: dataUrl, formato: ext.toUpperCase(), w: img.naturalWidth, h: img.naturalHeight };
    }
    const escala = Math.min(1, FOTO_MAX_PX / maior);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * escala);
    canvas.height = Math.round(img.naturalHeight * escala);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return { url: canvas.toDataURL('image/jpeg', 0.75), formato: 'JPEG', w: canvas.width, h: canvas.height };
  }

  if (!nativo) return null;
  const p = doc.getImageProperties(dataUrl);
  return { url: dataUrl, formato: ext.toUpperCase(), w: p.width, h: p.height };
}

// ---------- Capa ----------
function desenharCapa(doc, vistoria, dados) {
  let y = M.topo;

  doc.setFont(FONTE, 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...PRETO);
  doc.text('RELATÓRIO TÉCNICO', M.esq, y, { charSpace: 1.4 });
  doc.setFillColor(...PRETO);
  doc.rect(M.esq, y + 4, 22, 1.6, 'F');

  y += 22;
  doc.setFontSize(27);
  const titulo = doc.splitTextToSize('Diagnóstico das Condições de Acessibilidade', LARGURA);
  doc.text(titulo, M.esq, y, { lineHeightFactor: 1.15 });
  y += titulo.length * 11 - 2;

  doc.setFont(FONTE, 'normal');
  doc.setFontSize(11.5);
  doc.setTextColor(...CINZA_TEXTO);
  const sub = doc.splitTextToSize('Levantamento in loco das condições de acessibilidade espacial e arquitetônica — ABNT NBR 9050:2020', LARGURA - 20);
  doc.text(sub, M.esq, y, { lineHeightFactor: 1.4 });
  y += sub.length * 5.6 + 12;

  // Instituição vistoriada
  let nomeInst = campo(dados, 'institu', 'nome');
  if (nomeInst === 'Não informado' && vistoria.nome) nomeInst = vistoria.nome;

  doc.setDrawColor(...PRETO);
  doc.setLineWidth(0.5);
  doc.line(M.esq, y, X_DIR, y);
  y += 6;
  doc.setFont(FONTE, 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...CINZA_TEXTO);
  doc.text('INSTITUIÇÃO VISTORIADA', M.esq, y, { charSpace: 1 });
  y += 8;
  doc.setFontSize(18);
  doc.setTextColor(...PRETO);
  const linhasNome = doc.splitTextToSize(nomeInst, LARGURA);
  doc.text(linhasNome, M.esq, y, { lineHeightFactor: 1.2 });
  y += linhasNome.length * 7.8 + 4;

  // Dados em três blocos; campos secundários só aparecem se preenchidos
  const dataHora = (dataRaw, hora) => {
    const d = formatarData(dataRaw);
    const h = hora !== 'Não informado' ? hora : '';
    return [d, h].filter(Boolean).join(' às ') || 'Não informado';
  };
  const dataInicio = campo(dados, ['data', 'inicio'], ['data', 'vistoria']);
  const dataFim = campo(dados, ['data', 'termino']);
  const inicio = dataHora(dataInicio, campo(dados, ['horario', 'inicio']));
  const termino = dataHora(dataFim !== 'Não informado' ? dataFim : dataInicio, campo(dados, ['horario', 'termino']));
  const avaliadores = campo(dados, 'avaliador');

  const blocos = [
    ['Localização', [
      ['Endereço', campo(dados, 'endereco'), true],
      ['Bairro', campo(dados, 'bairro')],
      ['Cidade / Município', campo(dados, 'cidade', 'municipio'), true],
    ]],
    ['Caracterização', [
      ['Rede de ensino', campo(dados, 'rede')],
      ['Nível de ensino', campo(dados, 'nivel')],
      ['Nº de alunos', campo(dados, 'alunos')],
      ['Nº de pavimentos', campo(dados, 'pavimento')],
      ['Ano de construção', campo(dados, ['ano', 'constru'], 'constru')],
    ]],
    ['Vistoria', [
      ['Início', inicio, true],
      ['Término', termino, true],
      ['Avaliadores', avaliadores === 'Não informado' ? avaliadores : avaliadores.split(/,\s*/), true],
    ]],
  ];

  const X_VALOR = M.esq + 44;
  blocos.forEach(([titulo, linhas]) => {
    const visiveis = linhas.filter(([, valor, obrigatorio]) => obrigatorio || valor !== 'Não informado');
    if (!visiveis.length) return;

    y += 4;
    doc.setFont(FONTE, 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...PRETO);
    doc.text(titulo.toUpperCase(), M.esq, y, { charSpace: 0.8 });
    doc.setDrawColor(...PRETO);
    doc.setLineWidth(0.3);
    doc.line(M.esq, y + 2, X_DIR, y + 2);
    y += 2;

    visiveis.forEach(([rotulo, valor]) => {
      const linhasValor = Array.isArray(valor) ? valor : doc.splitTextToSize(String(valor), LARGURA - 46);
      const altura = Math.max(7.5, linhasValor.length * 4.8 + 3);
      doc.setFont(FONTE, 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...CINZA_TEXTO);
      doc.text(rotulo.toUpperCase(), M.esq, y + 5.2);
      doc.setFont(FONTE, 'normal');
      doc.setFontSize(10.5);
      doc.setTextColor(...PRETO);
      doc.text(linhasValor, X_VALOR, y + 5.2, { lineHeightFactor: 1.25 });
      y += altura;
      doc.setDrawColor(...CINZA_LINHA);
      doc.setLineWidth(0.15);
      doc.line(M.esq, y, X_DIR, y);
    });
    y += 2;
  });

  // Rodapé da capa
  doc.setFont(FONTE, 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...CINZA_TEXTO);
  const hoje = new Date().toLocaleDateString('pt-BR');
  doc.text('Referencial normativo: ABNT NBR 9050:2020', M.esq, Y_MAX - 4);
  doc.text(`Emitido em ${hoje}`, X_DIR, Y_MAX - 4, { align: 'right' });
  if (CREDITOS) doc.text(CREDITOS, M.esq, Y_MAX + 1);
}

// ---------- Página do IAA ----------
function desenharIaa(doc, grupos, respostas) {
  let y = tituloSecao(doc, 1, 'Índice de Avaliação de Acessibilidade (IAA)');
  const geral = calcularIndiceItens(ITENS_TECNICOS, respostas);
  const classif = geral.classificacao || {};
  const total = ITENS_TECNICOS.length;
  const avaliados = geral.conf + geral.nc;
  const pendentes = Math.max(0, total - (geral.conf + geral.nc + geral.na));

  // Painel de destaque
  const altura = 62;
  doc.setDrawColor(...PRETO);
  doc.setLineWidth(0.5);
  doc.rect(M.esq, y, LARGURA, altura, 'S');
  doc.setDrawColor(...CINZA_LINHA);
  doc.setLineWidth(0.2);
  doc.line(M.esq + 78, y + 7, M.esq + 78, y + altura - 7);

  // Medidor semicircular
  const cx = M.esq + 39;
  const cy = y + 45;
  const R2 = 30;
  const R1 = 21;
  const frac = Math.min(1, Math.max(0, Number.isFinite(geral.nota) ? geral.nota / 10 : 0));
  arco(doc, cx, cy, R1, R2, Math.PI, 2 * Math.PI, CINZA_CLARO);
  if (frac > 0) arco(doc, cx, cy, R1, R2, Math.PI, Math.PI + Math.PI * frac, PRETO);

  doc.setFont(FONTE, 'bold');
  doc.setFontSize(30);
  doc.setTextColor(...PRETO);
  doc.text(classif.notaFormatada || nota(geral.nota), cx, cy - 7, { align: 'center' });
  doc.setFont(FONTE, 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...CINZA_TEXTO);
  doc.text('de 10', cx, cy - 1, { align: 'center' });
  doc.text('0', cx - (R1 + R2) / 2, cy + 5, { align: 'center' });
  doc.text('10', cx + (R1 + R2) / 2, cy + 5, { align: 'center' });

  // Painel direito: classificação + composição dos itens
  const px = M.esq + 86;
  const pw = LARGURA - 94;
  let py = y + 10;
  doc.setFont(FONTE, 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...CINZA_TEXTO);
  doc.text('CLASSIFICAÇÃO', px, py, { charSpace: 1 });
  py += 7;
  doc.setFontSize(14);
  doc.setTextColor(...PRETO);
  const rotulo = doc.splitTextToSize(classif.rotulo || 'Não avaliado', pw).slice(0, 2);
  doc.text(rotulo, px, py, { lineHeightFactor: 1.15 });
  py += rotulo.length * 6 + 1;

  if (classif.descricao) {
    doc.setFont(FONTE, 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...CINZA_TEXTO);
    const desc = doc.splitTextToSize(classif.descricao, pw);
    doc.text(desc, px, py, { lineHeightFactor: 1.25 });
    py += desc.length * 3.2 + 3;
  }

  doc.setFont(FONTE, 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...CINZA_TEXTO);
  const yBarra = y + 40;
  if (geral.pct !== null && geral.pct !== undefined) {
    doc.text(`Conformidade de ${String(geral.pct).replace('.', ',')}% entre os itens avaliados`, px, yBarra - 3);
  }
  barraEmpilhada(doc, px, yBarra, pw, 5, [
    { valor: geral.conf, cor: PRETO },
    { valor: geral.nc, cor: CINZA_MEDIO },
    { valor: geral.na, cor: CINZA_CLARO },
    { valor: pendentes, cor: BRANCO },
  ]);

  const legenda = [
    ['Conforme', geral.conf, PRETO],
    ['Não conf.', geral.nc, CINZA_MEDIO],
    ['N/A', geral.na, CINZA_CLARO],
  ];
  if (pendentes) legenda.push(['Pendente', pendentes, BRANCO]);
  doc.setFontSize(7.5);
  const nCols = 3;
  legenda.forEach(([nome, valor, rgb], i) => {
    const lx = px + (i % nCols) * (pw / nCols);
    const ly = yBarra + 10.2 + Math.floor(i / nCols) * 5.2;
    doc.setFillColor(...rgb);
    doc.setDrawColor(...PRETO);
    doc.setLineWidth(0.2);
    doc.rect(lx, ly - 2.2, 2.4, 2.4, 'FD');
    doc.setTextColor(...PRETO);
    doc.text(`${nome} (${valor})`, lx + 3.8, ly);
  });

  // Tabela por ambiente
  y += altura + 12;
  doc.setFont(FONTE, 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...PRETO);
  doc.text('Resultado por ambiente', M.esq, y);

  const stats = grupos.map(g => ({ nome: g.nome, ...calcularIndiceItens(g.itens.map(e => e.item), respostas) }));
  stats.push({ nome: 'Resultado geral', ...geral });

  autoTable(doc, {
    startY: y + 3,
    margin: { left: M.esq, right: M.dir, top: M.topo, bottom: M.base },
    theme: 'plain',
    styles: { font: FONTE, fontSize: 8.5, textColor: PRETO, cellPadding: 1.8, valign: 'middle', lineWidth: 0 },
    headStyles: { fillColor: PRETO, textColor: BRANCO, fontStyle: 'bold', fontSize: 8, halign: 'center' },
    bodyStyles: { minCellHeight: 9 },
    columnStyles: {
      0: { cellWidth: 55 },
      1: { cellWidth: 17, halign: 'center' },
      2: { cellWidth: 21, halign: 'center' },
      3: { cellWidth: 14, halign: 'center' },
      4: { cellWidth: 53 },
    },
    head: [['Ambiente', 'Conforme', 'Não conforme', 'N/A', 'Índice (0 a 10)']],
    body: stats.map(s => [s.nome, s.conf, s.nc, s.na, '']),
    rowPageBreak: 'avoid',
    didParseCell: d => {
      if (d.section !== 'body') return;
      if (d.row.index === stats.length - 1) {
        d.cell.styles.fontStyle = 'bold';
        d.cell.styles.fillColor = CINZA_FUNDO;
      }
    },
    didDrawCell: d => {
      if (d.section !== 'body') return;
      linhaInferior(doc, d.cell, d.row.index === stats.length - 2 ? PRETO : CINZA_LINHA, d.row.index === stats.length - 2 ? 0.4 : 0.2);
      if (d.column.index !== 4) return;
      const s = stats[d.row.index];
      const c = d.cell;
      const bw = 34;
      const by = c.y + c.height / 2 - 1.5;
      if (!Number.isFinite(s.nota)) {
        doc.setFont(FONTE, 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...CINZA_TEXTO);
        doc.text('Sem dados', c.x + 2, c.y + c.height / 2 + 1);
        return;
      }
      doc.setFillColor(...CINZA_CLARO);
      doc.rect(c.x + 2, by, bw, 3, 'F');
      doc.setFillColor(...PRETO);
      doc.rect(c.x + 2, by, bw * Math.min(1, Math.max(0, s.nota / 10)), 3, 'F');
      doc.setFont(FONTE, 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...PRETO);
      doc.text(nota(s.nota), c.x + c.width - 2, c.y + c.height / 2 + 1.2, { align: 'right' });
    },
  });

  // Nota metodológica
  let yn = (doc.lastAutoTable?.finalY ?? y + 40) + 7;
  const textoNota = 'Nota: o IAA de cada ambiente é a razão entre os itens conformes e os itens avaliados '
    + '(conformes + não conformes), multiplicada por 10. Itens marcados como “não se aplica” e itens '
    + 'pendentes não entram no cálculo.';
  doc.setFont(FONTE, 'normal');
  doc.setFontSize(8);
  const linhasNota = doc.splitTextToSize(textoNota, LARGURA);
  if (yn + linhasNota.length * 3.6 > Y_MAX) { doc.addPage(); yn = M.topo; }
  doc.setTextColor(...CINZA_TEXTO);
  doc.text(linhasNota, M.esq, yn, { lineHeightFactor: 1.35 });
}

// ---------- Tabelas de itens ----------
/** Altura aproximada (mm) da primeira linha de uma tabela, para não deixar o título da categoria sozinho no fim da página. */
function alturaPrimeiraLinha(doc, item, obs, meta, larguras, comObs) {
  doc.setFont(FONTE, 'normal');
  doc.setFontSize(9);
  let h = doc.splitTextToSize(String(item.pergunta), larguras[1] - 4.4).length * 3.7 + 4.4;
  if (comObs) {
    doc.setFontSize(8.5);
    h = Math.max(h, doc.splitTextToSize(String(obs || '–'), larguras[3] - 4.4).length * 3.5 + 4.4);
  }
  if (meta.foto) h = Math.max(h, 26);
  return Math.max(h, 9.2) + 1;
}

function desenharItens(doc, grupos, respostas, fotos, observacoesEmColuna) {
  doc.addPage();
  let y = tituloSecao(doc, 2, 'Levantamento dos itens verificados');

  const larguras = observacoesEmColuna ? [10, 60, 25, 37, 28] : [10, 97, 25, 28];
  const nCols = larguras.length;
  const colCond = 2;
  const colFoto = nCols - 1;
  const estiloColunas = Object.fromEntries(larguras.map((w, i) => [i, { cellWidth: w, halign: i === 1 ? 'left' : 'center' }]));
  estiloColunas[0].fontStyle = 'bold';

  let proximoY = y;
  grupos.forEach(grupo => {
    const indice = calcularIndiceItens(grupo.itens.map(e => e.item), respostas);
    const metas = [];
    const corpo = grupo.itens.map(({ item, numero }) => {
      const resp = respostas[item.id] || {};
      const foto = fotos.get(item.id) || null;
      metas.push({ resultado: classificarResposta(resp.valor), foto });
      const rawObs = resp.obs || '';
      const isObsTriagem = typeof rawObs === 'string' && (rawObs.startsWith('Triagem #') || rawObs.startsWith('Triagem:'));
      const finalObs = isObsTriagem ? '–' : (rawObs || '–');
      const linha = [numero, item.pergunta, '', ...(observacoesEmColuna ? [finalObs] : []), ''];
      if (foto) linha[colFoto] = { content: '', styles: { minCellHeight: 26 } };
      return linha;
    });

    const ALTURA_CABECALHO = 18;
    if (proximoY + ALTURA_CABECALHO + alturaPrimeiraLinha(doc, grupo.itens[0].item, (respostas[grupo.itens[0].item.id] || {}).obs, metas[0], larguras, observacoesEmColuna) > Y_MAX) {
      doc.addPage();
      proximoY = M.topo;
    }

    autoTable(doc, {
      startY: proximoY,
      margin: { left: M.esq, right: M.dir, top: M.topo, bottom: M.base },
      theme: 'plain',
      styles: { font: FONTE, fontSize: 9, textColor: PRETO, cellPadding: 2.2, valign: 'middle', lineWidth: 0, overflow: 'linebreak' },
      head: [
        [{
          content: grupo.nome,
          colSpan: nCols,
          styles: {
            fillColor: PRETO, textColor: BRANCO, fontSize: 9, halign: 'left',
            cellPadding: { top: 2.8, bottom: 2.8, left: 3, right: 34 },
          },
        }],
        ['N°', 'Item verificado', 'Condição', ...(observacoesEmColuna ? ['Observações'] : []), 'Foto'],
      ],
      body: corpo,
      showHead: 'everyPage',
      rowPageBreak: 'avoid',
      headStyles: { fillColor: CINZA_FUNDO, textColor: PRETO, fontStyle: 'bold', fontSize: 8, halign: 'center' },
      columnStyles: estiloColunas,
      didParseCell: d => {
        if (d.section === 'head' && d.row.index === 1) d.cell.styles.halign = 'center';
        if (d.section !== 'body') return;
        if (d.column.index === colCond || d.column.index === colFoto) d.cell.text = [];
        if (observacoesEmColuna && d.column.index === 3) {
          d.cell.styles.fontSize = 8.5;
          if (d.cell.raw === '–') {
            d.cell.styles.textColor = CINZA_MEDIO;
          }
        }
      },
      didDrawCell: d => {
        if (d.section === 'head' && d.row.index === 0 && d.column.index === 0) {
          doc.setFont(FONTE, 'normal');
          doc.setFontSize(8);
          doc.setTextColor(...BRANCO);
          const texto = `${grupo.itens.length} ${grupo.itens.length === 1 ? 'item' : 'itens'} · IAA ${nota(indice.nota)}`;
          doc.text(texto, d.cell.x + d.cell.width - 3, d.cell.y + d.cell.height / 2 + 1.1, { align: 'right' });
        }
        if (d.section === 'head' && d.row.index === 1) linhaInferior(doc, d.cell, PRETO, 0.4);
        if (d.section !== 'body') return;
        linhaInferior(doc, d.cell);

        const meta = metas[d.row.index];
        if (d.column.index === colCond) etiquetaCondicao(doc, d.cell, meta.resultado);
        if (d.column.index === colFoto && meta.foto) {
          const f = meta.foto;
          const maxW = d.cell.width - 3;
          const maxH = d.cell.height - 3;
          const esc = f.w && f.h ? Math.min(maxW / f.w, maxH / f.h) : 1;
          const w = f.w && f.h ? f.w * esc : maxW;
          const h = f.w && f.h ? f.h * esc : maxH;
          const fx = d.cell.x + (d.cell.width - w) / 2;
          const fy = d.cell.y + (d.cell.height - h) / 2;
          try {
            doc.addImage(f.url, f.formato, fx, fy, w, h, undefined, 'FAST');
            doc.setDrawColor(...CINZA_LINHA);
            doc.setLineWidth(0.2);
            doc.rect(fx, fy, w, h, 'S');
          } catch (e) {
            console.warn('Falha ao inserir foto no PDF:', e);
          }
        }
      },
    });
    proximoY = doc.lastAutoTable.finalY + 9;
  });
}

// ---------- Observações em tabela separada ----------
function desenharObservacoes(doc, itens, respostas) {
  const comObs = itens.filter(({ item }) => (respostas[item.id] || {}).obs);
  if (!comObs.length) return;

  let y = (doc.lastAutoTable?.finalY ?? M.topo) + 14;
  if (y > Y_MAX - 40) { doc.addPage(); y = M.topo; }
  y = tituloSecao(doc, 3, 'Observações de campo', y);

  autoTable(doc, {
    startY: y,
    margin: { left: M.esq, right: M.dir, top: M.topo, bottom: M.base },
    theme: 'plain',
    styles: { font: FONTE, fontSize: 9, textColor: PRETO, cellPadding: 2.2, valign: 'top', lineWidth: 0 },
    headStyles: { fillColor: PRETO, textColor: BRANCO, fontStyle: 'bold', fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 68 },
      2: { cellWidth: 82 },
    },
    head: [['N°', 'Item verificado', 'Observação']],
    body: comObs.map(({ item, numero }) => [numero, item.pergunta, respostas[item.id].obs]),
    rowPageBreak: 'avoid',
    didDrawCell: d => { if (d.section === 'body') linhaInferior(doc, d.cell); },
  });
}

// ---------- Numeração e rodapé (a partir da 2ª folha) ----------
function numerarPaginas(doc, nomeInst) {
  const total = doc.getNumberOfPages();
  for (let p = 2; p <= total; p++) {
    doc.setPage(p);
    doc.setFont(FONTE, 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...PRETO);
    doc.text(String(p), X_DIR, 20, { align: 'right' });

    doc.setDrawColor(...CINZA_LINHA);
    doc.setLineWidth(0.2);
    doc.line(M.esq, 284, X_DIR, 284);
    doc.setFontSize(7.5);
    doc.setTextColor(...CINZA_TEXTO);
    doc.text(nomeInst, M.esq, 288);
    doc.text('Relatório técnico de acessibilidade', X_DIR, 288, { align: 'right' });
  }
}

/* =========================================================================
 * Função principal
 * opcoes.observacoes: 'coluna' (padrão, junto de cada item) | 'apendice' (tabela separada no final)
 * ========================================================================= */
export async function gerarRelatorioPdf(vistoria, { observacoes = 'coluna' } = {}) {
  if (!vistoria) throw new Error('Vistoria não fornecida para geração de PDF.');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const dados = extrairDadosInstituicao(vistoria);
  const respostas = vistoria.respostas || {};
  const grupos = agruparItens(ITENS_TECNICOS, SECOES);
  const itens = grupos.flatMap(g => g.itens);

  let nomeInst = campo(dados, 'institu', 'nome');
  if (nomeInst === 'Não informado' && vistoria.nome) nomeInst = vistoria.nome;

  doc.setProperties({
    title: `Relatório de acessibilidade — ${nomeInst}`,
    subject: 'Diagnóstico das condições de acessibilidade (ABNT NBR 9050:2020)',
    creator: 'Diagnóstico Acessibilidade',
  });

  // Fotos são preparadas antes, porque os hooks da tabela são síncronos
  const fotos = new Map();
  for (const { item } of itens) {
    const foto = await prepararFoto(doc, (respostas[item.id] || {}).foto);
    if (foto) fotos.set(item.id, foto);
  }

  desenharCapa(doc, vistoria, dados);
  doc.addPage();
  desenharIaa(doc, grupos, respostas);
  desenharItens(doc, grupos, respostas, fotos, observacoes !== 'apendice');
  if (observacoes === 'apendice') desenharObservacoes(doc, itens, respostas);
  numerarPaginas(doc, nomeInst);

  const nomeSanitizado = (vistoria.nome || nomeInst || 'Sem Nome').trim().replace(/[\\/:*?"<>|]/g, '-');
  const nomeArquivo = `Relatório - ${nomeSanitizado}.pdf`;
  if (typeof window !== 'undefined') doc.save(nomeArquivo);

  return { sucesso: true, nomeArquivo, doc };
}

export { gerarRelatorioPdf as gerarPdfVistoria };