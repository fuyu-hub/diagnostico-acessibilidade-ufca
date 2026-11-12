import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { nivelNoHistorico } from '../utilitarios/navegacao';
import { IconQrcode } from '@tabler/icons-react';
import Topbar from '../componentes/Topbar';
import { extrairCodigoGrupo } from '../dados/sincronizacao';
import styles from '../componentes/AbaGrupo.module.css';

function mensagemDaCamera(err) {
  if (err?.name === 'NotAllowedError') return 'O app não tem permissão para usar a câmera. Libere nas configurações do navegador ou cole o link abaixo.';
  if (err?.name === 'NotFoundError') return 'Nenhuma câmera encontrada neste aparelho. Cole o link abaixo.';
  return 'Não foi possível abrir a câmera. Cole o link abaixo.';
}

/** Lê o QR code de uma vistoria em grupo com a câmera e leva à tela de entrada. */
export default function LerQr() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [erroCamera, setErroCamera] = useState('');
  const [aviso, setAviso] = useState('');
  const [link, setLink] = useState('');
  const [erroLink, setErroLink] = useState('');

  useEffect(() => {
    let ativo = true;
    let fluxo = null;
    let quadro = 0;

    async function iniciar() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setErroCamera('Este navegador não abre a câmera pelo app. Cole o link abaixo.');
        return;
      }
      try {
        fluxo = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      } catch (err) {
        if (ativo) setErroCamera(mensagemDaCamera(err));
        return;
      }
      if (!ativo) { fluxo.getTracks().forEach(t => t.stop()); return; }

      const video = videoRef.current;
      video.srcObject = fluxo;
      await video.play().catch(() => {});

      // Leitor nativo quando existe (Chrome no Android); senão, a biblioteca jsQR
      const nativo = 'BarcodeDetector' in window ? new window.BarcodeDetector({ formats: ['qr_code'] }) : null;
      const jsQR = nativo ? null : (await import('jsqr')).default;
      const tela = document.createElement('canvas');
      const contexto = tela.getContext('2d', { willReadFrequently: true });

      async function ler() {
        if (!ativo) return;
        if (video.readyState >= 2) {
          let texto = null;
          if (nativo) {
            const achados = await nativo.detect(video).catch(() => []);
            texto = achados[0]?.rawValue || null;
          } else {
            tela.width = video.videoWidth;
            tela.height = video.videoHeight;
            contexto.drawImage(video, 0, 0);
            const imagem = contexto.getImageData(0, 0, tela.width, tela.height);
            texto = jsQR(imagem.data, imagem.width, imagem.height)?.data || null;
          }
          if (texto) {
            const codigo = extrairCodigoGrupo(texto);
            if (codigo) {
              navigate(`/grupo/${codigo}`, { replace: true, state: { nivel: nivelNoHistorico() } });
              return;
            }
            setAviso('Este QR code não é de uma vistoria em grupo.');
          }
        }
        quadro = requestAnimationFrame(ler);
      }
      ler();
    }

    iniciar();
    return () => {
      ativo = false;
      cancelAnimationFrame(quadro);
      fluxo?.getTracks().forEach(t => t.stop());
    };
  }, [navigate]);

  function abrirLink(e) {
    e.preventDefault();
    const codigo = extrairCodigoGrupo(link);
    if (!codigo) {
      setErroLink('Esse não parece um link de vistoria em grupo. Ele termina com /grupo/ e um código.');
      return;
    }
    // A câmera não volta a abrir: a tela do QR é trocada pela de entrar no grupo
    navigate(`/grupo/${codigo}`, { replace: true, state: { nivel: nivelNoHistorico() } });
  }

  return (
    <div className="app-shell">
      <Topbar titulo="Ler QR code" voltar="/" />
      <main className="tela-body" style={{ padding: '24px 20px 48px' }}>
        <section className={styles.cartao} aria-labelledby="ler-qr-titulo">
          <h2 id="ler-qr-titulo" className={styles.titulo}><IconQrcode size={22} aria-hidden="true" /> Entrar em uma vistoria em grupo</h2>

          {erroCamera
            ? <p className={styles.erro} role="alert">{erroCamera}</p>
            : (
              <>
                <p className={styles.texto}>Aponte a câmera para o QR code mostrado por quem compartilhou a vistoria.</p>
                <video ref={videoRef} className={styles.video} muted playsInline aria-label="Imagem da câmera" />
              </>
            )}
          {aviso && <p className={styles.erro} role="status">{aviso}</p>}

          <form onSubmit={abrirLink} className={styles.formulario} noValidate>
            <label htmlFor="ler-qr-link" className={styles.rotulo}>Ou cole o link recebido</label>
            <input
              id="ler-qr-link"
              type="text"
              inputMode="url"
              value={link}
              onChange={e => { setLink(e.target.value); setErroLink(''); }}
              aria-describedby={erroLink ? 'ler-qr-erro' : undefined}
              aria-invalid={Boolean(erroLink)}
            />
            {erroLink && <p id="ler-qr-erro" className={styles.erro} role="alert">{erroLink}</p>}
            <button type="submit" className="btn-nav">Abrir link</button>
          </form>
        </section>
      </main>
    </div>
  );
}
