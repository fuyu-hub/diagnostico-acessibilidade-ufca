import { useSyncExternalStore } from 'react';

/**
 * Duas versões de cada ilustração (decisão de 07/11/2026):
 * - deitada, 1376×768, em /imagens/: telas grandes, com a pergunta em duas colunas;
 * - quadrada, 720×720, em /imagens/quadradas/: celular e telas em pé.
 * Enquanto um desenho não tiver a versão quadrada, a deitada vale em todas as telas.
 */
export const DEITADA = { largura: 1376, altura: 768 };
export const QUADRADA = { largura: 720, altura: 720 };

// Desenhos que já têm a versão quadrada (mesmo nome de arquivo)
export const ILUSTRACOES_QUADRADAS = new Set([
  // Pilotos
  'calcada_faixa_livre.svg',
  'escada_largura_patamar.svg',
  'corrimao_alturas.svg',
  // Lote 1 (desenhos/quadradas_lote1.mjs)
  'rota_acessivel.svg',
  'piso_firme_regular.svg',
  'piso_tatil_externo.svg',
  'calcada_inclinacao_transversal.svg',
  'altura_livre.svg',
  'desniveis_piso.svg',
  'objetos_salientes.svg',
  'rebaixamento_calcada.svg',
  'escada_degrau_dimensoes.svg',
  'escada_sinal_visual.svg',
  'escada_inclinacao.svg',
  'rampa_dimensoes.svg',
  // Lote 2 (desenhos/quadradas_lote2.mjs)
  'rampa_guarda_corpo.svg',
  'corrimao_intermediario.svg',
  'corrimao_braille.svg',
  'porta_vao_livre.svg',
  'macaneta_alavanca.svg',
  'porta_giratoria.svg',
  'catraca_vao.svg',
  'vaga_pcd.svg',
  'vaga_idoso.svg',
  'estacionamento_percurso.svg',
  'corredor_largura.svg',
  'iluminacao_uniforme.svg',
  // Lote 3 (desenhos/quadradas_lote3.mjs)
  'comandos_alturas.svg',
  'inclinacao_longitudinal.svg',
  'piso_tatil_interno.svg',
  'escada_piso_tatil.svg',
  'elevador_botoeira.svg',
  'elevador_entrada.svg',
  'bebedouro_bica.svg',
  'bebedouro_alturas.svg',
  'sinalizacao_porta.svg',
  'porta_espaco_lateral.svg',
  'mesa_vao_livre.svg',
  'giro_360.svg',
  // Lote 4 (desenhos/quadradas_lote4.mjs)
  'lousa_tela_altura.svg',
  'estantes_corredor.svg',
  'giro_180.svg',
  'alcance_manual.svg',
  'auditorio_espaco_pcr.svg',
  'auditorio_assento_pmr.svg',
  'plateia_corrimao.svg',
  'interprete_libras.svg',
  'sinalizacao_luminosa_piso.svg',
  'balcao_autosservico.svg',
  'iluminacao_balcao.svg',
  'sanitario_porta_puxador.svg',
  // Lote 5 (desenhos/quadradas_lote5.mjs)
  'sanitario_area_manobra.svg',
  'bacia_altura_assento.svg',
  'bacia_barras.svg',
  'lavatorio.svg',
  'sanitario_acessorios.svg',
  'box_chuveiro.svg',
  'arquibancada_pcr.svg',
  'banco_patio.svg',
  'luminaria_rota.svg',
  'saida_antipanico.svg',
  'area_resgate.svg',
  'mapa_tatil.svg',
]);

// A mesma regra do layout de duas colunas em ItemChecklist.module.css
export const CONSULTA_DUAS_COLUNAS = '(min-width: 900px) and (min-aspect-ratio: 5/4)';

/** Escolhe a versão da ilustração para o layout atual. */
export function escolherIlustracao(arquivo, duasColunas) {
  if (!arquivo) return null;
  if (!duasColunas && ILUSTRACOES_QUADRADAS.has(arquivo)) {
    return { src: `/imagens/quadradas/${arquivo}`, ...QUADRADA };
  }
  return { src: `/imagens/${arquivo}`, ...DEITADA };
}

function assinar(fn) {
  const mq = window.matchMedia?.(CONSULTA_DUAS_COLUNAS);
  mq?.addEventListener('change', fn);
  return () => mq?.removeEventListener('change', fn);
}

/** true quando a tela usa o layout de duas colunas (acompanha o giro do tablet). */
export function useDuasColunas() {
  return useSyncExternalStore(
    assinar,
    () => window.matchMedia?.(CONSULTA_DUAS_COLUNAS).matches ?? false,
    () => false,
  );
}
