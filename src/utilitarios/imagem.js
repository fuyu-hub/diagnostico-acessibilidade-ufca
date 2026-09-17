/**
 * Utilitário de processamento e compressão de imagens via Canvas (Client-Side)
 * Converte imagens brutas para WebP compacto mantendo alta nitidez técnica
 */

export async function comprimirImagem(arquivo, opcoes = {}) {
  const { qualidade = 0.75 } = opcoes;

  return new Promise((resolve, reject) => {
    if (!arquivo) {
      return reject(new Error('Nenhum arquivo fornecido.'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo de imagem.'));

    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Formato de imagem inválido ou corrompido.'));

      img.onload = () => {
        // Mantém as dimensões 100% originais da imagem (sem redução de escala/proporção)
        const largura = img.naturalWidth || img.width;
        const altura = img.naturalHeight || img.height;

        const canvas = document.createElement('canvas');
        canvas.width = largura;
        canvas.height = altura;
        const ctx = canvas.getContext('2d');

        // Renderização suave no canvas
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, largura, altura);

        // Tenta WebP, com fallback para JPEG
        let dataUrl = canvas.toDataURL('image/webp', qualidade);
        let formato = 'webp';

        if (!dataUrl.startsWith('data:image/webp')) {
          dataUrl = canvas.toDataURL('image/jpeg', qualidade);
          formato = 'jpeg';
        }

        // Estima tamanho em bytes a partir da string Base64
        const base64Str = dataUrl.split(',')[1] || '';
        const tamanhoBytes = Math.round((base64Str.length * 3) / 4);

        resolve({
          dataUrl,
          formato,
          largura,
          altura,
          tamanhoBytes,
          tamanhoFormatado: formatarTamanhoBytes(tamanhoBytes),
          nomeOriginal: arquivo.name || 'foto.jpg',
        });
      };

      img.src = e.target.result;
    };

    reader.readAsDataURL(arquivo);
  });
}

export function formatarTamanhoBytes(bytes) {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * Converte Data URL (WebP, PNG) em Blob JPEG de alta qualidade
 */
export async function converterParaJpegBlob(dataUrl, qualidade = 0.92) {
  if (typeof window === 'undefined' || typeof Image === 'undefined' || typeof document === 'undefined') {
    return new Blob(['fake-jpeg'], { type: 'image/jpeg' });
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onerror = () => reject(new Error('Falha ao processar imagem para JPEG.'));
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');

      // Fundo branco caso haja transparência
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Falha ao converter imagem para JPEG.'));
        },
        'image/jpeg',
        qualidade
      );
    };
    img.src = dataUrl;
  });
}

/**
 * Dispara o download de qualquer foto em formato .jpg no dispositivo
 */
export async function baixarImagemJpg(dataUrl, nomeBase = 'foto_acessibilidade') {
  if (!dataUrl) return;

  try {
    const blob = await converterParaJpegBlob(dataUrl, 0.92);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const nomeLimpo = nomeBase.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    link.download = `${nomeLimpo}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Erro ao baixar foto em JPG:', err);
  }
}

