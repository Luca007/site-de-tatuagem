// Fábrica de blocos reutilizáveis para o editor visual
import { uploadImageFlow } from './editor-upload.js';

const boldPattern = /\*\*(.+?)\*\*|__(.+?)__/g;
const italicPattern = /\*(.+?)\*|_(.+?)_/g;
const codePattern = /`([^`]+?)`/g;
const EPHEMERAL_URL_PREFIX = 'blob:';
const YOUTUBE_PATTERNS = [
  /youtu\.be\/([\w-]{11})/i,
  /youtube\.com\/shorts\/([\w-]{11})/i,
  /youtube\.com\/embed\/([\w-]{11})/i,
  /youtube\.com\/watch.*[?&]v=([\w-]{11})/i,
  /youtube\.com\/live\/([\w-]{11})/i
];
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.ogg', '.ogv', '.mov', '.m4v'];

export const DEFAULT_TEXT_MARKDOWN = '# Seu nome artístico\nCompartilhe seu estilo, especialidades e formas de contato.';
export const DEFAULT_BUTTON_LABEL = 'Solicitar orçamento';
export const DEFAULT_TESTIMONIAL_MARKDOWN = 'Minha experiência foi incrível! Atendimento impecável e resultado melhor que o esperado.';
export const DEFAULT_AUTHOR_MARKDOWN = 'Cliente satisfeito';
export const DEFAULT_SERVICES = () => ([
  { titleMarkdown: 'Blackwork', descMarkdown: 'Linhas precisas e alto contraste.' },
  { titleMarkdown: 'Realismo', descMarkdown: 'Sombras suaves e profundidade.' },
  { titleMarkdown: 'Consultoria', descMarkdown: 'Desenvolvimento da sua ideia do zero.' }
]);
export const DEFAULT_BUTTON_BG = '#9f7aea';
export const DEFAULT_BUTTON_TEXT = '#120d1b';
export const DEFAULT_SERVICE_ACCENT = '#9f7aea';
export const DEFAULT_SERVICE_MARKDOWN = servicesToMarkdown();

export const Blocks = {
  Text: ({ markdown = DEFAULT_TEXT_MARKDOWN }) => {
    const node = createNode('div', 'block block-text markdown-block');
    node.innerHTML = renderMarkdown(markdown);
    stampProps(node, { markdown });
    return node;
  },
  Image: ({ src = placeholderImage(), captionMarkdown = '', editable }) => {
    const node = createNode('div', 'block block-image');
    node.dataset.type = 'image';
    node.append(handle('Imagem'));
    const img = document.createElement('img');
    const initialSrc = sanitiseImageSrc(src, placeholderImage());
    img.src = initialSrc;
    img.alt = stripMarkdown(captionMarkdown) || 'Arte do portfólio';
    node.append(img);
    if (captionMarkdown) {
      const figCaption = document.createElement('figcaption');
      figCaption.className = 'caption';
      figCaption.innerHTML = renderMarkdown(captionMarkdown);
      node.append(figCaption);
    }
    if (editable) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = 'Trocar imagem';
      btn.className = 'btn';
      btn.addEventListener('click', async () => {
        const url = await uploadImageFlow();
        if (!url) return;
        img.src = url;
        img.alt = stripMarkdown(captionMarkdown) || 'Arte do portfólio';
        if (isEphemeralUrl(url)) return;
        const current = { ...readProps(node), src: url, captionMarkdown };
        stampProps(node, current);
      });
      node.append(btn);
    }
    stampProps(node, { src: initialSrc, captionMarkdown });
    return node;
  },
  Button: ({
    labelMarkdown = DEFAULT_BUTTON_LABEL,
    href = '#',
    backgroundColor = DEFAULT_BUTTON_BG,
    textColor = DEFAULT_BUTTON_TEXT
  }) => {
    const node = createNode('div', 'block block-button');
    const bg = normaliseColor(backgroundColor, DEFAULT_BUTTON_BG);
    const fg = normaliseColor(textColor, DEFAULT_BUTTON_TEXT);
    node.innerHTML = `<a class="btn" href="${href}" style="--btn-bg:${bg};--btn-text:${fg};">${renderMarkdownInline(
      labelMarkdown
    )}</a>`;
    stampProps(node, { labelMarkdown, href, backgroundColor: bg, textColor: fg });
    return node;
  },
  Testimonial: ({ quoteMarkdown = DEFAULT_TESTIMONIAL_MARKDOWN, authorMarkdown = DEFAULT_AUTHOR_MARKDOWN }) => {
    const node = createNode('div', 'block block-testimonial');
    node.innerHTML = `
      <div class="handle">Depoimento</div>
      <div class="quote markdown-block">${renderMarkdown(quoteMarkdown)}</div>
      <p class="author">— ${renderMarkdownInline(authorMarkdown)}</p>
    `;
    stampProps(node, { quoteMarkdown, authorMarkdown });
    return node;
  },
  ServiceList: ({ bodyMarkdown = DEFAULT_SERVICE_MARKDOWN, accentColor = DEFAULT_SERVICE_ACCENT }) => {
    const node = createNode('div', 'block block-services');
    const accent = normaliseColor(accentColor, DEFAULT_SERVICE_ACCENT);
    node.style.setProperty('--service-accent', accent);
    node.innerHTML = `
      <div class="handle">Serviços</div>
      <div class="services-body markdown-block">${renderMarkdown(bodyMarkdown)}</div>
    `;
    stampProps(node, { bodyMarkdown, accentColor: accent });
    return node;
  },
  Video: ({ url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', captionMarkdown = '' }) => {
    const node = createNode('div', 'block block-video');
    const source = resolveVideoSource(url);
    const caption = captionMarkdown ? `<p class="caption">${renderMarkdownInline(captionMarkdown)}</p>` : '';
    node.innerHTML = `
      <div class="handle">Vídeo</div>
      ${createVideoPlayerMarkup(source)}
      ${caption}
    `;
    stampProps(node, { url: source.originalUrl, captionMarkdown });
    return node;
  }
};

export function mountBlock(container, def, onReady) {
  const factory = Blocks[def.type];
  if (!factory) return null;
  const node = factory({ ...def.props, editable: def.editable });
  node.style.left = `${def.x}px`;
  node.style.top = `${def.y}px`;
  node.style.width = `${def.w}px`;
  node.style.height = `${def.h}px`;
  node.dataset.blockId = def.id;
  node.dataset.blockType = def.type;
  container.append(node);
  onReady?.(node);
  return node;
}

export function collectProps(node) {
  const stored = getStoredProps(node);
  if (stored) return stored;

  const collector = PROP_COLLECTORS[node.dataset.blockType] || collectTextBlockProps;
  return collector(node);
}

const PROP_COLLECTORS = {
  Image: collectImageProps,
  Button: collectButtonProps,
  Testimonial: collectTestimonialProps,
  ServiceList: collectServiceListProps,
  Video: collectVideoProps,
  Text: collectTextBlockProps
};

function collectImageProps(node) {
  const img = node.querySelector('img');
  const stored = readProps(node);
  const storedSrc = sanitiseImageSrc(stored.src, placeholderImage());
  return {
    src: isEphemeralUrl(img?.src) ? storedSrc : img?.src || storedSrc || '',
    captionMarkdown: stored.captionMarkdown || ''
  };
}

function collectButtonProps(node) {
  const link = node.querySelector('a');
  const stored = readProps(node);
  return {
    labelMarkdown: stored.labelMarkdown || link?.textContent?.trim() || '',
    href: stored.href || link?.getAttribute('href') || '#',
    backgroundColor: normaliseColor(stored.backgroundColor, DEFAULT_BUTTON_BG),
    textColor: normaliseColor(stored.textColor, DEFAULT_BUTTON_TEXT)
  };
}

function collectTestimonialProps(node) {
  const quote = node.querySelector('.quote')?.textContent || DEFAULT_TESTIMONIAL_MARKDOWN;
  const author = node.querySelector('.author')?.textContent?.replace('—', '').trim() || DEFAULT_AUTHOR_MARKDOWN;
  return { quoteMarkdown: quote, authorMarkdown: author };
}

function collectServiceListProps(node) {
  const stored = readProps(node);
  const bodySource =
    stored.bodyMarkdown || htmlToMarkdown(node.querySelector('.services-body')?.innerHTML || '') || DEFAULT_SERVICE_MARKDOWN;
  const accent = stored.accentColor || node.style.getPropertyValue('--service-accent') || DEFAULT_SERVICE_ACCENT;
  return { bodyMarkdown: bodySource, accentColor: normaliseColor(accent, DEFAULT_SERVICE_ACCENT) };
}

function collectVideoProps(node) {
  const stored = readProps(node);
  const fallbackUrl = node.querySelector('iframe, video')?.src || '';
  return {
    url: stored.url || fallbackUrl || '',
    captionMarkdown: stored.captionMarkdown || ''
  };
}

function collectTextBlockProps(node) {
  return { markdown: htmlToMarkdown(node.innerHTML) };
}

function createNode(tag, className) {
  const node = document.createElement(tag);
  node.className = className;
  return node;
}

function handle(label) {
  const div = document.createElement('div');
  div.className = 'handle';
  div.textContent = label;
  return div;
}

function placeholderImage() {
  return 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=800&q=80';
}

function isEphemeralUrl(value) {
  return typeof value === 'string' && value.startsWith(EPHEMERAL_URL_PREFIX);
}

function sanitiseImageSrc(value, fallback) {
  if (typeof value !== 'string' || !value.trim()) return fallback;
  return isEphemeralUrl(value) ? fallback : value.trim();
}

function stampProps(node, props) {
  node.dataset.props = JSON.stringify(props);
}

function getStoredProps(node) {
  const stored = node?.dataset?.props;
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch (error) {
    console.warn('Não foi possível ler os dados do bloco, aplicando fallback.', error);
    return null;
  }
}

function readProps(node) {
  return getStoredProps(node) || {};
}

export function renderMarkdownInline(markdown = '') {
  const escaped = escapeHtml(markdown.trim());
  return applyInlineMarkdown(escaped);
}

export function renderMarkdown(markdown = '') {
  const context = createMarkdownContext();
  normaliseMarkdown(markdown).forEach((line) => processMarkdownLine(line, context));
  finaliseMarkdownContext(context);
  return context.html.join('') || '<p></p>';
}

function createMarkdownContext() {
  return { html: [], buffer: [], listType: null, table: null };
}

function normaliseMarkdown(markdown = '') {
  return markdown.replace(/\r\n?/g, '\n').split('\n');
}

function finaliseMarkdownContext(context) {
  flushParagraph(context);
  closeList(context);
  flushTable(context);
}

function processMarkdownLine(line, context) {
  const trimmed = line.trim();
  if (!trimmed) {
    handleEmptyLine(context);
    return;
  }

  if (tryHandleTable(trimmed, context)) return;
  flushTable(context);
  if (STRUCTURED_MARKDOWN_HANDLERS.some((handler) => handler(trimmed, context))) return;

  context.buffer.push(trimmed);
}

function handleEmptyLine(context) {
  flushTable(context);
  flushParagraph(context);
  closeList(context);
}

const STRUCTURED_MARKDOWN_HANDLERS = [tryHandleHeading, tryHandleQuote, tryHandleListItem];

function flushParagraph(context) {
  if (!context.buffer.length) return;
  context.html.push(`<p>${applyInlineMarkdown(escapeHtml(context.buffer.join(' ')))}</p>`);
  context.buffer = [];
}

function closeList(context) {
  if (context.listType === 'ul') context.html.push('</ul>');
  if (context.listType === 'ol') context.html.push('</ol>');
  context.listType = null;
}

function tryHandleHeading(line, context) {
  const match = /^(#{1,6})\s+(.+)/.exec(line);
  if (!match) return false;
  flushParagraph(context);
  closeList(context);
  flushTable(context);
  const level = match[1].length;
  context.html.push(`<h${level}>${applyInlineMarkdown(escapeHtml(match[2]))}</h${level}>`);
  return true;
}

function tryHandleQuote(line, context) {
  if (!/^>\s+/.test(line)) return false;
  flushParagraph(context);
  closeList(context);
  flushTable(context);
  context.html.push(`<blockquote>${renderMarkdown(line.replace(/^>\s+/, ''))}</blockquote>`);
  return true;
}

function tryHandleListItem(line, context) {
  const match = parseListItem(line);
  if (!match) return false;
  flushParagraph(context);
  flushTable(context);
  if (context.listType !== match.type) {
    closeList(context);
    context.listType = match.type;
    context.html.push(`<${match.type}>`);
  }
  context.html.push(`<li>${applyInlineMarkdown(escapeHtml(match.content))}</li>`);
  return true;
}

function parseListItem(line) {
  const bullet = /^([-*])\s+(.+)/.exec(line);
  if (bullet) {
    return { type: 'ul', content: bullet[2] };
  }
  const ordered = /^(\d+)\.\s+(.+)/.exec(line);
  if (ordered) {
    return { type: 'ol', content: ordered[2] };
  }
  return null;
}

function tryHandleTable(line, context) {
  if (!isTableLine(line)) return false;
  flushParagraph(context);
  closeList(context);

  const cells = parseTableCells(line);
  if (!cells.length) return false;

  const tableState = ensureTableState(context);

  if (shouldConsumeAlignmentRow(tableState, cells)) {
    tableState.align = cells.map(parseAlignment);
    tableState.awaitingAlignment = false;
    return true;
  }

  if (!tableState.header) {
    tableState.header = cells;
    return true;
  }

  tableState.awaitingAlignment = false;
  tableState.rows.push(cells);
  return true;
}

function ensureTableState(context) {
  if (!context.table) {
    context.table = { header: null, align: [], rows: [], awaitingAlignment: true };
  }
  return context.table;
}

function shouldConsumeAlignmentRow(tableState, cells) {
  return Boolean(tableState.awaitingAlignment && tableState.header && isAlignmentRow(cells));
}

function flushTable(context) {
  if (!context.table) return;
  const { header, rows, align } = context.table;
  const formatCell = (value) => applyInlineMarkdown(escapeHtml(value));
  const renderRow = (cells, tag = 'td') =>
    `<tr>${cells
      .map((cell, index) => {
        const alignment = align[index] ? ` data-align="${align[index]}"` : '';
        return `<${tag}${alignment}>${formatCell(cell)}</${tag}>`;
      })
      .join('')}</tr>`;

  let tableHtml = '<table class="markdown-table">';
  if (header) {
    tableHtml += `<thead>${renderRow(header, 'th')}</thead>`;
  }
  if (rows.length) {
    tableHtml += `<tbody>${rows.map((cells) => renderRow(cells)).join('')}</tbody>`;
  }
  tableHtml += '</table>';
  context.html.push(tableHtml);
  context.table = null;
}

function isTableLine(line) {
  const trimmed = line.trim();
  if (!trimmed.includes('|')) return false;
  if (!trimmed.startsWith('|') && !trimmed.includes(' | ')) return false;
  return true;
}

function parseTableCells(line) {
  const trimmed = line.trim();
  const segments = trimmed.split('|');
  if (segments.length < 2) return [];
  if (trimmed.startsWith('|')) segments.shift();
  if (trimmed.endsWith('|')) segments.pop();
  return segments.map((segment) => segment.trim());
}

function isAlignmentRow(cells) {
  if (!cells.length) return false;
  return cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function parseAlignment(cell) {
  const starts = cell.startsWith(':');
  const ends = cell.endsWith(':');
  if (starts && ends) return 'center';
  if (ends) return 'right';
  return 'left';
}

function applyInlineMarkdown(text) {
  return text
    .replace(codePattern, (_, code) => `<code>${code}</code>`)
    .replace(boldPattern, (_, a, b) => `<strong>${a || b}</strong>`)
    .replace(italicPattern, (_, a, b) => `<em>${a || b}</em>`);
}

function escapeHtml(text = '') {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function stripMarkdown(markdown = '') {
  return markdown.replace(boldPattern, '$1$2').replace(italicPattern, '$1$2').replace(codePattern, '$1');
}

function htmlToMarkdown(html = '') {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

export function servicesToMarkdown(items = DEFAULT_SERVICES()) {
  return normaliseServiceItems(items)
    .map(formatServiceLine)
    .filter(Boolean)
    .join('\n');
}

function normaliseServiceItems(items) {
  return Array.isArray(items) ? items : [];
}

function formatServiceLine(item) {
  const { title, description } = resolveServiceFields(item);
  const titleFragment = title ? `**${title}**` : '';
  const separator = titleFragment && description ? ' — ' : '';
  return `- ${titleFragment}${separator}${description}`.trim();
}

function resolveServiceFields(item = {}) {
  return {
    title: item.titleMarkdown || item.title || '',
    description: item.descMarkdown || item.desc || ''
  };
}

function normaliseColor(value, fallback) {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed) ? trimmed : fallback;
}

function resolveVideoSource(url) {
  const cleanUrl = typeof url === 'string' ? url.trim() : '';
  if (!cleanUrl) {
    return { type: 'empty', embedUrl: '', originalUrl: '' };
  }
  const youtubeId = extractYoutubeId(cleanUrl);
  if (youtubeId) {
    return {
      type: 'youtube',
      embedUrl: buildYoutubeEmbedUrl(youtubeId),
      originalUrl: cleanUrl
    };
  }
  if (isNativeVideo(cleanUrl)) {
    return { type: 'native', embedUrl: cleanUrl, originalUrl: cleanUrl };
  }
  return { type: 'external', embedUrl: cleanUrl, originalUrl: cleanUrl };
}

function createVideoPlayerMarkup(source) {
  if (!source.embedUrl) {
    return '<div class="block-video-empty">Informe uma URL de vídeo válida para este bloco.</div>';
  }
  if (source.type === 'native') {
    return `<video class="block-video-player" src="${escapeHtml(source.embedUrl)}" autoplay muted playsinline loop controls preload="metadata"></video>`;
  }
  const allowList = source.type === 'youtube'
    ? 'autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share'
    : 'accelerometer; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share';
  const providerAttr = source.type === 'youtube' ? ' data-provider="youtube"' : '';
  return `<iframe class="block-video-player" src="${escapeHtml(source.embedUrl)}" title="Vídeo do portfólio" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="${allowList}" allowfullscreen${providerAttr}></iframe>`;
}

function extractYoutubeId(url) {
  for (const pattern of YOUTUBE_PATTERNS) {
    const match = pattern.exec(url);
    if (match && match[1]) return match[1];
  }
  return '';
}

function buildYoutubeEmbedUrl(id) {
  const params = new URLSearchParams({
    autoplay: '1',
    mute: '1',
    playsinline: '1',
    rel: '0',
    showinfo: '0',
    modestbranding: '1'
  });
  return `https://www.youtube.com/embed/${id}?${params.toString()}`;
}

function isNativeVideo(url) {
  if (!url) return false;
  if (url.startsWith(EPHEMERAL_URL_PREFIX)) return true;
  return hasVideoExtension(url);
}

function hasVideoExtension(url) {
  const normalised = url.split('?')[0].toLowerCase();
  return VIDEO_EXTENSIONS.some((ext) => normalised.endsWith(ext));
}

