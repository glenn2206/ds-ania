import { page, esc } from '../lib/render.js';

export function loginView({ error = '' } = {}) {
  return page({
    title: 'Masuk',
    body: `
<div class="card card--narrow">
  <h1>Masuk</h1>
  ${error ? `<p class="err">${esc(error)}</p>` : ''}
  <form method="post" action="/login" class="form">
    <label>Username <input name="username" autocomplete="username" required autofocus></label>
    <label>Password <input type="password" name="password" autocomplete="current-password" required></label>
    <button class="btn" type="submit">Masuk</button>
  </form>
</div>`,
  });
}
