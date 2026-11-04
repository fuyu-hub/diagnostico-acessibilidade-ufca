import { Component } from 'react';
import { IconAlertTriangle } from '@tabler/icons-react';

export default class LimiteErro extends Component {
  state = { temErro: false };

  static getDerivedStateFromError() {
    return { temErro: true };
  }

  componentDidCatch(erro, info) {
    console.error('Erro de tela capturado:', erro, info);
  }

  render() {
    if (!this.state.temErro) return this.props.children;

    return (
      <main className="app-shell" style={{ justifyContent: 'center', alignItems: 'center', padding: 24, textAlign: 'center' }}>
        <IconAlertTriangle size={44} color="var(--text-warning)" aria-hidden="true" />
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '16px 0 10px' }}>Algo deu errado nesta tela</h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: 420, lineHeight: 1.5, marginBottom: 20 }}>
          As vistorias já gravadas continuam neste aparelho. Tente abrir a tela de novo ou volte ao início.
        </p>
        <div style={{ width: '100%', maxWidth: 320 }}>
          <button type="button" className="btn-nav primario" onClick={() => window.location.reload()}>
            Tentar novamente
          </button>
          <button type="button" className="btn-nav" onClick={() => window.location.assign('/')}>
            Voltar ao início
          </button>
        </div>
      </main>
    );
  }
}
