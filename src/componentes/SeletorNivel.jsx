import { useState, useRef, useEffect } from 'react';
import { IconChevronDown, IconCheck } from '@tabler/icons-react';
import styles from './SeletorNivel.module.css';

export const OPCOES_REDE = [
  { id: 'Federal', rotulo: 'Federal', curto: 'Federal' },
  { id: 'Estadual', rotulo: 'Estadual', curto: 'Estadual' },
  { id: 'Municipal', rotulo: 'Municipal', curto: 'Municipal' },
  { id: 'Privada', rotulo: 'Privada', curto: 'Privada' },
  { id: 'Outra', rotulo: 'Outra', curto: 'Outra' },
];

export const OPCOES_NIVEL_ENSINO = [
  { id: 'Infantil', rotulo: 'Educação Infantil', curto: 'Infantil' },
  { id: 'Fundamental', rotulo: 'Ensino Fundamental', curto: 'Fundamental' },
  { id: 'Médio', rotulo: 'Ensino Médio', curto: 'Médio' },
  { id: 'Técnico', rotulo: 'Ensino Técnico', curto: 'Técnico' },
  { id: 'Superior', rotulo: 'Ensino Superior', curto: 'Superior' },
];

// Alias para compatibilidade semântica
export const OPCOES_ESFERA = OPCOES_REDE;

export default function SeletorNivel({
  label,
  valor,
  valores,
  onChange,
  opcoes,
  multi = false,
  placeholder = 'Selecione uma opção',
  required = false,
}) {
  const [aberto, setAberto] = useState(false);
  const containerRef = useRef(null);

  // Lista padrão conforme o modo se opções não forem fornecidas explicitamente
  const listaOpcoes = opcoes || (multi ? OPCOES_NIVEL_ENSINO : OPCOES_REDE);

  // Normalização para escolha única
  const valorAtual = valor !== undefined
    ? valor
    : (Array.isArray(valores) ? valores[0] || '' : valores || '');

  // Normalização para múltipla escolha
  const listaValores = Array.isArray(valores)
    ? valores
    : valores === 'Ambos'
      ? ['Fundamental', 'Médio']
      : valores
        ? [valores]
        : valor
          ? [valor]
          : [];

  useEffect(() => {
    function handleClickFora(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setAberto(false);
      }
    }

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setAberto(false);
      }
    }

    if (aberto) {
      document.addEventListener('pointerdown', handleClickFora);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('pointerdown', handleClickFora);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [aberto]);

  function handleSelecionarUnico(id) {
    onChange?.(id);
    setAberto(false);
  }

  function toggleOpcao(id) {
    const existe = listaValores.includes(id);
    let novos;
    if (existe) {
      novos = listaValores.filter(item => item !== id);
    } else {
      novos = [...listaValores, id];
    }
    onChange?.(novos);
  }

  // Monta o texto de exibição no botão gatilho
  let textoBotao = '';
  const textoVazio = placeholder || 'Selecione uma opção';

  if (multi) {
    if (listaValores.length === 1) {
      const opcao = listaOpcoes.find(o => o.id === listaValores[0]);
      textoBotao = opcao ? opcao.rotulo : listaValores[0];
    } else if (listaValores.length > 1) {
      const selecionados = listaOpcoes.filter(o => listaValores.includes(o.id));
      textoBotao = selecionados.map(o => o.curto || o.rotulo).join(', ');
    } else {
      textoBotao = textoVazio;
    }
  } else {
    if (valorAtual) {
      const opcao = listaOpcoes.find(o => o.id === valorAtual);
      textoBotao = opcao ? opcao.rotulo : valorAtual;
    } else {
      textoBotao = textoVazio;
    }
  }

  const temValor = multi ? listaValores.length > 0 : Boolean(valorAtual);

  return (
    <div className={styles.wrapper} ref={containerRef}>
      {label && <label className="label-secao">{label}</label>}

      <button
        type="button"
        className={`${styles.gatilho} ${aberto ? styles.gatilhoAberto : ''}`}
        onClick={() => setAberto(prev => !prev)}
        aria-haspopup="listbox"
        aria-expanded={aberto}
        title={textoBotao || undefined}
      >
        <span className={temValor ? styles.valorTexto : styles.placeholder}>
          {textoBotao || '\u00A0'}
        </span>

        <div className={styles.gatilhoDireita}>
          {multi && listaValores.length > 1 && (
            <span className={styles.badgeQtd}>{listaValores.length}</span>
          )}
          <IconChevronDown
            size={18}
            className={`${styles.iconeSeta} ${aberto ? styles.iconeSetaGiro : ''}`}
          />
        </div>

        {/* Input invisível para acionar a validação HTML5 do navegador */}
        {required && (
          <input
            type="text"
            required={required}
            value={temValor ? 'selecionado' : ''}
            onChange={() => {}}
            tabIndex={-1}
            style={{
              opacity: 0,
              width: 0,
              height: 0,
              position: 'absolute',
              bottom: 0,
              left: '50%',
              pointerEvents: 'none'
            }}
          />
        )}
      </button>

      {aberto && (
        <div
          className={styles.painelOpcoes}
          role="listbox"
          aria-multiselectable={multi}
        >
          <div className={styles.cabecalhoPainel}>
            <span>{multi ? 'Selecione uma ou mais opções' : 'Selecione uma opção'}</span>
          </div>

          <div className={styles.lista}>
            {listaOpcoes.map(opcao => {
              const selecionado = multi
                ? listaValores.includes(opcao.id)
                : valorAtual === opcao.id;

              return (
                <div
                  key={opcao.id}
                  className={`${styles.itemOpcao} ${selecionado ? styles.itemSelecionado : ''}`}
                  onClick={() => {
                    if (multi) {
                      toggleOpcao(opcao.id);
                    } else {
                      handleSelecionarUnico(opcao.id);
                    }
                  }}
                  role="option"
                  aria-selected={selecionado}
                  tabIndex={0}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      if (multi) {
                        toggleOpcao(opcao.id);
                      } else {
                        handleSelecionarUnico(opcao.id);
                      }
                    }
                  }}
                >
                  {multi ? (
                    <input
                      type="checkbox"
                      checked={selecionado}
                      onChange={() => toggleOpcao(opcao.id)}
                      className={styles.checkbox}
                      onClick={e => e.stopPropagation()}
                      tabIndex={-1}
                    />
                  ) : (
                    <div className={`${styles.radio} ${selecionado ? styles.radioSelecionado : ''}`}>
                      {selecionado && <div className={styles.radioDot} />}
                    </div>
                  )}

                  <span className={styles.rotuloOpcao}>{opcao.rotulo}</span>
                  {selecionado && <IconCheck size={16} className={styles.checkIcon} />}
                </div>
              );
            })}
          </div>

          {multi && (
            <div className={styles.rodapePainel}>
              <button
                type="button"
                className={styles.btnConcluir}
                onClick={() => setAberto(false)}
              >
                Concluir seleção
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
