import { addWatermark } from './watermark.js';
import { githubUploadConfigured, uploadToGitHub, buildCdnUrl } from './github.js';
import { showToast } from './ui.js';
import { currentUser } from './auth.js';

export async function uploadImageFlow() {
  const file = await requestFile();
  if (!file) return null;
  try {
    const stamped = await addWatermark(file, watermarkLabel());
    if (!githubUploadConfigured()) {
      showToast('Configure o upload GitHub nas configurações para enviar imagens.', 'info');
      return URL.createObjectURL(stamped);
    }
    const path = buildPath(stamped.name);
    const { owner, repo, branch } = await uploadToGitHub(await toBase64(stamped), path, `Upload ${stamped.name}`);
    const url = buildCdnUrl(owner, repo, branch, path);
    showToast('Imagem enviada com marca d\'água.', 'success');
    return url;
  } catch (error) {
    console.error(error);
    showToast('Não foi possível enviar a imagem.', 'error');
    return null;
  }
}

function requestFile() {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => resolve(input.files?.[0] || null);
    input.click();
  });
}

async function toBase64(file) {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  bytes.forEach((b) => { binary += String.fromCharCode(b); });
  return btoa(binary);
}

function buildPath(filename) {
  const uid = currentUser?.uid || 'guest';
  const date = new Date();
  const stamp = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  return `portfolio/${uid}/${stamp}/${Date.now()}_${filename}`;
}

function watermarkLabel() {
  return `PREVIEW – © ${currentUser?.displayName || 'Tattooer'}`;
}
