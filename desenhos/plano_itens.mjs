// Avaliação item a item do conteúdo e plano de imagens. Falha se algum item técnico ficar sem classificação.
// Uso: node plano_itens.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const checklist = JSON.parse(readFileSync(new URL('../src/dados/checklist.json', import.meta.url)));
const TECNICOS = checklist.itens.filter(i => i.tipo === 'tecnico');
const nomeSecao = Object.fromEntries(checklist.secoes.map(s => [s.id, s.nome]));

// ---------- Situação da orientação atual (dica + como averiguar) ----------
// errado: fala de outro assunto; parcial: uma parte não serve; generico: coerente, mas não ensina a medir; ok: serve
const SITUACAO = {
  errado: [5, 16, 29, 32, 34, 45, 61, 78, 88, 89, 90, 92, 93, 96, 97, 100, 102, 107, 108, 109, 110, 111, 112, 113, 116, 119, 121, 124, 126, 127, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 143, 144, 145, 146, 147, 148, 149, 150, 153, 154, 156, 157, 158, 163, 165, 166, 171, 172, 173, 174, 175, 176, 177, 179, 180],
  parcial: [12, 26, 27, 30, 39, 50, 54, 75, 76, 81, 85, 103, 106, 114, 115, 117, 120, 128, 129, 142, 152, 159, 160, 167, 168, 170],
  generico: [1, 3, 7, 10, 14, 15, 19, 20, 44, 47, 55, 59, 60, 64, 65, 87, 91, 94, 95, 98, 99, 101, 104, 105, 122, 123, 125, 151, 155, 161, 162, 164, 178, 181, 182, 184],
  ok: [2, 4, 6, 8, 9, 11, 13, 17, 18, 21, 22, 23, 24, 25, 28, 31, 33, 35, 36, 37, 38, 40, 41, 42, 43, 46, 48, 49, 51, 52, 53, 56, 57, 58, 62, 63, 66, 67, 72, 73, 74, 77, 79, 80, 82, 83, 84, 86, 169, 183],
};

// ---------- Método de verificação correto, com texto-base para revisão da equipe ----------
const METODOS = {
  largura: { itens: [2, 13, 18, 19, 37, 38, 42, 43, 56, 58, 63, 64, 110, 137], dica: 'Meça onde o espaço fica mais estreito, contando obstáculos como extintor, vaso, poste ou mobiliário.', como: '[Trena] Estique a trena de um lado ao outro, na perpendicular ao caminho, no ponto mais estreito. Anote o menor valor e compare com a pergunta.' },
  vao: { itens: [30, 33, 92, 107, 139, 152, 174, 179], dica: 'O vão útil é o espaço realmente livre: a própria folha da porta aberta e o batente reduzem a medida.', como: '[Trena] Abra a porta totalmente, em 90°, e meça da face da folha até o batente oposto. Meça também a altura livre, quando a pergunta pedir.' },
  altura: { itens: [31, 46, 88, 89, 90, 94, 100, 101, 102, 111, 115, 134, 135, 147, 153, 156, 161, 162, 164, 165, 166, 177, 183], dica: 'Meça a partir do piso acabado, no ponto onde a pessoa usa o elemento. Em piso irregular, faça a média de 2 ou 3 pontos.', como: '[Trena] Apoie a trena no piso e leia a altura até o ponto indicado na pergunta. Anote o valor encontrado.' },
  alturaLivre: { itens: [5, 176], dica: 'Observe galhos, placas, toldos e equipamentos no caminho inteiro, não apenas no início do trecho.', como: '[Trena] Percorra o trajeto olhando para cima. Onde houver algo baixo, meça do piso até o ponto mais baixo do elemento.' },
  saliencia: { itens: [7, 50], dica: 'Objetos salientes nessa faixa de altura podem não ser percebidos pela bengala e causar colisão.', como: '[Trena] Meça quanto o objeto avança da parede e a que altura está. Se passar do limite, confira se há sinalização no piso.' },
  desnivel: { itens: [6, 10, 47], dica: 'Pequenos desníveis travam rodas e causam tropeço. Verifique as emendas de piso, soleiras e saídas de rebaixo.', como: '[Trena] Meça a altura do desnível. Nos intermediários, confira também a inclinação do chanfro.' },
  inclinacao: { itens: [4, 9, 17, 21, 22, 48, 49, 57, 66, 67, 169], dica: null, como: null },
  degrau: { itens: [14, 15, 59, 60], dica: 'Meça mais de um degrau: diferenças entre degraus também causam queda.', como: '[Trena] Meça a profundidade do piso (p) e a altura do espelho (e) em pelo menos 3 degraus e compare com os limites da pergunta.' },
  sinalDegrau: { itens: [16, 61], dica: 'A faixa precisa contrastar com o degrau inteiro para quem tem baixa visão.', como: '[Trena] Meça a largura e o comprimento da faixa em alguns degraus, nos pisos e nos espelhos, e observe o contraste.' },
  piso: { itens: [3, 20, 34, 44, 55, 65, 96, 108, 136, 148, 154, 171], dica: 'Observe buracos, emendas, tapetes soltos e peças trincadas. Se possível, avalie o piso molhado ou pergunte como ele fica na chuva.', como: '[Visual] Percorra a área observando o piso. Empurre algo com rodas ou caminhe para sentir trepidação, folgas e escorregamento.' },
  iluminacao: { itens: [45, 97, 109, 128, 130, 140, 145, 172], dica: 'Avalie em mais de um horário, quando possível, e com as luzes como são usadas no dia a dia.', como: '[Visual] Observe sombras e ofuscamento nos pontos de uso. Se houver luxímetro, registre a medida.' },
  pisoTatil: { itens: [8, 11, 40, 41, 51, 52, 53, 62, 86], dica: 'O piso tátil não pode estar encoberto ou interrompido, e deve contrastar com o piso ao redor.', como: '[Visual] Percorra o trajeto observando continuidade, relevo (alerta = pontos; direcional = linhas) e contraste.' },
  braille: { itens: [29, 78, 80, 83, 93, 167], dica: 'Confirme pelo tato, não só pela aparência. Se possível, peça a validação de uma pessoa que leia Braille.', como: '[Tato/Trena] Toque o relevo e o Braille, confira se a informação corresponde ao local e meça a altura, quando a pergunta indicar.' },
  corrimao: { itens: [23, 24, 25, 26, 27, 28, 72, 73, 74, 75, 76, 77, 124], dica: 'Meça dos dois lados e verifique a firmeza: corrimão solto também é uma barreira.', como: '[Trena] Meça o que a pergunta pede (altura, prolongamento, espaçamento ou diâmetro) em pelo menos 2 pontos, sempre da face superior até o piso.' },
  contagem: { itens: [35, 36, 98, 112, 114, 119, 123, 131, 143, 144, 151, 175], dica: 'Conte o total antes de calcular o mínimo exigido, e arredonde sempre para cima.', como: '[Contagem] Conte o total, calcule o percentual da pergunta e confira quantos atendem aos requisitos.' },
  mobiliario: { itens: [103, 132, 141, 146], dica: 'A medida que importa é o vão livre sob o tampo, descontando travessas, gavetas e pés.', como: '[Trena] Meça do piso até a parte de baixo do tampo, a largura entre os apoios e a profundidade livre.' },
  manobra: { itens: [95, 99, 113, 120, 133, 142, 155, 181], dica: 'Avalie com a porta fechada e sem contar lixeiras, carrinhos e móveis no espaço de manobra.', como: '[Trena] Marque a área indicada na pergunta e confira se ela fica livre de obstáculos.' },
  rota: { itens: [1, 12, 32, 39, 54, 91, 106, 117, 129, 138, 149, 150, 170, 173], dica: 'Percorra o caminho como faria uma pessoa em cadeira de rodas: um único degrau já interrompe a rota.', como: '[Visual] Percorra o trajeto da entrada até o local. Anote degraus, portas estreitas e distâncias que interrompam a rota.' },
  funcionamento: { itens: [79, 81, 82, 84, 85, 126, 127, 163, 178, 180], dica: 'Teste o equipamento quando possível: existir não significa funcionar no dia a dia.', como: '[Teste] Acione o item, observe o resultado e registre se está funcionando no dia da vistoria.' },
  barras: { itens: [158, 159, 160], dica: 'Confira também a firmeza: uma barra solta não oferece apoio.', como: '[Trena] Meça altura, comprimento e distâncias da bacia conforme a pergunta, e o diâmetro e o afastamento da parede.' },
  box: { itens: [168], dica: 'Confirme que o banco funciona e fica firme quando aberto.', como: '[Trena] Meça altura, profundidade e comprimento do banco e a posição das barras.' },
  entrevista: { itens: [87, 104, 105, 116, 122, 125, 157, 182, 184, 121], dica: 'Confira no local e, se não for possível, pergunte a mais de uma pessoa e registre quem informou.', como: '[Visual/Entrevista] Procure o recurso no local. Se não estiver visível, pergunte à gestão e registre a resposta.' },
};

// ---------- Plano de imagens ----------
// tipo: tecnico (código), cena (ilustração + cotas por código); prioridade 1 = entra primeiro
const IMAGENS = [
  ['calcada_faixa_livre', 'existe', 2, [2], 'Faixa livre da calçada', 'Refazer os rótulos para o celular'],
  ['calcada_inclinacao_transversal', 'existe', 1, [4, 22, 48, 67], 'Caimento atravessado no piso', 'Hoje usada também em rampa; revisar o rótulo'],
  ['piso_tatil_externo', 'existe', 1, [8, 11, 40, 41], 'Direcional e alerta no percurso externo', 'Retirar do item 5, que fala de altura livre'],
  ['altura_livre', 'tecnico', 2, [5, 176], 'Altura livre sobre o caminho', 'Serve à calçada e às áreas de lazer'],
  ['objetos_salientes', 'tecnico', 1, [7, 50], 'Objeto saliente entre as alturas críticas', 'Mesmo desenho, externo e interno'],
  ['desniveis_piso', 'tecnico', 1, [6, 47], 'Faixas de desnível e tratamento', ''],
  ['rebaixamento_calcada', 'tecnico', 1, [9, 10], 'Rebaixo, largura e declividade', ''],
  ['escada_largura_patamar', 'tecnico', 2, [13, 56, 58], 'Largura da escada e patamares', ''],
  ['escada_degrau_dimensoes', 'tecnico', 1, [14, 15, 59, 60], 'Piso, espelho, fórmula e bocel', 'Uma das mais úteis'],
  ['escada_sinal_visual', 'tecnico', 1, [16, 61], 'Faixa de contraste no degrau', ''],
  ['escada_inclinacao', 'tecnico', 3, [17, 57], 'Caimento em degraus e patamares', ''],
  ['escada_piso_tatil', 'tecnico', 2, [62], 'Alerta no início e no fim do lance', ''],
  ['rampa_dimensoes', 'teste', 1, [18, 19, 21, 63, 64, 66], 'Rampa, patamares e declividade', 'Já desenhada'],
  ['rampa_guarda_corpo', 'tecnico', 2, [23, 72], 'Guarda-corpo e guia de balizamento', ''],
  ['corrimao_alturas', 'teste', 1, [24, 27, 28, 73, 76, 77], 'Alturas, prolongamento e seção', 'Já desenhada'],
  ['corrimao_intermediario', 'tecnico', 2, [25, 26, 74, 75], 'Corrimão central em rampa larga', ''],
  ['corrimao_braille', 'tecnico', 3, [29, 78], 'Braille na geratriz superior', ''],
  ['porta_vao_livre', 'tecnico', 1, [30, 92, 107, 139, 174], 'Vão livre com a porta em 90°', 'A mesma imagem atende 5 ambientes'],
  ['macaneta_alavanca', 'tecnico', 1, [31, 94], 'Maçaneta, comprimento e altura', ''],
  ['porta_espaco_lateral', 'tecnico', 2, [95], 'Espaço ao lado da maçaneta', ''],
  ['porta_giratoria', 'cena', 3, [32], 'Entrada acessível ao lado', ''],
  ['catraca_vao', 'cena', 3, [33], 'Passagem acessível ao lado da catraca', ''],
  ['vaga_pcd', 'tecnico', 1, [35, 38], 'Vaga, faixa adicional e sinalização', ''],
  ['vaga_idoso', 'tecnico', 3, [36], 'Vaga para idoso e sinalização', 'Confirmar o símbolo na norma'],
  ['estacionamento_percurso', 'tecnico', 3, [37, 39], 'Faixa de pedestres até a entrada', ''],
  ['corredor_largura', 'tecnico', 1, [42, 43], 'Largura livre e obstáculos', 'Pode virar o quadro final da animação'],
  ['piso_tatil_interno', 'tecnico', 1, [51, 52, 53, 86], 'Direcional e alerta no interior', ''],
  ['comandos_alturas', 'tecnico', 1, [46, 101, 111, 147, 183], 'Interruptores, tomadas e comandos', 'Faixas variam: destacar as da pergunta'],
  ['piso_firme_regular', 'tecnico', 2, [3, 20, 34, 44, 55, 65, 96, 108, 136, 148, 154, 171], 'Piso adequado x problemas comuns', 'Uma imagem para 12 itens'],
  ['iluminacao_uniforme', 'cena', 3, [45, 97, 109, 130, 140, 172], 'Sombra e ofuscamento x luz uniforme', 'Uma imagem para 6 itens'],
  ['elevador_botoeira', 'tecnico', 2, [80, 83], 'Botões, relevo e altura', ''],
  ['elevador_entrada', 'cena', 3, [81, 85], 'Porta e piso com contraste', ''],
  ['bebedouro_alturas', 'tecnico', 1, [88, 89, 90], 'Duas alturas, vão e acionamento', ''],
  ['bebedouro_bica', 'tecnico', 3, [87, 184], 'Bica frontal de jato inclinado', 'Os dois itens parecem duplicados'],
  ['mesa_vao_livre', 'tecnico', 1, [98, 103, 112, 114, 132, 141, 146], 'Vão sob carteira, mesa ou bancada', 'Uma imagem para 7 itens'],
  ['giro_360', 'tecnico', 1, [99], 'Área de giro de 1,50 m', 'Candidata a animação'],
  ['giro_180', 'tecnico', 1, [113, 133, 137, 142, 181], 'Área de manobra de 1,20 m × 1,50 m', 'Candidata a animação'],
  ['lousa_tela_altura', 'tecnico', 2, [100, 102], 'Borda inferior da lousa ou tela', ''],
  ['sinalizacao_porta', 'tecnico', 1, [93, 167], 'Placa tátil ao lado da porta', ''],
  ['estantes_corredor', 'tecnico', 2, [110], 'Corredor e manobra entre estantes', ''],
  ['alcance_manual', 'tecnico', 2, [115, 135], 'Faixa de alcance em estantes e balcões', ''],
  ['auditorio_espaco_pcr', 'tecnico', 1, [119, 120, 121, 122], 'Espaço para cadeira e companheiro', ''],
  ['auditorio_assento_pmr', 'tecnico', 3, [123], 'Assento junto ao corredor', ''],
  ['interprete_libras', 'cena', 3, [125], 'Local e iluminação do intérprete', ''],
  ['balcao_autosservico', 'tecnico', 2, [134], 'Altura do balcão e corredor', ''],
  ['sanitario_porta_puxador', 'tecnico', 1, [152, 153], 'Porta para fora e puxador', ''],
  ['sanitario_area_manobra', 'teste', 1, [155], 'Giro e transferência', 'Já desenhada'],
  ['bacia_altura_assento', 'tecnico', 1, [156, 157], 'Altura e assento sem abertura', ''],
  ['bacia_barras', 'tecnico', 1, [158, 159, 160, 161], 'Barras lateral e de fundo', 'Muitas medidas: separar em 2 vistas'],
  ['lavatorio', 'tecnico', 1, [162, 163], 'Altura, aproximação e torneira', ''],
  ['sanitario_acessorios', 'tecnico', 2, [164, 165, 166], 'Alarme, espelho e acessórios', ''],
  ['box_chuveiro', 'tecnico', 2, [168, 169], 'Box, banco e barras', ''],
  ['arquibancada_pcr', 'tecnico', 3, [175], 'Espaço reservado na arquibancada', ''],
  ['banco_patio', 'tecnico', 3, [177], 'Banco e módulo ao lado', ''],
  ['saida_antipanico', 'tecnico', 2, [179], 'Barra antipânico e vão', ''],
  ['area_resgate', 'tecnico', 2, [180], 'Área de resgate e intercomunicador', ''],
  ['luminaria_rota', 'cena', 3, [178], 'Luminárias na rota de fuga', ''],
  ['mapa_tatil', 'cena', 3, [182], 'Mapa visual e tátil', ''],
].map(([nome, tipo, prioridade, itens, mostra, nota]) => ({ nome, tipo, prioridade, itens, mostra, nota }));

// ---------- Animações de método: aparecem em "Como averiguar" ----------
const ANIMACOES = [
  { nome: 'trena_largura', mostra: 'Medir no ponto mais estreito', metodos: ['largura'] },
  { nome: 'celular_inclinacao', mostra: 'Celular sobre o piso, no sentido certo', metodos: ['inclinacao'] },
  { nome: 'altura_do_piso', mostra: 'Medir a altura a partir do piso acabado', metodos: ['altura'] },
  { nome: 'porta_90', mostra: 'Abrir a 90° e medir o vão livre', metodos: ['vao'] },
  { nome: 'giro_cadeira', mostra: 'Cadeira girando dentro da área livre', metodos: ['manobra'] },
];

// Itens em que uma imagem acrescenta pouco, com o motivo
const SEM_IMAGEM = {
  'Rota e localização: percorrer resolve': [1, 12, 54, 91, 106, 117, 129, 138, 149, 150, 170, 173],
  'Contagem ou recurso, sem geometria': [104, 105, 116, 126, 127, 131, 143, 144, 151],
  'Funcionamento ou comunicação': [79, 82, 84],
  'Coberto pelo texto ou pela animação': [49, 124, 128, 145],
};

// ---------- Conferência ----------
const ids = new Set(TECNICOS.map(i => i.id));
function conferir(nome, grupos, exclusivo) {
  const vistos = new Map();
  for (const [grupo, lista] of grupos) for (const id of lista) {
    if (!ids.has(id)) throw new Error(`${nome}: item ${id} não existe (${grupo})`);
    if (exclusivo && vistos.has(id)) throw new Error(`${nome}: item ${id} repetido em ${vistos.get(id)} e ${grupo}`);
    vistos.set(id, grupo);
  }
  const faltando = [...ids].filter(id => !vistos.has(id));
  if (faltando.length) throw new Error(`${nome}: faltam itens ${faltando.join(', ')}`);
  return vistos;
}

const situacao = conferir('situação', Object.entries(SITUACAO), true);
const metodo = conferir('método', Object.entries(METODOS).map(([k, v]) => [k, v.itens]), true);
const imagemDe = new Map();
for (const img of IMAGENS) for (const id of img.itens) {
  if (!ids.has(id)) throw new Error(`imagem ${img.nome}: item ${id} não existe`);
  if (imagemDe.has(id)) throw new Error(`item ${id} em ${imagemDe.get(id)} e ${img.nome}`);
  imagemDe.set(id, img.nome);
}
const semImagem = new Map(Object.entries(SEM_IMAGEM).flatMap(([motivo, lista]) => lista.map(id => [id, motivo])));
const comAsDuas = [...ids].filter(id => imagemDe.has(id) && semImagem.has(id));
const semDecisao = [...ids].filter(id => !imagemDe.has(id) && !semImagem.has(id));
if (comAsDuas.length) throw new Error(`Com e sem imagem: ${comAsDuas.join(', ')}`);
if (semDecisao.length) throw new Error(`Sem decisão de imagem: ${semDecisao.join(', ')}`);

const animacaoDe = id => ANIMACOES.find(a => a.metodos.includes(metodo.get(id)))?.nome || '';
// Itens em que o texto-base do método não descreve bem a verificação
const AJUSTES = {
  19: { como: '[Trena] Meça o comprimento de cada patamar no sentido da circulação: no início, no término e entre os segmentos da rampa.' },
  64: { como: '[Trena] Meça o comprimento de cada patamar no sentido da circulação: no início, no término e entre os segmentos da rampa.' },
  32: { dica: 'A entrada alternativa precisa estar aberta durante o funcionamento, e não apenas existir.', como: '[Visual] Verifique se há outra entrada ao lado da porta giratória e percorra-a como faria uma pessoa em cadeira de rodas.' },
  81: { dica: 'Observe a uma certa distância: quem tem baixa visão localiza a porta pelo contraste com a parede.', como: '[Visual] Com a porta fechada, compare a cor da porta e a da parede ao redor.' },
  85: { dica: 'Desconsidere a soleira: compare o piso da cabina com o do pavimento.', como: '[Visual/Tato] Observe o revestimento da cabina, confira se é duro e antiderrapante e compare com o piso do pavimento.' },
  106: { dica: 'Um único degrau ou porta estreita interrompe a rota até a biblioteca.' },
  117: { como: '[Visual] Percorra o caminho até o auditório e dele até a rota de fuga. Anote degraus, portas estreitas e outras barreiras.' },
  129: { como: '[Visual] Percorra o caminho até o refeitório e dele até o sanitário acessível. Anote o que interrompa a rota.' },
  150: { como: '[Trena/Passos] Estime o percurso do ponto mais distante até o sanitário acessível. Em caso de dúvida, meça com trena longa ou pela planta.' },
  39: { como: '[Trena/Passos] Meça ou estime o percurso da vaga até o acesso da edificação e compare com o limite da pergunta.' },
  180: { dica: 'Procure a área em cada pavimento e confirme que ela não fica no caminho principal de circulação.', como: '[Visual/Trena] Localize a área de resgate, confira o espaço reservado, teste o intercomunicador e meça a altura dele.' },
  143: { como: '[Contagem] Conte os postos de atendimento e verifique se ao menos um é acessível para atendente em cadeira de rodas.' },
};

const textoDe = id => {
  const m = METODOS[metodo.get(id)];
  const item = TECNICOS.find(i => i.id === id);
  // Inclinação já tem orientação específica e correta
  return { dica: AJUSTES[id]?.dica ?? m.dica ?? item.dica, como: AJUSTES[id]?.como ?? m.como ?? item.comoAveriguar };
};

// ---------- Planilha de revisão ----------
const celula = v => `"${String(v ?? '').replace(/\r?\n/g, ' ').replace(/"/g, '""')}"`;
const linhas = [['Item', 'Seção', 'Grupo', 'Pergunta', 'Situação atual', 'Dica atual', 'Como averiguar atual', 'Método', 'Dica proposta (rascunho)', 'Como averiguar proposto (rascunho)', 'Imagem', 'Animação', 'Revisado por', 'Observações'].map(celula).join(';')];
for (const i of TECNICOS) {
  const t = textoDe(i.id), s = situacao.get(i.id);
  const manter = s === 'ok';
  linhas.push([i.id, nomeSecao[i.secaoId], i.subgrupo, i.pergunta, s, i.dica, i.comoAveriguar, metodo.get(i.id), manter ? '(manter)' : t.dica, manter ? '(manter)' : t.como, imagemDe.get(i.id) || `— ${semImagem.get(i.id)}`, animacaoDe(i.id), '', ''].map(celula).join(';'));
}
writeFileSync(new URL('../../planejamento/em_andamento/revisao_itens.csv', import.meta.url), '﻿' + linhas.join('\r\n'));

// Textos a aplicar no checklist: tudo que não estava adequado
writeFileSync(new URL('./saida/textos_revisados.json', import.meta.url), JSON.stringify(
  Object.fromEntries(TECNICOS.filter(i => situacao.get(i.id) !== 'ok').map(i => [i.id, textoDe(i.id)])), null, 2));

// ---------- Resumo para o documento ----------
const cont = o => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v.length]));
const comImagem = imagemDe.size;
const porPrioridade = [1, 2, 3].map(p => {
  const g = IMAGENS.filter(x => x.prioridade === p);
  return { p, imagens: g.length, itens: new Set(g.flatMap(x => x.itens)).size, novas: g.filter(x => x.tipo === 'tecnico' || x.tipo === 'cena').length };
});
const tabela = IMAGENS.slice().sort((a, b) => a.prioridade - b.prioridade || b.itens.length - a.itens.length)
  .map(x => `| ${x.prioridade} | \`${x.nome}\` | ${x.tipo} | ${x.mostra} | ${x.itens.join(', ')} | ${x.nota} |`).join('\n');
const tabelaAnim = ANIMACOES.map(a => {
  const lista = [...ids].filter(id => animacaoDe(id) === a.nome);
  return `| \`${a.nome}\` | ${a.mostra} | ${lista.length} | ${lista.join(', ')} |`;
}).join('\n');
const semTabela = Object.entries(SEM_IMAGEM).map(([m, l]) => `| ${m} | ${l.join(', ')} |`).join('\n');
const porSecao = checklist.secoes.map(sec => {
  const its = TECNICOS.filter(i => i.secaoId === sec.id);
  const c = k => its.filter(i => situacao.get(i.id) === k).length;
  return `| ${sec.nome} | ${its.length} | ${c('ok')} | ${c('generico')} | ${c('parcial')} | ${c('errado')} |`;
}).join('\n');

writeFileSync(new URL('./saida/resumo_plano.json', import.meta.url), JSON.stringify({
  situacao: cont(SITUACAO), comImagem, totalImagens: IMAGENS.length, porPrioridade,
  tipos: IMAGENS.reduce((a, x) => ({ ...a, [x.tipo]: (a[x.tipo] || 0) + 1 }), {}),
  tabela, tabelaAnim, semTabela, porSecao,
  comAnimacao: [...ids].filter(id => animacaoDe(id)).length,
  compartilham: IMAGENS.filter(x => x.itens.length > 1).length,
}, null, 2));

console.log(JSON.stringify({ situacao: cont(SITUACAO), comImagem, semImagem: semImagem.size, totalImagens: IMAGENS.length, porPrioridade, comAnimacao: [...ids].filter(id => animacaoDe(id)).length, tipos: IMAGENS.reduce((a, x) => ({ ...a, [x.tipo]: (a[x.tipo] || 0) + 1 }), {}) }));
