import SeletorNivel, { OPCOES_NIVEL_ENSINO } from './SeletorNivel';

export { OPCOES_NIVEL_ENSINO };

/**
 * Componente legado mantido para total compatibilidade retroativa.
 * Encapsula SeletorNivel configurado para múltipla escolha.
 */
export default function SeletorNivelEnsino({ valores = [], onChange, label = 'Nível de Ensino', ...rest }) {
  return (
    <SeletorNivel
      label={label}
      valores={valores}
      onChange={onChange}
      opcoes={OPCOES_NIVEL_ENSINO}
      multi={true}
      {...rest}
    />
  );
}
