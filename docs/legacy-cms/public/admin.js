/* cms/public/admin.js — reorder/hapus foto + tombol Publish (polling). */
(() => {
  // ---- Publish ----
  const pubBtn = document.querySelector('[data-publish]');
  const log = document.getElementById('publog');
  if (pubBtn) {
    pubBtn.addEventListener('click', async () => {
      pubBtn.disabled = true;
      pubBtn.textContent = 'Mengantre…';
      log.hidden = false;
      log.textContent = 'mengirim…';
      try {
        const r = await fetch('/publish', { method: 'POST' }).then((x) => x.json());
        const id = r.id;
        const tick = async () => {
          const s = await fetch('/publish/status?id=' + id).then((x) => x.json());
          log.textContent = s.log || s.status;
          log.scrollTop = log.scrollHeight;
          if (s.status === 'done' || s.status === 'error') {
            pubBtn.disabled = false;
            pubBtn.textContent = 'Publish ke situs';
            if (s.status === 'done') log.textContent += '\n\n✅ Selesai.';
            return;
          }
          setTimeout(tick, 2000);
        };
        tick();
      } catch (e) {
        log.textContent = 'gagal: ' + e.message;
        pubBtn.disabled = false;
        pubBtn.textContent = 'Publish ke situs';
      }
    });
  }

  // ---- Foto: reorder & hapus ----
  const grid = document.querySelector('[data-images]');
  if (grid) {
    const pid = grid.dataset.product;
    const saveOrder = async () => {
      const order = [...grid.querySelectorAll('[data-img-id]')].map((li) => Number(li.dataset.imgId));
      await fetch(`/admin/products/${pid}/images/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order }),
      });
    };
    grid.addEventListener('click', async (e) => {
      const li = e.target.closest('[data-img-id]');
      if (!li) return;
      if (e.target.dataset.move === 'up' && li.previousElementSibling) {
        li.parentNode.insertBefore(li, li.previousElementSibling);
        await saveOrder();
        location.reload();
      } else if (e.target.dataset.move === 'down' && li.nextElementSibling) {
        li.parentNode.insertBefore(li.nextElementSibling, li);
        await saveOrder();
        location.reload();
      } else if (e.target.dataset.del !== undefined) {
        if (!confirm('Hapus foto ini?')) return;
        await fetch(`/admin/products/${pid}/images/${li.dataset.imgId}`, { method: 'DELETE' });
        location.reload();
      }
    });
  }

  // uploader submit = biasa (multipart form) — biarkan native, tapi kunci tombol
  const up = document.querySelector('[data-uploader]');
  if (up) {
    up.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(up);
      const btn = up.querySelector('button');
      btn.disabled = true;
      btn.textContent = 'Mengunggah…';
      fetch(up.getAttribute('action') || `/admin/products/${up.dataset.product}/images`, {
        method: 'POST',
        body: fd,
      }).then(() => location.reload());
    });
    up.setAttribute('action', `/admin/products/${up.dataset.product}/images`);
    up.setAttribute('method', 'post');
    up.setAttribute('enctype', 'multipart/form-data');
  }
})();
