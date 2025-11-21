import {
  auth,
  db,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  updateProfile,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from './firebase.js';
import { showToast, formToObject, switchView } from './ui.js';

const userInfo = document.getElementById('user-info');
const btnLogin = document.getElementById('btn-login');
const btnLogout = document.getElementById('btn-logout');
const btnSettings = document.getElementById('btn-settings');
const btnChat = document.getElementById('btn-chat');
const authDialog = document.getElementById('auth-dialog');
const authClose = document.getElementById('auth-close');
const authTabs = Array.from(document.querySelectorAll('[data-auth-tab]'));
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const loginGoogleBtn = document.getElementById('login-google');
const chatView = document.getElementById('chat-view');

export let currentUser = null;
export let currentRole = 'guest';
let activeAuthView = 'login';

function setRole(role) {
  currentRole = role || 'client';
  document.body.dataset.role = currentRole;
  document.dispatchEvent(new CustomEvent('role:changed', { detail: currentRole }));
}

async function ensureUserDoc(user) {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      role: 'client',
      email: user.email || '',
      displayName: user.displayName || user.email || 'Sem nome',
      bio: '',
      avatarUrl: '',
      createdAt: Date.now()
    });
    return { role: 'client' };
  }
  return snap.data();
}

onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  if (!user) {
    document.body.dataset.auth = 'signed-out';
    setRole('guest');
    userInfo.textContent = 'Convidado';
    btnLogin?.classList.remove('hidden');
    btnLogout?.classList.add('hidden');
    btnSettings?.classList.add('hidden');
    btnChat?.classList.add('hidden');
    redirectGuestFromRestrictedViews();
    document.dispatchEvent(new CustomEvent('auth:ready', { detail: null }));
    return;
  }

  document.body.dataset.auth = 'signed-in';
  const data = await ensureUserDoc(user);
  setRole(data.role || 'client');
  userInfo.textContent = `${user.displayName || user.email} (${currentRole})`;
  btnLogin?.classList.add('hidden');
  btnLogout?.classList.remove('hidden');
  btnSettings?.classList.toggle('hidden', !user);
  btnChat?.classList.toggle('hidden', !user);
  document.dispatchEvent(new CustomEvent('auth:ready', { detail: user }));
  closeAuthDialog();
});

btnLogin?.addEventListener('click', () => openAuthDialog('login'));

btnLogout?.addEventListener('click', async () => {
  await signOut(auth);
  showToast('Até breve!', 'info');
});

authTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    const targetView = tab.dataset.authTab || 'login';
    if (authDialog?.open) {
      showAuthView(targetView);
    } else {
      openAuthDialog(targetView);
    }
  });
});

authClose?.addEventListener('click', () => closeAuthDialog());

authDialog?.addEventListener('cancel', (event) => {
  event.preventDefault();
  closeAuthDialog();
});

authDialog?.addEventListener('close', () => resetAuthDialog());

loginForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const { email = '', password = '' } = formToObject(loginForm);
  if (!email || !password) {
    showToast('Informe email e senha para entrar.', 'error');
    return;
  }
  try {
    await signInWithEmailAndPassword(auth, email, password);
    showToast('Bem-vindo de volta!', 'success');
    closeAuthDialog();
  } catch (error) {
    showToast(authErrorMessage(error), 'error');
  }
});

registerForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = formToObject(registerForm);
  const { displayName = '', email = '', password = '', confirmPassword = '' } = formData;
  const validationMessage = validateRegistrationForm({ displayName, email, password, confirmPassword });
  if (validationMessage) {
    showToast(validationMessage, 'error');
    return;
  }
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
      await updateProfile(credential.user, { displayName });
    }
    showToast('Conta criada! Agora é só personalizar seu portfólio.', 'success');
    closeAuthDialog();
  } catch (error) {
    showToast(authErrorMessage(error), 'error');
  }
});

loginGoogleBtn?.addEventListener('click', async () => {
  try {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
    showToast('Login realizado com Google.', 'success');
    closeAuthDialog();
  } catch (error) {
    showToast(authErrorMessage(error), 'error');
  }
});

export async function updateProfileData(payload = {}) {
  if (!currentUser) throw new Error('Precisa estar autenticado.');
  const { displayName, bio, avatarUrl } = normaliseProfileFields(payload);
  const ref = doc(db, 'users', currentUser.uid);
  await updateDoc(ref, { displayName, bio, avatarUrl });
  await maybeRefreshAuthProfile(displayName);
  showToast('Perfil atualizado.', 'success');
}

export async function updateAccountEmail({ email, currentPassword }) {
  if (!currentUser) throw new Error('Precisa estar autenticado.');
  const nextEmail = email?.trim();
  if (!nextEmail) throw new Error('Informe um email válido.');
  try {
    await reauthenticateWithPassword(currentPassword);
    await updateEmail(currentUser, nextEmail);
    await updateDoc(doc(db, 'users', currentUser.uid), { email: nextEmail });
    showToast('Email atualizado com sucesso.', 'success');
  } catch (error) {
    handleAccountError(error);
  }
}

export async function updateAccountPassword({ currentPassword, newPassword }) {
  if (!currentUser) throw new Error('Precisa estar autenticado.');
  const nextPassword = newPassword?.trim();
  if (!nextPassword || nextPassword.length < 6) throw new Error('A nova senha deve ter ao menos 6 caracteres.');
  try {
    await reauthenticateWithPassword(currentPassword);
    await updatePassword(currentUser, nextPassword);
    showToast('Senha atualizada com sucesso.', 'success');
  } catch (error) {
    handleAccountError(error);
  }
}

function normaliseProfileFields({ displayName, bio, avatarUrl }) {
  return {
    displayName: displayName || currentUser?.displayName || '',
    bio: bio || '',
    avatarUrl: avatarUrl || ''
  };
}

function hasPasswordProvider() {
  return currentUser?.providerData?.some((provider) => provider.providerId === 'password');
}

async function reauthenticateWithPassword(password) {
  if (!hasPasswordProvider()) {
    throw new Error('Esta conta usa login social. Gerencie email e senha pelo provedor original.');
  }
  if (!password) throw new Error('Informe sua senha atual para confirmar.');
  const email = currentUser?.email;
  if (!email) throw new Error('Email não disponível para reautenticação.');
  const credential = EmailAuthProvider.credential(email, password);
  await reauthenticateWithCredential(currentUser, credential);
}

function handleAccountError(error) {
  if (!error) return;
  if (error.code) throw new Error(authErrorMessage(error));
  throw error;
}

async function maybeRefreshAuthProfile(displayName) {
  if (!displayName || displayName === currentUser?.displayName) return;
  await updateProfile(currentUser, { displayName });
}

export function isTattooer() {
  return currentRole === 'tattooer';
}

function openAuthDialog(view = 'login') {
  activeAuthView = view;
  showAuthView(view);
  if (!authDialog) return;
  if (!authDialog.open) {
    clearAuthForms();
    authDialog.showModal();
  }
}

function closeAuthDialog() {
  if (!authDialog?.open) return;
  authDialog.close();
}

function showAuthView(view) {
  activeAuthView = view;
  authTabs.forEach((tab) => {
    const isActive = tab.dataset.authTab === view;
    tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
  if (loginForm) {
    const showLogin = view === 'login';
    loginForm.classList.toggle('active', showLogin);
    toggleHidden(loginForm, !showLogin);
  }
  if (registerForm) {
    const showRegister = view === 'register';
    registerForm.classList.toggle('active', showRegister);
    toggleHidden(registerForm, !showRegister);
  }
}

function clearAuthForms() {
  loginForm?.reset();
  registerForm?.reset();
}

function toggleHidden(element, shouldHide) {
  if (!element) return;
  if (shouldHide) element.setAttribute('hidden', '');
  else element.removeAttribute('hidden');
}

function resetAuthDialog() {
  clearAuthForms();
  activeAuthView = 'login';
  showAuthView(activeAuthView);
}

function authErrorMessage(error) {
  const map = {
    'auth/user-not-found': 'Usuário não encontrado. Verifique o email.',
    'auth/wrong-password': 'Senha inválida. Tente novamente.',
    'auth/invalid-email': 'Email inválido.',
    'auth/email-already-in-use': 'Este email já está em uso.',
    'auth/popup-closed-by-user': 'Login cancelado antes de concluir.',
    'auth/weak-password': 'Escolha uma senha com pelo menos 6 caracteres.'
  };
  return map[error.code] || 'Não foi possível concluir a ação. Tente novamente.';
}

function validateRegistrationForm({ displayName, email, password, confirmPassword }) {
  if (!displayName) return 'Informe seu nome artístico.';
  if (!email) return 'Informe um email válido.';
  if (!password) return 'Defina uma senha.';
  if (password.length < 6) return 'A senha deve ter pelo menos 6 caracteres.';
  if (password !== confirmPassword) return 'As senhas não conferem.';
  return '';
}

function redirectGuestFromRestrictedViews() {
  if (!chatView?.classList.contains('active')) return;
  switchView('portfolio');
}
