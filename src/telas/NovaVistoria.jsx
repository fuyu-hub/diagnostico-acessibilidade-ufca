import { useEffect, useState } from 'react';
import { IconCheck, IconUserPlus, IconTrash, IconBuilding, IconClipboardCheck } from '@tabler/icons-react';
import { useVistoria } from '../contexto/VistoriaContext';
import Topbar from '../componentes/Topbar';
import { useNavegacao } from '../utilitarios/navegacao';
import SeletorNivel, { OPCOES_REDE, OPCOES_NIVEL_ENSINO } from '../componentes/SeletorNivel';

// O que foi digitado fica guardado: sair da ficha pela metade não perde o preenchimento
const CHAVE_RASCUNHO = 'ufca:rascunhoNovaVistoria';

const fichaVazia = () => ({
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
  horarioInicio: '',
  horarioTermino: '',
  avaliadores: [''],
});

function lerRascunho() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_RASCUNHO));
  } catch {
    return null;
  }
}

const fichaPreenchida = f => Boolean(
  f.nome || f.endereco || f.bairro || f.cidade || f.rede || f.nivelEnsino.length || f.numAlunos ||
  f.numPavimentos || f.dataTermino || f.horarioInicio || f.horarioTermino || f.avaliadores.some(a => a.trim())
);

const estiloErro = { display: 'block', marginTop: 6, fontSize: '0.82rem', color: 'var(--text-danger)' };

export default function NovaVistoria() {
  const { navegar } = useNavegacao();
  const { criarVistoria } = useVistoria();

  const [form, setForm] = useState(() => ({ ...fichaVazia(), ...(lerRascunho() || {}) }));
  const [recuperado, setRecuperado] = useState(() => {
    const rascunho = lerRascunho();
    return Boolean(rascunho && fichaPreenchida({ ...fichaVazia(), ...rascunho }));
  });
  const [erros, setErros] = useState({});

  useEffect(() => {
    try {
      if (fichaPreenchida(form)) localStorage.setItem(CHAVE_RASCUNHO, JSON.stringify(form));
      else localStorage.removeItem(CHAVE_RASCUNHO);
    } catch {
      // Sem armazenamento, a ficha só não fica guardada ao sair
    }
  }, [form]);

  function set(campo, valor) {
    setForm(prev => ({ ...prev, [campo]: valor }));
    setErros(prev => ({ ...prev, [campo]: undefined }));
  }

  function limparFicha() {
    setForm(fichaVazia());
    setErros({});
    setRecuperado(false);
  }

  function setAvaliador(idx, valor) {
    const lista = [...form.avaliadores];
    lista[idx] = valor;
    setForm(prev => ({ ...prev, avaliadores: lista }));
    setErros(prev => ({ ...prev, avaliadores: undefined }));
  }

  function adicionarAvaliador() {
    setForm(prev => ({ ...prev, avaliadores: [...prev.avaliadores, ''] }));
  }

  function removerAvaliador(idx) {
    if (form.avaliadores.length <= 1) {
      setForm(prev => ({ ...prev, avaliadores: [''] }));
      return;
    }
    setForm(prev => ({
      ...prev,
      avaliadores: prev.avaliadores.filter((_, i) => i !== idx),
    }));
  }

  function iniciar(e) {
    e.preventDefault();
    const avaliadoresValidos = form.avaliadores.filter(a => a.trim() !== '');

    const novosErros = {
      nome: form.nome.trim() ? undefined : 'Informe o nome da escola ou instituição.',
      rede: form.rede ? undefined : 'Escolha a rede de ensino.',
      nivelEnsino: form.nivelEnsino.length ? undefined : 'Escolha ao menos um nível de ensino.',
      avaliadores: avaliadoresValidos.length ? undefined : 'Informe ao menos um avaliador.',
    };
    setErros(novosErros);
    if (Object.values(novosErros).some(Boolean)) {
      setTimeout(() => document.querySelector('[aria-invalid="true"]')?.focus(), 0);
      return;
    }

    const id = criarVistoria({
      ...form,
      avaliadores: avaliadoresValidos,
    });
    try {
      localStorage.removeItem(CHAVE_RASCUNHO);
    } catch {
      // Sem armazenamento não há rascunho para remover
    }
    navegar(`/vistoria/${id}`);
  }

  return (
    <div className="app-shell">
      <Topbar titulo="Nova Vistoria" voltar="/" />

      <main className="tela-body" style={{ padding: '24px 20px 48px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: 6 }}>Ficha da Instituição</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 28, lineHeight: 1.6 }}>
            Preencha as informações cadastrais do estabelecimento e da vistoria conforme o protocolo oficial de diagnóstico da acessibilidade.
          </p>

          {recuperado && (
            <p role="status" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              Recuperamos a ficha que você começou.
              <button type="button" onClick={limparFicha} style={{ minHeight: 44, background: 'none', border: 0, color: 'var(--accent-text)', font: 'inherit', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer' }}>
                Começar do zero
              </button>
            </p>
          )}
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 12 }}>* Campos obrigatórios</p>

          <form onSubmit={iniciar} noValidate>
            {/* Bloco 1: Dados da Instituição */}
            <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 18, padding: 20, marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <IconBuilding size={20} color="var(--accent)" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Identificação da Escola / Instituição</h3>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label className="label-secao" htmlFor="ficha-nova-1">Nome da escola / instituição *</label>
                <input
                  id="ficha-nova-1"
                  type="text"
                  placeholder="Ex: Universidade Federal do Cariri - UFCA"
                  value={form.nome}
                  onChange={e => set('nome', e.target.value)}
                  aria-required="true"
                  aria-invalid={erros.nome ? true : undefined}
                  aria-describedby={erros.nome ? 'erro-nome' : undefined}
                />
                {erros.nome && <span id="erro-nome" style={estiloErro}>{erros.nome}</span>}
              </div>

              <div className="form-grid-2" style={{ marginBottom: 16 }}>
                <div className="col-span-2">
                  <label className="label-secao" htmlFor="ficha-nova-2">Endereço completo</label>
                  <input
                  id="ficha-nova-2"
                    type="text"
                    placeholder="Ex: Av. Tenente Raimundo Rocha, 1639"
                    value={form.endereco}
                    onChange={e => set('endereco', e.target.value)}
                  />
                </div>

                <div>
                  <label className="label-secao" htmlFor="ficha-nova-3">Bairro</label>
                  <input
                  id="ficha-nova-3"
                    type="text"
                    placeholder="Ex: Cidade Universitária"
                    value={form.bairro}
                    onChange={e => set('bairro', e.target.value)}
                  />
                </div>

                <div>
                  <label className="label-secao" htmlFor="ficha-nova-4">Cidade / Município</label>
                  <input
                  id="ficha-nova-4"
                    type="text"
                    placeholder="Ex: Juazeiro do Norte, CE"
                    value={form.cidade}
                    onChange={e => set('cidade', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-grid-2" style={{ marginBottom: 16 }}>
                <SeletorNivel
                  label="Rede de Ensino *"
                  valor={form.rede}
                  onChange={val => set('rede', val)}
                  opcoes={OPCOES_REDE}
                  multi={false}
                  required={true}
                  erro={erros.rede}
                />

                <SeletorNivel
                  label="Nível de Ensino *"
                  valores={form.nivelEnsino}
                  onChange={novos => set('nivelEnsino', novos)}
                  opcoes={OPCOES_NIVEL_ENSINO}
                  multi={true}
                  required={true}
                  erro={erros.nivelEnsino}
                />
              </div>

              <div className="form-grid-2">
                <div>
                  <label className="label-secao" htmlFor="ficha-nova-5">Número de alunos (aprox.)</label>
                  <input
                  id="ficha-nova-5"
                    type="number"
                    placeholder="Ex: 2500"
                    value={form.numAlunos}
                    onChange={e => set('numAlunos', e.target.value)}
                  />
                </div>

                <div>
                  <label className="label-secao" htmlFor="ficha-nova-6">Número de pavimentos</label>
                  <input
                  id="ficha-nova-6"
                    type="number"
                    placeholder="Ex: 3"
                    value={form.numPavimentos}
                    onChange={e => set('numPavimentos', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Bloco 2: Dados da Vistoria */}
            <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 18, padding: 20, marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <IconClipboardCheck size={20} color="var(--accent)" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Dados da Vistoria Técnica</h3>
              </div>

              <div className="form-grid-2" style={{ marginBottom: 20 }}>
                <div>
                  <label className="label-secao" htmlFor="ficha-nova-7">Data da vistoria (Início)</label>
                  <input
                  id="ficha-nova-7"
                    type="date"
                    value={form.data}
                    onChange={e => set('data', e.target.value)}
                  />
                </div>

                <div>
                  <label className="label-secao" htmlFor="ficha-nova-8">Data de término</label>
                  <input
                  id="ficha-nova-8"
                    type="date"
                    value={form.dataTermino}
                    onChange={e => set('dataTermino', e.target.value)}
                  />
                </div>

                <div>
                  <label className="label-secao" htmlFor="ficha-nova-9">Horário de início</label>
                  <input
                  id="ficha-nova-9"
                    type="time"
                    value={form.horarioInicio}
                    onChange={e => set('horarioInicio', e.target.value)}
                  />
                </div>

                <div>
                  <label className="label-secao" htmlFor="ficha-nova-10">Horário de término</label>
                  <input
                  id="ficha-nova-10"
                    type="time"
                    value={form.horarioTermino}
                    onChange={e => set('horarioTermino', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <span className="label-secao">Equipe de Avaliadores *</span>
                {form.avaliadores.map((a, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder={`Nome do avaliador ${i + 1}`}
                      aria-label={`Nome do avaliador ${i + 1}`}
                      aria-required={i === 0 ? 'true' : undefined}
                      aria-invalid={i === 0 && erros.avaliadores ? true : undefined}
                      aria-describedby={i === 0 && erros.avaliadores ? 'erro-avaliadores' : undefined}
                      value={a}
                      onChange={e => setAvaliador(i, e.target.value)}
                      style={{ flex: 1 }}
                    />
                    {form.avaliadores.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removerAvaliador(i)}
                        aria-label="Excluir avaliador"
                        title="Excluir avaliador"
                        style={{
                          background: 'var(--surface-2)',
                          border: '1px solid var(--border)',
                          borderRadius: 12,
                          width: 48,
                          height: 48,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          color: 'var(--text-danger)',
                          flexShrink: 0,
                        }}
                      >
                        <IconTrash size={18} />
                      </button>
                    )}
                  </div>
                ))}
                {erros.avaliadores && <span id="erro-avaliadores" style={{ ...estiloErro, marginBottom: 8 }}>{erros.avaliadores}</span>}
                <button
                  type="button"
                  onClick={adicionarAvaliador}
                  style={{
                    background: 'none', border: 'none', color: 'var(--text-primary)',
                    fontSize: '0.9rem', cursor: 'pointer', display: 'inline-flex',
                    alignItems: 'center', gap: 8, fontFamily: 'inherit', fontWeight: 500,
                    marginTop: 6,
                  }}
                >
                  <IconUserPlus size={18} /> Adicionar outro avaliador
                </button>
              </div>
            </div>


            <button
              type="submit"
              className="btn-nav primario"
              style={{ height: 52 }}
            >
              <IconCheck size={20} /> Salvar Ficha e Acessar Vistoria
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
