import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = import.meta.dirname;

// Each page lives in its own folder so URLs are clean: /tien-trinh/, /gioi-thieu/, /dich-vu/, /san-pham/, /tai-khoan/.
const PAGES = ['tien-trinh', 'gioi-thieu', 'dich-vu', 'san-pham', 'tai-khoan'];

// Replaces <!-- @include name --> with src/partials/name.html so every page
// ships the same header, menu and footer as real HTML (no JS needed to see them).
function partials() {
  return {
    name: 'html-partials',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        return html.replace(/<!--\s*@include\s+([\w-]+)\s*-->/g, (_, name) =>
          readFileSync(resolve(root, 'src/partials', `${name}.html`), 'utf8')
        );
      },
    },
    handleHotUpdate({ file, server }) {
      if (file.includes('/src/partials/')) server.ws.send({ type: 'full-reload' });
    },
  };
}

// Sends old or incomplete URLs to the clean slug with a 301:
// /dich-vu.html → /dich-vu/, /dich-vu → /dich-vu/, /index.html → /
// (query string and hash are kept by the browser).
function cleanUrls() {
  const redirect = (req, res, next) => {
    const [path, query = ''] = req.url.split('?');
    const qs = query ? `?${query}` : '';
    let to = null;
    if (path === '/index.html') to = '/';
    for (const slug of PAGES) {
      if (path === `/${slug}` || path === `/${slug}.html` || path === `/${slug}/index.html`) to = `/${slug}/`;
    }
    if (!to) return next();
    res.statusCode = 301;
    res.setHeader('Location', to + qs);
    res.end();
  };
  return {
    name: 'clean-urls',
    configureServer(server) { server.middlewares.use(redirect); },
    configurePreviewServer(server) { server.middlewares.use(redirect); },
  };
}

export default defineConfig({
  appType: 'mpa',
  plugins: [partials(), cleanUrls()],
  build: {
    rollupOptions: {
      input: {
        index: resolve(root, 'index.html'),
        ...Object.fromEntries(PAGES.map((slug) => [slug, resolve(root, slug, 'index.html')])),
      },
    },
  },
});
