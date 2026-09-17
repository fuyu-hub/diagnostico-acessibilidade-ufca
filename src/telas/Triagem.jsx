import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { IconCheck, IconX, IconMinus, IconFilter } from '@tabler/icons-react';
import { useVistoria } from '../contexto/VistoriaContext';
import Topbar from '../componentes/Topbar';
import BarraProgresso from '../componentes/BarraProgresso';
import { tocarSomResposta } from '../utilitarios/som';

export default function Triagem() {
  const { id, itemId } = useParams();
  const navigate = useNavigate();
  const { getVistoria, responderItem, carregando } = useVistoria();
  const vistoria = getVistoria(id);
  const [selecionado, setSelecionado] = useState(
    vistoria?.respostas?.[itemId]?.valor || null
  );

  if (!vistoria) {
    if (carregando) {
      return (
        <div className="app-shell">
          <Topbar eyebrow="Aguarde" titulo="Carregando..." voltar="/" />
          <div className="tela-body" style={{ padding: '32px 20px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)' }}>Carregando dados da triagem...</p>
          </div>
        </div>
      );
    }
    return null;
  }

  function responder(valor) {
    tocarSomResposta(valor);
    setSelecionado(valor);
    responderItem(id, parseInt(itemId, 10), { valor });

    if (valor === 'nao' || valor === 'nao-aplica') {
      // Marca dependentes como N/A (hardcoded para o item 7/8)
      [8, 9, 10, 11].forEach(dep =>
        responderItem(id, dep, {
          valor: 'nao-aplica',
          obs: '',
          foto: null,
          automatico: true,
          origemTriagem: parseInt(itemId, 10) || 7,
        })
      );
    } else {
      [8, 9, 10, 11].forEach(dep => {
        const respDep = vistoria.respostas?.[dep];
        if (respDep?.automatico) responderItem(id, dep, null);
      });
    }
  }

  return (
    <div className="app-shell">
      <Topbar eyebrow="Pergunta de triagem" titulo="Rebaixamento de Calçada" />
      <BarraProgresso pct={32} label="Rebaixamento de Calçada" />

      <div className="tela-body" style={{ padding: '12px 20px 24px' }}>
        <span className="tag triagem" style={{ marginBottom: 16, display: 'inline-flex' }}>
          <IconFilter size={14} /> Pergunta de triagem
        </span>

        <p style={{ fontSize: '1.05rem', fontWeight: 600, lineHeight: 1.5, marginBottom: 24 }}>
          Há travessia de via com rebaixamento de calçada no trajeto de acesso?
        </p>

        <button
          className={`btn-resposta ${selecionado === 'sim' ? 'conforme' : ''}`}
          onClick={() => responder('sim')}
        >
          <span className="icone"><IconCheck size={20} /></span> Sim
        </button>

        <button
          className={`btn-resposta ${selecionado === 'nao' ? 'nao-conforme' : ''}`}
          onClick={() => responder('nao')}
        >
          <span className="icone"><IconX size={20} /></span> Não
        </button>

        <button
          className={`btn-resposta ${selecionado === 'nao-aplica' ? 'nao-aplica' : ''}`}
          onClick={() => responder('nao-aplica')}
        >
          <span className="icone"><IconMinus size={20} /></span> Não se aplica
        </button>

        <div style={{ background: 'var(--surface-1)', borderRadius: 14, padding: 14, border: '1px solid var(--border)', marginTop: 16 }}>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
            Se "Não" ou "Não se aplica", os itens dependentes serão marcados <strong>Não se aplica (N/A)</strong> automaticamente.
          </p>
        </div>

        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 20 }}>Ref.: NBR 9050 6.12.8</p>

        {selecionado && (
          <button
            className="btn-nav primario"
            style={{ marginTop: 16 }}
            onClick={() => navigate(`/checklist/${id}/itens`)}
          >
            Continuar
          </button>
        )}
      </div>
    </div>
  );
}
