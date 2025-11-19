const navButtons = Array.from(document.querySelectorAll('.nav-btn[data-view]'));
const views = Array.from(document.querySelectorAll('.view'));
const toastEl = document.getElementById('toast');
const nav = document.getElementById('site-nav');
const navToggle = document.getElementById('nav-toggle');

export function initNavigation() {
  navButtons.forEach((btn) => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });
  navToggle?.addEventListener('click', toggleNav);
  window.addEventListener('resize', handleResize);
}

export function switchView(id) {
  navButtons.forEach((btn) => {
    const isActive = btn.dataset.view === id;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-current', isActive ? 'page' : 'false');
  });
  views.forEach((view) => view.classList.toggle('active', view.id === `${id}-view`));
  setNavOpen(false);
}

let toastTimeout = null;
export function showToast(message, tone = 'info', ms = 4000) {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.className = `toast show ${tone}`;
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toastEl.classList.remove('show');
  }, ms);
}

export function setGridVisible(enabled) {
  document.body.dataset.showGrid = enabled ? '1' : '0';
}

export function bindToggle(id, handler) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('change', () => handler(el.checked));
  handler(el.checked);
}

export function formToObject(form) {
  const data = new FormData(form);
  return Object.fromEntries(data.entries());
}

export function setFormValues(form, values = {}) {
  Object.entries(values).forEach(([key, value]) => {
    const input = form.elements.namedItem(key) || form.querySelector(`#${form.id}-${key}`);
    if (!input) return;
    if (input.type === 'checkbox') {
      input.checked = Boolean(value);
    } else {
      input.value = value ?? '';
    }
  });
}

function toggleNav() {
  const open = nav?.dataset.open === '1';
  setNavOpen(!open);
}

function setNavOpen(open) {
  if (!nav) return;
  nav.dataset.open = open ? '1' : '0';
  navToggle?.setAttribute('aria-expanded', open ? 'true' : 'false');
  document.body.dataset.navOpen = open ? '1' : '0';
}

function handleResize() {
  if (window.innerWidth > 900) setNavOpen(false);
}
