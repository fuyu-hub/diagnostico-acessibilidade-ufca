/**
 * Marca do Rota Acessível (arquivo original: logo/marca.svg, na raiz do projeto) desenhada aqui para acompanhar o tema:
 * o contorno e a rota usam as cores do tema, o piso de alerta é sempre amarelo.
 */
const PONTOS = [148, 168, 188].flatMap(x => [76, 96, 116].map(y => [x, y]));

export default function MarcaRota({ tamanho = 48 }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 256 256" aria-hidden="true" focusable="false">
      <path
        d="M100 228H58A30 30 0 0 1 28 198V58A30 30 0 0 1 58 28H198A30 30 0 0 1 228 58V198A30 30 0 0 1 198 228H156"
        fill="none"
        stroke="var(--text-strong)"
        strokeWidth="14"
        strokeLinecap="round"
      />
      <path
        d="M128 236V180Q128 158 148 158Q168 158 168 138V128"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="24"
        strokeLinecap="round"
      />
      <rect x="130" y="58" width="76" height="76" rx="5" fill="#FFDF00" stroke="#0F172A" strokeWidth="8" />
      {PONTOS.map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="6" fill="#9A7400" />)}
    </svg>
  );
}
