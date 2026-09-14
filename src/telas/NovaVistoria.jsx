import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconCheck, IconUserPlus } from '@tabler/icons-react';
import { useVistoria } from '../contexto/VistoriaContext';
import Topbar from '../componentes/Topbar';

export default function NovaVistoria() {
  const navigate = useNavigate();
  const { criarVistoria } = useVistoria();

  const [form, setForm] = useState({
    nome: '',
    cidade: '',
    data: new Date().toISOString().split('T')[0],
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

  function iniciar() {
    if (!form.nome.trim()) return;
    const id = criarVistoria(form);
    navigate(`/checklist/${id}/item/1`);
  }

  return (
    <div className="app-shell">
      <Topbar titulo="Nova Vistoria" voltar="/" />

      <div className="tela-body" style={{ padding: '24px 20px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: 6 }}>Cadastrar Projeto</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 28, lineHeight: 1.6 }}>
            Preencha a identificação do estabelecimento para iniciar o diagnóstico de acessibilidade.
          </p>

          <div style={{ marginBottom: 20 }}>
            <label className="label-secao">Nome do Estabelecimento *</label>
            <input
              type="text"
              placeholder="Ex: Escola Estadual Prof. Aníbal de Freitas"
              value={form.nome}
              onChange={e => set('nome', e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 20 }}>
            <div>
              <label className="label-secao">Cidade / Município</label>
              <input
                type="text"
                placeholder="Ex: Campinas, SP"
                value={form.cidade}
                onChange={e => set('cidade', e.target.value)}
              />
            </div>

            <div>
              <label className="label-secao">Data da Vistoria</label>
              <input
                type="date"
                value={form.data}
                onChange={e => set('data', e.target.value)}
              />
            </div>
          </div>

          <div style={{ marginBottom: 28 }}>
            <label className="label-secao">Avaliadores</label>
            {form.avaliadores.map((a, i) => (
              <input
                key={i}
                type="text"
                placeholder={`Nome do avaliador ${i + 1}`}
                value={a}
                onChange={e => setAvaliador(i, e.target.value)}
                style={{ marginBottom: 10 }}
              />
            ))}
            <button
              type="button"
              onClick={adicionarAvaliador}
              style={{
                background: 'none', border: 'none', color: 'var(--text-primary)',
                fontSize: '0.9rem', cursor: 'pointer', display: 'flex',
                alignItems: 'center', gap: 8, fontFamily: 'inherit', fontWeight: 500,
              }}
            >
              <IconUserPlus size={20} /> Adicionar outro avaliador
            </button>
          </div>

          <button className="btn-nav primario" onClick={iniciar} disabled={!form.nome.trim()} style={{ height: 52 }}>
            <IconCheck size={20} /> Iniciar Checklist de Vistoria
          </button>
        </div>
      </div>
    </div>
  );
}
