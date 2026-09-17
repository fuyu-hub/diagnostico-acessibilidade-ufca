import { EnvelopeExportacao, Vistoria } from './esquema.js';
import { converterLegadoParaCanonica } from './migracoes.js';

const VERSAO_APP = '0.4.2';

/**
 * Monta um EnvelopeExportacao canônico a partir de uma ou várias vistorias
 */
export function criarEnvelopeExportacao(vistorias) {
  const lista = Array.isArray(vistorias) ? vistorias : [vistorias];
  const vistoriasValidadas = lista.map(v => Vistoria.parse(v));

  const envelope = {
    formato: 'vistoria-ufca',
    versaoFormato: 1,
    exportadoEm: new Date().toISOString(),
    versaoApp: VERSAO_APP,
    vistorias: vistoriasValidadas,
  };

  return EnvelopeExportacao.parse(envelope);
}

/**
 * Gera o nome de arquivo sugerido para exportação
 */
export function gerarNomeArquivoExportacao(vistorias) {
  const dataStr = new Date().toISOString().split('T')[0];
  const lista = Array.isArray(vistorias) ? vistorias : [vistorias];

  if (lista.length === 1) {
    const nomeBloco = (lista[0].blocoAvaliado || 'vistoria')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .substring(0, 30);
    const idCurto = (lista[0].vistoriaId || '').substring(0, 8);
    return `vistoria_${nomeBloco}_${dataStr}_${idCurto}.json`;
  }

  return `vistorias_ufca_${dataStr}_qtd${lista.length}.json`;
}

/**
 * Exporta envelope com suporte a Web Share API (mobile/WhatsApp/Drive) e fallback de download
 */
export async function compartilharOuBaixarEnvelope(envelope, nomeArquivoCustomizado) {
  const nomeArquivo = nomeArquivoCustomizado || gerarNomeArquivoExportacao(envelope.vistorias);
  const jsonTexto = JSON.stringify(envelope, null, 2);
  const blob = new Blob([jsonTexto], { type: 'application/json' });

  // Tentar Web Share API com arquivo se o dispositivo suportar
  if (
    typeof navigator !== 'undefined' &&
    navigator.canShare &&
    navigator.share
  ) {
    try {
      const arquivo = new File([blob], nomeArquivo, { type: 'application/json' });
      if (navigator.canShare({ files: [arquivo] })) {
        await navigator.share({
          title: 'Exportação de Vistorias UFCA',
          text: `Diagnóstico de acessibilidade exportado em ${new Date().toLocaleDateString('pt-BR')}`,
          files: [arquivo],
        });
        return { metodo: 'share', sucesso: true };
      }
    } catch (shareErr) {
      if (shareErr.name === 'AbortError') {
        return { metodo: 'share', cancelado: true };
      }
      console.warn('Falha no Web Share, aplicando fallback para download:', shareErr);
    }
  }

  // Fallback para download tradicional via tag <a>
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return { metodo: 'download', sucesso: true };
}

/**
 * Analisa e valida com barreira rigorosa um texto JSON recebido por upload
 * Suporta EnvelopeExportacao v1 e formato legado retrocompatível
 */
export function analisarArquivoImportacao(conteudoTexto) {
  if (!conteudoTexto || typeof conteudoTexto !== 'string') {
    throw new Error('O arquivo está vazio.');
  }

  // Barreira de tamanho (máximo 15MB para evitar travar a aba)
  if (conteudoTexto.length > 15 * 1024 * 1024) {
    throw new Error('O arquivo selecionado excede o limite máximo permitido (15MB).');
  }

  let jsonBruto;
  try {
    jsonBruto = JSON.parse(conteudoTexto);
  } catch {
    throw new Error('Arquivo corrompido ou formato JSON inválido.');
  }

  // Caso 1: Envelope oficial canônico
  const validacaoEnvelope = EnvelopeExportacao.safeParse(jsonBruto);
  if (validacaoEnvelope.success) {
    return {
      tipo: 'envelope',
      versaoFormato: validacaoEnvelope.data.versaoFormato,
      vistorias: validacaoEnvelope.data.vistorias,
    };
  }

  // Caso 2: Array de vistorias legadas ou cruas
  if (Array.isArray(jsonBruto)) {
    const vistoriasConvertidas = jsonBruto.map(item => converterLegadoParaCanonica(item));
    return {
      tipo: 'legado_lote',
      versaoFormato: 0,
      vistorias: vistoriasConvertidas,
    };
  }

  // Caso 3: Objeto único (vistoria avulsa canônica ou legada)
  if (jsonBruto && typeof jsonBruto === 'object') {
    const vistoriaUnica = converterLegadoParaCanonica(jsonBruto);
    return {
      tipo: 'legado_individual',
      versaoFormato: 0,
      vistorias: [vistoriaUnica],
    };
  }

  throw new Error('Conteúdo do arquivo não reconhecido como vistoria válida.');
}
