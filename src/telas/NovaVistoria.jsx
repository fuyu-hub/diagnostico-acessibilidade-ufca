import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconCheck, IconUserPlus, IconTrash, IconBuilding, IconClipboardCheck } from '@tabler/icons-react';
import { useVistoria } from '../contexto/VistoriaContext';
import Topbar from '../componentes/Topbar';
import SeletorNivel, { OPCOES_REDE, OPCOES_NIVEL_ENSINO } from '../componentes/SeletorNivel';

export default function NovaVistoria() {
  const navigate = useNavigate();
  const { criarVistoria } = useVistoria();

  const [form, setForm] = useState({
    nome: '',
    endereco: '',
    bairro: '',
    cidade: '',
    rede: '',
    nivelEnsino: [],
    numAlunos: '',
    numPavimentos: '',
    anoConstrucao: '',
    data: new Date().toISOString().split('T')[0],
    horarioInicio: '',
    horarioTermino: '',
    avaliadores: [''],
  });

  function set(campo, valor) {
    setForm(prev => ({ ...prev, [campo]: valor }));
  }

  function setAvaliador(idx, valor) {
    const lista = [...form.avaliadores];
    lista[idx] = valor;
    setForm(prev => ({ ...prev, avaliadores: lista }));
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

    const id = criarVistoria({
      ...form,
      avaliadores: avaliadoresValidos,
    });
    navigate(`/vistoria/${id}`);
  }

  return (
    <div className="app-shell">
      <Topbar titulo="Nova Vistoria" voltar="/" />

      <div className="tela-body" style={{ padding: '24px 20px 48px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: 6 }}>Ficha da Instituição</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 28, lineHeight: 1.6 }}>
            Preencha as informações cadastrais do estabelecimento e da vistoria conforme o protocolo oficial de diagnóstico da acessibilidade.
          </p>

          <form onSubmit={iniciar}>
            {/* Bloco 1: Dados da Instituição */}
            <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 18, padding: 20, marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <IconBuilding size={20} color="var(--accent)" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Identificação da Escola / Instituição</h3>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label className="label-secao">Nome da escola / instituição *</label>
                <input
                  type="text"
                  placeholder="Ex: Universidade Federal do Cariri - UFCA"
                  value={form.nome}
                  onChange={e => set('nome', e.target.value)}
                  required
                />
              </div>

              <div className="form-grid-2" style={{ marginBottom: 16 }}>
                <div className="col-span-2">
                  <label className="label-secao">Endereço completo</label>
                  <input
                    type="text"
                    placeholder="Ex: Av. Tenente Raimundo Rocha, 1639"
                    value={form.endereco}
                    onChange={e => set('endereco', e.target.value)}
                  />
                </div>

                <div>
                  <label className="label-secao">Bairro</label>
                  <input
                    type="text"
                    placeholder="Ex: Cidade Universitária"
                    value={form.bairro}
                    onChange={e => set('bairro', e.target.value)}
                  />
                </div>

                <div>
                  <label className="label-secao">Cidade / Município</label>
                  <input
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
                />

                <SeletorNivel
                  label="Nível de Ensino *"
                  valores={form.nivelEnsino}
                  onChange={novos => set('nivelEnsino', novos)}
                  opcoes={OPCOES_NIVEL_ENSINO}
                  multi={true}
                  required={true}
                />
              </div>

              <div className="form-grid-3">
                <div>
                  <label className="label-secao">Número de alunos (aprox.)</label>
                  <input
                    type="number"
                    placeholder="Ex: 2500"
                    value={form.numAlunos}
                    onChange={e => set('numAlunos', e.target.value)}
                  />
                </div>

                <div>
                  <label className="label-secao">Número de pavimentos</label>
                  <input
                    type="number"
                    placeholder="Ex: 3"
                    value={form.numPavimentos}
                    onChange={e => set('numPavimentos', e.target.value)}
                  />
                </div>

                <div>
                  <label className="label-secao">Ano de construção</label>
                  <input
                    type="text"
                    placeholder="Ex: 2006"
                    value={form.anoConstrucao}
                    onChange={e => set('anoConstrucao', e.target.value)}
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

              <div className="form-grid-3" style={{ marginBottom: 20 }}>
                <div>
                  <label className="label-secao">Data da vistoria</label>
                  <input
                    type="date"
                    value={form.data}
                    onChange={e => set('data', e.target.value)}
                  />
                </div>

                <div>
                  <label className="label-secao">Horário de início</label>
                  <input
                    type="time"
                    value={form.horarioInicio}
                    onChange={e => set('horarioInicio', e.target.value)}
                  />
                </div>

                <div>
                  <label className="label-secao">Horário de término</label>
                  <input
                    type="time"
                    value={form.horarioTermino}
                    onChange={e => set('horarioTermino', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="label-secao">Equipe de Avaliadores *</label>
                {form.avaliadores.map((a, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder={`Nome do avaliador ${i + 1}`}
                      value={a}
                      required={i === 0}
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
      </div>
    </div>
  );
}
