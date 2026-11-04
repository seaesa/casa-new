// "Ghim" (favourite) projects — stored in localStorage so the library works
// without a backend. Every page that renders pins can reuse the same store.
import { PROJECTS } from './projects-data.js';
import { TITLES_EN, catEn } from './projects-en.js';
import { currentLang } from './lang.js';

const KEY = 'casa:favorites:v1';
const listeners = new Set();

export function readFavorites() {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr)
      ? arr.filter((n) => Number.isInteger(n) && PROJECTS[n])
      : [];
  } catch {
    return [];
  }
}

function write(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* private mode / quota — the UI still works for this session */
  }
  listeners.forEach((fn) => fn(list));
}

export function isFavorite(index) {
  return readFavorites().includes(index);
}

export function toggleFavorite(index) {
  const list = readFavorites();
  const at = list.indexOf(index);
  if (at === -1) list.push(index);
  else list.splice(at, 1);
  write(list);
  return at === -1;
}

export function onFavoritesChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

const PIN_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.6c-3 0-5.4 2.4-5.4 5.4 0 3.8 5.4 10 5.4 10s5.4-6.2 5.4-10c0-3-2.4-5.4-5.4-5.4Z"/><circle cx="12" cy="9" r="1.9"/></svg>';

function paint(btn, index) {
  const on = isFavorite(index);
  btn.classList.toggle('is-on', on);
  btn.setAttribute('aria-pressed', String(on));
  btn.setAttribute('aria-label', on ? 'Bỏ ghim dự án' : 'Ghim dự án vào thư viện yêu thích');
  btn.title = on ? 'Bỏ ghim' : 'Ghim vào thư viện yêu thích';
}

function announce(on) {
  let el = document.querySelector('[data-fav-live]');
  if (!el) {
    el = document.createElement('p');
    el.setAttribute('data-fav-live', '');
    el.className = 'visually-hidden';
    el.setAttribute('aria-live', 'polite');
    document.body.appendChild(el);
  }
  el.textContent = on
    ? 'Đã ghim vào thư viện yêu thích.'
    : 'Đã bỏ ghim khỏi thư viện yêu thích.';
}

// Wraps each .pin so the favourite button can sit next to it (a button
// cannot be nested inside the pin button itself).
export function initPinFavorites(scope = document) {
  scope.querySelectorAll('.pin[data-index]').forEach((pin) => {
    if (pin.parentElement?.classList.contains('pin-wrap')) return;

    const wrap = document.createElement('div');
    wrap.className = 'pin-wrap';
    pin.parentNode.insertBefore(wrap, pin);
    wrap.appendChild(pin);

    const index = Number(pin.dataset.index);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pin__fav';
    btn.dataset.favIndex = String(index);
    btn.innerHTML = PIN_SVG;
    wrap.appendChild(btn);
    paint(btn, index);

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const on = toggleFavorite(index);
      paint(btn, index);
      announce(on);
    });
  });

  onFavoritesChange(() => {
    scope.querySelectorAll('.pin__fav').forEach((b) => paint(b, Number(b.dataset.favIndex)));
  });
}

function cardMarkup(item, index) {
  const en = currentLang() === 'en';
  const title = en ? (TITLES_EN[index] || item.title) : item.title;
  const cat = en ? catEn(item.cat) : item.cat;
  const href = item.link || item.img;
  return `
    <div class="pin-wrap">
      <a class="pin" href="${href}" target="_blank" rel="noopener">
        <img src="${item.img}" width="${item.w}" height="${item.h}" loading="lazy" decoding="async" alt="${title}">
        <span class="pin__info">${title}<small>${cat}${item.domain ? ` · ${item.domain}` : ''}</small></span>
      </a>
      <button class="fav-card__remove" type="button" data-fav-remove="${index}" aria-label="Bỏ ghim ${title}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 5l14 14M19 5 5 19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </button>
    </div>`;
}

export function initFavoritesPage() {
  const grid = document.querySelector('[data-fav-grid]');
  if (!grid) return;

  const count = document.querySelector('[data-fav-count]');
  const empty = document.querySelector('[data-fav-empty]');

  const render = () => {
    const list = readFavorites();
    const en = currentLang() === 'en';
    grid.innerHTML = list.map((i) => `<li>${cardMarkup(PROJECTS[i], i)}</li>`).join('');
    grid.hidden = list.length === 0;
    if (empty) empty.hidden = list.length !== 0;
    if (count) count.textContent = en
      ? `${String(list.length).padStart(2, '0')} pinned items`
      : `${String(list.length).padStart(2, '0')} mục đã ghim`;
  };

  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-fav-remove]');
    if (!btn) return;
    e.preventDefault();
    toggleFavorite(Number(btn.dataset.favRemove));
    render();
  });

  onFavoritesChange(render);
  document.addEventListener('casa:lang', render);
  render();
}

// Small preview used by the account dashboard.
export function initFavoritesPreview() {
  const box = document.querySelector('[data-fav-preview]');
  if (!box) return;
  const empty = document.querySelector('[data-fav-preview-empty]');
  const link = document.querySelector('[data-fav-preview-link]');

  const render = () => {
    const list = readFavorites();
    const en = currentLang() === 'en';
    box.innerHTML = list.slice(0, 8).map((i) => {
      const p = PROJECTS[i];
      return `<li><img src="${p.img}" width="${p.w}" height="${p.h}" loading="lazy" alt="${en ? (TITLES_EN[i] || p.title) : p.title}"></li>`;
    }).join('');
    box.hidden = list.length === 0;
    if (empty) empty.hidden = list.length !== 0;
    if (link) {
      link.textContent = list.length
        ? (en ? 'View favourites' : 'Xem thư viện yêu thích')
        : (en ? 'Explore projects' : 'Khám phá dự án');
    }
  };

  onFavoritesChange(render);
  document.addEventListener('casa:lang', render);
  render();
}
