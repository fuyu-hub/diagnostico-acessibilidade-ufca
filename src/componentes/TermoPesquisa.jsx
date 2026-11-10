import { VERSAO_TERMO } from '../dados/consentimento';

// RASCUNHO do termo, aguardando revisão da coordenação (Escopo 09, pendência P3).
// Mudança relevante no texto exige subir VERSAO_TERMO, para pedir o aceite de novo.

export const RESUMO_PESQUISA =
  'Ao concluir uma vistoria, o app envia à equipe do projeto uma cópia sem fotos, nomes, endereço ou observações, para pesquisa sobre acessibilidade nas escolas.';

/** Termo completo, recolhido em "Ler o termo completo". */
export default function TermoPesquisa({ className }) {
  return (
    <details className={className}>
      <summary>Ler o termo completo</summary>
      <div>
        <p><strong>Quem recebe:</strong> a equipe do projeto de extensão Rota Acessível, da Universidade Federal do Cariri (UFCA).</p>
        <p><strong>O que é enviado:</strong> as respostas do checklist, a triagem, a nota, a cidade, a rede e o nível de ensino, o número de alunos e de pavimentos, o ano de construção e a versão do app.</p>
        <p><strong>O que não é enviado:</strong> fotos, nomes de avaliadores, endereço, bairro e observações.</p>
        <p><strong>Quando:</strong> ao concluir uma vistoria, assim que houver internet.</p>
        <p><strong>Para quê:</strong> estudar a acessibilidade das escolas. Resultados publicados não identificam pessoas.</p>
        <p><strong>Como mudar de ideia:</strong> em Ajustes, a qualquer momento. Os envios param a partir daí. Para pedir a exclusão do que já foi enviado, fale com a coordenação do projeto.</p>
        <p>Sem aceitar, o app funciona do mesmo jeito, e as vistorias ficam só neste aparelho.</p>
        <p>Versão {VERSAO_TERMO} do termo.</p>
      </div>
    </details>
  );
}
