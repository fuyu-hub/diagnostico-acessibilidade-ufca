import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const dados = JSON.parse(readFileSync(new URL('../src/dados/checklist.json', import.meta.url)));

// Posição 1-based na lista completa de itens, usada na rota /checklist/:id/item/:n
const n = id => dados.itens.findIndex(i => i.id === id) + 1;

// O popup de primeiro acesso tem teste próprio; nos demais, ele já foi visto
test.beforeEach(async ({ page }, info) => {
  // Os testes conferem o próprio item depois de responder: sem avançar sozinho, exceto no teste do avanço
  if (!info.title.includes('avança')) {
    // Só no primeiro carregamento: recarregar a página mantém o que o teste mudou
    await page.addInitScript(() => {
      if (!localStorage.getItem('nbr9050_preferencias')) {
        localStorage.setItem('nbr9050_preferencias', JSON.stringify({ avancarAoResponder: false }));
      }
    });
  }
  if (info.title.includes('popup')) return;
  await page.addInitScript(() => localStorage.setItem('ufca:boasVindas:v1', 'visto'));
});

async function criarVistoria(page, nome = 'Escola de Teste') {
  await page.goto('/nova');
  await page.waitForLoadState('networkidle');
  await page.fill('input[placeholder*="Ex: Universidade Federal do Cariri"]', nome);
  await page.fill('input[placeholder*="Ex: Av. Tenente Raimundo Rocha"]', 'Rua de Teste, 1');
  await page.fill('input[placeholder*="Ex: Juazeiro do Norte"]', 'Crato, CE');
  await page.fill('input[placeholder*="Nome do avaliador 1"]', 'Avaliador');
  await page.locator('button[aria-haspopup="listbox"]').first().click();
  await page.locator('div[role="option"]:has-text("Estadual")').click();
  await page.locator('button[aria-haspopup="listbox"]').nth(1).click();
  await page.locator('div[role="option"]:has-text("Ensino Médio")').click();
  await page.locator('h2:has-text("Ficha da Instituição")').click();
  await page.click('button:has-text("Salvar Ficha e Acessar Vistoria")');
  await page.waitForURL(/\/vistoria\//);
  await expect(page.locator(`input[value="${nome}"]`).first()).toBeVisible();
  // A gravação é assíncrona: aguarda antes de navegar com recarga de página
  await page.waitForTimeout(800);
  return page.url().split('/vistoria/')[1];
}

// O nome acessível de uma opção marcada termina em "(selecionado)"
const radio = (page, nome) => page.getByRole('radio', { name: new RegExp(`^${nome}( \\(selecionado\\))?$`) });

async function responder(page, id, itemId, opcao) {
  await page.goto(`/checklist/${id}/item/${n(itemId)}`);
  await radio(page, opcao).click();
  await page.waitForTimeout(800);
}

test('recarregar a tela da vistoria mantém a tela e os dados da ficha', async ({ page }) => {
  const erros = [];
  page.on('pageerror', e => erros.push(e.message));

  await criarVistoria(page);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await page.reload();

  await expect(page.locator('input[value="Escola de Teste"]').first()).toBeVisible();
  expect(erros).toEqual([]);
});

test('triagem positiva desfaz o N/A automático, inclusive depois de recarregar', async ({ page }) => {
  const id = await criarVistoria(page);
  const cartaoTriagem = page.getByText('Definido pela Pergunta de Triagem');

  await responder(page, id, 1001, 'Não');
  await page.goto(`/checklist/${id}/item/${n(9)}`);
  await expect(cartaoTriagem).toBeVisible();
  await expect(radio(page, 'Não se aplica')).toHaveAttribute('aria-checked', 'true');

  await responder(page, id, 1001, 'Sim');
  await page.goto(`/checklist/${id}/item/${n(9)}`);
  await expect(cartaoTriagem).toBeHidden();
  await expect(radio(page, 'Não se aplica')).toHaveAttribute('aria-checked', 'false');
});

test('triagem negativa alcança os itens de triagens aninhadas, e a positiva os libera', async ({ page }) => {
  const id = await criarVistoria(page);

  await responder(page, id, 1004, 'Não');
  await page.goto(`/checklist/${id}/item/${n(12)}`);
  await expect(page.getByText('Definido pela Pergunta de Triagem')).toBeVisible();
  await expect(radio(page, 'Não se aplica')).toHaveAttribute('aria-checked', 'true');

  await responder(page, id, 1004, 'Sim');
  await page.goto(`/checklist/${id}/item/${n(12)}`);
  await expect(radio(page, 'Não se aplica')).toHaveAttribute('aria-checked', 'false');
});

test('triagem pede confirmação antes de apagar respostas e respeita a recusa', async ({ page }) => {
  const id = await criarVistoria(page);

  await responder(page, id, 9, 'Conforme');
  await page.goto(`/checklist/${id}/item/${n(1001)}`);
  await radio(page, 'Não').click();

  const dialogo = page.getByRole('alertdialog');
  await expect(dialogo).toContainText('1 item abaixo desta pergunta');

  await dialogo.getByRole('button', { name: 'Manter registros' }).click();
  await page.waitForTimeout(800);
  await page.goto(`/checklist/${id}/item/${n(9)}`);
  await expect(radio(page, 'Conforme')).toHaveAttribute('aria-checked', 'true');

  await page.goto(`/checklist/${id}/item/${n(1001)}`);
  await radio(page, 'Não').click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Apagar e continuar' }).click();
  await page.waitForTimeout(800);
  await page.goto(`/checklist/${id}/item/${n(9)}`);
  await expect(radio(page, 'Não se aplica')).toHaveAttribute('aria-checked', 'true');
});

test('backup acima de 15 MB é restaurado com a foto', async ({ page }) => {
  const foto = `data:image/webp;base64,${'A'.repeat(16 * 1024 * 1024)}`;
  const agora = new Date().toISOString();
  const backup = {
    formato: 'vistoria-ufca',
    versaoFormato: 1,
    exportadoEm: agora,
    versaoApp: '0.4.2',
    vistorias: [{
      vistoriaId: '22222222-2222-4222-8222-222222222222',
      dataCriacao: agora,
      dataUltimaEdicao: agora,
      blocoAvaliado: 'Escola do Backup',
      status: 'em_andamento',
      dadosVistoria: { 1: { resposta: 'conforme', observacao: '', foto } },
    }],
  };

  await page.goto('/');
  await page.locator('input[type="file"]').setInputFiles({
    name: 'backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(backup)),
  });
  await expect(page.getByRole('article', { name: 'Vistoria de Escola do Backup' })).toBeVisible();

  await page.waitForTimeout(800);
  await page.reload();
  await expect(page.getByRole('article', { name: 'Vistoria de Escola do Backup' })).toBeVisible();
  const fotoGuardada = await page.evaluate(() => new Promise((resolve, reject) => {
    const abrir = indexedDB.open('ufca_acessibilidade_db');
    abrir.onerror = () => reject(abrir.error);
    abrir.onsuccess = () => {
      const leitura = abrir.result.transaction('vistorias_store_v1').objectStore('vistorias_store_v1')
        .get('ufca:vistoria:22222222-2222-4222-8222-222222222222');
      leitura.onsuccess = () => resolve(leitura.result?.dadosVistoria?.[1]?.foto?.length);
    };
  }));
  expect(fotoGuardada).toBe(foto.length);
});

test('erro em uma tela mostra saída em vez de tela branca', async ({ page }) => {
  await page.route('**/src/telas/NaoEncontrada.jsx*', route => route.fulfill({
    contentType: 'text/javascript',
    body: 'export default function Quebrada() { throw new Error("falha de teste"); }',
  }));

  await page.goto('/rota-que-nao-existe');

  await expect(page.getByRole('heading', { name: 'Algo deu errado nesta tela' })).toBeVisible();
  await page.getByRole('button', { name: 'Voltar ao início' }).click();
  await expect(page.getByRole('heading', { name: 'Vistorias' })).toBeVisible();
});

test('popup aparece no primeiro acesso, some depois e o Sobre continua disponível', async ({ page }) => {
  await page.goto('/');

  const popup = page.getByRole('dialog', { name: 'Boas-vindas ao Diagnóstico NBR 9050' });
  await expect(popup).toContainText('Profa. Antonia Fabiana Marques Almeida');
  await popup.getByRole('button', { name: 'Começar' }).click();
  await expect(popup).toBeHidden();

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Vistorias' })).toBeVisible();
  await expect(popup).toBeHidden();

  await page.getByRole('button', { name: 'Sobre' }).click();
  await expect(page.getByRole('heading', { name: 'Como o IAA é calculado' })).toBeVisible();
  await expect(page.getByText('Samuel Sousa Santos')).toBeVisible();
});

test('tema: padrão segue o sistema, a escolha manual prevalece e persiste', async ({ page }) => {
  const tema = () => page.evaluate(() => document.documentElement.dataset.tema);

  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/ajustes');
  expect(await tema()).toBe('claro');

  await page.emulateMedia({ colorScheme: 'dark' });
  await expect.poll(tema).toBe('escuro');

  await page.getByRole('radio', { name: 'Claro' }).check({ force: true });
  expect(await tema()).toBe('claro');

  await page.reload();
  expect(await tema()).toBe('claro');
  const fundo = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(fundo).toBe('rgb(248, 250, 252)');

  await page.getByRole('radio', { name: 'Automático' }).check({ force: true });
  await expect.poll(tema).toBe('escuro');
});

test('tela inicial oferece continuar de onde parou e filtra com muitas vistorias', async ({ page }) => {
  const id = await criarVistoria(page, 'Escola Continuar');
  await responder(page, id, 1, 'Conforme');

  await page.goto('/');
  const continuar = page.getByRole('region', { name: 'Continuar de onde parou' });
  await expect(continuar).toContainText('Escola Continuar');
  await continuar.getByRole('button', { name: 'Continuar' }).click();
  await expect(page).toHaveURL(new RegExp(`/checklist/${id}/item/\\d+$`));

  // Com mais de 6 vistorias, a busca aparece
  await page.goto('/');
  await expect(page.getByPlaceholder('Buscar por nome ou cidade')).toBeHidden();
  const agora = new Date().toISOString();
  const lote = Array.from({ length: 6 }, (_, i) => ({
    vistoriaId: `33333333-3333-4333-8333-33333333333${i}`,
    dataCriacao: agora,
    dataUltimaEdicao: agora,
    blocoAvaliado: `Colégio Número ${i}`,
  }));
  await page.locator('input[type="file"]').setInputFiles({
    name: 'lote.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ formato: 'vistoria-ufca', versaoFormato: 1, exportadoEm: agora, versaoApp: '0.4.2', vistorias: lote })),
  });

  const busca = page.getByPlaceholder('Buscar por nome ou cidade');
  await busca.fill('colegio numero 3');
  await expect(page.getByRole('article')).toHaveCount(1);
  await expect(page.getByRole('article')).toContainText('Colégio Número 3');
});

const lerResposta = (page, id, itemId) => page.evaluate(([vistoriaId, item]) => new Promise((resolve, reject) => {
  const abrir = indexedDB.open('ufca_acessibilidade_db');
  abrir.onerror = () => reject(abrir.error);
  abrir.onsuccess = () => {
    const leitura = abrir.result.transaction('vistorias_store_v1').objectStore('vistorias_store_v1')
      .get(`ufca:vistoria:${vistoriaId}`);
    leitura.onsuccess = () => resolve(leitura.result?.dadosVistoria?.[item] ?? null);
  };
}), [id, itemId]);

test('falha ao salvar avisa o usuário e tenta de novo sem perder a resposta', async ({ page }) => {
  test.setTimeout(60000);
  const id = await criarVistoria(page);
  await page.goto(`/checklist/${id}/item/${n(1)}`);
  await expect(radio(page, 'Conforme')).toBeVisible();

  await page.evaluate(() => {
    window.__putOriginal = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = () => { throw new Error('falha de disco simulada'); };
  });
  await radio(page, 'Conforme').click();
  await expect(page.getByText(/Não foi possível salvar agora/)).toBeVisible();

  await page.evaluate(() => { IDBObjectStore.prototype.put = window.__putOriginal; });
  await expect(page.getByText('Respostas salvas com sucesso.')).toBeVisible({ timeout: 25000 });

  expect((await lerResposta(page, id, 1)).resposta).toBe('conforme');
  await page.reload();
  await expect(radio(page, 'Conforme')).toHaveAttribute('aria-checked', 'true');
});

test('foto grande é reduzida ao ser anexada', async ({ page }) => {
  const id = await criarVistoria(page);
  await page.goto(`/checklist/${id}/item/${n(1)}`);
  await radio(page, 'Conforme').click();

  const png = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 4000;
    canvas.height = 3000;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#4477aa';
    ctx.fillRect(0, 0, 4000, 3000);
    return canvas.toDataURL('image/png').split(',')[1];
  });
  await page.getByRole('button', { name: /Foto e obs/ }).click();
  await page.getByRole('dialog', { name: 'Observação e fotos' }).locator('input[type="file"]').first().setInputFiles({
    name: 'grande.png',
    mimeType: 'image/png',
    buffer: Buffer.from(png, 'base64'),
  });

  await expect.poll(async () => (await lerResposta(page, id, 1))?.foto?.length ?? 0).toBeGreaterThan(0);
  const dimensoes = await page.evaluate(async foto => {
    const img = new Image();
    img.src = foto;
    await img.decode();
    return [img.naturalWidth, img.naturalHeight];
  }, (await lerResposta(page, id, 1)).foto);
  expect(dimensoes).toEqual([1920, 1440]);
});

test('item exibe a imagem aprovada com descrição acessível', async ({ page }) => {
  const id = await criarVistoria(page);
  await page.goto(`/checklist/${id}/item/${n(42)}`);
  const imagem = page.getByRole('img', { name: /Corredor em perspectiva/ });
  await expect(imagem).toHaveAttribute('src', '/imagens/corredor_largura.svg');
  await expect.poll(() => imagem.evaluate(e => e.naturalWidth)).toBeGreaterThan(0);
});

test('responder avança ao próximo item e Desfazer volta e limpa a resposta', async ({ page }) => {
  const id = await criarVistoria(page);
  await page.goto(`/checklist/${id}/item/${n(2)}`);
  await radio(page, 'Conforme').click();
  await expect(page).toHaveURL(new RegExp(`/item/${n(2) + 1}$`));
  await page.getByRole('button', { name: 'Desfazer' }).click();
  await expect(page).toHaveURL(new RegExp(`/item/${n(2)}$`));
  await expect(radio(page, 'Conforme')).toHaveAttribute('aria-checked', 'false');
});

test('não conforme fica no item, abre a evidência e guarda várias fotos', async ({ page }) => {
  const id = await criarVistoria(page);
  await page.goto(`/checklist/${id}/item/${n(2)}`);
  await radio(page, 'Não conforme').click();
  const folha = page.getByRole('dialog', { name: 'Observação e fotos' });
  await expect(folha).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`/item/${n(2)}$`));

  const png = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 150;
    canvas.getContext('2d').fillRect(0, 0, 200, 150);
    return canvas.toDataURL('image/png').split(',')[1];
  });
  const arquivo = nome => ({ name: nome, mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
  await folha.locator('input[type="file"]').first().setInputFiles([arquivo('a.png'), arquivo('b.png')]);
  await expect(folha.getByRole('button', { name: /Ampliar foto/ })).toHaveCount(2);

  await expect.poll(async () => (await lerResposta(page, id, 2))?.fotos?.length ?? 0).toBe(2);
  const resposta = await lerResposta(page, id, 2);
  expect(resposta.foto).toBe(resposta.fotos[0]);
});

test('ilustração abre em tela cheia com zoom pelos botões e fecha com Esc', async ({ page }) => {
  const id = await criarVistoria(page);
  await page.goto(`/checklist/${id}/item/${n(42)}`);
  await page.getByRole('button', { name: /Ampliar/ }).click();
  const visualizador = page.getByRole('dialog', { name: /Corredor|Corredores/ });
  await expect(visualizador).toBeVisible();
  await visualizador.getByRole('button', { name: 'Aumentar zoom' }).click();
  await expect(visualizador.getByRole('toolbar', { name: 'Zoom' })).toContainText('125%');
  await page.keyboard.press('Escape');
  await expect(visualizador).toBeHidden();
});

test('ajustes de tamanho do texto e de avanço ficam salvos e valem no app', async ({ page }) => {
  await page.goto('/ajustes');
  await page.getByRole('radio', { name: 'Máximo' }).check({ force: true });
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).fontSize)).toBe('24px');

  const avancar = page.getByRole('switch', { name: 'Avançar ao responder' });
  await expect(avancar).not.toBeChecked();
  await avancar.check({ force: true });

  await page.reload();
  await expect(page.getByRole('radio', { name: 'Máximo' })).toBeChecked();
  await expect(page.getByRole('switch', { name: 'Avançar ao responder' })).toBeChecked();
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).fontSize)).toBe('24px');
});
