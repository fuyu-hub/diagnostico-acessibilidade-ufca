/**
 * Marca do Percurso Acessível (arquivo original: logo/marca.svg, na raiz do projeto): três ladrilhos em L,
 * o piso direcional que faz uma curva com o piso de alerta na mudança de direção.
 * O azul dos ladrilhos segue o tema; o piso de alerta é sempre amarelo.
 */
const PONTOS = [48, 72, 96].flatMap(x => [48, 72, 96].map(y => [x, y]));

export default function MarcaPercurso({ tamanho = 48 }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 256 256" aria-hidden="true" focusable="false">
      <rect x="24" y="128" width="96" height="96" rx="12" fill="var(--accent)" />
      <path d="M48 144V208M72 144V208M96 144V208" fill="none" stroke="#93C5FD" strokeWidth="8" strokeLinecap="round" />
      <rect x="24" y="24" width="96" height="96" rx="12" fill="#FFDF00" stroke="#0F172A" strokeWidth="6" />
      {PONTOS.map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="7" fill="#9A7400" />)}
      <rect x="128" y="24" width="96" height="96" rx="12" fill="var(--accent)" />
      <path d="M144 48H208M144 72H208M144 96H208" fill="none" stroke="#93C5FD" strokeWidth="8" strokeLinecap="round" />
    </svg>
  );
}
