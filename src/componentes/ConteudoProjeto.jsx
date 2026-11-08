import { PROJETO } from '../dados/projeto';
import { ITENS_TECNICOS, SECOES } from '../dados/checklist';
import styles from './ConteudoProjeto.module.css';

export default function ConteudoProjeto({ nivelTitulo: Titulo = 'h3' }) {
  return (
    <div className={styles.conteudo}>
      <section>
        <Titulo className={styles.titulo}>Como funciona</Titulo>
        <p>
          Você responde {ITENS_TECNICOS.length} itens em {SECOES.length} seções e recebe o Índice de Avaliação
          de Acessibilidade (IAA), com relatório em PDF e planilha. O app funciona sem internet depois de aberto
          pela primeira vez.
        </p>
      </section>

      <section>
        <Titulo className={styles.titulo}>O projeto</Titulo>
        <p>{PROJETO.objetivo}</p>
        <p className={styles.detalhe}>
          Projeto de extensão {PROJETO.codigo} · {PROJETO.instituicao} · {PROJETO.unidade}
        </p>
      </section>

      <section>
        <Titulo className={styles.titulo}>Quem faz</Titulo>
        <ul className={styles.lista}>
          {PROJETO.coordenacao.map(pessoa => (
            <li key={pessoa.nome}>{pessoa.nome} <span className={styles.detalhe}>· {pessoa.funcao}</span></li>
          ))}
          {PROJETO.discentes.map(nome => (
            <li key={nome}>{nome} <span className={styles.detalhe}>· Equipe discente</span></li>
          ))}
        </ul>
      </section>

      <section>
        <Titulo className={styles.titulo}>Seus dados</Titulo>
        <p>
          As vistorias ficam apenas neste aparelho. Faça backup com frequência em Ajustes. Ao fotografar,
          evite registrar pessoas, sobretudo crianças e adolescentes.
        </p>
      </section>
    </div>
  );
}
