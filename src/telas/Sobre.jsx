import Topbar from '../componentes/Topbar';
import ConteudoProjeto from '../componentes/ConteudoProjeto';
import { PROJETO } from '../dados/projeto';
import { FAIXAS_INDICE } from '../dados/classificacao';
import { VERSAO_APP } from '../dados/exportacao';
import styles from './Sobre.module.css';

export default function Sobre() {
  return (
    <div className="app-shell">
      <Topbar titulo="Sobre" voltar="/" />
      <main className="tela-body" style={{ padding: '24px 20px 48px' }}>
        <div className={styles.container}>
          <h1 className={styles.nomeProjeto}>{PROJETO.nome}</h1>
          <p className={styles.edital}>{PROJETO.edital}</p>

          <div className="cartao">
            <ConteudoProjeto nivelTitulo="h2" />
          </div>

          <section className="cartao">
            <h2 className={styles.titulo}>Como o IAA é calculado</h2>
            <p className={styles.texto}>
              A nota é a proporção de itens conformes entre os avaliados, em uma escala de 0 a 10, com uma casa
              decimal. Itens marcados como "Não se aplica" e itens ainda sem resposta ficam fora do cálculo. Enquanto
              a vistoria está incompleta, o resultado aparece como prévia.
            </p>
            <table className={styles.tabela}>
              <thead>
                <tr><th scope="col">Nota</th><th scope="col">Classificação</th><th scope="col">Significado</th></tr>
              </thead>
              <tbody>
                {FAIXAS_INDICE.map(faixa => (
                  <tr key={faixa.rotulo}>
                    <td>{faixa.faixaTexto}</td>
                    <td style={{ color: faixa.cor, fontWeight: 700 }}>{faixa.rotulo}</td>
                    <td>{faixa.descricao}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="cartao">
            <h2 className={styles.titulo}>Referencial normativo</h2>
            <ul className={styles.lista}>
              {PROJETO.normas.map(norma => <li key={norma}>{norma}</li>)}
            </ul>
          </section>

          <p className={styles.versao}>Versão do app {VERSAO_APP} · Checklist 1.0</p>
        </div>
      </main>
    </div>
  );
}
