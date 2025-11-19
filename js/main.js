import './auth.js';
import { currentUser, currentRole, updateProfileData, updateAccountEmail, updateAccountPassword } from './auth.js';
import { initNavigation, switchView, bindToggle, formToObject, showToast } from './ui.js';
import { loadPortfolio, enableEdit, disableEdit, saveLayout, setAutoSave, setSmartGuides, setGrid } from './editor.js';
import { initCalendar } from './calendar.js';
import { initChat, openOrCreateChat } from './chat.js';
import { saveGithubCfg, loadGithubCfg, clearGithubCfg, githubUploadConfigured } from './github.js';
import { readDoc, writeDoc } from './db.js';

const profileForm = document.getElementById('profile-form');
const githubForm = document.getElementById('github-form');
const clearGithubBtn = document.getElementById('gh-clear');
const prefGrid = document.getElementById('pref-grid');
const prefGuides = document.getElementById('pref-guides');
const prefLive = document.getElementById('pref-live');
const startChatBtn = document.getElementById('start-chat');
const addBlockBtn = document.getElementById('add-block');
const accountEmailForm = document.getElementById('account-email-form');
const accountEmailInput = document.getElementById('account-email');
const accountEmailPasswordInput = document.getElementById('account-email-password');
const accountPasswordForm = document.getElementById('account-password-form');
const accountPasswordCurrentInput = document.getElementById('account-password-current');
const accountPasswordNewInput = document.getElementById('account-password-new');
const accountPasswordConfirmInput = document.getElementById('account-password-confirm');
const accountProviderWarning = document.getElementById('account-provider-warning');
const settingsPanels = Array.from(document.querySelectorAll('[data-settings-visibility]'));

const preferenceToggles = [
  { element: prefGrid, storageKey: 'pref.grid', setter: setGrid, defaultChecked: true },
  { element: prefGuides, storageKey: 'pref.guides', setter: setSmartGuides, defaultChecked: true },
  { element: prefLive, storageKey: 'pref.live', setter: setAutoSave, defaultChecked: true }
];

let tattooerUid = null;

initNavigation();
initPreferences();
wireProfileForm();
wireGithubForm();
wireAccountForms();
wireChatShortcut();
toggleSettingsPanels();

async function resolveTattooerUid() {
  const hash = window.location.hash.replace('#', '');
  if (hash) return hash;
  if (currentRole === 'tattooer' && currentUser) return currentUser.uid;
  const published = await readDoc('portfolio', 'public');
  if (published?.publishedUid) return published.publishedUid;
  return 'DEMO_TATTOOER';
}

async function ensurePublishedPortfolio(uid) {
  if (!uid) return;
  const current = await readDoc('portfolio', 'public');
  if (current?.publishedUid === uid) return;
  try {
    await writeDoc('portfolio', 'public', { publishedUid: uid, updatedAt: Date.now() });
  } catch (error) {
    console.warn('Não foi possível atualizar o portfólio público.', error);
  }
}

document.addEventListener('auth:ready', () => {
  bootstrapSession().catch((error) => console.error('Falha ao inicializar sessão.', error));
});

async function bootstrapSession() {
  await ensureTattooerPublication();
  tattooerUid = await resolveTattooerUid();
  await Promise.all([loadPortfolio(tattooerUid), initCalendar(tattooerUid)]);
  initChat(tattooerUid);
  await hydrateProfileForm();
  hydrateAccountForms();
  finalizeBootstrap();
}

document.addEventListener('role:changed', () => {
  toggleEditorControls();
  toggleSettingsPanels();
  hydrateAccountForms();
});

function toggleEditorControls() {
  const ownsPortfolio = currentRole === 'tattooer' && currentUser?.uid === tattooerUid;
  if (ownsPortfolio) {
    enableEdit();
    addBlockBtn?.classList.remove('hidden');
    return;
  }
  disableEdit();
  addBlockBtn?.classList.add('hidden');
}

function wireProfileForm() {
  profileForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const payload = formToObject(profileForm);
      await updateProfileData({
        displayName: payload['profile-displayName'] || payload.displayName,
        bio: payload['profile-bio'] || payload.bio,
        avatarUrl: payload['profile-avatar'] || payload.avatar
      });
      showToast('Perfil salvo.', 'success');
    } catch (error) {
      showToast(error.message, 'error');
    }
  });
}

function wireGithubForm() {
  githubForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const cfg = {
      owner: githubForm.querySelector('#gh-owner').value.trim(),
      repo: githubForm.querySelector('#gh-repo').value.trim(),
      branch: githubForm.querySelector('#gh-branch').value.trim() || 'main',
      token: githubForm.querySelector('#gh-token').value.trim()
    };
    saveGithubCfg(cfg);
    showToast('Configuração GitHub salva localmente.', 'success');
  });

  clearGithubBtn?.addEventListener('click', () => {
    clearGithubCfg();
    githubForm.reset();
    showToast('Token removido deste dispositivo.', 'info');
  });
}

function wireAccountForms() {
  if (accountEmailForm && !accountEmailForm.dataset.bound) {
    accountEmailForm.dataset.bound = '1';
    accountEmailForm.addEventListener('submit', handleAccountEmailSubmit);
  }
  if (accountPasswordForm && !accountPasswordForm.dataset.bound) {
    accountPasswordForm.dataset.bound = '1';
    accountPasswordForm.addEventListener('submit', handleAccountPasswordSubmit);
  }
}

function hydrateGithubForm() {
  const cfg = loadGithubCfg();
  if (!githubForm || !cfg.owner) return;
  githubForm.querySelector('#gh-owner').value = cfg.owner || '';
  githubForm.querySelector('#gh-repo').value = cfg.repo || '';
  githubForm.querySelector('#gh-branch').value = cfg.branch || 'main';
}

async function hydrateProfileForm() {
  if (!profileForm || !currentUser) return;
  const data = await readDoc('users', currentUser.uid);
  if (!data) return;
  profileForm.querySelector('#profile-displayName').value = data.displayName || '';
  profileForm.querySelector('#profile-bio').value = data.bio || '';
  profileForm.querySelector('#profile-avatar').value = data.avatarUrl || '';
}

function hydrateAccountForms() {
  const signedIn = Boolean(currentUser);
  const passwordCapable = supportsPasswordAccount();

  if (!signedIn) {
    accountEmailForm?.reset();
    accountPasswordForm?.reset();
  } else if (accountEmailInput) {
    accountEmailInput.value = currentUser.email || '';
  }

  accountEmailPasswordInput && (accountEmailPasswordInput.value = '');
  accountPasswordCurrentInput && (accountPasswordCurrentInput.value = '');
  accountPasswordNewInput && (accountPasswordNewInput.value = '');
  accountPasswordConfirmInput && (accountPasswordConfirmInput.value = '');

  setFormEnabled(accountEmailForm, signedIn && passwordCapable);
  setFormEnabled(accountPasswordForm, signedIn && passwordCapable);

  if (accountProviderWarning) {
    accountProviderWarning.hidden = !signedIn || passwordCapable;
  }
}

async function handleAccountEmailSubmit(event) {
  event.preventDefault();
  if (!accountEmailInput) return;
  if (!supportsPasswordAccount()) {
    showToast('Gerencie email e senha pelo provedor onde fez o cadastro.', 'info');
    return;
  }
  const email = accountEmailInput.value.trim();
  const currentPassword = accountEmailPasswordInput?.value || '';
  try {
    await updateAccountEmail({ email, currentPassword });
    hydrateAccountForms();
  } catch (error) {
    showToast(error.message || 'Não foi possível atualizar o email.', 'error');
  }
}

async function handleAccountPasswordSubmit(event) {
  event.preventDefault();
  if (!supportsPasswordAccount()) {
    showToast('Gerencie email e senha pelo provedor onde fez o cadastro.', 'info');
    return;
  }
  const currentPassword = accountPasswordCurrentInput?.value || '';
  const newPassword = accountPasswordNewInput?.value || '';
  const confirmation = accountPasswordConfirmInput?.value || '';
  if (newPassword !== confirmation) {
    showToast('As senhas não conferem.', 'error');
    return;
  }
  try {
    await updateAccountPassword({ currentPassword, newPassword });
    accountPasswordForm?.reset();
  } catch (error) {
    showToast(error.message || 'Não foi possível atualizar a senha.', 'error');
  }
}

function supportsPasswordAccount() {
  return Boolean(currentUser?.providerData?.some((provider) => provider.providerId === 'password'));
}

function setFormEnabled(form, enabled) {
  if (!form) return;
  form.querySelectorAll('input, button').forEach((element) => {
    element.disabled = !enabled;
  });
}

function toggleSettingsPanels() {
  settingsPanels.forEach((panel) => {
    if (!panel) return;
    const visibility = panel.dataset.settingsVisibility || 'all';
    const shouldShow =
      visibility === 'all' ||
      (visibility === 'signed' && Boolean(currentUser)) ||
      (visibility === 'tattooer' && currentRole === 'tattooer');
    panel.classList.toggle('hidden', !shouldShow);
  });
}

function initPreferences() {
  preferenceToggles.forEach(setupPreferenceToggle);
}

function wireChatShortcut() {
  startChatBtn?.addEventListener('click', () => openOrCreateChat());
}

addBlockBtn?.addEventListener('click', () => switchView('portfolio'));

window.addEventListener('beforeunload', () => {
  if (githubUploadConfigured()) return;
  sessionStorage.setItem('upload.warning', '1');
});

async function ensureTattooerPublication() {
  if (currentRole !== 'tattooer' || !currentUser) return;
  await ensurePublishedPortfolio(currentUser.uid);
}

function finalizeBootstrap() {
  switchView('portfolio');
  toggleEditorControls();
  toggleSettingsPanels();
  hydrateGithubForm();
}

function setupPreferenceToggle({ element, storageKey, setter, defaultChecked }) {
  if (!element || !element.id) return;
  const stored = localStorage.getItem(storageKey);
  const enabled = stored === null ? defaultChecked : stored !== '0';
  element.checked = enabled;
  setter(enabled);
  bindToggle(element.id, (checked) => {
    localStorage.setItem(storageKey, checked ? '1' : '0');
    setter(checked);
  });
}
