import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { nivelNoHistorico } from '../utilitarios/navegacao';
import { IconUsersGroup, IconMapPin } from '@tabler/icons-react';
import Topbar from '../componentes/Topbar';
import { useVistoria } from '../contexto/VistoriaContext';
import { lerGrupo } from '../dados/sincronizacao';
import { conectarNuvem, nuvemDisponivel } from '../dados/nuvem';
import styles from '../componentes/AbaGrupo.module.css';

/** Entrada em uma vistoria em grupo pelo link `/grupo/:codigo`. */
export default function EntrarGrupo() {
  const { codigo } = useParams();
  const navigate = useNavigate();
  const { vistorias, carregando, entrarEmGrupo } = useVistoria();
  const [grupo, setGrupo] = useState(null);
  const [falhaGrupo, setFalhaGrupo] = useState('');
  const [nome, setNome] = useState('');
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState(false);

  const jaNoGrupo = vistorias.find(v => v.grupo?.codigo === codigo);

  useEffect(() => {
    if (jaNoGrupo) navigate(`/vistoria/${jaNoGrupo.vistoriaId}`, { replace: true, state: { nivel: nivelNoHistorico() } });
  }, [jaNoGrupo, navigate]);

  useEffect(() => {
    if (carregando || jaNoGrupo || !nuvemDisponivel()) return undefined;
    let ativo = true;
    lerGrupo(codigo, conectarNuvem)
      .then(g => { if (ativo) setGrupo(g); })
      .catch(err => { if (ativo) setFalhaGrupo(err.message || 'Não foi possível abrir este link.'); });
    return () => { ativo = false; };
  }, [codigo, carregando, jaNoGrupo]);

  const erroGrupo = nuvemDisponivel() ? falhaGrupo : 'O servidor não está configurado nesta versão do app.';

  async function entrar(e) {
    e.preventDefault();
    if (!nome.trim()) {
      setErro('Informe seu nome, para o grupo saber quem respondeu.');
      return;
    }
    setOcupado(true);
    setErro('');
    try {
      const id = await entrarEmGrupo(codigo, nome);
      navigate(`/vistoria/${id}`, { replace: true, state: { nivel: nivelNoHistorico() } });
    } catch (err) {
      setErro(err.message || 'Não foi possível entrar agora.');
      setOcupado(false);
    }
  }

  return (
    <div className="app-shell">
      <Topbar titulo="Entrar na vistoria" voltar="/" />
      <main className="tela-body" style={{ padding: '24px 20px 48px' }}>
        <section className={styles.cartao} aria-labelledby="entrar-titulo" aria-busy={!grupo && !erroGrupo}>
          <h2 id="entrar-titulo" className={styles.titulo}><IconUsersGroup size={22} aria-hidden="true" /> Vistoria em grupo</h2>

          {erroGrupo && <p className={styles.erro} role="alert">{erroGrupo}</p>}
          {!grupo && !erroGrupo && <p className={styles.texto}>Abrindo a vistoria…</p>}

          {grupo && grupo.status !== 'aberta' && (
            <p className={styles.erro} role="alert">Esta vistoria já foi concluída por quem a compartilhou.</p>
          )}

          {grupo && grupo.status === 'aberta' && (
            <>
              <p className={styles.texto}>
                <strong>{grupo.blocoAvaliado}</strong>
                {grupo.ficha?.cidade && <><br /><IconMapPin size={14} aria-hidden="true" /> {grupo.ficha.cidade}</>}
              </p>
              <p className={styles.texto}>
                Você vai preencher esta vistoria junto com o grupo. Suas respostas ficam salvas neste aparelho
                e se juntam às dos outros quando houver internet. As fotos ficam só neste aparelho.
              </p>
              <form onSubmit={entrar} className={styles.formulario} noValidate>
                <label htmlFor="entrar-nome" className={styles.rotulo}>Seu nome</label>
                <input
                  id="entrar-nome"
                  type="text"
                  value={nome}
                  maxLength={60}
                  autoComplete="name"
                  onChange={e => { setNome(e.target.value); setErro(''); }}
                  aria-describedby={erro ? 'entrar-erro' : undefined}
                  aria-invalid={Boolean(erro)}
                />
                {erro && <p id="entrar-erro" className={styles.erro} role="alert">{erro}</p>}
                <button type="submit" className="btn-nav primario" disabled={ocupado}>
                  {ocupado ? 'Entrando…' : 'Entrar na vistoria'}
                </button>
              </form>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
