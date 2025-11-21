import { db, doc, getDoc, getDocs, setDoc, collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, where } from './firebase.js';
import { addWatermark } from './watermark.js';
import { githubUploadConfigured, uploadToGitHub, buildCdnUrl } from './github.js';
import { currentUser, isTattooer } from './auth.js';
import { showToast } from './ui.js';

const chatView = document.getElementById('chat-view');
const chatListEl = document.getElementById('chat-list');
const chatBoxEl = document.getElementById('chat-box');
const messagesEl = document.getElementById('messages');
const chatEmptyEl = document.getElementById('chat-empty');
const chatSidebarHint = document.getElementById('chat-sidebar-hint');
const chatSearchContainer = document.getElementById('chat-search-container');
const chatSearchInput = document.getElementById('chat-search');
const formEl = document.getElementById('send-form');
const messageInput = document.getElementById('msg');
const fileInput = document.getElementById('imgfile');
const chatTitle = document.getElementById('chat-title');
const chatParticipants = document.getElementById('chat-participants');
const startChatBtn = document.getElementById('start-chat');
const chatClientCard = document.getElementById('chat-client-card');
const chatClientCardCopy = document.getElementById('chat-client-card-copy');
const chatClientCardBtn = document.getElementById('chat-client-card-btn');
const chatStartModal = document.getElementById('chat-start-modal');
const chatStartResults = document.getElementById('chat-start-results');
const chatStartSearch = document.getElementById('chat-start-search');

const state = {
  tattooerUid: null,
  activeChat: null,
  unsubMessages: null,
  unsubChats: null,
  chats: [],
  contactNames: new Map(),
  pendingContacts: new Set(),
  searchTerm: '',
  userDirectory: [],
  userDirectoryLoaded: false,
  userDirectorySearch: ''
};

export function initChat(tattooerUid) {
  state.tattooerUid = tattooerUid;
  state.contactNames.clear();
  state.pendingContacts.clear();
  state.searchTerm = '';
  state.userDirectory = [];
  state.userDirectoryLoaded = false;
  state.userDirectorySearch = '';
  configureLayoutForRole();
  subscribeChats();
  bindForm();
  bindSearch();
  bindClientCardButton();
  bindStartChatButton();
  bindChatStartModal();
  showEmptyChatState();
  ensureClientChatForCurrentTattooer({ openAfterCreate: true });
}

function subscribeChats() {
  state.unsubChats?.();
  if (!currentUser) {
    state.chats = [];
    state.activeChat = null;
    state.searchTerm = '';
    if (chatSearchInput) chatSearchInput.value = '';
    renderChatList();
    showEmptyChatState('Entre para conversar com o estúdio.');
    return;
  }
  configureLayoutForRole();
  const uid = currentUser.uid;
  const chatsRef = collection(db, 'chats');
  const chatQuery = query(chatsRef, where('participants', 'array-contains', uid));
  state.unsubChats = onSnapshot(
    chatQuery,
    (snapshot) => {
      state.chats = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0));
      if (shouldLimitToCurrentTattooer()) {
        ensureClientChatForCurrentTattooer({ openAfterCreate: true });
      }
      renderChatList();
      autoOpenPrimaryChat();
    },
    handleChatSubscriptionError
  );
}

function handleChatSubscriptionError(error) {
  console.warn('Erro ao sincronizar conversas.', error);
  state.unsubChats?.();
  state.unsubChats = null;
}

function renderChatList() {
  if (!chatListEl) return;
  const stateInfo = deriveChatListState();
  if (stateInfo.type !== 'ready') {
    renderChatPlaceholder(stateInfo.message, stateInfo.hint);
    return;
  }

  chatListEl.innerHTML = stateInfo.chats.map(buildChatListItem).join('');
  activateChatButtons();
}

function visibleChats() {
  if (isTattooer()) return state.chats;
  if (!state.tattooerUid) return [];
  return state.chats.filter((chat) => chat.participants.includes(state.tattooerUid));
}

function shouldLimitToCurrentTattooer() {
  return Boolean(
    currentUser &&
      !isTattooer() &&
      state.tattooerUid &&
      currentUser.uid !== state.tattooerUid
  );
}

async function ensureClientChatForCurrentTattooer({ openAfterCreate = false } = {}) {
  if (!shouldLimitToCurrentTattooer()) return;
  const chatId = composeChatId(state.tattooerUid, currentUser.uid);
  const alreadyExists = visibleChats().some((chat) => chat.id === chatId);
  if (alreadyExists) {
    if (openAfterCreate) await openChat(chatId);
    return;
  }
  try {
    await ensureChatDocument(state.tattooerUid, currentUser.uid);
    if (openAfterCreate) await openChat(chatId);
  } catch (error) {
    console.warn('Falha ao preparar chat do cliente.', error);
  }
}

function deriveChatListState() {
  if (!currentUser) {
    return {
      type: 'placeholder',
      message: 'Entre para visualizar suas conversas.',
      hint: 'Entre para conversar com o estúdio.'
    };
  }

  const scopedChats = visibleChats();

  if (!scopedChats.length) {
    return isTattooer()
      ? {
          type: 'placeholder',
          message: 'Nenhum cliente iniciou conversa ainda.',
          hint: 'Selecione uma conversa para visualizar as mensagens.'
        }
      : {
          type: 'placeholder',
          message: 'Nenhuma conversa iniciada ainda.',
          hint: 'Envie a primeira mensagem para conversar com o tatuador.'
        };
  }

  const chats = filteredChats();
  if (!chats.length) {
    return {
      type: 'placeholder',
      message: 'Nenhuma conversa encontrada.',
      hint: 'Refine a busca ou limpe o filtro.'
    };
  }

  return { type: 'ready', chats };
}

function buildChatListItem(chat) {
  const name = chatDisplayName(chat);
  const last = chat.lastMessagePreview || 'Conversa vazia';
  const timestamp = formatRelative(chat.lastMessageAt);
  return `
    <button class="chat-item" data-chat="${chat.id}">
      <span class="name">${escapeHtml(name)}</span>
      <span class="last">${escapeHtml(last)}</span>
      <span class="meta"><span>${timestamp}</span></span>
    </button>
  `;
}

function activateChatButtons() {
  chatListEl.querySelectorAll('[data-chat]').forEach((button) => {
    button.addEventListener('click', () => openChat(button.dataset.chat));
    if (button.dataset.chat === state.activeChat?.id) button.classList.add('active');
  });
}

function renderChatPlaceholder(message, emptyHint) {
  if (chatListEl) chatListEl.innerHTML = `<p class="muted">${escapeHtml(message)}</p>`;
  showEmptyChatState(emptyHint);
}

function filteredChats() {
  const base = visibleChats();
  if (!isTattooer() || !state.searchTerm) return base;
  const term = state.searchTerm.toLowerCase();
  return base.filter((chat) => {
    const label = chatDisplayName(chat).toLowerCase();
    const preview = (chat.lastMessagePreview || '').toLowerCase();
    return label.includes(term) || preview.includes(term) || chat.id.toLowerCase().includes(term);
  });
}

function chatDisplayName(chat) {
  const other = chat.participants.find((uid) => uid !== currentUser?.uid);
  if (!other) return 'Você';
  if (!isTattooer() && other === state.tattooerUid) return 'Seu tatuador';
  return getContactName(other);
}

function getContactName(uid) {
  if (!uid) return 'Cliente';
  if (state.contactNames.has(uid)) return state.contactNames.get(uid);
  if (!state.pendingContacts.has(uid)) {
    state.pendingContacts.add(uid);
    fetchContactName(uid);
  }
  return uid.slice(0, 6);
}

function updateClientCardCopy() {
  if (!chatClientCardCopy) return;
  chatClientCardCopy.textContent = 'Envie referências e tire dúvidas diretamente com o estúdio.';
}

function handleChatStartSearch() {
  state.userDirectorySearch = chatStartSearch?.value?.trim().toLowerCase() || '';
  renderChatStartResults();
}

function filteredUserDirectory() {
  const base = state.userDirectory.filter((user) => user.id !== state.tattooerUid);
  if (!state.userDirectorySearch) return base;
  const term = state.userDirectorySearch;
  return base.filter((user) => {
    return (
      user.displayName.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term)
    );
  });
}

function renderChatStartResults() {
  if (!chatStartResults) return;
  const users = filteredUserDirectory();
  if (!users.length) {
    chatStartResults.innerHTML = '<p class="chat-start-empty">Nenhum cliente encontrado.</p>';
    return;
  }
  chatStartResults.innerHTML = users
    .map((user) => {
      const roleLabel = user.role === 'tattooer' ? 'Tatuador' : 'Cliente';
      return `
        <button type="button" data-chat-user="${user.id}" role="option">
          <span class="user-meta">
            <strong>${escapeHtml(user.displayName)}</strong>
            <small>${escapeHtml(user.email)}</small>
          </span>
          <span class="user-role">${roleLabel}</span>
        </button>
      `;
    })
    .join('');
  chatStartResults.querySelectorAll('[data-chat-user]').forEach((button) => {
    button.addEventListener('click', () => handleDirectorySelection(button.dataset.chatUser));
  });
}

function closeChatDirectory() {
  chatStartModal?.close();
}

async function handleDirectorySelection(uid) {
  if (!uid || uid === state.tattooerUid) return;
  closeChatDirectory();
  try {
    const { chatId } = await ensureChatDocument(state.tattooerUid, uid);
    await openChat(chatId);
  } catch (error) {
    console.warn('Erro ao abrir conversa com cliente.', error);
    showToast('Não foi possível iniciar o chat.', 'error');
  }
}

async function ensureUserDirectory() {
  if (state.userDirectoryLoaded || !isTattooer()) return state.userDirectory;
  const snapshot = await getDocs(collection(db, 'users'));
  state.userDirectory = snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data(), displayName: doc.data().displayName || doc.data().email || 'Sem nome' }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName, 'pt-BR'));
  state.userDirectoryLoaded = true;
  return state.userDirectory;
}

export async function openChatDirectory() {
  if (!isTattooer()) {
    openOrCreateChat();
    return;
  }
  await ensureUserDirectory();
  state.userDirectorySearch = '';
  if (chatStartSearch) chatStartSearch.value = '';
  renderChatStartResults();
  chatStartModal?.showModal();
  chatStartSearch?.focus();
}

async function fetchContactName(uid) {
  try {
    const snapshot = await getDoc(doc(db, 'users', uid));
    const data = snapshot.data();
    const label = data?.displayName || data?.email || uid;
    state.contactNames.set(uid, label);
  } catch (error) {
    state.contactNames.set(uid, uid);
  } finally {
    state.pendingContacts.delete(uid);
    renderChatList();
  }
}

async function openChat(chatId) {
  if (!currentUser) return;
  if (state.unsubMessages) state.unsubMessages();
  const chatRef = doc(db, 'chats', chatId);
  const snapshot = await getDoc(chatRef);
  if (!snapshot.exists()) return;
  const chat = { id: chatRef.id, ...snapshot.data() };
  state.activeChat = chat;
  if (chatBoxEl) chatBoxEl.classList.remove('hidden');
  hideEmptyChatState();
  chatTitle.textContent = chatDisplayName(chat);
  chatParticipants.textContent = participantsLabel(chat.participants);
  highlightActiveChatButton(chat.id);
  const messagesRef = collection(db, 'chats', chatId, 'messages');
  const messagesQuery = query(messagesRef, orderBy('createdAt', 'asc'));
  state.unsubMessages = onSnapshot(messagesQuery, (ss) => {
    const messages = ss.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    renderMessages(messages);
  });
}

function renderMessages(list) {
  if (!messagesEl) return;
  if (!list.length) {
    renderNoMessages();
    return;
  }
  messagesEl.innerHTML = list.map(buildMessageMarkup).join('');
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function buildMessageMarkup(msg) {
  const mine = msg.fromUid === currentUser?.uid;
  const direction = mine ? 'you' : 'them';
  const text = msg.text ? `<p>${escapeHtml(msg.text)}</p>` : '';
  const image = msg.imageUrl ? `<img src="${msg.imageUrl}" alt="Imagem enviada" />` : '';
  const createdAt = msg.createdAt?.toDate ? msg.createdAt.toDate() : new Date(msg.createdAt || Date.now());
  return `
    <div class="message ${direction}">
      ${text}
      ${image}
      <span class="timestamp">${createdAt.toLocaleString()}</span>
    </div>
  `;
}

function renderNoMessages() {
  if (!messagesEl) return;
  messagesEl.innerHTML = '<p class="muted message-placeholder">Nenhuma mensagem por aqui ainda.</p>';
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function bindForm() {
  if (!formEl || formEl.dataset.bound) return;
  formEl.dataset.bound = '1';
  formEl.addEventListener('submit', handleSendMessage);
}

function bindSearch() {
  if (!chatSearchInput || chatSearchInput.dataset.bound) return;
  chatSearchInput.dataset.bound = '1';
  chatSearchInput.addEventListener('input', () => {
    state.searchTerm = chatSearchInput.value.trim().toLowerCase();
    renderChatList();
  });
}

function bindClientCardButton() {
  if (!chatClientCardBtn || chatClientCardBtn.dataset.bound) return;
  chatClientCardBtn.dataset.bound = '1';
  chatClientCardBtn.addEventListener('click', () => openOrCreateChat());
}

function bindStartChatButton() {
  if (!startChatBtn || startChatBtn.dataset.bound) return;
  startChatBtn.dataset.bound = '1';
  startChatBtn.addEventListener('click', () => openChatDirectory());
}

function bindChatStartModal() {
  if (chatStartModal && !chatStartModal.dataset.bound) {
    chatStartModal.dataset.bound = '1';
    chatStartModal.addEventListener('cancel', (event) => {
      event.preventDefault();
      closeChatDirectory();
    });
    chatStartModal.querySelector('[data-chat-start-close]')?.addEventListener('click', () => closeChatDirectory());
  }
  if (chatStartSearch && !chatStartSearch.dataset.bound) {
    chatStartSearch.dataset.bound = '1';
    chatStartSearch.addEventListener('input', handleChatStartSearch);
  }
}

function configureLayoutForRole() {
  const tattooerView = isTattooer();
  configureSharedLayout(tattooerView);
  if (!tattooerView) {
    applyClientLayout();
  }
}

function configureSharedLayout(tattooerView) {
  toggleSharedElements(tattooerView);
  updateSidebarHint(tattooerView);
  updateStartChatButton(tattooerView);
}

function toggleSharedElements(tattooerView) {
  chatSearchContainer?.classList.toggle('hidden', !tattooerView);
  chatView?.classList.toggle('client-chat', !tattooerView);
  chatClientCard?.classList.toggle('hidden', tattooerView);
}

function updateSidebarHint(tattooerView) {
  if (!chatSidebarHint) return;
  chatSidebarHint.textContent = tattooerView
    ? 'Selecione um cliente para responder.'
    : 'Converse diretamente com o estúdio para tirar dúvidas.';
}

function updateStartChatButton(tattooerView) {
  if (!startChatBtn) return;
  startChatBtn.classList.remove('hidden');
  const label = startChatBtn.querySelector('span:last-child');
  if (label) label.textContent = tattooerView ? 'Nova conversa' : 'Falar com o estúdio';
}

function applyClientLayout() {
  state.searchTerm = '';
  if (chatSearchInput) chatSearchInput.value = '';
  updateClientCardCopy();
}

function showEmptyChatState(message = 'Selecione uma conversa para começar.') {
  if (chatBoxEl) chatBoxEl.classList.remove('hidden');
  if (!chatEmptyEl) return;
  chatEmptyEl.textContent = message;
  chatEmptyEl.style.display = state.activeChat ? 'none' : 'grid';
  if (!state.activeChat && messagesEl) messagesEl.innerHTML = '';
}

function hideEmptyChatState() {
  if (!chatEmptyEl) return;
  chatEmptyEl.style.display = 'none';
}

function highlightActiveChatButton(chatId) {
  if (!chatListEl) return;
  chatListEl.querySelectorAll('[data-chat]').forEach((button) => {
    button.classList.toggle('active', button.dataset.chat === chatId);
  });
}

function participantsLabel(participants = []) {
  return participants
    .map((uid) => (uid === currentUser?.uid ? 'Você' : getContactName(uid)))
    .join(' • ');
}

function autoOpenPrimaryChat() {
  const chats = visibleChats();
  if (!chats.length) {
    state.activeChat = null;
    const emptyMessage = isTattooer()
      ? 'Selecione uma conversa para visualizar as mensagens.'
      : 'Envie a primeira mensagem para conversar com o estúdio.';
    showEmptyChatState(emptyMessage);
    highlightActiveChatButton(null);
    return;
  }

  if (state.activeChat && chats.some((chat) => chat.id === state.activeChat.id)) {
    highlightActiveChatButton(state.activeChat.id);
    return;
  }

  if (isTattooer()) {
    state.activeChat = null;
    showEmptyChatState('Selecione uma conversa para visualizar as mensagens.');
    return;
  }

  openChat(chats[0].id);
}

async function handleSendMessage(event) {
  event.preventDefault();
  if (!canSendMessage()) return;
  const { text, file } = captureMessageForm();
  const imageUrl = file ? await processImage(file) : null;
  if (file && !imageUrl) return;
  await persistMessage(text, imageUrl);
  resetForm();
}

function canSendMessage() {
  return Boolean(currentUser && state.activeChat);
}

function captureMessageForm() {
  return {
    text: messageInput.value.trim(),
    file: fileInput.files?.[0] || null
  };
}

async function persistMessage(text, imageUrl) {
  const messagesRef = collection(db, 'chats', state.activeChat.id, 'messages');
  await addDoc(messagesRef, {
    fromUid: currentUser.uid,
    text: text || null,
    imageUrl: imageUrl || null,
    createdAt: serverTimestamp()
  });
  await setDoc(
    doc(db, 'chats', state.activeChat.id),
    {
      lastMessageAt: Date.now(),
      lastMessagePreview: text || (imageUrl ? 'Imagem enviada' : ''),
      participants: state.activeChat.participants
    },
    { merge: true }
  );
}

function resetForm() {
  messageInput.value = '';
  fileInput.value = '';
}

async function processImage(file) {
  if (!githubUploadConfigured()) {
    showToast('Configure o upload GitHub nas configurações para enviar imagens.', 'error');
    return null;
  }
  const stamped = await addWatermark(file, watermarkLabel());
  const base64 = await toBase64(stamped);
  const path = `chat/${state.activeChat.id}/${Date.now()}_${stamped.name}`;
  const { owner, repo, branch } = await uploadToGitHub(base64, path, `Upload chat ${stamped.name}`);
  return buildCdnUrl(owner, repo, branch, path);
}

function watermarkLabel() {
  return `PREVIEW – © ${currentUser?.displayName || 'Tattooer'}`;
}

function toBase64(file) {
  return file.arrayBuffer().then((buffer) => {
    let binary = '';
    new Uint8Array(buffer).forEach((b) => {
      binary += String.fromCharCode(b);
    });
    return btoa(binary);
  });
}

export async function openOrCreateChat() {
  if (!currentUser) {
    showToast('Entre para iniciar uma conversa.', 'info');
    return;
  }
  if (isTattooer()) {
    const nextChat = state.chats[0];
    if (!nextChat) {
      showToast('Nenhum cliente iniciou conversa ainda.', 'info');
      return;
    }
    openChat(nextChat.id);
    return;
  }
  const tattooer = state.tattooerUid;
  if (!tattooer) {
    showToast('Nenhum tatuador selecionado.', 'error');
    return;
  }
  const { chatId } = await ensureChatDocument(tattooer, currentUser.uid);
  openChat(chatId);
}

export async function sendBookingRequestMessage({ slot, tattooerUid, timezone }) {
  if (!currentUser) throw new Error('auth-required');
  if (!slot || !tattooerUid) throw new Error('missing-booking-data');

  const { chatId, participants } = await ensureChatDocument(tattooerUid, currentUser.uid);
  const zone = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const formattedDate = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: zone
  }).format(new Date(slot.id));
  const duration = slot.durationMin || 60;
  const text = `Olá! Gostaria de reservar o horário ${formattedDate} (${duration} min). Pode confirmar para mim?`;
  const messagesRef = collection(db, 'chats', chatId, 'messages');
  await addDoc(messagesRef, {
    fromUid: currentUser.uid,
    text,
    slotId: slot.id,
    durationMin: duration,
    timezone: zone,
    type: 'booking-request',
    createdAt: serverTimestamp()
  });
  await setDoc(
    doc(db, 'chats', chatId),
    {
      lastMessageAt: Date.now(),
      lastMessagePreview: text,
      participants
    },
    { merge: true }
  );
  await openChat(chatId);
}

function composeChatId(a, b) {
  return [a, b].sort().join('_');
}

async function ensureChatDocument(tattooerUid, clientUid) {
  if (!tattooerUid || !clientUid) throw new Error('Participantes inválidos para o chat.');
  const participants = [tattooerUid, clientUid].sort();
  const chatId = composeChatId(tattooerUid, clientUid);
  const chatRef = doc(db, 'chats', chatId);
  await setDoc(
    chatRef,
    {
      participants,
      createdAt: Date.now(),
      lastMessageAt: Date.now(),
      lastMessagePreview: ''
    },
    { merge: true }
  );
  return { chatId, participants };
}

function escapeHtml(text = '') {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatRelative(ts) {
  if (!ts) return '';
  const date = typeof ts.toDate === 'function' ? ts.toDate() : new Date(ts);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString();
}

document.addEventListener('auth:ready', () => {
  subscribeChats();
  ensureClientChatForCurrentTattooer({ openAfterCreate: true });
});

document.addEventListener('role:changed', () => {
  configureLayoutForRole();
  ensureClientChatForCurrentTattooer({ openAfterCreate: true });
});
