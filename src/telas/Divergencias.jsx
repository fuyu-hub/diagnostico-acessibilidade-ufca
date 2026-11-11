import { useParams } from 'react-router-dom';
import { IconCircleCheck } from '@tabler/icons-react';
import Topbar from '../componentes/Topbar';
import DivergenciaItem from '../componentes/DivergenciaItem';
import { temDivergencia } from '../dados/mescla';
import { useVistoria } from '../contexto/VistoriaContext';
import { TODOS_ITENS } from '../dados/checklist';
import { useNavegacao } from '../utilitarios/navegacao';
import styles from '../componentes/AbaGrupo.module.css';

/** Todas as divergências de uma vistoria em grupo, para decidir de uma vez. */
export default function Divergencias() {
  const { id } = useParams();
  const { getVistoria, carregando } = useVistoria();
  const { navegar } = useNavegacao();
  const vistoria = getVistoria(id);

  if (carregando) return <div style={{ padding: 20, textAlign: 'center' }}>Carregando…</div>;
  if (!vistoria) {
    return (
      <div className="app-shell">
        <Topbar titulo="Vistoria não encontrada" voltar="/" />
      </div>
    );
  }

  const itens = TODOS_ITENS
    .map((item, indice) => ({ item, indice }))
    .filter(({ item }) => temDivergencia(vistoria.dadosVistoria?.[item.id]));

  return (
    <div className="app-shell">
      <Topbar titulo="Divergências" voltar={`/vistoria/${vistoria.id}?aba=grupo`} />
      <main className="tela-body" style={{ padding: '24px 20px 48px', display: 'grid', gap: 16 }}>
        {itens.length === 0 ? (
          <section className={styles.cartao}>
            <p className={`${styles.estado} ${styles.ok}`}><IconCircleCheck size={18} aria-hidden="true" /> Nenhuma divergência. As respostas do grupo combinam.</p>
          </section>
        ) : (
          <>
            <p className={styles.texto}>
              {itens.length === 1 ? '1 item tem' : `${itens.length} itens têm`} respostas diferentes. Para cada um, escolha a que vale.
            </p>
            {itens.map(({ item, indice }) => (
              <section key={item.id} className={styles.cartao} aria-labelledby={`pergunta-${item.id}`}>
                <p id={`pergunta-${item.id}`} className={styles.texto}>
                  <strong>Item {indice + 1}</strong> · {item.pergunta}
                </p>
                <DivergenciaItem vistoria={vistoria} itemId={String(item.id)} />
                <button type="button" className="btn-nav" onClick={() => navegar(`/checklist/${vistoria.id}/item/${indice + 1}`)}>
                  Ver o item
                </button>
              </section>
            ))}
          </>
        )}
      </main>
    </div>
  );
}
