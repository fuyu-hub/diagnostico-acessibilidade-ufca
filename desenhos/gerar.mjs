// Gera os SVGs e confere cada medida escrita no desenho contra as perguntas do checklist.
// Uso: node gerar.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { FIGURAS } from './figuras.mjs';
import { LOTE1 } from './lote1.mjs';
import { LOTE2 } from './lote2.mjs';
import { LOTE3 } from './lote3.mjs';
import { LOTE4 } from './lote4.mjs';

const checklist = JSON.parse(readFileSync(new URL('../src/dados/checklist.json', import.meta.url)));
const saida = new URL('./saida/', import.meta.url);
mkdirSync(saida, { recursive: true });

// "1,20m" e "1,20 m" são o mesmo valor; aceita também quando a unidade fica só no último número
const normalizar = t => t.replace(/&#\d+;/g, '').replace(/\s+/g, ' ').replace(/(\d)\s+(m|cm|mm|%)\b/g, '$1$2');
const MEDIDA = /\d+(?:,\d+)?\s?(?:cm|mm|m\b|%)/g;

let erros = 0;
for (const criar of [...FIGURAS, ...LOTE1, ...LOTE2, ...LOTE3, ...LOTE4]) {
  const figura = criar();
  writeFileSync(new URL(`${figura.nome}.svg`, saida), figura.svg);

  const textos = [...figura.svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map(m => m[1]);
  const perguntas = figura.itens.map(id => {
    const item = checklist.itens.find(i => i.id === id);
    if (!item) throw new Error(`Item ${id} não existe no checklist`);
    return normalizar(item.pergunta);
  }).join(' ');

  const permitidos = [...(figura.derivados || []), ...(figura.aConfirmar || [])].map(normalizar);
  const medidas = new Set(textos.flatMap(t => {
    const limpo = permitidos.reduce((acc, p) => normalizar(acc).replace(p, ''), t);
    return limpo.match(MEDIDA) || [];
  }).map(normalizar));

  const emCm = m => {
    const [, numero, unidade] = m.match(/^(\d+(?:,\d+)?)(cm|mm|m|%)$/);
    const valor = Number(numero.replace(',', '.'));
    return unidade === '%' ? `${valor}%` : (valor * { m: 100, cm: 1, mm: 0.1 }[unidade]).toFixed(2);
  };
  // Intervalos como "0,43 m e 0,46 m" ou "3 cm e 4,5 cm" escrevem a unidade às vezes só no último valor
  const dasPerguntas = new Set((perguntas.match(/\d+(?:,\d+)?\s?(?:cm|mm|m\b|%)/g) || []).map(m => emCm(normalizar(m))));
  const ausentes = [...medidas].filter(m => !dasPerguntas.has(emCm(m)));

  const semDescricao = !/<desc[^>]*>[^<]{40,}/.test(figura.svg);
  const kb = (figura.svg.length / 1024).toFixed(1);
  console.log(`${figura.nome}: ${kb} KB · itens ${figura.itens.join(', ')} · ${medidas.size} medidas conferidas`);
  if (figura.aConfirmar?.length) console.log(`  a confirmar na norma: ${figura.aConfirmar.join('; ')}`);
  if (ausentes.length) { console.log(`  ERRO, medida sem apoio no checklist: ${ausentes.join('; ')}`); erros++; }
  if (semDescricao) { console.log('  ERRO: sem descrição acessível'); erros++; }
}

if (erros) process.exit(1);
console.log('Conferência concluída sem divergências.');
