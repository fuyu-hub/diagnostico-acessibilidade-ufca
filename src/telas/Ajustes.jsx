import { IconSettings } from '@tabler/icons-react';
import Topbar from '../componentes/Topbar';

export default function Ajustes() {
  return (
    <div className="app-shell">
      <Topbar titulo="Ajustes" voltar="/" />
      <div className="tela-body" style={{ padding: '32px 20px', textAlign: 'center' }}>
        <IconSettings size={48} color="var(--text-muted)" />
        <p style={{ marginTop: 16, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Em breve: exportação, backup e configurações do app.
        </p>
      </div>
    </div>
  );
}
