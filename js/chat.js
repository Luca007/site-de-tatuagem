import { db, doc, getDoc, setDoc, collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, where } from './firebase.js';
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

const state = {
  tattooerUid: null,
  activeChat: null,
  unsubMessages: null,
  unsubChats: null,
  chats: [],
  contactNames: new Map(),
  pendingContacts: new Set(),
  searchTerm: ''
};

export function initChat(tattooerUid) {
  state.tattooerUid = tattooerUid;
  state.contactNames.clear();
  state.pendingContacts.clear();
  state.searchTerm = '';
  configureLayoutForRole();
  subscribeChats();
  bindForm();
  bindSearch();
  showEmptyChatState();
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

function deriveChatListState() {
  if (!currentUser) {
    return {
      type: 'placeholder',
      message: 'Entre para visualizar suas conversas.',
      hint: 'Entre para conversar com o estúdio.'
    };
  }

  if (!state.chats.length) {
    return isTattooer()
      ? {
          type: 'placeholder',
          message: 'Nenhum cliente iniciou conversa ainda.',
          hint: 'Selecione uma conversa para visualizar as mensagens.'
        }
      : {
          type: 'placeholder',
          message: 'Nenhuma conversa iniciada ainda.',
          hint: 'Use "Falar com o estúdio" para iniciar um chat com o tatuador.'
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
  if (!isTattooer() || !state.searchTerm) return state.chats;
  const term = state.searchTerm.toLowerCase();
  return state.chats.filter((chat) => {
    const label = chatDisplayName(chat).toLowerCase();
    const preview = (chat.lastMessagePreview || '').toLowerCase();
    return label.includes(term) || preview.includes(term) || chat.id.toLowerCase().includes(term);
  });
}

function chatDisplayName(chat) {
  const other = chat.participants.find((uid) => uid !== currentUser?.uid);
  if (!other) return 'Você';
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
  const mine = msg.fromUid === currentUser?.uid ? ' you' : '';
  const text = msg.text ? `<p>${escapeHtml(msg.text)}</p>` : '';
  const image = msg.imageUrl ? `<img src="${msg.imageUrl}" alt="Imagem enviada" />` : '';
  const createdAt = msg.createdAt?.toDate ? msg.createdAt.toDate() : new Date(msg.createdAt || Date.now());
  return `
    <div class="message${mine}">
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

function configureLayoutForRole() {
  const tattooerView = isTattooer();
  chatSearchContainer?.classList.toggle('hidden', !tattooerView);
  if (chatSidebarHint) {
    chatSidebarHint.textContent = tattooerView
      ? 'Selecione um cliente para responder.'
      : 'Converse diretamente com o estúdio para tirar dúvidas.';
  }
  if (startChatBtn) {
    startChatBtn.classList.remove('hidden');
    const label = startChatBtn.querySelector('span:last-child');
    if (label) label.textContent = tattooerView ? 'Nova conversa' : 'Falar com o estúdio';
  }
  if (!tattooerView) {
    state.searchTerm = '';
    if (chatSearchInput) chatSearchInput.value = '';
  }
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
  if (!state.chats.length) {
    state.activeChat = null;
  showEmptyChatState(isTattooer() ? 'Selecione uma conversa para visualizar as mensagens.' : 'Use "Falar com o estúdio" para abrir um chat.');
    highlightActiveChatButton(null);
    return;
  }

  if (state.activeChat && state.chats.some((chat) => chat.id === state.activeChat.id)) {
    highlightActiveChatButton(state.activeChat.id);
    return;
  }

  if (isTattooer()) {
    state.activeChat = null;
    showEmptyChatState('Selecione uma conversa para visualizar as mensagens.');
    return;
  }

  openChat(state.chats[0].id);
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
  const snapshot = await getDoc(chatRef);
  if (!snapshot.exists()) {
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
  }
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
});

document.addEventListener('role:changed', () => {
  configureLayoutForRole();
});
