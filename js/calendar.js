import { db, doc, runTransaction, updateDoc, onSnapshot, collection, query, where, serverTimestamp, addDoc } from './firebase.js';
import { readAvailability, saveAvailability } from './db.js';
import { showToast } from './ui.js';
import { currentUser, isTattooer } from './auth.js';
import { sendBookingRequestMessage, openOrCreateChat } from './chat.js';

const calendarRoot = document.getElementById('calendar');
const addSlotBtn = document.getElementById('add-slot');
const bookingPanel = document.getElementById('booking-panel');
const timezoneSelect = document.getElementById('calendar-timezone');
const slotDialog = document.getElementById('slot-dialog');
const slotForm = document.getElementById('slot-form');

const state = {
  tattooerUid: null,
  slots: [],
  bookings: [],
  calendar: null,
  unsubscribe: null,
  selectedSlot: null
};

export async function initCalendar(uid) {
  state.tattooerUid = uid;
  hydrateTimezones();
  await ensureCalendar();
  await loadAvailabilityData();
  subscribeBookings();
  bindUiOnce();
}

export async function reloadCalendar() {
  await loadAvailabilityData();
}

function hydrateTimezones() {
  if (!timezoneSelect || timezoneSelect.childElementCount) return;
  Intl.supportedValuesOf('timeZone').forEach((tz) => {
    const option = document.createElement('option');
    option.value = tz;
    option.textContent = tz;
    if (tz === Intl.DateTimeFormat().resolvedOptions().timeZone) option.selected = true;
    timezoneSelect.append(option);
  });
  timezoneSelect.addEventListener('change', () => renderSlots());
}

async function ensureCalendar() {
  if (state.calendar || !window.tui?.Calendar) return;
  state.calendar = new window.tui.Calendar(calendarRoot, {
    defaultView: 'month',
    usageStatistics: false
  });
  state.calendar.on('selectDateTime', ({ start }) => onSelectSlot(parseDate(start)));
  state.calendar.on('clickSchedule', ({ schedule }) => onClickSlot(schedule?.raw));
}

async function loadAvailabilityData() {
  if (!state.tattooerUid) return;
  state.slots = await readAvailability(state.tattooerUid);
  renderSlots();
}

function renderSlots() {
  if (!state.calendar) return;
  state.calendar.clear();
  const tz = timezoneSelect?.value || 'UTC';
  state.slots.forEach((slot) => state.calendar.createEvents([eventFor(slot, tz)]));
  if (state.selectedSlot) {
    const updated = state.slots.find((slot) => slot.id === state.selectedSlot.id);
    state.selectedSlot = updated || null;
  }
  renderBookingPanel(tz);
}

function eventFor(slot, timezone) {
  const start = new Date(slot.id);
  const end = new Date(start.getTime() + (slot.durationMin || 60) * 60000);
  return {
    id: slot.id,
    calendarId: slot.status,
    title: titleFor(slot),
    start: convertTimezone(start, timezone),
    end: convertTimezone(end, timezone),
    raw: slot
  };
}

function titleFor(slot) {
  const booking = state.bookings.find((item) => item.slotId === slot.id && item.status !== 'cancelled');
  if (slot.status === 'blocked') return 'Indisponível';
  if (booking) return `Reservado (${bookingStatusLabel(booking.status)})`;
  return 'Disponível';
}

function convertTimezone(date, timezone) {
  const parts = date.toLocaleString('en-US', { timeZone: timezone });
  return new Date(parts);
}

function onSelectSlot(date) {
  if (!isTattooer()) {
    showToast('Somente o tatuador pode criar horários.', 'info');
    return;
  }
  openSlotDialog(date);
}

function onClickSlot(slot) {
  if (!slot) return;
  if (isTattooer()) {
    selectSlot(slot);
    return;
  }
  handleClientSlotClick(slot);
}

function selectSlot(slot) {
  state.selectedSlot = slot;
  renderBookingPanel();
}

function clearSelectedSlot() {
  state.selectedSlot = null;
  renderBookingPanel();
}

function handleClientSlotClick(slot) {
  if (!currentUser) {
    showToast('Entre para solicitar uma sessão.', 'info');
    return;
  }
  if (!isSlotAvailable(slot)) {
    showToast('Este horário não está disponível.', 'info');
    return;
  }
  selectSlot(slot);
}

function isSlotAvailable(slot) {
  if (!slot || slot.status === 'blocked') return false;
  return !state.bookings.some((booking) => booking.slotId === slot.id && booking.status !== 'cancelled');
}

function bindUiOnce() {
  if (!addSlotBtn || addSlotBtn.dataset.bound) return;
  addSlotBtn.dataset.bound = '1';
  addSlotBtn.addEventListener('click', () => openSlotDialog());
  if (slotForm && !slotForm.dataset.bound) {
    slotForm.dataset.bound = '1';
    slotForm.addEventListener('submit', handleSlotFormSubmit);
    slotForm.querySelector('[data-slot-cancel]')?.addEventListener('click', () => slotDialog?.close('cancel'));
  }
  slotDialog?.addEventListener('close', () => slotForm?.reset());
}

function openSlotDialog(date = new Date()) {
  if (!isTattooer()) return;
  const safeDate = ensureDate(date);
  const dateField = slotForm?.querySelector('#slot-date');
  if (dateField) dateField.value = formatDateInputValue(safeDate);
  const timeInput = slotForm?.querySelector('#slot-time');
  if (timeInput) timeInput.value = formatTimeInputValue(safeDate);
  slotDialog?.showModal();
}

async function handleSlotFormSubmit(event) {
  event.preventDefault();
  const form = new FormData(slotForm);
  const date = form.get('slot-date');
  const time = form.get('slot-time');
  const duration = Number(form.get('slot-duration')) || 60;
  if (!date || !time) return;
  const iso = buildSlotIso(date, time);
  if (!iso) {
    showToast('Horário inválido. Verifique a data e hora informadas.', 'error');
    return;
  }
  await addSlot(iso, duration);
  slotDialog?.close('confirm');
}

async function addSlot(iso, durationMin) {
  if (state.slots.some((slot) => slot.id === iso)) {
    showToast('Já existe um horário nesta janela.', 'error');
    return;
  }
  const entry = { id: iso, durationMin, status: 'open' };
  state.slots.push(entry);
  await saveAvailability(state.tattooerUid, state.slots);
  renderSlots();
  showToast('Horário adicionado.', 'success');
}

function toggleSlotStatus(slotId) {
  let nextStatus = null;
  state.slots = state.slots.map((slot) => {
    if (slot.id !== slotId) return slot;
    nextStatus = slot.status === 'blocked' ? 'open' : 'blocked';
    return { ...slot, status: nextStatus };
  });
  saveAvailability(state.tattooerUid, state.slots).then(() => {
    renderSlots();
    if (nextStatus) {
      const message = nextStatus === 'open' ? 'Horário liberado.' : 'Horário bloqueado.';
      showToast(message, 'success');
    }
  });
}

async function requestBooking(slot) {
  const bookingId = `${state.tattooerUid}_${slot.id}`;
  await runTransaction(db, async (tx) => {
    const ref = doc(db, 'bookings', bookingId);
    const current = await tx.get(ref);
    if (current.exists() && current.data()?.status !== 'cancelled') throw new Error('Horário já reservado.');
    tx.set(ref, {
      bookingId,
      slotId: slot.id,
      tattooerUid: state.tattooerUid,
      clientUid: currentUser.uid,
      status: 'pending',
      createdAt: Date.now()
    }, { merge: true });
  });
  let delivered = true;
  try {
    await sendBookingRequestMessage({
      slot,
      tattooerUid: state.tattooerUid,
      timezone: timezoneSelect?.value || 'UTC'
    });
  } catch (error) {
    console.error('Falha ao enviar pedido via chat.', error);
    delivered = false;
    await openOrCreateChat();
  }
  const toastMessage = delivered
    ? 'Pedido enviado ao tatuador pelo chat.'
    : 'Pedido registrado. Abra o chat para confirmar manualmente.';
  showToast(toastMessage, delivered ? 'success' : 'warning');
  clearSelectedSlot();
  renderSlots();
}

function subscribeBookings() {
  state.unsubscribe?.();
  if (!state.tattooerUid) {
    state.bookings = [];
    renderSlots();
    return;
  }

  if (!currentUser && !isTattooer()) {
    state.bookings = [];
    renderSlots();
    return;
  }

  const q = query(collection(db, 'bookings'), where('tattooerUid', '==', state.tattooerUid));
  state.unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      state.bookings = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      renderSlots();
    },
    handleBookingSubscriptionError
  );
}

function handleBookingSubscriptionError(error) {
  console.warn('Erro ao monitorar reservas.', error);
  state.unsubscribe?.();
  state.unsubscribe = null;
}

function renderBookingPanel(timezone = timezoneSelect?.value || 'UTC') {
  if (!bookingPanel) return;
  bookingPanel.innerHTML = isTattooer()
    ? buildTattooerPanelMarkup(timezone)
    : buildClientPanelMarkup(timezone);
  ensureBookingPanelEvents();
}

function buildTattooerPanelMarkup(timezone) {
  return [
    '<h3>Horário selecionado</h3>',
    renderTattooerSlotSummary(timezone),
    '<h3>Pedidos recentes</h3>',
    renderBookingsList()
  ]
    .filter(Boolean)
    .join('');
}

function buildClientPanelMarkup(timezone) {
  const summary = renderClientSlotSummary(timezone);
  const history = state.bookings.length ? renderClientBookingsList() : '';
  const sections = [summary];
  if (history) sections.push('<h3>Seus pedidos</h3>', history);
  return sections.filter(Boolean).join('');
}

function renderTattooerSlotSummary(timezone) {
  const slot = state.selectedSlot;
  if (!slot) {
    return '<div class="empty-state"><strong>Nenhum horário selecionado.</strong><span>Toque em um horário da agenda para visualizar detalhes ou bloquear.</span></div>';
  }
  const statusLabel = slot.status === 'blocked' ? 'Bloqueado' : 'Disponível';
  const booking = state.bookings.find((entry) => entry.slotId === slot.id && entry.status !== 'cancelled');
  const bookingLine = booking ? `Cliente: ${escapeHtml(booking.clientUid)}` : 'Sem pedidos vinculados.';
  const toggleLabel = slot.status === 'blocked' ? 'Reabrir horário' : 'Bloquear horário';
  return `
    <div class="slot-summary" data-slot-selected="${slot.id}">
      <strong>${formatSlotLabel(slot, timezone)}</strong>
      <div class="slot-meta">
        <span>Status: ${statusLabel}</span>
        <span>Duração: ${formatDuration(slot.durationMin)}</span>
        <span>${bookingLine}</span>
      </div>
      <div class="slot-actions">
        <button type="button" data-slot-action="toggle" data-id="${slot.id}">${toggleLabel}</button>
        <button type="button" class="secondary" data-slot-action="clear">Limpar seleção</button>
      </div>
    </div>
  `;
}

function renderClientSlotSummary(timezone) {
  if (!currentUser) {
    return `
      <div class="empty-state">
        <strong>Entre para reservar</strong>
        <span>Faça login para solicitar um horário e conversar com o estúdio.</span>
      </div>
    `;
  }

  const slot = state.selectedSlot;
  if (!slot) {
    return `
      <div class="empty-state">
        <strong>Escolha um horário disponível</strong>
        <span>Selecione um horário aberto na agenda. O pedido será enviado para o chat e confirmado manualmente pelo tatuador.</span>
      </div>
    `;
  }

  return `
    <div class="slot-summary">
      <strong>${formatSlotLabel(slot, timezone)}</strong>
      <div class="slot-meta">
        <span>Duração: ${formatDuration(slot.durationMin)}</span>
        <span>Fuso selecionado: ${escapeHtml(timezone)}</span>
      </div>
    </div>
    <div class="slot-actions">
      <button type="button" data-request-slot="${slot.id}">Solicitar horário</button>
      <button type="button" class="secondary" data-cancel-selection>Cancelar</button>
    </div>
    <p class="muted">Vamos te responder pelo chat para alinhar os detalhes antes de confirmar.</p>
  `;
}

function renderBookingsList() {
  if (!state.bookings.length) {
    return '<div class="empty-state"><strong>Nenhum pedido por enquanto.</strong><span>Os pedidos confirmados ou cancelados continuam aparecendo para registro.</span></div>';
  }
  return `<div class="booking-list">${state.bookings.map(renderBookingCard).join('')}</div>`;
}

function renderClientBookingsList() {
  if (!state.bookings.length || !currentUser) return '';
  const mine = state.bookings.filter((booking) => booking.clientUid === currentUser.uid);
  if (!mine.length) return '';
  return `<div class="booking-list">${mine.map(renderBookingCard).join('')}</div>`;
}

function renderBookingCard(booking) {
  const slotDate = parseDate(booking.slotId);
  const createdAt = parseDate(booking.createdAt);
  const statusLabel = bookingStatusLabel(booking.status);
  const slotLabel = escapeHtml(slotDate.toLocaleString());
  const infoLine = isTattooer()
    ? `Cliente: ${escapeHtml(booking.clientUid)}`
    : `Solicitado em: ${escapeHtml(createdAt.toLocaleString())}`;
  const actions = isTattooer()
    ? `
        <div class="actions">
          <button type="button" data-booking-action="confirm" data-id="${booking.id}">Confirmar</button>
          <button type="button" data-booking-action="cancel" data-id="${booking.id}" class="danger">Cancelar</button>
        </div>
      `
    : '';
  return `
    <article class="booking-card" data-booking="${booking.id}">
      <header>
        <strong>${slotLabel}</strong>
        <span class="status status-${booking.status}">${statusLabel}</span>
      </header>
      <div class="slot-meta">
        <span>${infoLine}</span>
      </div>
      ${actions}
    </article>
  `;
}

function ensureBookingPanelEvents() {
  if (!bookingPanel || bookingPanel.dataset.bound) return;
  bookingPanel.dataset.bound = '1';
  bookingPanel.addEventListener('click', handleBookingPanelClick);
}

function handleBookingPanelClick(event) {
  const button = event.target.closest('button');
  if (!button || !bookingPanel.contains(button)) return;

  const { bookingAction, slotAction, id, requestSlot } = button.dataset;

  if (bookingAction && id) {
    const status = bookingAction === 'confirm' ? 'confirmed' : 'cancelled';
    updateBookingStatus(id, status);
    return;
  }

  if (slotAction) {
    if (slotAction === 'toggle' && id) toggleSlotStatus(id);
    if (slotAction === 'clear') clearSelectedSlot();
    return;
  }

  if (requestSlot) {
    const slot = state.slots.find((entry) => entry.id === requestSlot);
    if (slot) requestBooking(slot).catch((error) => showToast(error.message, 'error'));
    return;
  }

  if ('cancelSelection' in button.dataset) {
    clearSelectedSlot();
  }
}

async function updateBookingStatus(id, status) {
  const ref = doc(db, 'bookings', id);
  await updateDoc(ref, { status });
  await addDoc(collection(db, 'booking-events'), {
    bookingId: id,
    status,
    by: currentUser?.uid || 'system',
    createdAt: serverTimestamp()
  });
  showToast(`Reserva ${status === 'confirmed' ? 'confirmada' : 'cancelada'}.`, 'success');
}

function formatSlotLabel(slot, timezone) {
  const start = new Date(slot.id);
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: timezone
  });
  return formatter.format(start);
}

function formatDuration(durationMin) {
  const value = Number(durationMin) || 60;
  return `${value} min`;
}

function bookingStatusLabel(status) {
  switch (status) {
    case 'confirmed':
      return 'Confirmada';
    case 'cancelled':
      return 'Cancelada';
    case 'pending':
    default:
      return 'Pendente';
  }
}

function parseDate(value) {
  if (!value) return new Date();
  if (typeof value.toDate === 'function') return value.toDate();
  if (typeof value === 'number') return new Date(value);
  return new Date(value);
}

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = value ?? '';
  return div.innerHTML;
}

function ensureDate(input) {
  const date = parseDate(input);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function formatDateInputValue(date) {
  return new Intl.DateTimeFormat('en-CA').format(date);
}

function formatTimeInputValue(date) {
  return date
    .toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
    .replace(/^(\d{2}:\d{2}).*$/, '$1');
}

function buildSlotIso(dateValue, timeValue) {
  const candidate = new Date(`${dateValue}T${timeValue}`);
  if (Number.isNaN(candidate.getTime())) return null;
  return candidate.toISOString();
}
