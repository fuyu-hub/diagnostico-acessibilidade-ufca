import { useNavigate } from 'react-router-dom';
import { IconAlertCircle, IconArrowLeft } from '@tabler/icons-react';
import Topbar from '../componentes/Topbar';

export default function NaoEncontrada() {
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      <Topbar titulo="Página não encontrada" voltar="/" />
      <div className="tela-body" style={{ padding: '60px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ marginBottom: 20 }}>
          <IconAlertCircle size={56} color="var(--text-muted)" style={{ opacity: 0.6 }} />
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 12, color: 'var(--text-strong, #ffffff)' }}>
          Página não encontrada
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 32, maxWidth: 360, lineHeight: 1.5 }}>
          O endereço acessado não existe, foi alterado ou a vistoria foi removida.
        </p>
        <button
          type="button"
          className="btn-nav primario"
          style={{ maxWidth: 280 }}
          onClick={() => navigate('/')}
        >
          <IconArrowLeft size={18} /> Voltar ao Início
        </button>
      </div>
    </div>
  );
}
