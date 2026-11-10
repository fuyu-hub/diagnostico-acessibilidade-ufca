import { Vistoria } from './esquema.js';
import { gerarUUID } from './migracoes.js';
import { mesclarCopias } from './mescla.js';

/**
 * Gera um novo nome com sufixo de cópia inteligente (" - Cópia", " - Cópia (2)")
 */
export function gerarNomeCopia(nomeOriginal, nomesExistentes = []) {
  const base = (nomeOriginal || 'Vistoria').replace(/ - Cópia( \(\d+\))?$/, '');
  let candidato = `${base} - Cópia`;
  let contador = 2;

  const setExistentes = new Set(nomesExistentes);
  while (setExistentes.has(candidato)) {
    candidato = `${base} - Cópia (${contador})`;
    contador++;
  }
  return candidato;
}

/**
 * Motor puro de resolução de conflitos entre duas versões de uma mesma vistoria
 * Compartilhado entre importação de arquivos locais e respostas HTTP 409
 *
 * @param {object} local - Versão já existente localmente
 * @param {object} remota - Versão recebida (do arquivo ou servidor)
 * @param {'sobrescrever'|'copia'|'mesclar'|'cancelar'} estrategia
 * @param {string[]} [nomesExistentes] - Lista opcional para desambiguação de cópia
 * @returns {{ acao: 'salvar'|'criar'|'cancelar', vistoria: object }}
 */
export function resolverConflito(local, remota, estrategia, nomesExistentes = []) {
  const vLocal = Vistoria.parse(local);
  const vRemota = Vistoria.parse(remota);
  const agora = new Date().toISOString();

  switch (estrategia) {
    case 'sobrescrever': {
      const substituida = {
        ...vRemota,
        vistoriaId: vLocal.vistoriaId, // preserva ID local para manter rotas estáveis
        revisao: Math.max(vLocal.revisao, vRemota.revisao) + 1,
        dataUltimaEdicao: agora,
      };
      return {
        acao: 'salvar',
        vistoria: Vistoria.parse(substituida),
      };
    }

    case 'copia': {
      const novoNome = gerarNomeCopia(vRemota.blocoAvaliado, nomesExistentes);
      const copia = {
        ...vRemota,
        vistoriaId: gerarUUID(),
        blocoAvaliado: novoNome,
        status: vRemota.status === 'concluida' ? 'concluida' : 'em_andamento',
        revisao: 0,
        dataCriacao: agora,
        dataUltimaEdicao: agora,
        sincronizada: false,
        dataUltimaSincronizacao: null,
      };
      return {
        acao: 'criar',
        vistoria: Vistoria.parse(copia),
      };
    }

    case 'mesclar': {
      // Mescla item a item pelos carimbos de cada resposta (mescla.js). Respostas diferentes
      // dadas sem uma conhecer a outra ficam guardadas como divergência, sem perda.
      // Em respostas antigas, sem carimbo, a cópia de revisão maior vence; no empate, a local.
      const ordem = vRemota.revisao > vLocal.revisao ? [vLocal, vRemota] : [vRemota, vLocal];
      const dadosMesclados = mesclarCopias(ordem.map(v => v.dadosVistoria));

      const mesclada = {
        ...vLocal,
        blocoAvaliado: vLocal.blocoAvaliado || vRemota.blocoAvaliado,
        revisao: Math.max(vLocal.revisao, vRemota.revisao) + 1,
        dataUltimaEdicao: agora,
        dadosVistoria: dadosMesclados,
        // Recalcular snapshot se necessário na interface
      };

      return {
        acao: 'salvar',
        vistoria: Vistoria.parse(mesclada),
      };
    }

    case 'cancelar':
    default:
      return {
        acao: 'cancelar',
        vistoria: vLocal,
      };
  }
}
