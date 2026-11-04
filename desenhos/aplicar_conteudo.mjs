// Aplica ao checklist os textos revisados e as correções de redação, sem alterar perguntas em sentido ou estrutura.
// Uso: node plano_itens.mjs && node aplicar_conteudo.mjs (rodar só uma vez: depois disso a planilha fica como registro)
import { readFileSync, writeFileSync } from 'node:fs';

const arquivo = new URL('../src/dados/checklist.json', import.meta.url);
const checklist = JSON.parse(readFileSync(arquivo, 'utf8'));
const textos = JSON.parse(readFileSync(new URL('./saida/textos_revisados.json', import.meta.url), 'utf8'));
const item = id => checklist.itens.find(i => i.id === id);

for (const [id, t] of Object.entries(textos)) {
  const alvo = item(Number(id));
  alvo.dica = t.dica;
  alvo.comoAveriguar = t.como;
}

// Só erros de redação: o sentido da pergunta não muda
const REDACAO = [
  [35, 'o que for maior) , devidamente', 'o que for maior), devidamente'],
  [102, 'está uma altura máxima', 'está a uma altura máxima'],
  [103, 'possuem altura entre mínima de 0,73 m', 'possuem altura mínima de 0,73 m'],
  [111, 'outros comandos das áreas administrativas estão', 'outros comandos da biblioteca estão'],
];
for (const [id, de, para] of REDACAO) {
  const alvo = item(id);
  if (!alvo.pergunta.includes(de)) throw new Error(`Item ${id}: trecho não encontrado`);
  alvo.pergunta = alvo.pergunta.replace(de, para);
}

// A imagem de piso tátil não corresponde à altura livre do item 5
item(5).imagem = null;

writeFileSync(arquivo, JSON.stringify(checklist, null, 2) + '\n');
console.log(`${Object.keys(textos).length} itens atualizados; ${REDACAO.length} perguntas com redação corrigida`);
