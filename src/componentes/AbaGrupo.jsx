import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  IconUsersGroup, IconRefresh, IconCopy, IconShare, IconCloudCheck, IconCloudUpload, IconWifiOff, IconAlertTriangle,
  IconPhotoUp, IconPhotoDown, IconLock, IconLockOpen, IconCircleCheck,
} from '@tabler/icons-react';
import { listarDivergencias } from '../dados/mescla';
import { fotosFaltando } from '../dados/sincronizacao';
import { ITENS_TECNICOS, TODOS_ITENS } from '../dados/checklist';
import { useNavegacao } from '../utilitarios/navegacao';
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

/** QR code do link, para quem está perto entrar apontando a câmera. */
function QrDoLink({ link }) {
  const [imagem, setImagem] = useState('');

  useEffect(() => {
    let ativo = true;
    import('qrcode')
      .then(({ default: QRCode }) => QRCode.toDataURL(link, { margin: 2, width: 480, color: { dark: '#000000', light: '#ffffff' } }))
      .then(url => { if (ativo) setImagem(url); })
      .catch(err => console.warn('Não foi possível gerar o QR code:', err));
    return () => { ativo = false; };
  }, [link]);

  return (
    <figure className={styles.qr}>
      {imagem
        ? <img src={imagem} alt="QR code com o link da vistoria" width={240} height={240} />
        : <span className={styles.texto} aria-busy="true">Gerando QR code…</span>}
      <figcaption className={styles.nota}>Quem estiver perto aponta a câmera do celular, ou usa "Ler QR code" na tela inicial do app.</figcaption>
    </figure>
  );
}

/** Aba "Grupo" do painel da vistoria: compartilhar, estado da sincronização e participantes. */
export default function AbaGrupo({ vistoria }) {
  const {
    compartilharVistoria, sincronizarGrupo, estadoGrupos,
    mudarStatusDoGrupo, exportarFotosDoGrupo, importarFotosDoGrupo,
  } = useVistoria();
  const { mostrarToast, mostrarConfirmacao } = useNotificacao();
  const { navegar } = useNavegacao();
  const arquivoFotosRef = useRef(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [nome, setNome] = useState(vistoria.avaliadores?.[0] || '');
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState('');
  const automatico = useRef(false);

  async function criarLink(nomeEscolhido) {
    if (!nomeEscolhido.trim()) {
      setErro('Informe seu nome, para o grupo saber quem respondeu.');
      return;
    }
    setOcupado(true);
    setErro('');
    try {
      await compartilharVistoria(vistoria, nomeEscolhido);
      mostrarToast('Vistoria compartilhada. Envie o link ou mostre o QR code.', 'sucesso');
    } catch (err) {
      setErro(err.message || 'Não foi possível compartilhar agora.');
    } finally {
      setOcupado(false);
    }
  }

  // Vindo da criação com "Preencher em grupo": cria o link sem pedir outro clique
  useEffect(() => {
    if (searchParams.get('compartilhar') !== '1' || automatico.current) return;
    automatico.current = true;
    setSearchParams({ aba: 'grupo' }, { replace: true });
    if (!vistoria.grupo && nuvemDisponivel()) criarLink(vistoria.avaliadores?.[0] || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!nuvemDisponivel()) {
    return (
      <section className={styles.cartao}>
        <h3 className={styles.titulo}>Vistoria em grupo</h3>
        <p className={styles.texto}>O servidor não está configurado nesta versão do app.</p>
      </section>
    );
  }

  function compartilhar(e) {
    e.preventDefault();
    criarLink(nome);
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
  const concluida = estado?.status === 'concluida';
  const participantes = estado?.participantes || [];
  const divergencias = listarDivergencias(vistoria.dadosVistoria);
  const faltando = fotosFaltando(vistoria.dadosVistoria, participantes);
  const semResposta = ITENS_TECNICOS.filter(i => !vistoria.respostas?.[i.id]?.valor).length;
  const atrasados = participantes.filter(p => !p.voce && (!p.ultimaSincronizacao
    || Date.now() - Date.parse(p.ultimaSincronizacao) > 15 * 60000));
  const numeroItem = id => TODOS_ITENS.findIndex(i => String(i.id) === String(id)) + 1;

  async function enviarFotos() {
    try {
      const r = await exportarFotosDoGrupo(vistoria.vistoriaId);
      if (!r.cancelado) mostrarToast(`${r.total} foto(s) prontas para enviar`, 'sucesso');
    } catch (err) {
      mostrarToast(err.message || 'Não foi possível preparar as fotos.', 'erro');
    }
  }

  async function receberFotos(e) {
    const arquivo = e.target.files?.[0];
    e.target.value = '';
    if (!arquivo) return;
    try {
      const resultado = importarFotosDoGrupo(JSON.parse(await arquivo.text()));
      if (!resultado) {
        mostrarToast('Este arquivo não é um pacote de fotos de vistoria.', 'erro');
        return;
      }
      if (resultado.vistoriaId !== vistoria.vistoriaId) {
        mostrarToast('Estas fotos são de outra vistoria. Elas foram adicionadas a ela.', 'info');
        return;
      }
      mostrarToast(resultado.adicionadas > 0
        ? `${resultado.adicionadas} foto(s)${resultado.enviadoPor ? ` de ${resultado.enviadoPor}` : ''} adicionada(s)`
        : 'Essas fotos já estavam neste aparelho', 'sucesso');
    } catch (err) {
      mostrarToast(err.message || 'Não foi possível ler o arquivo.', 'erro');
    }
  }

  async function concluir() {
    const pendencias = [
      semResposta > 0 && `${semResposta} item(ns) sem resposta`,
      divergencias.length > 0 && `${divergencias.length} divergência(s)`,
      atrasados.length > 0 && `${atrasados.map(p => p.nome).join(', ')} sem sincronizar há mais de 15 minutos`,
      faltando.length > 0 && `fotos de ${faltando.length} item(ns) ainda em outro aparelho`,
    ].filter(Boolean);
    const ok = await mostrarConfirmacao({
      titulo: 'Concluir a vistoria do grupo?',
      mensagem: (pendencias.length ? `Ainda há: ${pendencias.join('; ')}. ` : '')
        + 'Depois de concluir, o grupo fecha: ninguém mais envia respostas. Você pode reabrir depois.',
      textoConfirmar: 'Concluir e fechar',
      textoCancelar: 'Voltar',
      perigo: pendencias.length > 0,
    });
    if (!ok) return;
    setOcupado(true);
    try {
      await sincronizarGrupo(vistoria.vistoriaId).catch(() => {});
      await mudarStatusDoGrupo(vistoria.vistoriaId, 'concluida');
      mostrarToast('Vistoria do grupo concluída', 'sucesso');
    } catch (err) {
      mostrarToast(err.message || 'Não foi possível concluir agora.', 'erro');
    } finally {
      setOcupado(false);
    }
  }

  async function reabrir() {
    setOcupado(true);
    try {
      await mudarStatusDoGrupo(vistoria.vistoriaId, 'aberta');
      mostrarToast('Grupo reaberto', 'sucesso');
    } catch (err) {
      mostrarToast(err.message || 'Não foi possível reabrir agora.', 'erro');
    } finally {
      setOcupado(false);
    }
  }

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

      {concluida && (
        <p className={`${styles.estado} ${styles.alerta}`}>
          <IconLock size={18} aria-hidden="true" />
          Vistoria concluída por quem compartilhou. O grupo está fechado: o que mudar agora fica só neste aparelho.
        </p>
      )}
      {divergencias.length > 0 && (
        <button type="button" className="btn-nav" onClick={() => navegar(`/checklist/${vistoria.id}/divergencias`)}>
          <IconAlertTriangle size={20} aria-hidden="true" />
          {divergencias.length === 1 ? '1 divergência para decidir' : `${divergencias.length} divergências para decidir`}
        </button>
      )}

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
      <QrDoLink link={link} />
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

      <h4 className={styles.subtitulo}>Fotos</h4>
      <p className={styles.texto}>
        As fotos não passam pelo servidor. Envie as suas como arquivo para quem vai gerar o relatório, por
        WhatsApp (como documento), Drive ou compartilhamento por proximidade.
      </p>
      {faltando.length > 0 ? (
        <p className={`${styles.estado} ${styles.alerta}`}>
          <IconAlertTriangle size={18} aria-hidden="true" />
          Fotos ainda em outro aparelho: {faltando.slice(0, 6).map(f => `item ${numeroItem(f.itemId)} (${f.nomes.join(', ')})`).join('; ')}
          {faltando.length > 6 ? ` e mais ${faltando.length - 6}` : ''}.
        </p>
      ) : participantes.length > 1 && (
        <p className={`${styles.estado} ${styles.ok}`}><IconCircleCheck size={18} aria-hidden="true" /> Todas as fotos do grupo estão neste aparelho.</p>
      )}
      <div className={styles.acoes}>
        <button type="button" className="btn-nav" onClick={enviarFotos}><IconPhotoUp size={20} aria-hidden="true" /> Enviar minhas fotos</button>
        <button type="button" className="btn-nav" onClick={() => arquivoFotosRef.current?.click()}><IconPhotoDown size={20} aria-hidden="true" /> Receber fotos</button>
      </div>
      <input ref={arquivoFotosRef} type="file" accept=".json,application/json" hidden onChange={receberFotos} aria-hidden="true" tabIndex={-1} />

      {vistoria.grupo.papel === 'responsavel' && (
        <>
          <h4 className={styles.subtitulo}>Concluir</h4>
          {concluida ? (
            <button type="button" className="btn-nav" onClick={reabrir} disabled={ocupado}>
              <IconLockOpen size={20} aria-hidden="true" /> Reabrir o grupo
            </button>
          ) : (
            <>
              <ul className={styles.lista}>
                <li className={styles.participante}><span>Itens sem resposta</span><span className={styles.quando}>{semResposta}</span></li>
                <li className={styles.participante}><span>Divergências</span><span className={styles.quando}>{divergencias.length}</span></li>
                <li className={styles.participante}><span>Sem sincronizar há mais de 15 min</span><span className={styles.quando}>{atrasados.length ? atrasados.map(p => p.nome).join(', ') : 'ninguém'}</span></li>
                <li className={styles.participante}><span>Itens com fotos em outro aparelho</span><span className={styles.quando}>{faltando.length}</span></li>
              </ul>
              <button type="button" className="btn-nav primario" onClick={concluir} disabled={ocupado}>
                <IconLock size={20} aria-hidden="true" /> Concluir e fechar o grupo
              </button>
              <p className={styles.nota}>Ao concluir, ninguém mais envia respostas. Você gera o PDF e o Excel com tudo o que chegou.</p>
            </>
          )}
        </>
      )}
    </section>
  );
}
