import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import { useNotificacao } from '../contexto/NotificacaoContext';
import { useVistoria } from '../contexto/VistoriaContext';
import {
  VERSAO_APP,
  aplicarAtualizacao,
  limparCachesDeRecursos,
  registrarVersao,
} from '../utilitarios/versaoApp';
import { marcarVersaoPronta } from '../utilitarios/aplicativo';

// Nas telas de pergunta a troca nunca acontece: ela espera a pessoa sair do checklist
const TELA_DE_PERGUNTA = /\/checklist\/[^/]+\/item\//;

const UMA_HORA = 60 * 60 * 1000;

/**
 * Procura novas versões e as aplica ao trocar de tela, quando não há nada sendo preenchido.
 * A página recarrega na tela de destino, sem apagar vistorias, fotos ou preferências.
 */
export default function AtualizacaoApp() {
  const { pathname } = useLocation();
  const { descarregarGravacoes } = useVistoria();
  const { mostrarToast } = useNotificacao();

  const atualizarRef = useRef(null);
  const versaoProntaRef = useRef(false);
  const aplicandoRef = useRef(false);
  const telaAnteriorRef = useRef(pathname);
  const iniciadoRef = useRef(false);

  useEffect(() => {
    if (iniciadoRef.current) return undefined;
    iniciadoRef.current = true;

    const { mudou } = registrarVersao();
    if (mudou) {
      limparCachesDeRecursos();
      mostrarToast(`App atualizado para a versão ${VERSAO_APP}.`, 'info', 4000);
    }

    let registro = null;
    const procurarVersao = () => {
      if (registro && navigator.onLine) registro.update().catch(() => {});
    };
    const aoVoltarParaOApp = () => {
      if (document.visibilityState === 'visible') procurarVersao();
    };

    atualizarRef.current = registerSW({
      onNeedRefresh() {
        versaoProntaRef.current = true;
        // Ajustes mostra a versão nova e deixa aplicar na hora
        marcarVersaoPronta(() => aplicarAtualizacao({
          descarregar: descarregarGravacoes,
          atualizar: () => atualizarRef.current(true),
        }));
      },
      onRegisteredSW(_url, reg) {
        registro = reg || null;
      },
    });

    const intervalo = setInterval(procurarVersao, UMA_HORA);
    document.addEventListener('visibilitychange', aoVoltarParaOApp);
    window.addEventListener('online', procurarVersao);

    return () => {
      clearInterval(intervalo);
      document.removeEventListener('visibilitychange', aoVoltarParaOApp);
      window.removeEventListener('online', procurarVersao);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mostrarToast]);

  // Troca de tela fora das perguntas: momento seguro para aplicar uma versão já baixada
  useEffect(() => {
    if (telaAnteriorRef.current === pathname) return;
    telaAnteriorRef.current = pathname;
    if (!versaoProntaRef.current || aplicandoRef.current || !atualizarRef.current) return;
    if (TELA_DE_PERGUNTA.test(pathname)) return;

    aplicandoRef.current = true;
    aplicarAtualizacao({
      descarregar: descarregarGravacoes,
      atualizar: () => atualizarRef.current(true),
    })
      .catch(erro => console.warn('Falha ao aplicar a atualização:', erro))
      .finally(() => {
        aplicandoRef.current = false;
      });
  }, [pathname, descarregarGravacoes]);

  // Uma aba aberta na versão antiga pode pedir um arquivo que já foi trocado: recarrega uma vez
  useEffect(() => {
    const chave = `nbr9050_recarga_arquivo:${VERSAO_APP}`;

    async function aoFalharArquivo(evento) {
      try {
        if (sessionStorage.getItem(chave)) return;
        sessionStorage.setItem(chave, '1');
      } catch {
        return;
      }
      evento.preventDefault();
      if (await descarregarGravacoes()) window.location.reload();
    }

    window.addEventListener('vite:preloadError', aoFalharArquivo);
    return () => window.removeEventListener('vite:preloadError', aoFalharArquivo);
  }, [descarregarGravacoes]);

  return null;
}
