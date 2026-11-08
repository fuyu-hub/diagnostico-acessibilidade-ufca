import { IconTools } from '@tabler/icons-react';
import Topbar from '../componentes/Topbar';
import { PROJETO } from '../dados/projeto';
import { VERSAO_APP } from '../dados/exportacao';
import styles from './Sobre.module.css';

// Página em construção: o conteúdo anterior (projeto, equipe e cálculo do IAA) está no histórico do git
export default function Sobre() {
  return (
    <div className="app-shell">
      <Topbar titulo="Sobre" voltar="/" />
      <main className="tela-body" style={{ padding: '24px 20px 48px' }}>
        <div className={styles.container}>
          <section className="cartao" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
            <IconTools size={32} color="var(--accent)" aria-hidden="true" />
            <h2 className={styles.titulo}>Em construção</h2>
            <p className={styles.texto}>
              Esta página está sendo refeita e volta em breve com as informações do projeto e da equipe.
            </p>
          </section>
          <p className={styles.texto} style={{ color: 'var(--text-secondary)' }}>
            {PROJETO.nome} · versão {VERSAO_APP}
          </p>
        </div>
      </main>
    </div>
  );
}
