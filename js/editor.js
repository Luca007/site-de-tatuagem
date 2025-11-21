import { currentUser, isTattooer } from './auth.js';
import { fetchLayout, saveLayout as persistLayout } from './db.js';
import {
  Blocks,
  mountBlock,
  collectProps,
  DEFAULT_TEXT_MARKDOWN,
  DEFAULT_BUTTON_LABEL,
  DEFAULT_TESTIMONIAL_MARKDOWN,
  DEFAULT_AUTHOR_MARKDOWN,
  DEFAULT_BUTTON_BG,
  DEFAULT_BUTTON_TEXT,
  DEFAULT_SERVICE_ACCENT,
  DEFAULT_SERVICE_MARKDOWN,
  servicesToMarkdown
} from './components.js';
import { showToast, setGridVisible } from './ui.js';

const canvas = document.getElementById('canvas');
const toggleBtn = document.getElementById('toggle-edit');
const saveBtn = document.getElementById('save-layout');
const addBlockBtn = document.getElementById('add-block');
const blockPickerDialog = document.getElementById('block-picker');
const blockPickerOptions = Array.from(document.querySelectorAll('[data-block-option]'));
const blockPickerCloseButtons = Array.from(document.querySelectorAll('[data-block-close]'));
const blockEditorDialog = document.getElementById('block-editor');
const blockEditorTitle = document.getElementById('block-editor-title');
const blockEditorForm = document.getElementById('block-editor-form');
const blockEditorFields = document.getElementById('block-editor-fields');
const blockEditorPreview = document.getElementById('block-editor-preview');
const blockEditorCloseButtons = Array.from(document.querySelectorAll('[data-editor-close]'));
const configureCanvasBtn = document.getElementById('configure-canvas');
const canvasSettingsDialog = document.getElementById('canvas-settings');
const canvasSettingsForm = document.getElementById('canvas-settings-form');
const canvasSettingsCloseButtons = Array.from(document.querySelectorAll('[data-canvas-close]'));

const DEFAULT_BLOCK_SIZE = { w: 260, h: 180 };
const BLOCK_PRESETS = {
  Text: { w: 360, h: 200 },
  Image: { w: 420, h: 300 },
  Button: { w: 200, h: 80 },
  Testimonial: { w: 340, h: 200 },
  ServiceList: { w: 360, h: 240 },
  Video: { w: 520, h: 300 }
};
const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=800&q=80';
const BLOCK_DEFAULT_PROPS = {
  Text: { markdown: DEFAULT_TEXT_MARKDOWN },
  Image: { src: PLACEHOLDER_IMAGE, captionMarkdown: '' },
  Button: {
    labelMarkdown: DEFAULT_BUTTON_LABEL,
    href: '#chat',
    backgroundColor: DEFAULT_BUTTON_BG,
    textColor: DEFAULT_BUTTON_TEXT
  },
  Testimonial: { quoteMarkdown: DEFAULT_TESTIMONIAL_MARKDOWN, authorMarkdown: DEFAULT_AUTHOR_MARKDOWN },
  ServiceList: { bodyMarkdown: DEFAULT_SERVICE_MARKDOWN, accentColor: DEFAULT_SERVICE_ACCENT },
  Video: { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', captionMarkdown: '' }
};

const registry = new Map();

let tattooerUid = null;
let layoutState = null;
let editing = false;
let autoSave = true;
let smartGuides = true;
let editingBlockId = null;
let editorValues = {};
let editorBlockType = null;
let editorLayout = null;
let canvasDraft = null;

function cloneDefaultProps(type) {
  const defaults = BLOCK_DEFAULT_PROPS[type];
  if (!defaults) return {};
  if (typeof structuredClone === 'function') {
    return structuredClone(defaults);
  }
  return JSON.parse(JSON.stringify(defaults));
}


function normaliseLayout(layout) {
  const blocks = Array.isArray(layout?.blocks) ? layout.blocks : [];
  return {
    canvas: normaliseCanvas(layout?.canvas),
    blocks: blocks.map(normaliseBlock)
  };
}

function normaliseBlock(block) {
  const type = block.type;
  const preset = BLOCK_PRESETS[type] || DEFAULT_BLOCK_SIZE;
  const x = block.x ?? 40;
  const y = block.y ?? 40;
  const w = block.w ?? preset.w;
  const h = block.h ?? preset.h;
  const props = normaliseProps(type, block.props);
  return {
    id: block.id || crypto.randomUUID(),
    type,
    x,
    y,
    w,
    h,
    props,
    viewport: normaliseViewportFrame(block.viewport, { x, y, w, h })
  };
}

function normaliseProps(type, source) {
  const legacy = source || {};
  const defaults = cloneDefaultProps(type);
  const normaliser = PROP_NORMALISERS[type];
  return normaliser ? normaliser(legacy, defaults) : { ...defaults, ...legacy };
}

const PROP_NORMALISERS = {
  Text(legacy, defaults) {
    return { ...defaults, markdown: legacy.markdown || legacy.html || defaults.markdown };
  },
  Image(legacy, defaults) {
    return {
      ...defaults,
      src: legacy.src || defaults.src,
      captionMarkdown: legacy.captionMarkdown || legacy.caption || defaults.captionMarkdown
    };
  },
  Button(legacy, defaults) {
    return {
      ...defaults,
      labelMarkdown: legacy.labelMarkdown || legacy.label || defaults.labelMarkdown,
      href: legacy.href || defaults.href,
      backgroundColor: legacy.backgroundColor || defaults.backgroundColor || DEFAULT_BUTTON_BG,
      textColor: legacy.textColor || defaults.textColor || DEFAULT_BUTTON_TEXT
    };
  },
  Testimonial(legacy, defaults) {
    return {
      ...defaults,
      quoteMarkdown: legacy.quoteMarkdown || legacy.quote || defaults.quoteMarkdown,
      authorMarkdown: legacy.authorMarkdown || legacy.author || defaults.authorMarkdown
    };
  },
  ServiceList(legacy, defaults) {
    return {
      bodyMarkdown:
        legacy.bodyMarkdown ||
        (Array.isArray(legacy.items) && legacy.items.length ? servicesToMarkdown(legacy.items) : defaults.bodyMarkdown),
      accentColor: legacy.accentColor || defaults.accentColor || DEFAULT_SERVICE_ACCENT
    };
  },
  Video(legacy, defaults) {
    return {
      ...defaults,
      url: (legacy.url || defaults.url || '').trim(),
      captionMarkdown: (legacy.captionMarkdown || legacy.caption || defaults.captionMarkdown || '').trim()
    };
  }
};

const MIN_SIZE_PERCENT = 4;
const LAYOUT_FIELD_LIMITS = {
  xPct: [0, 100],
  yPct: [0, 100],
  wPct: [MIN_SIZE_PERCENT, 100],
  hPct: [MIN_SIZE_PERCENT, 100]
};

const CANVAS_DEFAULTS = {
  widthPct: 90,
  heightPct: 90,
  marginTopPct: 4,
  marginBottomPct: 6,
  marginLeftPct: 5,
  marginRightPct: 5,
  paddingPct: 3
};

const CANVAS_LIMITS = {
  widthPct: [60, 140],
  heightPct: [60, 200],
  marginTopPct: [0, 40],
  marginBottomPct: [0, 40],
  marginLeftPct: [0, 40],
  marginRightPct: [0, 40],
  paddingPct: [0, 20]
};

layoutState = normaliseLayout(defaultLayout());

function normaliseViewportFrame(viewport, dims) {
  const fallback = computeViewportMetrics(dims);
  if (!viewport) return fallback;
  return sanitiseLayoutDraft(viewport, fallback);
}

function computeViewportMetrics(dims = {}) {
  const { width, height } = getViewportSize();
  return sanitiseLayoutDraft({
    xPct: viewportPercent(dims.x, width, 0, 0),
    yPct: viewportPercent(dims.y, height, 0, 0),
    wPct: viewportPercent(dims.w, width, MIN_SIZE_PERCENT, DEFAULT_BLOCK_SIZE.w),
    hPct: viewportPercent(dims.h, height, MIN_SIZE_PERCENT, DEFAULT_BLOCK_SIZE.h)
  });
}

function viewportPercent(rawValue, total, fallbackPercent, defaultPixels) {
  if (!total) return fallbackPercent;
  const pixels = toNumber(rawValue, defaultPixels ?? 0);
  return (pixels / total) * 100;
}

function sanitiseLayoutDraft(layout = {}, fallback = { xPct: 0, yPct: 0, wPct: MIN_SIZE_PERCENT, hPct: MIN_SIZE_PERCENT }) {
  return {
    xPct: clamp(toNumber(layout.xPct, fallback.xPct), 0, 100),
    yPct: clamp(toNumber(layout.yPct, fallback.yPct), 0, 100),
    wPct: clamp(toNumber(layout.wPct, fallback.wPct), MIN_SIZE_PERCENT, 100),
    hPct: clamp(toNumber(layout.hPct, fallback.hPct), MIN_SIZE_PERCENT, 100)
  };
}

function getViewportSize() {
  return {
    width: resolveViewportDimension('width', DEFAULT_BLOCK_SIZE.w),
    height: resolveViewportDimension('height', DEFAULT_BLOCK_SIZE.h)
  };
}

function resolveViewportDimension(axis, fallback) {
  const viewportValue = window.visualViewport?.[axis];
  const windowValue = axis === 'width' ? window.innerWidth : window.innerHeight;
  const docElement = document.documentElement;
  const docValue = axis === 'width' ? docElement?.clientWidth : docElement?.clientHeight;
  const raw = viewportValue ?? windowValue ?? docValue ?? fallback;
  const numeric = Number(raw);
  return Math.max(Number.isFinite(numeric) ? numeric : fallback, 1);
}

function toNumber(value, fallback) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function percentToPixels(percent, size) {
  return Math.round((percent / 100) * size);
}

function layoutPercentToPixels(layout) {
  const { width, height } = getViewportSize();
  return {
    x: percentToPixels(layout.xPct, width),
    y: percentToPixels(layout.yPct, height),
    w: percentToPixels(layout.wPct, width),
    h: percentToPixels(layout.hPct, height)
  };
}

function ensureViewport(block) {
  block.viewport = normaliseViewportFrame(block.viewport, block);
  return block.viewport;
}

function formatPercent(value) {
  return Number.isFinite(Number(value)) ? Number(value).toFixed(1) : '0.0';
}

function sanitiseHexColor(value, fallback) {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed) ? trimmed.toLowerCase() : fallback;
}

function normaliseCanvas(canvas) {
  return sanitiseCanvas(canvas || {});
}

function cloneCanvasDefaults() {
  return { ...CANVAS_DEFAULTS };
}

function sanitiseCanvas(source = {}, fallback = CANVAS_DEFAULTS) {
  const merged = { ...fallback, ...source };
  return Object.entries(CANVAS_LIMITS).reduce((acc, [key, [min, max]]) => {
    acc[key] = clamp(toNumber(merged[key], fallback[key]), min, max);
    return acc;
  }, {});
}

function applyCanvasStyles(settings = CANVAS_DEFAULTS) {
  if (!canvas) return;
  const sanitized = sanitiseCanvas(settings);
  layoutState.canvas = sanitized;
  canvas.style.width = `${sanitized.widthPct}dvw`;
  canvas.style.minHeight = `${sanitized.heightPct}dvh`;
  canvas.style.marginTop = `${sanitized.marginTopPct}dvh`;
  canvas.style.marginBottom = `${sanitized.marginBottomPct}dvh`;
  canvas.style.marginLeft = `${sanitized.marginLeftPct}dvw`;
  canvas.style.marginRight = `${sanitized.marginRightPct}dvw`;
  const padding = clamp(sanitized.paddingPct, ...CANVAS_LIMITS.paddingPct);
  canvas.style.padding = `${padding}dvh ${padding}dvw`;
  canvas.dataset.canvasSettings = JSON.stringify(sanitized);
}

function applyBlockFrame(node, block) {
  const viewport = ensureViewport(block);
  if (editing) {
    node.style.left = `${block.x}px`;
    node.style.top = `${block.y}px`;
    node.style.width = `${block.w}px`;
    node.style.height = `${block.h}px`;
  } else {
    node.style.left = `${viewport.xPct}dvw`;
    node.style.top = `${viewport.yPct}dvh`;
    node.style.width = `${viewport.wPct}dvw`;
    node.style.height = `${viewport.hPct}dvh`;
  }
  node.dataset.viewportFrame = JSON.stringify(viewport);
}

function mergeBlockLayout(block, layoutDraft, updatedProps) {
  const fallback = computeViewportMetrics(block);
  const baseline = sanitiseLayoutDraft(block.viewport || fallback, fallback);
  const nextLayout = sanitiseLayoutDraft(layoutDraft || baseline, baseline);
  const frame = layoutPercentToPixels(nextLayout);
  return {
    ...block,
    ...frame,
    viewport: nextLayout,
    props: updatedProps
  };
}

function openCanvasSettings() {
  if (!canEdit() || !canvasSettingsDialog) return;
  canvasDraft = { ...sanitiseCanvas(layoutState.canvas) };
  renderCanvasSettings();
  canvasSettingsDialog.showModal();
}

function renderCanvasSettings() {
  if (!canvasSettingsForm || !canvasDraft) return;
  const inputs = canvasSettingsForm.querySelectorAll('[data-canvas-field]');
  inputs.forEach((input) => {
    if (!(input instanceof HTMLInputElement)) return;
    const key = input.dataset.canvasField;
    if (!key) return;
    input.value = formatPercent(canvasDraft[key]);
  });
}

function closeCanvasSettings() {
  if (!canvasSettingsDialog?.open) return;
  canvasDraft = null;
  canvasSettingsDialog.close();
}

function handleCanvasInput(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;
  if (!canvasDraft) return;
  updateCanvasDraft(target);
}

function updateCanvasDraft(input) {
  const key = input.dataset.canvasField;
  if (!key || !canvasDraft) return;
  const limits = CANVAS_LIMITS[key];
  if (!limits) return;
  const parsed = Number.parseFloat(input.value);
  const sanitised = clamp(Number.isFinite(parsed) ? parsed : canvasDraft[key], limits[0], limits[1]);
  canvasDraft[key] = sanitised;
  input.value = formatPercent(sanitised);
}

function handleCanvasSubmit(event) {
  event.preventDefault();
  if (!canvasDraft) {
    closeCanvasSettings();
    return;
  }
  layoutState = {
    ...layoutState,
    canvas: sanitiseCanvas(canvasDraft)
  };
  render();
  scheduleAutoSave();
  showToast('Canvas atualizado.', 'success');
  closeCanvasSettings();
}

layoutState = normaliseLayout(defaultLayout());

export async function loadPortfolio(uid) {
  tattooerUid = uid;
  layoutState = normaliseLayout(await fetchLayout(uid, defaultLayout));
  render();
}

export function setAutoSave(enabled) {
  autoSave = enabled;
}

export function setSmartGuides(enabled) {
  smartGuides = enabled;
}

export function enableEdit() {
  if (!canEdit()) return;
  editing = true;
  document.body.dataset.editing = '1';
  render();
}

export function disableEdit() {
  editing = false;
  document.body.dataset.editing = '0';
  render();
}

export async function saveLayout(showMessage = true) {
  if (!tattooerUid) return;
  layoutState.canvas = sanitiseCanvas(layoutState.canvas);
  layoutState.blocks = collectLayoutFromDom();
  await persistLayout(tattooerUid, layoutState);
  if (showMessage) showToast('Layout salvo com sucesso.', 'success');
}

function render() {
  resetCanvas();
  applyCanvasStyles(layoutState.canvas);
  layoutState.blocks.forEach(renderBlock);
  refreshEditorControls();
}

function resetCanvas() {
  canvas.innerHTML = '';
  registry.clear();
}

function renderBlock(block) {
  ensureViewport(block);
  const node = mountBlock(canvas, { ...block, editable: editing }, attachInteractions);
  if (!node) return;
  applyBlockFrame(node, block);
  bindBlockEditing(node, block);
  registry.set(block.id, { def: block, node });
}

function refreshEditorControls() {
  const canManage = canEdit();
  const showEditorControls = editing && canManage;
  toggleBtn?.classList.toggle('hidden', !canManage);
  addBlockBtn?.classList.toggle('hidden', !showEditorControls);
  configureCanvasBtn?.classList.toggle('hidden', !showEditorControls);
  saveBtn?.classList.toggle('hidden', !showEditorControls);
  setGridVisible(document.body.dataset.showGrid !== '0');
}

function canEdit() {
  return isTattooer() && currentUser && tattooerUid === currentUser.uid;
}

function attachInteractions(node) {
  if (!editing || !window.interact) return;
  const snap = buildSnapOptions();
  const instance = window.interact(node);
  setupDraggable(instance, node, snap);
  setupResizable(instance, node, snap);
}

function buildSnapOptions() {
  if (!smartGuides) return null;
  return {
    targets: [window.interact.createSnapGrid({ x: 20, y: 20 })],
    range: 15,
    relativePoints: [{ x: 0, y: 0 }]
  };
}

function setupDraggable(instance, node, snap) {
  instance.draggable({
    modifiers: snap ? [window.interact.modifiers.snap(snap)] : [],
    listeners: {
      move(event) {
        const x = (parseFloat(node.getAttribute('data-x')) || 0) + event.dx;
        const y = (parseFloat(node.getAttribute('data-y')) || 0) + event.dy;
        node.style.transform = `translate(${x}px, ${y}px)`;
        node.dataset.x = x;
        node.dataset.y = y;
        node.classList.add('dragging');
      },
      end() {
        applyDeltaPosition(node);
        node.classList.remove('dragging');
        scheduleAutoSave();
      }
    }
  });
}

function setupResizable(instance, node, snap) {
  instance
    .resizable({
      edges: { left: true, right: true, bottom: true, top: true },
      modifiers: snap ? [window.interact.modifiers.snapSize({ targets: snap.targets })] : []
    })
    .on('resizemove', (event) => {
      node.style.width = `${event.rect.width}px`;
      node.style.height = `${event.rect.height}px`;
    })
    .on('resizeend', () => scheduleAutoSave());
}

function applyDeltaPosition(node) {
  const x = parseFloat(node.dataset.x) || 0;
  const y = parseFloat(node.dataset.y) || 0;
  node.style.left = `${(parseInt(node.style.left, 10) || 0) + x}px`;
  node.style.top = `${(parseInt(node.style.top, 10) || 0) + y}px`;
  node.style.transform = 'translate(0, 0)';
  node.dataset.x = '0';
  node.dataset.y = '0';
}

function collectLayoutFromDom() {
  return Array.from(canvas.querySelectorAll('.block')).map((node) => {
    const id = node.dataset.blockId;
    const type = node.dataset.blockType;
    const existing = layoutState.blocks.find((block) => block.id === id) || {};
    const mergedProps = {
      ...(existing.props || {}),
      ...collectProps(node)
    };
    const x = parseInt(node.style.left, 10) || 0;
    const y = parseInt(node.style.top, 10) || 0;
    const w = parseInt(node.style.width, 10) || node.getBoundingClientRect().width;
    const h = parseInt(node.style.height, 10) || node.getBoundingClientRect().height;
    return {
      id,
      type,
      x,
      y,
      w,
      h,
      props: mergedProps,
      viewport: computeViewportMetrics({ x, y, w, h })
    };
  });
}

function bindBlockEditing(node, block) {
  if (!node) return;
  node.addEventListener('dblclick', (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!editing) return;
    openBlockEditor(block.id);
  });
}

function openBlockEditor(blockId) {
  const block = findBlock(blockId);
  if (!block || !blockEditorDialog) return;
  editingBlockId = blockId;
  editorBlockType = block.type;
  editorValues = extractEditorValues(block);
  editorLayout = { ...ensureViewport(block) };
  renderBlockEditor(block);
  blockEditorDialog.showModal();
}

function renderBlockEditor(block) {
  if (blockEditorTitle) {
    blockEditorTitle.textContent = BLOCK_EDITOR_TITLES[block.type] || 'Editar bloco';
  }
  buildBlockEditorFields(block);
  updateEditorPreview(block);
}

function closeBlockEditor() {
  if (!blockEditorDialog?.open) return;
  blockEditorDialog.close();
  resetEditorState();
}

function buildBlockEditorFields(block) {
  if (!blockEditorFields) return;
  blockEditorFields.innerHTML = '';
  const builder = BLOCK_FIELD_BUILDERS[block.type] || buildGenericFields;
  builder(block);
  buildLayoutControls(block);
}

function buildGenericFields(block) {
  Object.entries(editorValues).forEach(([key, value]) => {
    addTextareaField({
      label: key,
      name: key,
      value: value || '',
      rows: 3
    });
  });
}

const EDITOR_VALUE_EXTRACTORS = {
  Text: (block) => ({ markdown: block.props.markdown || '' }),
  Image: (block) => ({ captionMarkdown: block.props.captionMarkdown || '', src: block.props.src }),
  Button: (block) => ({
    labelMarkdown: block.props.labelMarkdown || '',
    href: block.props.href || '',
    backgroundColor: block.props.backgroundColor || DEFAULT_BUTTON_BG,
    textColor: block.props.textColor || DEFAULT_BUTTON_TEXT
  }),
  Testimonial: (block) => ({
    quoteMarkdown: block.props.quoteMarkdown || '',
    authorMarkdown: block.props.authorMarkdown || ''
  }),
  ServiceList: (block) => ({
    bodyMarkdown: block.props.bodyMarkdown || DEFAULT_SERVICE_MARKDOWN,
    accentColor: block.props.accentColor || DEFAULT_SERVICE_ACCENT
  }),
  Video: (block) => ({
    url: (block.props.url || '').trim(),
    captionMarkdown: block.props.captionMarkdown || ''
  })
};

const EDITOR_VALUE_APPLIERS = {
  Text: (block, values) => ({ ...block.props, markdown: values.markdown || '' }),
  Image: (block, values) => ({ ...block.props, captionMarkdown: values.captionMarkdown || '' }),
  Button: (block, values) => ({
    ...block.props,
    labelMarkdown: values.labelMarkdown || DEFAULT_BUTTON_LABEL,
    href: values.href || block.props.href || '#',
    backgroundColor: sanitiseHexColor(
      values.backgroundColor,
      block.props.backgroundColor || DEFAULT_BUTTON_BG
    ),
    textColor: sanitiseHexColor(values.textColor, block.props.textColor || DEFAULT_BUTTON_TEXT)
  }),
  Testimonial: (block, values) => ({
    ...block.props,
    quoteMarkdown: values.quoteMarkdown || DEFAULT_TESTIMONIAL_MARKDOWN,
    authorMarkdown: values.authorMarkdown || DEFAULT_AUTHOR_MARKDOWN
  }),
  ServiceList: (block, values) => ({
    ...block.props,
    bodyMarkdown:
      values.bodyMarkdown !== undefined
        ? values.bodyMarkdown
        : block.props.bodyMarkdown || DEFAULT_SERVICE_MARKDOWN,
    accentColor: sanitiseHexColor(values.accentColor, block.props.accentColor || DEFAULT_SERVICE_ACCENT)
  }),
  Video: (block, values) => ({
    ...block.props,
    url: (values.url || block.props.url || '').trim(),
    captionMarkdown:
      typeof values.captionMarkdown === 'string' ? values.captionMarkdown : block.props.captionMarkdown || ''
  })
};

const BLOCK_FIELD_BUILDERS = {
  Text() {
    addTextareaField({
      label: 'Conteúdo (Markdown)',
      name: 'markdown',
      value: editorValues.markdown,
      rows: 8,
      description: 'Use # para títulos, **texto** para negrito e *texto* para itálico.'
    });
  },
  Image() {
    addTextareaField({
      label: 'Legenda (Markdown opcional)',
      name: 'captionMarkdown',
      value: editorValues.captionMarkdown,
      rows: 4,
      description: 'A legenda também alimenta o texto alternativo da imagem.'
    });
  },
  Button() {
    addTextareaField({
      label: 'Texto do botão (Markdown)',
      name: 'labelMarkdown',
      value: editorValues.labelMarkdown,
      rows: 3
    });
    addInputField({
      label: 'Link',
      name: 'href',
      value: editorValues.href,
      placeholder: '#chat'
    });
    addColorField({
      label: 'Cor de fundo',
      name: 'backgroundColor',
      value: editorValues.backgroundColor || DEFAULT_BUTTON_BG
    });
    addColorField({
      label: 'Cor do texto',
      name: 'textColor',
      value: editorValues.textColor || DEFAULT_BUTTON_TEXT
    });
  },
  Testimonial() {
    addTextareaField({
      label: 'Depoimento (Markdown)',
      name: 'quoteMarkdown',
      value: editorValues.quoteMarkdown,
      rows: 5
    });
    addTextareaField({
      label: 'Assinatura (Markdown)',
      name: 'authorMarkdown',
      value: editorValues.authorMarkdown,
      rows: 2
    });
  },
  ServiceList() {
    addTextareaField({
      label: 'Conteúdo (Markdown)',
      name: 'bodyMarkdown',
      value: editorValues.bodyMarkdown,
      rows: 10,
      description: 'Listas, tabelas e destaques são suportados via Markdown.'
    });
    addColorField({
      label: 'Cor de destaque',
      name: 'accentColor',
      value: editorValues.accentColor || DEFAULT_SERVICE_ACCENT
    });
  },
  Video() {
    addInputField({
      label: 'URL do vídeo',
      name: 'url',
      value: editorValues.url,
      placeholder: 'https://youtu.be/seu-video ou https://cdn.com/video.mp4',
      description: 'Links do YouTube/Shorts são convertidos automaticamente e iniciam o vídeo assim que carregam.'
    });
    addTextareaField({
      label: 'Legenda (Markdown opcional)',
      name: 'captionMarkdown',
      value: editorValues.captionMarkdown,
      rows: 3
    });
  }
};

const BLOCK_EDITOR_TITLES = {
  Text: 'Editar bloco de texto',
  Image: 'Editar imagem',
  Button: 'Editar botão',
  Testimonial: 'Editar depoimento',
  ServiceList: 'Editar lista de serviços',
  Video: 'Editar vídeo'
};

function addTextareaField({ label, name, value, rows = 3, description = '', dataset = {} }) {
  if (!blockEditorFields) return;
  const wrapper = document.createElement('label');
  wrapper.className = 'editor-field';
  const span = document.createElement('span');
  span.textContent = label;
  const textarea = document.createElement('textarea');
  textarea.name = name;
  textarea.rows = rows;
  textarea.value = value || '';
  Object.entries(dataset).forEach(([key, val]) => {
    textarea.dataset[key] = String(val);
  });
  wrapper.append(span, textarea);
  if (description) {
    const hint = document.createElement('small');
    hint.className = 'editor-hint';
    hint.textContent = description;
    wrapper.append(hint);
  }
  blockEditorFields.append(wrapper);
}

function addInputField({ label, name, value, placeholder = '', description = '' }) {
  if (!blockEditorFields) return;
  const wrapper = document.createElement('label');
  wrapper.className = 'editor-field';
  const span = document.createElement('span');
  span.textContent = label;
  const input = document.createElement('input');
  input.name = name;
  input.value = value || '';
  input.placeholder = placeholder;
  wrapper.append(span, input);
  if (description) {
    const hint = document.createElement('small');
    hint.className = 'editor-hint';
    hint.textContent = description;
    wrapper.append(hint);
  }
  blockEditorFields.append(wrapper);
}

function addColorField({ label, name, value }) {
  if (!blockEditorFields) return;
  const wrapper = document.createElement('label');
  wrapper.className = 'editor-field';
  const span = document.createElement('span');
  span.textContent = label;
  const input = document.createElement('input');
  input.type = 'color';
  input.name = name;
  input.value = value || '#ffffff';
  wrapper.append(span, input);
  blockEditorFields.append(wrapper);
}

function buildLayoutControls(block) {
  if (!blockEditorFields) return;
  const baseline = ensureViewport(block);
  editorLayout = sanitiseLayoutDraft(editorLayout || baseline, baseline);

  const section = document.createElement('section');
  section.className = 'editor-layout-section';

  const title = document.createElement('h4');
  title.className = 'editor-layout-title';
  title.textContent = 'Posicionamento responsivo';
  section.append(title);

  const grid = document.createElement('div');
  grid.className = 'editor-layout-grid';
  const fields = [
    {
      key: 'xPct',
      label: 'Margem esquerda (%)',
      description: 'Aplicado como dvw (viewport width).',
      min: 0,
      max: 100
    },
    {
      key: 'yPct',
      label: 'Margem superior (%)',
      description: 'Aplicado como dvh (viewport height).',
      min: 0,
      max: 100
    },
    {
      key: 'wPct',
      label: 'Largura (%)',
      description: 'Calculada em dvw para manter responsividade.',
      min: MIN_SIZE_PERCENT,
      max: 100
    },
    {
      key: 'hPct',
      label: 'Altura (%)',
      description: 'Calculada em dvh para acompanhar o viewport.',
      min: MIN_SIZE_PERCENT,
      max: 100
    }
  ];

  fields.forEach(({ key, label, description, min, max }) => {
    const wrapper = document.createElement('label');
    wrapper.className = 'editor-field';
    const span = document.createElement('span');
    span.textContent = label;
    const input = document.createElement('input');
    input.type = 'number';
    input.name = `layout-${key}`;
    input.dataset.layoutField = key;
    input.min = String(min);
    input.max = String(max);
    input.step = '0.5';
    input.value = formatPercent(editorLayout[key]);
    wrapper.append(span, input);
    if (description) {
      const hint = document.createElement('small');
      hint.className = 'unit-hint';
      hint.textContent = description;
      wrapper.append(hint);
    }
    grid.append(wrapper);
  });

  section.append(grid);
  blockEditorFields.append(section);
}

function updateEditorPreview(block) {
  if (!blockEditorPreview) return;
  const previewProps = buildPreviewProps(block.type, block.props, editorValues);
  const previewRoot = document.createElement('div');
  previewRoot.className = 'block-preview';
  const node = Blocks[block.type]?.({ ...previewProps, editable: false });
  if (node) {
    node.style.removeProperty('left');
    node.style.removeProperty('top');
    node.style.removeProperty('width');
    node.style.removeProperty('height');
    previewRoot.append(node);
  } else {
    const empty = document.createElement('p');
    empty.className = 'editor-empty';
    empty.textContent = 'Não há pré-visualização disponível para este bloco.';
    previewRoot.append(empty);
  }
  blockEditorPreview.innerHTML = '';
  blockEditorPreview.append(previewRoot);
}

function buildPreviewProps(type, originalProps, values) {
  if (type === 'ServiceList') {
    return {
      ...originalProps,
      bodyMarkdown: values.bodyMarkdown ?? originalProps.bodyMarkdown,
      accentColor: values.accentColor ?? originalProps.accentColor
    };
  }
  return { ...originalProps, ...values };
}

function resetEditorState() {
  editingBlockId = null;
  editorBlockType = null;
  editorValues = {};
  editorLayout = null;
  if (blockEditorForm) blockEditorForm.reset();
  if (blockEditorFields) blockEditorFields.innerHTML = '';
  if (blockEditorPreview) blockEditorPreview.innerHTML = '';
}

function findBlock(blockId) {
  return layoutState.blocks.find((block) => block.id === blockId) || null;
}

function extractEditorValues(block) {
  const extractor = EDITOR_VALUE_EXTRACTORS[block.type];
  return extractor ? extractor(block) : { ...block.props };
}

function applyEditorValues(block, values) {
  const applier = EDITOR_VALUE_APPLIERS[block.type];
  return applier ? applier(block, values) : { ...block.props, ...values };
}

function handleEditorInput(event) {
  const target = event.target;
  if (!isEditorField(target) || !editingBlockId) return;

  updateEditorDraft(target);

  const block = findBlock(editingBlockId);
  if (block) updateEditorPreview(block);
}

function isEditorField(target) {
  return target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement;
}

function updateEditorDraft(target) {
  if (updateLayoutDraft(target)) return;
  if (target.name) {
    editorValues[target.name] = target.value;
  }
}

function updateLayoutDraft(target) {
  const field = target.dataset.layoutField;
  if (!field || !editorLayout) return false;
  const value = Number.parseFloat(target.value);
  if (!Number.isFinite(value)) return false;
  const [min, max] = LAYOUT_FIELD_LIMITS[field] || [0, 100];
  const sanitised = clamp(value, min, max);
  editorLayout[field] = sanitised;
  target.value = formatPercent(sanitised);
  return true;
}

function handleEditorSubmit(event) {
  event.preventDefault();
  if (!editingBlockId) {
    closeBlockEditor();
    return;
  }
  const block = findBlock(editingBlockId);
  if (!block) {
    closeBlockEditor();
    return;
  }

  const updatedProps = applyEditorValues(block, editorValues);
  const updatedBlock = mergeBlockLayout(block, editorLayout, updatedProps);
  layoutState = {
    ...layoutState,
    blocks: layoutState.blocks.map((item) => (item.id === block.id ? updatedBlock : item))
  };
  render();
  scheduleAutoSave();
  showToast('Bloco atualizado.', 'success');
  closeBlockEditor();
}

function scheduleAutoSave() {
  if (!editing || !autoSave) return;
  window.clearTimeout(scheduleAutoSave.timer);
  scheduleAutoSave.timer = window.setTimeout(() => saveLayout(false), 800);
}

scheduleAutoSave.timer = null;

function defaultLayout() {
  const textProps = cloneDefaultProps('Text');
  textProps.markdown = '# Seu nome artístico\nConte sua história, estilos e contato.';
  const imageProps = cloneDefaultProps('Image');
  imageProps.src = 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80';
  const buttonProps = cloneDefaultProps('Button');
  buttonProps.href = '#chat';
  return {
    canvas: cloneCanvasDefaults(),
    blocks: [
      {
        id: crypto.randomUUID(),
        type: 'Text',
        x: 32,
        y: 32,
        w: 360,
        h: 160,
        props: textProps
      },
      {
        id: crypto.randomUUID(),
        type: 'Image',
        x: 420,
        y: 32,
        w: 420,
        h: 320,
        props: imageProps
      },
      {
        id: crypto.randomUUID(),
        type: 'Button',
        x: 32,
        y: 220,
        w: 200,
        h: 64,
        props: buttonProps
      }
    ]
  };
}

addBlockBtn?.addEventListener('click', () => openBlockPicker());

toggleBtn?.addEventListener('click', () => {
  if (editing) disableEdit();
  else enableEdit();
});

saveBtn?.addEventListener('click', () => saveLayout(true));

document.addEventListener('role:changed', () => {
  if (!canEdit()) disableEdit();
  render();
});

export function setGrid(enabled) {
  setGridVisible(enabled);
}

blockPickerOptions.forEach((button) => {
  button.addEventListener('click', () => {
    const type = button.dataset.blockOption;
    if (!type) return;
    handleBlockSelection(type);
  });
});

blockPickerCloseButtons.forEach((button) => {
  button.addEventListener('click', () => closeBlockPicker());
});

blockPickerDialog?.addEventListener('cancel', (event) => {
  event.preventDefault();
  closeBlockPicker();
});

blockPickerDialog?.addEventListener('click', (event) => {
  if (event.target === blockPickerDialog) closeBlockPicker();
});

blockEditorCloseButtons.forEach((button) => {
  button.addEventListener('click', () => closeBlockEditor());
});

blockEditorDialog?.addEventListener('cancel', (event) => {
  event.preventDefault();
  closeBlockEditor();
});

blockEditorDialog?.addEventListener('click', (event) => {
  if (event.target === blockEditorDialog) closeBlockEditor();
});

blockEditorForm?.addEventListener('input', handleEditorInput);
blockEditorForm?.addEventListener('submit', handleEditorSubmit);

configureCanvasBtn?.addEventListener('click', () => openCanvasSettings());

canvasSettingsCloseButtons.forEach((button) => {
  button.addEventListener('click', () => closeCanvasSettings());
});

canvasSettingsDialog?.addEventListener('cancel', (event) => {
  event.preventDefault();
  closeCanvasSettings();
});

canvasSettingsDialog?.addEventListener('click', (event) => {
  if (event.target === canvasSettingsDialog) closeCanvasSettings();
});

canvasSettingsForm?.addEventListener('input', handleCanvasInput);
canvasSettingsForm?.addEventListener('submit', handleCanvasSubmit);

function openBlockPicker() {
  if (!canEdit() || !blockPickerDialog) return;
  blockPickerDialog.showModal();
}

function closeBlockPicker() {
  if (!blockPickerDialog?.open) return;
  blockPickerDialog.close();
}

function handleBlockSelection(type) {
  if (!Blocks[type]) {
    showToast('Este tipo de bloco ainda não está disponível.', 'error');
    return;
  }
  const frame = BLOCK_PRESETS[type] || DEFAULT_BLOCK_SIZE;
  const position = nextBlockPosition();
  const props = cloneDefaultProps(type);
  const viewport = computeViewportMetrics({ x: position.x, y: position.y, w: frame.w, h: frame.h });
  layoutState.blocks.push({
    id: crypto.randomUUID(),
    type,
    x: position.x,
    y: position.y,
    w: frame.w,
    h: frame.h,
    props,
    viewport
  });
  render();
  scheduleAutoSave();
  closeBlockPicker();
  showToast('Bloco adicionado ao layout.', 'success');
}

function nextBlockPosition() {
  const index = layoutState.blocks.length;
  const columns = Math.max(1, Math.floor(canvas.clientWidth / 240) || 1);
  const col = index % columns;
  const row = Math.floor(index / columns);
  return {
    x: 48 + col * 140,
    y: 48 + row * 160
  };
}
