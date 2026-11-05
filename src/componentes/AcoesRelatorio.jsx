import { useState } from 'react';
import { IconFileTypePdf, IconTable, IconShieldCheck, IconDownload, IconLoader2 } from '@tabler/icons-react';
import { useVistoria } from '../contexto/VistoriaContext';
import { useNotificacao } from '../contexto/NotificacaoContext';
import styles from './AcoesRelatorio.module.css';

/**
 * PDF, planilha e cópia de segurança de uma vistoria.
 * variante "lista": linhas com descrição (Painel › Relatórios); "botoes": fileira compacta (Resultado).
 */
export default function AcoesRelatorio({ vistoria, variante = 'lista' }) {
  const { exportarVistoria } = useVistoria();
  const { mostrarToast } = useNotificacao();
  const [gerando, setGerando] = useState(null); // 'pdf' | 'planilha' | 'backup'

  async function executar(tipo) {
    if (gerando) return;
    setGerando(tipo);
    try {
      if (tipo === 'pdf') {
        const { gerarPdfVistoria } = await import('../relatorios/geradorPdf');
        await gerarPdfVistoria(vistoria);
        mostrarToast('Relatório PDF baixado.', 'sucesso');
      } else if (tipo === 'planilha') {
        const { gerarPlanilhaVistoria } = await import('../relatorios/geradorExcel');
        await gerarPlanilhaVistoria(vistoria);
        mostrarToast('Planilha baixada.', 'sucesso');
      } else {
        await exportarVistoria(vistoria.id);
      }
    } catch (err) {
      console.error(`Erro ao gerar ${tipo}:`, err);
      mostrarToast(
        tipo === 'pdf' ? 'Não foi possível gerar o relatório PDF.'
          : tipo === 'planilha' ? 'Não foi possível gerar a planilha.'
          : 'Não foi possível gerar a cópia de segurança.',
        'erro'
      );
    } finally {
      setGerando(null);
    }
  }

  const acoes = [
    { tipo: 'pdf', titulo: 'Relatório em PDF', curto: 'PDF', desc: 'Resultado, seções, não conformidades e fotos, pronto para imprimir.', Icone: IconFileTypePdf },
    { tipo: 'planilha', titulo: 'Planilha (Excel)', curto: 'Planilha', desc: 'Questionário, respostas, fotos e o resumo do IAA.', Icone: IconTable },
    { tipo: 'backup', titulo: 'Cópia de segurança', curto: 'Backup', desc: 'Arquivo para restaurar ou continuar em outro aparelho.', Icone: IconShieldCheck },
  ];

  if (variante === 'botoes') {
    return (
      <div className={styles.botoes}>
        {acoes.map(({ tipo, curto, Icone }) => (
          <button key={tipo} type="button" className={styles.botao} onClick={() => executar(tipo)} aria-busy={gerando === tipo}>
            {gerando === tipo ? <IconLoader2 size={18} className={styles.girando} aria-hidden="true" /> : <Icone size={18} aria-hidden="true" />}
            {gerando === tipo ? 'Gerando…' : curto}
          </button>
        ))}
      </div>
    );
  }

  return (
    <ul className={styles.lista}>
      {acoes.map(({ tipo, titulo, desc, Icone }) => (
        <li key={tipo}>
          <button type="button" className={styles.linha} onClick={() => executar(tipo)} aria-busy={gerando === tipo}>
            <span className={styles.icone} aria-hidden="true"><Icone size={24} /></span>
            <span className={styles.textos}>
              <strong>{titulo}</strong>
              <span>{gerando === tipo ? 'Gerando…' : desc}</span>
            </span>
            {gerando === tipo
              ? <IconLoader2 size={20} className={styles.girando} aria-hidden="true" />
              : <IconDownload size={20} aria-hidden="true" />}
          </button>
        </li>
      ))}
    </ul>
  );
}
