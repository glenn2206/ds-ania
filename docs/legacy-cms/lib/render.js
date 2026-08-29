/** cms/lib/render.js — util kecil: escape HTML + kerangka halaman. */
export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function page({ title = 'ANIA CMS', body = '', user = null }) {
  return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} — ANIA CMS</title>
<link rel="stylesheet" href="/admin.css">
</head>
<body>
<header class="top">
  <a class="brand" href="/admin">ANIA CMS</a>
  ${user ? `<nav><span class="who">${esc(user.username)}</span>
    <form method="post" action="/logout"><button class="link">Logout</button></form></nav>` : ''}
</header>
<main class="wrap">${body}</main>
<script src="/admin.js" defer></script>
</body>
</html>`;
}
