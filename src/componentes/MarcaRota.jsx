/**
 * Marca do Rota Acessível (arquivo original: logo/marca.svg, na raiz do projeto) desenhada aqui para acompanhar o tema:
 * os cantos e a cruz usam as cores do tema, o piso de alerta é sempre amarelo.
 */
const PONTOS = [106, 128, 150].flatMap(x => [106, 128, 150].map(y => [x, y]));

export default function MarcaRota({ tamanho = 48 }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 256 256" aria-hidden="true" focusable="false">
      <path
        d="M21 102V51A30 30 0 0 1 51 21H102M154 21H205A30 30 0 0 1 235 51V102M235 154V205A30 30 0 0 1 205 235H154M102 235H51A30 30 0 0 1 21 205V154"
        fill="none"
        stroke="var(--text-strong)"
        strokeWidth="14"
        strokeLinecap="round"
      />
      <path d="M128 8V248M8 128H248" fill="none" stroke="var(--accent)" strokeWidth="21" />
      <rect x="88" y="88" width="80" height="80" rx="8" fill="#FFDF00" stroke="#0F172A" strokeWidth="8" />
      {PONTOS.map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="6" fill="#9A7400" />)}
    </svg>
  );
}
