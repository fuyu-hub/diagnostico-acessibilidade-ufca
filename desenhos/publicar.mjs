// Publica as imagens aprovadas: guarda SVG e PNG em desenhos/aprovadas e liga o SVG aos itens do app.
// Para um novo lote aprovado: acrescente as imagens abaixo e rode gerar.mjs, renderizar.cjs e este arquivo.
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

const APROVADAS = {
  corredor_largura: [42, 43],
  rampa_dimensoes: [18, 19, 21, 63, 64, 66],
  corrimao_alturas: [24, 27, 28, 73, 76, 77],
  sanitario_area_manobra: [155],
  // Lote 1
  mesa_vao_livre: [98, 103, 112, 114, 132, 141, 146],
  porta_vao_livre: [30, 92, 107, 139, 174],
  comandos_alturas: [46, 101, 111, 147, 183],
  giro_180: [113, 133, 137, 142, 181],
  escada_degrau_dimensoes: [14, 15, 59, 60],
  auditorio_espaco_pcr: [119, 120, 121, 122],
  bacia_barras: [158, 159, 160, 161],
  piso_tatil_interno: [51, 52, 53, 86],
  bebedouro_alturas: [88, 89, 90],
  rebaixamento_calcada: [9, 10],
  // Lote 2
  objetos_salientes: [7, 50],
  desniveis_piso: [6, 47],
  escada_sinal_visual: [16, 61],
  macaneta_alavanca: [31, 94],
  vaga_pcd: [35, 38],
  sinalizacao_porta: [93, 167],
  sanitario_porta_puxador: [152, 153],
  bacia_altura_assento: [156, 157],
  lavatorio: [162, 163],
  giro_360: [99],
  calcada_faixa_livre: [2],
  calcada_inclinacao_transversal: [4, 22, 48, 67],
  piso_tatil_externo: [8, 11, 40, 41],
  // Lote 3
  rota_acessivel: [1, 12, 54, 91, 106, 117, 129, 138, 149, 150, 170, 173],
  piso_firme_regular: [3, 20, 34, 44, 55, 65, 96, 108, 136, 148, 154, 171],
  corrimao_intermediario: [25, 26, 74, 75],
  sanitario_acessorios: [164, 165, 166],
  escada_largura_patamar: [13, 56, 58],
  altura_livre: [5, 176],
  rampa_guarda_corpo: [23, 72],
  elevador_botoeira: [80, 83],
  lousa_tela_altura: [100, 102],
  alcance_manual: [115, 135],
  box_chuveiro: [168, 169],
  estantes_corredor: [110],
  // Lote 4
  escada_piso_tatil: [62],
  porta_espaco_lateral: [95],
  balcao_autosservico: [134],
  saida_antipanico: [179],
  area_resgate: [180],
  iluminacao_uniforme: [45, 97, 109, 130, 140, 172],
  escada_inclinacao: [17, 57],
  corrimao_braille: [29, 78],
  estacionamento_percurso: [37, 39],
  elevador_entrada: [81, 85],
  bebedouro_bica: [87, 184],
  inclinacao_longitudinal: [49],
  // Lote 5
  porta_giratoria: [32],
  catraca_vao: [33],
  vaga_idoso: [36],
  auditorio_assento_pmr: [123],
  interprete_libras: [125],
  arquibancada_pcr: [175],
  banco_patio: [177],
  luminaria_rota: [178],
  mapa_tatil: [182],
  plateia_corrimao: [124],
  sinalizacao_luminosa_piso: [128],
  iluminacao_balcao: [145],
};

// Imagens antigas que já têm substituta aprovada
const REMOVER = ['calcada_faixa_livre.png', 'calcada_inclinacao_transversal.png', 'piso_tatil_externo.png'];

// Itens que usavam imagem antiga e aguardam a substituta do plano
const SEM_IMAGEM_POR_ENQUANTO = [];

const raiz = new URL('../', import.meta.url);
const de = nome => new URL(`desenhos/saida/${nome}`, raiz);
const aprovadas = new URL('desenhos/aprovadas/', raiz);
mkdirSync(aprovadas, { recursive: true });

const arquivoChecklist = new URL('src/dados/checklist.json', raiz);
const checklist = JSON.parse(readFileSync(arquivoChecklist, 'utf8'));
const descricoes = {};

for (const [nome, itens] of Object.entries(APROVADAS)) {
  const svg = readFileSync(de(`${nome}.svg`), 'utf8');
  const descricao = svg.match(/<desc[^>]*>([^<]+)<\/desc>/)?.[1];
  if (!descricao) throw new Error(`${nome}: sem descrição`);
  if (!existsSync(de(`${nome}.png`))) throw new Error(`${nome}: sem PNG; rode renderizar.cjs`);

  copyFileSync(de(`${nome}.svg`), new URL(`${nome}.svg`, aprovadas));
  copyFileSync(de(`${nome}.png`), new URL(`${nome}.png`, aprovadas));
  copyFileSync(de(`${nome}.svg`), new URL(`public/imagens/${nome}.svg`, raiz));
  descricoes[`${nome}.svg`] = descricao;

  for (const id of itens) {
    const item = checklist.itens.find(i => i.id === id);
    if (!item) throw new Error(`Item ${id} não existe`);
    item.imagem = `${nome}.svg`;
  }
}

for (const id of SEM_IMAGEM_POR_ENQUANTO) {
  checklist.itens.find(i => i.id === id).imagem = null;
}

for (const arquivo of REMOVER) rmSync(new URL(`public/imagens/${arquivo}`, raiz), { force: true });

writeFileSync(arquivoChecklist, JSON.stringify(checklist, null, 2) + '\n');
writeFileSync(new URL('src/dados/imagens.json', raiz), JSON.stringify(descricoes, null, 2) + '\n');
console.log(`${Object.keys(APROVADAS).length} imagens publicadas`);
