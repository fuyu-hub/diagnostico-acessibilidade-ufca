import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconVolume, IconVolumeOff, IconCheck, IconX, IconMinus, IconInfoCircle,
  IconShieldCheck, IconDownload, IconUpload, IconPalette, IconChevronRight,
  IconListCheck, IconPlayerPlayFilled, IconPlayerStopFilled, IconDeviceMobile, IconRefresh,
} from '@tabler/icons-react';
import Topbar from '../componentes/Topbar';
import ModalConflito from '../componentes/ModalConflito';
import { lerArquivoImportacao } from '../dados/exportacao';
import { useVistoria } from '../contexto/VistoriaContext';
import { useNotificacao } from '../contexto/NotificacaoContext';
import {
  isSomHabilitado,
  setSomHabilitado,
  tocarSomConforme,
  tocarSomNaoConforme,
  tocarSomNaoAplica
} from '../utilitarios/som';
import {
  PREFERENCIAS_TEMA,
  obterPreferenciaTema,
  definirPreferenciaTema,
  obterAltoContraste,
  definirAltoContraste,
} from '../utilitarios/tema';
import {
  usePreferencias,
  definirPreferencia,
  TAMANHOS_TEXTO,
  VELOCIDADES_VOZ,
} from '../utilitarios/preferencias';
import { useLeituraVoz, vozSuportada, vozPortugues } from '../utilitarios/leituraVoz';
import { useAplicativo, instalarAplicativo, atualizarAgora, ehIOS } from '../utilitarios/aplicativo';
import { VERSAO_APP } from '../utilitarios/versaoApp';
import styles from './Ajustes.module.css';

/** Interruptor (liga/desliga) com rótulo e descrição ligados ao controle. */
function Interruptor({ id, titulo, descricao, ativo, onMudar }) {
  return (
    <div className={styles.linhaAjuste}>
      <div className={styles.secaoInfo}>
        <span id={`${id}-rotulo`} className={styles.rotuloOpcao}>{titulo}</span>
        {descricao && <p id={`${id}-desc`} className={styles.secaoDesc}>{descricao}</p>}
      </div>
      <label className={styles.switchLabel}>
        <input
          type="checkbox"
          role="switch"
          className={styles.switchInput}
          checked={ativo}
          onChange={e => onMudar(e.target.checked)}
          aria-labelledby={`${id}-rotulo`}
          aria-describedby={descricao ? `${id}-desc` : undefined}
        />
        <span className={styles.slider} />
      </label>
    </div>
  );
}

/** Escolha única em botões (rádios nativos), como o tema. */
function GrupoOpcoes({ nome, titulo, descricao, opcoes, valor, onMudar }) {
  return (
    <div className={styles.blocoGrupo}>
      <fieldset className={styles.grupo}>
        <legend className={styles.rotuloOpcao}>{titulo}</legend>
        {descricao && <p className={styles.secaoDesc}>{descricao}</p>}
        <div className={styles.opcoesTema}>
          {opcoes.map(opcao => (
            <label key={opcao.valor} className={`chip ${styles.opcaoTema} ${valor === opcao.valor ? 'ativo' : ''}`}>
              <input
                type="radio"
                name={nome}
                className="sr-only"
                value={opcao.valor}
                checked={valor === opcao.valor}
                onChange={() => onMudar(opcao.valor)}
              />
              {opcao.rotulo}
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

export default function Ajustes() {
  const [somAtivo, setSomAtivo] = useState(isSomHabilitado);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const [tema, setTema] = useState(obterPreferenciaTema);
  const [altoContraste, setAltoContraste] = useState(obterAltoContraste);
  const prefs = usePreferencias();
  const app = useAplicativo();
  const voz = useLeituraVoz();
  const [nomeVoz, setNomeVoz] = useState(() => vozPortugues()?.name || null);

  // As vozes do aparelho podem chegar depois da abertura da tela
  useEffect(() => {
    if (!vozSuportada()) return;
    const atualizar = () => setNomeVoz(vozPortugues()?.name || null);
    window.speechSynthesis.addEventListener?.('voiceschanged', atualizar);
    // Em alguns navegadores a lista já chegou e o evento não se repete
    const t = setTimeout(atualizar, 300);
    return () => {
      clearTimeout(t);
      window.speechSynthesis.removeEventListener?.('voiceschanged', atualizar);
    };
  }, []);

  function testarVoz() {
    if (voz.ativo) {
      voz.parar();
      return;
    }
    voz.iniciar([{
      chave: 'teste',
      rotulo: 'Teste',
      texto: 'Esta é a leitura em voz alta do diagnóstico de acessibilidade. A largura livre mínima da calçada é de um metro e vinte.',
    }]);
  }

  const {
    vistorias,
    exportarTodasVistorias,
    importarConteudoJson,
    aplicarResolucaoConflito,
    armazenamentoPersistido,
    solicitarPersistenciaManual,
    ultimoBackup,
    registrarBackupManual,
  } = useVistoria();
  const { mostrarToast, mostrarAlerta } = useNotificacao();

  const [conflitosFila, setConflitosFila] = useState([]);
  const [indiceConflito, setIndiceConflito] = useState(0);

  async function baixarBackup() {
    try {
      if (vistorias && vistorias.length > 0) {
        const res = await exportarTodasVistorias();
        if (!res?.cancelado) mostrarToast('Backup salvo com sucesso!', 'sucesso');
        return;
      }
      const raw = localStorage.getItem('nbr9050_vistorias');
      if (!raw || raw === '[]') {
        mostrarToast('Nenhuma vistoria encontrada para backup.', 'info');
        return;
      }
      const blob = new Blob([raw], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dataStr = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `backup_vistorias_${dataStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      registrarBackupManual?.();
      mostrarToast('Backup salvo com sucesso!', 'sucesso');
    } catch (err) {
      mostrarAlerta('Erro no Backup', 'Erro ao gerar backup: ' + err.message);
    }
  }

  async function handleImportarArquivo(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const texto = await lerArquivoImportacao(file);
      const res = await importarConteudoJson(texto, (conflitos) => {
        setConflitosFila(conflitos);
        setIndiceConflito(0);
      });

      if (!conflitosFila.length) {
        mostrarToast(`Importação concluída com sucesso! (${res?.importadasDiretas || 1} vistoria(s) importada(s))`, 'sucesso');
      }
    } catch (err) {
      mostrarAlerta('Falha ao Importar', 'Não foi possível importar o arquivo: ' + err.message);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleResolverConflito(estrategia, aplicarTodos) {
    if (!conflitosFila.length) return;

    try {
      if (aplicarTodos) {
        for (let i = indiceConflito; i < conflitosFila.length; i++) {
          const item = conflitosFila[i];
          await aplicarResolucaoConflito(item.local, item.remota, estrategia);
        }
        setConflitosFila([]);
        mostrarToast('Todos os conflitos resolvidos e vistorias salvas!', 'sucesso');
      } else {
        const item = conflitosFila[indiceConflito];
        await aplicarResolucaoConflito(item.local, item.remota, estrategia);

        if (indiceConflito + 1 < conflitosFila.length) {
          setIndiceConflito(prev => prev + 1);
        } else {
          setConflitosFila([]);
          mostrarToast('Conflito resolvido com sucesso!', 'sucesso');
        }
      }
    } catch (err) {
      mostrarAlerta('Erro de Resolução', 'Erro ao resolver conflito: ' + err.message);
    }
  }

  function handleToggleSom(e) {
    const novo = e.target.checked;
    setSomAtivo(novo);
    setSomHabilitado(novo);
    if (novo) {
      tocarSomConforme();
    }
  }

  return (
    <div className="app-shell">
      <Topbar titulo="Ajustes" voltar="/" />

      <main className="tela-body" style={{ padding: '24px 20px 48px' }}>
        <div className={styles.container}>
          {/* Card de Aparência */}
          <section className={styles.secaoCard}>
            <div className={styles.secaoInfo}>
              <h2 className={styles.secaoTitulo}>
                <IconPalette size={20} color="var(--accent)" aria-hidden="true" />
                <span>Aparência e leitura</span>
              </h2>
            </div>

            <GrupoOpcoes
              nome="tema"
              titulo="Tema"
              descricao="No modo automático, o app acompanha o tema do sistema."
              opcoes={PREFERENCIAS_TEMA}
              valor={tema}
              onMudar={v => {
                setTema(v);
                definirPreferenciaTema(v);
              }}
            />

            <Interruptor
              id="alto-contraste"
              titulo="Alto contraste"
              descricao="Reforça bordas e textos, útil sob luz forte."
              ativo={altoContraste}
              onMudar={v => {
                setAltoContraste(v);
                definirAltoContraste(v);
              }}
            />

            <GrupoOpcoes
              nome="tamanho-texto"
              titulo="Tamanho do texto"
              descricao="No Máximo, a tela de perguntas passa a rolar para nada ficar cortado."
              opcoes={TAMANHOS_TEXTO}
              valor={prefs.tamanhoTexto}
              onMudar={v => definirPreferencia('tamanhoTexto', Number(v))}
            />

            <Interruptor
              id="reduzir-movimento"
              titulo="Reduzir movimento"
              descricao="Desliga animações e transições."
              ativo={prefs.reduzirMovimento}
              onMudar={v => definirPreferencia('reduzirMovimento', v)}
            />
          </section>

          {/* Card do Checklist */}
          <section className={styles.secaoCard}>
            <div className={styles.secaoInfo}>
              <h2 className={styles.secaoTitulo}>
                <IconListCheck size={20} color="var(--accent)" aria-hidden="true" />
                <span>Checklist</span>
              </h2>
            </div>
            <Interruptor
              id="avancar"
              titulo="Avançar ao responder"
              descricao="Vai ao próximo item depois de Conforme ou Não se aplica, com a opção Desfazer. Em Não conforme, abre a observação e as fotos."
              ativo={prefs.avancarAoResponder}
              onMudar={v => definirPreferencia('avancarAoResponder', v)}
            />
            <Interruptor
              id="vibracao"
              titulo="Vibração"
              descricao="Vibra levemente ao responder (celular)."
              ativo={prefs.vibracao}
              onMudar={v => definirPreferencia('vibracao', v)}
            />
          </section>

          {/* Card de Leitura em voz alta */}
          <section className={styles.secaoCard}>
            <div className={styles.secaoInfo}>
              <h2 className={styles.secaoTitulo}>
                <IconVolume size={20} color="var(--accent)" aria-hidden="true" />
                <span>Leitura em voz alta</span>
              </h2>
              <p className={styles.secaoDesc}>
                O botão Ouvir lê a pergunta, a descrição da ilustração, como medir e a referência, com a voz do próprio aparelho.
              </p>
            </div>
            <Interruptor
              id="ler-ao-abrir"
              titulo="Ler o item ao abrir"
              descricao="Começa a leitura sempre que um item é aberto."
              ativo={prefs.lerAoAbrir}
              onMudar={v => definirPreferencia('lerAoAbrir', v)}
            />
            <GrupoOpcoes
              nome="velocidade-voz"
              titulo="Velocidade"
              opcoes={VELOCIDADES_VOZ}
              valor={prefs.velocidadeVoz}
              onMudar={v => definirPreferencia('velocidadeVoz', Number(v))}
            />
            <div className={styles.linhaAjuste}>
              <div className={styles.secaoInfo}>
                <span className={styles.rotuloOpcao}>Voz</span>
                <p className={styles.secaoDesc} aria-live="polite">
                  {!vozSuportada()
                    ? 'Este navegador não oferece leitura em voz alta.'
                    : nomeVoz || 'Sem voz em português instalada: será usada a voz padrão do aparelho.'}
                </p>
              </div>
              {vozSuportada() && (
                <button type="button" className={styles.btnSecundario} onClick={testarVoz} aria-pressed={voz.ativo}>
                  {voz.ativo ? <IconPlayerStopFilled size={18} aria-hidden="true" /> : <IconPlayerPlayFilled size={18} aria-hidden="true" />}
                  {voz.ativo ? 'Parar' : 'Testar'}
                </button>
              )}
            </div>
          </section>

          {/* Card de Efeitos Sonoros */}
          <section className={styles.secaoCard}>
            <div className={styles.secaoHeader}>
              <div className={styles.secaoInfo}>
                <h2 className={styles.secaoTitulo}>
                  {somAtivo ? (
                    <IconVolume size={20} color="var(--accent)" />
                  ) : (
                    <IconVolumeOff size={20} color="var(--text-muted)" />
                  )}
                  <span>Efeitos Sonoros</span>
                </h2>
                <p className={styles.secaoDesc}>
                  Sons interativos com retorno auditivo imediato ao selecionar Conforme, Não Conforme e Não se Aplica.
                </p>
              </div>

              <label className={styles.switchLabel}>
                <input
                  type="checkbox"
                  role="switch"
                  className={styles.switchInput}
                  checked={somAtivo}
                  onChange={handleToggleSom}
                  aria-label="Efeitos sonoros"
                />
                <span className={styles.slider} />
              </label>
            </div>

            {/* Painel de Demonstração / Teste dos 3 sons */}
            <div className={styles.blocoTesteSons}>
              <p className={styles.tituloTeste}>
                {somAtivo ? 'Toque nos botões para testar cada som:' : 'Ative o som acima para testar:'}
              </p>

              <div className={styles.gradeTestes}>
                <button
                  type="button"
                  className={`${styles.btnTeste} ${styles.btnTesteConforme}`}
                  onClick={tocarSomConforme}
                  disabled={!somAtivo}
                  title="Testar som afirmativo (Kahoot)"
                >
                  <IconCheck size={18} /> Conforme
                </button>

                <button
                  type="button"
                  className={`${styles.btnTeste} ${styles.btnTesteNaoConforme}`}
                  onClick={tocarSomNaoConforme}
                  disabled={!somAtivo}
                  title="Testar som negativo"
                >
                  <IconX size={18} /> Não conforme
                </button>

                <button
                  type="button"
                  className={`${styles.btnTeste} ${styles.btnTesteNaoAplica}`}
                  onClick={tocarSomNaoAplica}
                  disabled={!somAtivo}
                  title="Testar som neutro"
                >
                  <IconMinus size={18} /> Não se aplica
                </button>
              </div>
            </div>
          </section>

          {/* Card do aplicativo: instalar e atualizar, sem avisos que interrompem */}
          <section className={styles.secaoCard} aria-labelledby="titulo-aplicativo">
            <div className={styles.secaoHeader}>
              <div className={styles.secaoInfo}>
                <h2 id="titulo-aplicativo" className={styles.secaoTitulo}>
                  <IconDeviceMobile size={20} color="var(--accent)" aria-hidden="true" />
                  <span>Aplicativo</span>
                </h2>
                <p className={styles.secaoDesc}>
                  Versão {VERSAO_APP}. {app.instalado
                    ? 'Instalado neste aparelho: abre pelo ícone e funciona sem internet.'
                    : 'Instale para abrir pelo ícone, em tela cheia, e usar sem internet.'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {app.versaoPronta && (
                <button type="button" className={styles.btnBackup} onClick={() => atualizarAgora()}>
                  <IconRefresh size={20} aria-hidden="true" />
                  <span>Nova versão pronta · Atualizar agora</span>
                </button>
              )}
              {!app.instalado && app.podeInstalar && (
                <button
                  type="button"
                  className={styles.btnBackup}
                  onClick={async () => {
                    if (await instalarAplicativo()) mostrarToast('App instalado. Ele aparece junto dos outros apps.', 'sucesso');
                  }}
                >
                  <IconDownload size={20} aria-hidden="true" />
                  <span>Instalar o app</span>
                </button>
              )}
              {!app.instalado && !app.podeInstalar && (
                <p className={styles.secaoDesc}>
                  {ehIOS()
                    ? 'No iPhone ou iPad: toque em Compartilhar e depois em "Adicionar à Tela de Início".'
                    : 'Para instalar, use a opção "Instalar app" ou "Adicionar à tela inicial" no menu do navegador.'}
                </p>
              )}
              {!app.versaoPronta && (
                <p className={styles.secaoDesc}>
                  Versões novas são baixadas sozinhas e aplicadas quando você sai das perguntas. Nada é apagado.
                </p>
              )}
            </div>
          </section>

          {/* Card de Backup */}
          <section className={styles.secaoCard}>
            <div className={styles.secaoHeader}>
              <div className={styles.secaoInfo}>
                <h2 className={styles.secaoTitulo}>
                  <IconShieldCheck size={20} color="var(--accent)" />
                  <span>Backup das Vistorias</span>
                </h2>
                <p className={styles.secaoDesc}>
                  Salve uma cópia das vistorias no seu dispositivo ou restaure um backup anterior.
                </p>
              </div>
            </div>

            <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                type="button"
                className={styles.btnBackup}
                onClick={baixarBackup}
              >
                <IconDownload size={20} />
                <span>Fazer Backup</span>
              </button>

              <button
                type="button"
                className={styles.btnBackup}
                onClick={() => fileInputRef.current?.click()}
              >
                <IconUpload size={20} />
                <span>Restaurar Backup</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                style={{ display: 'none' }}
                onChange={handleImportarArquivo}
              />

              <div style={{ marginTop: 8, padding: '12px 14px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                <div style={{ marginBottom: 6 }}>
                  <strong style={{ color: 'var(--text-strong)' }}>Último backup: </strong>
                  {ultimoBackup 
                    ? new Date(ultimoBackup).toLocaleString('pt-BR') 
                    : 'Nenhum backup realizado ainda (recomendado)'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span>
                    <strong style={{ color: 'var(--text-strong)' }}>Armazenamento: </strong>
                    {armazenamentoPersistido ? '✓ Persistente (protegido)' : 'Padrão do navegador'}
                  </span>
                  {!armazenamentoPersistido && (
                    <button
                      type="button"
                      style={{
                        background: 'transparent',
                        border: '1px solid var(--border)',
                        color: 'var(--accent)',
                        padding: '3px 8px',
                        borderRadius: 6,
                        fontSize: '0.76rem',
                        cursor: 'pointer'
                      }}
                      onClick={async () => {
                        const ok = await solicitarPersistenciaManual?.();
                        if (ok) mostrarToast('Armazenamento protegido com sucesso!', 'sucesso');
                        else mostrarToast('Navegador manteve política padrão de limpeza.', 'info');
                      }}
                    >
                      Proteger dados
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>

          <button type="button" className={styles.linhaSobre} onClick={() => navigate('/sobre')}>
            <IconInfoCircle size={20} aria-hidden="true" />
            <span>Sobre o projeto e a equipe</span>
            <IconChevronRight size={18} aria-hidden="true" />
          </button>
        </div>
      </main>

      <ModalConflito
        aberto={conflitosFila.length > 0 && indiceConflito < conflitosFila.length}
        conflitoAtual={conflitosFila[indiceConflito]}
        indiceConflito={indiceConflito + 1}
        totalConflitos={conflitosFila.length}
        onResolver={handleResolverConflito}
        onCancelarLote={() => setConflitosFila([])}
      />
    </div>
  );
}
