import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconCheck, IconUserPlus, IconTrash, IconBuilding, IconClipboardCheck,
  IconChevronLeft, IconChevronRight, IconAlertCircle,
} from '@tabler/icons-react';
import { useVistoria } from '../contexto/VistoriaContext';
import Topbar from '../componentes/Topbar';
import SeletorNivel, { OPCOES_REDE, OPCOES_NIVEL_ENSINO } from '../componentes/SeletorNivel';
import styles from './NovaVistoria.module.css';

const agoraHora = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/** Campo de texto com rótulo, ajuda e erro ligados ao input. */
function Campo({ id, rotulo, obrigatorio, ajuda, erro, className = '', ...props }) {
  const descritores = [ajuda && `${id}-ajuda`, erro && `${id}-erro`].filter(Boolean).join(' ') || undefined;
  return (
    <div className={`${styles.campo} ${className}`}>
      <label htmlFor={id}>
        {rotulo}
        {obrigatorio && <><span className={styles.obrigatorio} aria-hidden="true"> *</span><span className="sr-only"> (obrigatório)</span></>}
      </label>
      <input
        id={id}
        aria-required={obrigatorio || undefined}
        aria-invalid={erro ? true : undefined}
        aria-describedby={descritores}
        {...props}
      />
      {ajuda && !erro && <span id={`${id}-ajuda`} className={styles.ajuda}>{ajuda}</span>}
      {erro && <span id={`${id}-erro`} className={styles.erro}><IconAlertCircle size={16} aria-hidden="true" />{erro}</span>}
    </div>
  );
}

export default function NovaVistoria() {
  const navigate = useNavigate();
  const { criarVistoria } = useVistoria();
  const [etapa, setEtapa] = useState(1);
  const [erros, setErros] = useState({});
  const resumoErrosRef = useRef(null);
  const tituloEtapaRef = useRef(null);

  const [form, setForm] = useState({
    nome: '',
    endereco: '',
    bairro: '',
    cidade: '',
    rede: '',
    nivelEnsino: [],
    numAlunos: '',
    numPavimentos: '',
    data: new Date().toISOString().split('T')[0],
    dataTermino: '',
    horarioInicio: agoraHora(),
    horarioTermino: '',
    avaliadores: [''],
  });

  // Ao trocar de etapa, o foco vai para o título dela; com erros, para o resumo
  useEffect(() => {
    if (Object.keys(erros).length) resumoErrosRef.current?.focus();
  }, [erros]);

  function set(campo, valor) {
    setForm(prev => ({ ...prev, [campo]: valor }));
    if (erros[campo]) setErros(prev => { const n = { ...prev }; delete n[campo]; return n; });
  }

  function setAvaliador(idx, valor) {
    const lista = [...form.avaliadores];
    lista[idx] = valor;
    setForm(prev => ({ ...prev, avaliadores: lista }));
    if (idx === 0 && erros.avaliador) setErros(prev => { const n = { ...prev }; delete n.avaliador; return n; });
  }

  function adicionarAvaliador() {
    setForm(prev => ({ ...prev, avaliadores: [...prev.avaliadores, ''] }));
    setTimeout(() => document.getElementById(`nova-avaliador-${form.avaliadores.length}`)?.focus(), 0);
  }

  function removerAvaliador(idx) {
    if (form.avaliadores.length <= 1) {
      setForm(prev => ({ ...prev, avaliadores: [''] }));
      return;
    }
    setForm(prev => ({ ...prev, avaliadores: prev.avaliadores.filter((_, i) => i !== idx) }));
  }

  function validarEtapa1() {
    const e = {};
    if (!form.nome.trim()) e.nome = 'Informe o nome da escola ou instituição.';
    if (!form.rede) e.rede = 'Escolha a rede de ensino.';
    if (!form.nivelEnsino?.length) e.nivelEnsino = 'Escolha ao menos um nível de ensino.';
    return e;
  }

  function validarEtapa2() {
    const e = {};
    if (!form.avaliadores[0]?.trim()) e.avaliador = 'Informe ao menos um avaliador.';
    if (!form.data) e.data = 'Informe a data da vistoria.';
    return e;
  }

  function avancar(e) {
    e.preventDefault();
    const e1 = validarEtapa1();
    setErros(e1);
    if (Object.keys(e1).length) return;
    setEtapa(2);
    window.scrollTo(0, 0);
    setTimeout(() => tituloEtapaRef.current?.focus(), 0);
  }

  function voltar() {
    setErros({});
    setEtapa(1);
    window.scrollTo(0, 0);
    setTimeout(() => tituloEtapaRef.current?.focus(), 0);
  }

  function iniciar(e) {
    e.preventDefault();
    const e2 = validarEtapa2();
    setErros(e2);
    if (Object.keys(e2).length) return;

    const id = criarVistoria({
      ...form,
      avaliadores: form.avaliadores.filter(a => a.trim() !== ''),
    });
    navigate(`/vistoria/${id}`);
  }

  const listaErros = Object.values(erros);

  return (
    <div className="app-shell">
      <Topbar eyebrow={`Etapa ${etapa} de 2`} titulo="Nova Vistoria" voltar={etapa === 2 ? voltar : '/'} />

      <main className="tela-body" style={{ padding: '20px 16px 48px' }}>
        <div className={styles.container}>
          <ol className={styles.etapas} aria-label="Etapas do cadastro">
            <li aria-current={etapa === 1 ? 'step' : undefined} className={etapa > 1 ? styles.etapaFeita : ''}>
              <strong>{etapa > 1 ? <><IconCheck size={14} aria-hidden="true" /> Concluída</> : 'Etapa 1'}</strong>
              Instituição
            </li>
            <li aria-current={etapa === 2 ? 'step' : undefined}>
              <strong>Etapa 2</strong>
              Equipe e data
            </li>
          </ol>

          <h2 ref={tituloEtapaRef} tabIndex={-1} className={styles.tituloEtapa}>
            {etapa === 1 ? 'Ficha da Instituição' : 'Equipe e data da vistoria'}
          </h2>

          {listaErros.length > 0 && (
            <div ref={resumoErrosRef} tabIndex={-1} role="alert" className={styles.resumoErros}>
              <IconAlertCircle size={20} aria-hidden="true" />
              <div>
                <strong>{listaErros.length === 1 ? 'Corrija 1 campo:' : `Corrija ${listaErros.length} campos:`}</strong>
                <ul>{listaErros.map(m => <li key={m}>{m}</li>)}</ul>
              </div>
            </div>
          )}

          {etapa === 1 ? (
            <form onSubmit={avancar} noValidate className={styles.formulario}>
              <section className={styles.bloco} aria-labelledby="bloco-identificacao">
                <h3 id="bloco-identificacao" className={styles.tituloBloco}>
                  <IconBuilding size={20} aria-hidden="true" /> Identificação
                </h3>
                <Campo
                  id="nova-nome"
                  rotulo="Nome da escola / instituição"
                  obrigatorio
                  ajuda="Como aparecerá nos relatórios."
                  erro={erros.nome}
                  type="text"
                  autoComplete="organization"
                  placeholder="Ex.: Escola Municipal Padre Cícero"
                  value={form.nome}
                  onChange={e => set('nome', e.target.value)}
                />
                <Campo
                  id="nova-endereco"
                  rotulo="Endereço"
                  type="text"
                  autoComplete="street-address"
                  placeholder="Rua, número"
                  value={form.endereco}
                  onChange={e => set('endereco', e.target.value)}
                />
                <div className={styles.linha2}>
                  <Campo
                    id="nova-bairro"
                    rotulo="Bairro"
                    type="text"
                    value={form.bairro}
                    onChange={e => set('bairro', e.target.value)}
                  />
                  <Campo
                    id="nova-cidade"
                    rotulo="Cidade / UF"
                    type="text"
                    autoComplete="address-level2"
                    placeholder="Ex.: Crato, CE"
                    value={form.cidade}
                    onChange={e => set('cidade', e.target.value)}
                  />
                </div>
              </section>

              <section className={styles.bloco} aria-labelledby="bloco-perfil">
                <h3 id="bloco-perfil" className={styles.tituloBloco}>Perfil da escola</h3>
                {/* Os dois seletores lado a lado, também no celular */}
                <div className={styles.seletores}>
                  <SeletorNivel
                    label="Rede de ensino *"
                    valor={form.rede}
                    onChange={val => set('rede', val)}
                    opcoes={OPCOES_REDE}
                    multi={false}
                    required
                    placeholder="Selecione"
                    erro={erros.rede}
                  />
                  <SeletorNivel
                    label="Nível de ensino *"
                    valores={form.nivelEnsino}
                    onChange={novos => set('nivelEnsino', novos)}
                    opcoes={OPCOES_NIVEL_ENSINO}
                    multi={true}
                    required
                    placeholder="Selecione"
                    erro={erros.nivelEnsino}
                  />
                </div>
                <div className={styles.linha3}>
                  <Campo id="nova-alunos" rotulo="Nº de alunos" type="number" inputMode="numeric" min="0" placeholder="Aprox." value={form.numAlunos} onChange={e => set('numAlunos', e.target.value)} />
                  <Campo id="nova-pavimentos" rotulo="Pavimentos" type="number" inputMode="numeric" min="1" value={form.numPavimentos} onChange={e => set('numPavimentos', e.target.value)} />
                </div>
              </section>

              <p className={styles.ajuda}><span className={styles.obrigatorio} aria-hidden="true">*</span> Campo obrigatório</p>

              <button type="submit" className={`btn-nav primario ${styles.botaoPrincipal}`}>
                Próximo: equipe e data <IconChevronRight size={20} aria-hidden="true" />
              </button>
            </form>
          ) : (
            <form onSubmit={iniciar} noValidate className={styles.formulario}>
              <section className={styles.bloco} aria-labelledby="bloco-datas">
                <h3 id="bloco-datas" className={styles.tituloBloco}>
                  <IconClipboardCheck size={20} aria-hidden="true" /> Data e horário
                </h3>
                <div className={styles.linha2}>
                  <Campo id="nova-data" rotulo="Data de início" obrigatorio erro={erros.data} type="date" value={form.data} onChange={e => set('data', e.target.value)} />
                  <Campo id="nova-hora-inicio" rotulo="Horário de início" ajuda="Preenchido com a hora atual." type="time" value={form.horarioInicio} onChange={e => set('horarioInicio', e.target.value)} />
                  <Campo id="nova-data-termino" rotulo="Data de término" type="date" value={form.dataTermino} onChange={e => set('dataTermino', e.target.value)} />
                  <Campo id="nova-hora-termino" rotulo="Horário de término" type="time" value={form.horarioTermino} onChange={e => set('horarioTermino', e.target.value)} />
                </div>
                <p className={styles.ajuda}>O término também pode ser registrado depois, no Painel da vistoria.</p>
              </section>

              <section className={styles.bloco} aria-labelledby="bloco-equipe">
                <h3 id="bloco-equipe" className={styles.tituloBloco}>Equipe de avaliadores</h3>
                {form.avaliadores.map((a, i) => (
                  <div key={i} className={styles.linhaAvaliador}>
                    <Campo
                      id={`nova-avaliador-${i}`}
                      className={styles.campoAvaliador}
                      rotulo={`Avaliador ${i + 1}`}
                      obrigatorio={i === 0}
                      erro={i === 0 ? erros.avaliador : undefined}
                      type="text"
                      autoComplete="name"
                      placeholder={`Nome do avaliador ${i + 1}`}
                      value={a}
                      onChange={e => setAvaliador(i, e.target.value)}
                    />
                    {form.avaliadores.length > 1 && (
                      <button
                        type="button"
                        className={styles.btnRemover}
                        onClick={() => removerAvaliador(i)}
                        aria-label={`Remover avaliador ${i + 1}`}
                      >
                        <IconTrash size={18} />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" className={styles.btnAdicionar} onClick={adicionarAvaliador}>
                  <IconUserPlus size={18} aria-hidden="true" /> Adicionar outro avaliador
                </button>
              </section>

              <div className={styles.botoes}>
                <button type="button" className="btn-nav" onClick={voltar}>
                  <IconChevronLeft size={20} aria-hidden="true" /> Voltar
                </button>
                <button type="submit" className={`btn-nav primario ${styles.botaoPrincipal}`}>
                  <IconCheck size={20} aria-hidden="true" /> Salvar Ficha e Acessar Vistoria
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
