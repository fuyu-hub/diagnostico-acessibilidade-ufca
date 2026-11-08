// Confere as orientações reescritas e as grava no checklist, mexendo só nos campos comoAveriguar e dica.
// Uso: node aplicar_orientacoes.mjs [--aplicar]   (sem a opção, só confere)
import { readFileSync, writeFileSync } from 'node:fs';
import { PARTE1 } from './orientacoes_parte1.mjs';
import { PARTE2 } from './orientacoes_parte2.mjs';

const arquivo = new URL('../src/dados/checklist.json', import.meta.url);
const checklist = JSON.parse(readFileSync(arquivo, 'utf8'));
const textos = { ...PARTE1, ...PARTE2 };
const tec = checklist.itens.filter(i => i.tipo === 'tecnico');
const MEDIDA = /\d+(?:,\d+)?\s?(?:cm|mm|kg|m\b|%)/g;
const sem = t => t.replace(/\s+/g, '');
// Números que não vêm da pergunta: a régua do método alternativo e a Tabela/figuras não são medidas
const FORA = { 4: ['30cm', '0,9cm'], 22: ['30cm', '0,9cm', '3%'], 9: ['5%'] };
const erros = [];
if (Object.keys(textos).length !== tec.length) erros.push(`${Object.keys(textos).length} textos para ${tec.length} itens`);
for (const i of tec) {
  const t = textos[i.id];
  if (!t) { erros.push(`Item ${i.id} sem texto`); continue; }
  if (!/^\[[^\]]+\] /.test(t.c)) erros.push(`Item ${i.id}: sem etiqueta do método`);
  const p = sem(i.pergunta);
  for (const m of [...t.c.matchAll(MEDIDA), ...t.d.matchAll(MEDIDA)].map(x => sem(x[0]))) {
    if (!p.includes(m) && !(FORA[i.id] || []).includes(m)) erros.push(`Item ${i.id}: ${m} não está na pergunta`);
  }
}
const repetidos = lista => lista.filter((t, n) => lista.indexOf(t) !== n);
const vals = Object.values(textos);
for (const r of [...repetidos(vals.map(t => t.c)), ...repetidos(vals.map(t => t.d))]) erros.push(`Texto repetido: ${r.slice(0, 60)}`);
const tam = k => vals.map(t => t[k].length).sort((a, b) => a - b);
console.log('como verificar: min/mediana/max', tam('c')[0], tam('c')[89], tam('c').at(-1), '| dica:', tam('d')[0], tam('d')[89], tam('d').at(-1));
if (erros.length) { console.log(erros.join('\n')); process.exit(1); }
console.log('Conferência ok:', tec.length, 'itens, textos todos diferentes');
if (process.argv.includes('--aplicar')) {
  for (const i of tec) { i.comoAveriguar = textos[i.id].c; i.dica = textos[i.id].d; }
  writeFileSync(arquivo, JSON.stringify(checklist, null, 2) + '\n');
  console.log('Gravado em checklist.json');
}
