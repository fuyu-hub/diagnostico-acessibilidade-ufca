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
};

// Imagens antigas que já têm substituta aprovada
const REMOVER = [];

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

for (const arquivo of REMOVER) rmSync(new URL(`public/imagens/${arquivo}`, raiz), { force: true });

writeFileSync(arquivoChecklist, JSON.stringify(checklist, null, 2) + '\n');
writeFileSync(new URL('src/dados/imagens.json', raiz), JSON.stringify(descricoes, null, 2) + '\n');
console.log(`${Object.keys(APROVADAS).length} imagens publicadas`);
