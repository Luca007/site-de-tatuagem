const LS_KEY = 'tattoosite.github.cfg';

export function saveGithubCfg({ owner, repo, branch = 'main', token }) {
  const payload = { owner, repo, branch, token };
  localStorage.setItem(LS_KEY, JSON.stringify(payload));
  return payload;
}

export function loadGithubCfg() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '{}');
  } catch (error) {
    console.warn('Configuração GitHub inválida:', error);
    return {};
  }
}

export function githubUploadConfigured() {
  const cfg = loadGithubCfg();
  return hasUploadConfig(cfg);
}

export function clearGithubCfg() {
  localStorage.removeItem(LS_KEY);
}

export function buildCdnUrl(owner, repo, branch, path) {
  return `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${branch}/${path}`;
}

export async function uploadToGitHub(base64Content, path, message) {
  const { owner, repo, branch = 'main', token } = loadGithubCfg();
  if (!hasUploadConfig({ owner, repo, token })) {
    throw new Error('Configuração GitHub ausente.');
  }
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json'
    },
    body: JSON.stringify({
      message: message || `upload ${path}`,
      content: base64Content,
      branch
    })
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Falha no upload GitHub: ${txt}`);
  }
  return { owner, repo, branch };
}

function hasUploadConfig({ owner, repo, token }) {
  return Boolean(owner && repo && token);
}
