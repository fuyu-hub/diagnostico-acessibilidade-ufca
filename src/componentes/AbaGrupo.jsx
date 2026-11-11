import { useState } from 'react';
import {
  IconUsersGroup, IconRefresh, IconCopy, IconShare, IconCloudCheck, IconCloudUpload, IconWifiOff, IconAlertTriangle,
} from '@tabler/icons-react';
import { useVistoria } from '../contexto/VistoriaContext';
import { useNotificacao } from '../contexto/NotificacaoContext';
import { linkDoGrupo } from '../dados/sincronizacao';
import { nuvemDisponivel } from '../dados/nuvem';
import styles from './AbaGrupo.module.css';

function tempoRelativo(iso) {
  if (!iso) return 'ainda não sincronizou';
  const min = Math.round((Date.now() - Date.parse(iso)) / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  return new Date(iso).toLocaleDateString('pt-BR');
}

function Estado({ estado }) {
  if (!estado) return <p className={styles.estado}><IconRefresh size={18} aria-hidden="true" /> Conectando ao grupo…</p>;
  if (estado.erro) {
    return <p className={`${styles.estado} ${styles.alerta}`}><IconAlertTriangle size={18} aria-hidden="true" /> Não foi possível sincronizar agora. Suas respostas estão salvas neste aparelho.</p>;
  }
  if (estado.semInternet) {
    return <p className={`${styles.estado} ${styles.alerta}`}><IconWifiOff size={18} aria-hidden="true" /> Sem internet: suas respostas estão salvas neste aparelho e seguem quando a conexão voltar.</p>;
  }
  if (estado.pendente) {
    return <p className={styles.estado}><IconCloudUpload size={18} aria-hidden="true" /> Enviando suas alterações…</p>;
  }
  const hora = estado.ultimaSincronizacao
    ? new Date(estado.ultimaSincronizacao).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : null;
  return <p className={`${styles.estado} ${styles.ok}`}><IconCloudCheck size={18} aria-hidden="true" /> {hora ? `Sincronizado às ${hora}` : 'Sincronizado'}</p>;
}

/** Aba "Grupo" do painel da vistoria: compartilhar, estado da sincronização e participantes. */
export default function AbaGrupo({ vistoria }) {
  const { compartilharVistoria, sincronizarGrupo, estadoGrupos } = useVistoria();
  const { mostrarToast } = useNotificacao();
  const [nome, setNome] = useState(vistoria.avaliadores?.[0] || '');
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState('');

  if (!nuvemDisponivel()) {
    return (
      <section className={styles.cartao}>
        <h3 className={styles.titulo}>Vistoria em grupo</h3>
        <p className={styles.texto}>O servidor não está configurado nesta versão do app.</p>
      </section>
    );
  }

  async function compartilhar(e) {
    e.preventDefault();
    if (!nome.trim()) {
      setErro('Informe seu nome, para o grupo saber quem respondeu.');
      return;
    }
    setOcupado(true);
    setErro('');
    try {
      await compartilharVistoria(vistoria.vistoriaId, nome);
      mostrarToast('Vistoria compartilhada. Envie o link ao grupo.', 'sucesso');
    } catch (err) {
      setErro(err.message || 'Não foi possível compartilhar agora.');
    } finally {
      setOcupado(false);
    }
  }

  if (!vistoria.grupo) {
    return (
      <section className={styles.cartao} aria-labelledby="grupo-titulo">
        <h3 id="grupo-titulo" className={styles.titulo}><IconUsersGroup size={22} aria-hidden="true" /> Vistoria em grupo</h3>
        <p className={styles.texto}>
          Compartilhe para outras pessoas preencherem esta vistoria ao mesmo tempo, cada uma no próprio aparelho.
          As respostas se juntam sempre que houver internet. As fotos ficam em cada aparelho.
        </p>
        <form onSubmit={compartilhar} className={styles.formulario} noValidate>
          <label htmlFor="grupo-nome" className={styles.rotulo}>Seu nome</label>
          <input
            id="grupo-nome"
            type="text"
            value={nome}
            maxLength={60}
            onChange={e => { setNome(e.target.value); setErro(''); }}
            aria-describedby={erro ? 'grupo-erro' : undefined}
            aria-invalid={Boolean(erro)}
          />
          {erro && <p id="grupo-erro" className={styles.erro} role="alert">{erro}</p>}
          <button type="submit" className="btn-nav primario" disabled={ocupado}>
            {ocupado ? 'Compartilhando…' : 'Compartilhar vistoria'}
          </button>
        </form>
        <p className={styles.nota}>Quem receber o link pode ver e editar esta vistoria. Envie só para quem faz parte da equipe.</p>
      </section>
    );
  }

  const estado = estadoGrupos?.[vistoria.vistoriaId];
  const link = linkDoGrupo(vistoria.grupo.codigo);

  async function sincronizar() {
    setOcupado(true);
    try {
      await sincronizarGrupo(vistoria.vistoriaId);
      mostrarToast('Vistoria sincronizada', 'sucesso');
    } catch (err) {
      mostrarToast(err.message || 'Não foi possível sincronizar agora.', 'erro');
    } finally {
      setOcupado(false);
    }
  }

  async function convidar() {
    const dados = { title: `Vistoria: ${vistoria.nome}`, text: 'Entre na vistoria em grupo pelo link:', url: link };
    try {
      if (navigator.share) {
        await navigator.share(dados);
        return;
      }
    } catch (err) {
      if (err?.name === 'AbortError') return;
    }
    copiar();
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(link);
      mostrarToast('Link copiado', 'sucesso');
    } catch {
      mostrarToast('Não foi possível copiar. Selecione o link e copie.', 'erro');
    }
  }

  return (
    <section className={styles.cartao} aria-labelledby="grupo-titulo">
      <h3 id="grupo-titulo" className={styles.titulo}><IconUsersGroup size={22} aria-hidden="true" /> Vistoria em grupo</h3>
      <div role="status" aria-live="polite"><Estado estado={estado} /></div>
      <button type="button" className="btn-nav" onClick={sincronizar} disabled={ocupado}>
        <IconRefresh size={20} aria-hidden="true" /> {ocupado ? 'Sincronizando…' : 'Sincronizar agora'}
      </button>

      <h4 className={styles.subtitulo}>Participantes</h4>
      <ul className={styles.lista}>
        {(estado?.participantes || []).map(p => (
          <li key={p.uid} className={styles.participante}>
            <span>{p.nome}{p.voce ? ' (você)' : ''}</span>
            <span className={styles.quando}>{tempoRelativo(p.ultimaSincronizacao)}</span>
          </li>
        ))}
      </ul>

      <h4 className={styles.subtitulo}>Convidar pessoas</h4>
      <label htmlFor="grupo-link" className={styles.rotulo}>Link da vistoria</label>
      <input id="grupo-link" type="text" readOnly value={link} onFocus={e => e.target.select()} />
      <div className={styles.acoes}>
        <button type="button" className="btn-nav" onClick={convidar}><IconShare size={20} aria-hidden="true" /> Compartilhar link</button>
        <button type="button" className="btn-nav" onClick={copiar}><IconCopy size={20} aria-hidden="true" /> Copiar</button>
      </div>
      <p className={styles.nota}>
        Você está como {vistoria.grupo.nome}{vistoria.grupo.papel === 'responsavel' ? ', responsável pela vistoria' : ''}.
        Quem tem o link pode ver e editar.
      </p>
    </section>
  );
}
