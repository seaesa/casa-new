// Lightweight, browser-only account state. There is no backend on this static
// site: the "account" is a local profile that unlocks the dashboard and is
// kept in localStorage. Passwords are never stored — only the profile fields.
const KEY = 'casa:user:v1';
const listeners = new Set();

export function getUser() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const u = JSON.parse(raw);
    return u && typeof u.email === 'string' ? u : null;
  } catch {
    return null;
  }
}

function write(user) {
  try {
    if (user) localStorage.setItem(KEY, JSON.stringify(user));
    else localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  listeners.forEach((fn) => fn(user));
}

export function signIn({ name, email }) {
  const user = {
    name: (name || '').trim() || email.split('@')[0],
    email: email.trim(),
    phone: getUser()?.phone || '0763161286',
    joined: getUser()?.joined || new Date().toISOString(),
  };
  write(user);
  return user;
}

export function signOut() {
  write(null);
}

export function onAuthChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function setText(scope, selector, value) {
  scope.querySelectorAll(selector).forEach((el) => {
    el.textContent = value;
  });
}

export function initAuth() {
  const guest = document.querySelector('[data-auth-guest]');
  const member = document.querySelector('[data-auth-user]');
  if (!guest || !member) return;

  const form = document.querySelector('[data-login-form]');
  const status = document.querySelector('[data-login-status]');

  const render = (user) => {
    guest.hidden = Boolean(user);
    member.hidden = !user;
    if (user) {
      setText(member, '[data-user-name]', user.name);
      setText(member, '[data-user-email]', user.email);
      setText(member, '[data-user-phone]', user.phone);
      const first = member.querySelector('[data-user-first]');
      if (first) first.textContent = user.name;
    }
  };

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const email = String(data.get('email') || '').trim();
    const password = String(data.get('password') || '');
    const name = String(data.get('name') || '');

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      if (status) status.textContent = 'Vui lòng nhập email hợp lệ.';
      form.querySelector('#lg-email')?.focus();
      return;
    }
    if (password.length < 6) {
      if (status) status.textContent = 'Mật khẩu cần ít nhất 6 ký tự.';
      form.querySelector('#lg-pass')?.focus();
      return;
    }
    if (status) status.textContent = '';
    render(signIn({ name, email }));
  });

  document.querySelectorAll('[data-auth-signout]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      signOut();
      render(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  onAuthChange(render);
  render(getUser());
}
