import { useState, useRef, useEffect } from 'react';
import { IconChevronDown, IconCheck } from '@tabler/icons-react';
import styles from './SeletorNivelEnsino.module.css';

export const OPCOES_NIVEL_ENSINO = [
  { id: 'Infantil', rotulo: 'Educação Infantil', curto: 'Infantil' },
  { id: 'Fundamental', rotulo: 'Ensino Fundamental', curto: 'Fundamental' },
  { id: 'Médio', rotulo: 'Ensino Médio', curto: 'Médio' },
  { id: 'Técnico', rotulo: 'Ensino Técnico', curto: 'Técnico' },
  { id: 'Superior', rotulo: 'Ensino Superior', curto: 'Superior' },
];

export default function SeletorNivelEnsino({ valores = [], onChange }) {
  const [aberto, setAberto] = useState(false);
  const containerRef = useRef(null);

  // Fecha o dropdown se o usuário clicar fora dele
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

  // Garante que valores seja sempre um array
  const listaValores = Array.isArray(valores)
    ? valores
    : valores === 'Ambos'
      ? ['Fundamental', 'Médio']
      : valores
        ? [valores]
        : [];

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
  let textoBotao = 'Selecione o nível de ensino...';
  if (listaValores.length === 1) {
    const opcao = OPCOES_NIVEL_ENSINO.find(o => o.id === listaValores[0]);
    textoBotao = opcao ? opcao.rotulo : listaValores[0];
  } else if (listaValores.length > 1) {
    const selecionados = OPCOES_NIVEL_ENSINO.filter(o => listaValores.includes(o.id));
    textoBotao = selecionados.map(o => o.curto).join(', ');
  }

  return (
    <div className={styles.wrapper} ref={containerRef}>
      <label className="label-secao">Nível de Ensino</label>

      <button
        type="button"
        className={`${styles.gatilho} ${aberto ? styles.gatilhoAberto : ''}`}
        onClick={() => setAberto(prev => !prev)}
        aria-haspopup="listbox"
        aria-expanded={aberto}
        title={textoBotao}
      >
        <span className={listaValores.length === 0 ? styles.placeholder : styles.valorTexto}>
          {textoBotao}
        </span>

        <div className={styles.gatilhoDireita}>
          {listaValores.length > 1 && (
            <span className={styles.badgeQtd}>{listaValores.length}</span>
          )}
          <IconChevronDown
            size={18}
            className={`${styles.iconeSeta} ${aberto ? styles.iconeSetaGiro : ''}`}
          />
        </div>
      </button>

      {aberto && (
        <div className={styles.painelOpcoes} role="listbox" aria-multiselectable="true">
          <div className={styles.cabecalhoPainel}>
            <span>Selecione uma ou mais opções</span>
          </div>

          <div className={styles.lista}>
            {OPCOES_NIVEL_ENSINO.map(opcao => {
              const selecionado = listaValores.includes(opcao.id);
              return (
                <label
                  key={opcao.id}
                  className={`${styles.itemOpcao} ${selecionado ? styles.itemSelecionado : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={selecionado}
                    onChange={() => toggleOpcao(opcao.id)}
                    className={styles.checkbox}
                  />
                  <span className={styles.rotuloOpcao}>{opcao.rotulo}</span>
                  {selecionado && <IconCheck size={16} className={styles.checkIcon} />}
                </label>
              );
            })}
          </div>

          <div className={styles.rodapePainel}>
            <button
              type="button"
              className={styles.btnConcluir}
              onClick={() => setAberto(false)}
            >
              Concluir seleção
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
