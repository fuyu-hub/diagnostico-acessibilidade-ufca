import Topbar from '../componentes/Topbar';
import ConteudoProjeto from '../componentes/ConteudoProjeto';
import { PROJETO } from '../dados/projeto';
import { VERSAO_APP } from '../dados/exportacao';
import styles from './Sobre.module.css';

// O mesmo conteúdo das boas-vindas, para a pessoa poder rever depois
export default function Sobre() {
  return (
    <div className="app-shell">
      <Topbar titulo="Sobre" voltar="/" />
      <main className="tela-body" style={{ padding: '24px 20px 48px' }}>
        <div className={styles.container}>
          <ConteudoProjeto nivelTitulo="h2" />
          <p className={styles.texto} style={{ color: 'var(--text-secondary)' }}>
            {PROJETO.nome} · versão {VERSAO_APP}
          </p>
        </div>
      </main>
    </div>
  );
}
