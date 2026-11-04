import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { ITENS_POR_ID, ITENS_TECNICOS, TODOS_ITENS } from '../dados/checklist.js';
import DESCRICOES from '../dados/imagens.json';

const orientacao = id => `${ITENS_POR_ID[id].dica} ${ITENS_POR_ID[id].comoAveriguar}`;

describe('Orientação dos itens', () => {
  it('1. Todo item técnico tem dica e como averiguar', () => {
    const incompletos = ITENS_TECNICOS.filter(i => !i.dica?.trim() || !i.comoAveriguar?.trim());
    expect(incompletos.map(i => i.id)).toEqual([]);
  });

  it('2. Nenhum texto cita resquícios da planilha ou manda só ler o item', () => {
    const genericos = ITENS_TECNICOS.filter(i => /coluna de referência|Leia atentamente|Registre foto do item/.test(`${i.dica} ${i.comoAveriguar}`));
    expect(genericos.map(i => i.id)).toEqual([]);
  });

  it('3. Barras de apoio só orientam os itens de barras de apoio', () => {
    const fora = ITENS_TECNICOS.filter(i => /barras? de apoio/i.test(i.comoAveriguar) && ![158, 159, 160].includes(i.id));
    expect(fora.map(i => i.id)).toEqual([]);
  });

  it('4. Bica do bebedouro só aparece na seção de bebedouros', () => {
    const fora = ITENS_TECNICOS.filter(i => /\bbica\b/i.test(`${i.dica} ${i.comoAveriguar}`) && i.secaoId !== 4);
    expect(fora.map(i => i.id)).toEqual([]);
  });

  it('5. Elevador só orienta itens que falam de elevador', () => {
    const fora = ITENS_TECNICOS.filter(i => /elevador/i.test(i.comoAveriguar) && !/elevador/i.test(i.pergunta));
    expect(fora.map(i => i.id)).toEqual([]);
  });

  it('6. Casos que estavam trocados agora correspondem à pergunta', () => {
    expect(orientacao(89)).toMatch(/piso acabado/);
    expect(orientacao(92)).toMatch(/vão/i);
    expect(orientacao(100)).not.toMatch(/Braille/);
    expect(orientacao(102)).not.toMatch(/vagas/);
    expect(orientacao(107)).not.toMatch(/corrimão/);
    expect(orientacao(109)).not.toMatch(/sinal sonoro/);
    expect(orientacao(156)).not.toMatch(/Conte o total/);
    expect(orientacao(158)).toMatch(/altura/);
    expect(orientacao(173)).toMatch(/trajeto/);
  });

  it('8. Toda imagem usada por um item existe no app', () => {
    const ausentes = TODOS_ITENS.filter(i => i.imagem && !existsSync(new URL('../../public/imagens/' + i.imagem, import.meta.url)));
    expect(ausentes.map(i => i.id)).toEqual([]);
  });

  it('9. Toda imagem em SVG tem descrição para leitor de tela e cópia guardada em PNG', () => {
    const svgs = TODOS_ITENS.filter(i => i.imagem?.endsWith('.svg')).map(i => i.imagem);
    expect(svgs.length).toBeGreaterThan(0);
    for (const nome of svgs) {
      expect(DESCRICOES[nome]?.length).toBeGreaterThan(40);
      expect(existsSync(new URL('../../desenhos/aprovadas/' + nome.replace('.svg', '.png'), import.meta.url))).toBe(true);
    }
  });

  it('7. Item de altura livre não exibe a imagem de piso tátil', () => {
    expect(ITENS_POR_ID[5].imagem).toBeNull();
  });
});
