import http from 'node:http';
import crypto from 'node:crypto';

export async function localPaymentPortal({ port, appBase, db, productId, token, onOrder }) {
  const origin = `http://127.0.0.1:${port}`;
  const invoices = new Map();
  const json = (res, value, status = 200) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(value)); };
  const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const server = http.createServer(async (req, res) => {
    try {
      const path = new URL(req.url, origin).pathname;
      if (path === '/invoices' || path === '/can-book') {
        if (req.method !== 'POST' || req.headers['x-local-demo-token'] !== token) return json(res, { error: 'forbidden' }, 403);
        let text = '';
        for await (const chunk of req) { text += chunk; if (text.length > 20000) throw Error('Request too large'); }
        const data = JSON.parse(text);
        if (path === '/can-book') return json(res, { allowed: [...invoices.values()].some(i => i.reference === data.reference) });
        const { rows } = await db.query('SELECT * FROM orders WHERE code=$1', [data.external_id]);
        const order = rows[0];
        if (!order) return json(res, { error: 'Missing demo order' }, 400);
        const items = (await db.query('SELECT product_id FROM order_items WHERE order_id=$1', [order.id])).rows;
        if (!items.length || items.some(i => i.product_id !== productId) || Number(data.amount) !== Number(order.total)) return json(res, { error: 'Only the local DEMO product may be used' }, 400);
        const id = 'LOCAL-MOCK-' + crypto.randomBytes(8).toString('hex');
        invoices.set(id, { order, reference: `ANIA-SHIP-${order.id}-${order.code}` });
        onOrder(order.id);
        return json(res, { id, invoice_url: `${origin}/pay/${id}`, status: 'PENDING' });
      }
      const id = path.startsWith('/pay/') ? path.slice('/pay/'.length) : '';
      const invoice = invoices.get(id);
      if (!invoice) { res.writeHead(404); return res.end('Local mock invoice not found'); }
      const order = invoice.order;
      if (req.method === 'POST') {
        if (req.headers.origin !== origin) return json(res, { error: 'Invalid origin' }, 403);
        const response = await fetch(`${appBase}/api/webhooks/xendit`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-callback-token': token }, body: JSON.stringify({ id, external_id: order.code, status: 'PAID', amount: order.total, paid_amount: order.total, currency: 'IDR' }) });
        if (!response.ok) throw Error('Mock callback failed');
        res.writeHead(303, { Location: `${appBase}/order/${order.code}` }); return res.end();
      }
      const money = value => 'Rp ' + Number(value).toLocaleString('id-ID');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(`<!doctype html><html lang="id"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pembayaran Simulasi Lokal</title><style>body{font:16px/1.6 Arial,sans-serif;color:#333;margin:0;background:#f4f5f4}main{max-width:580px;margin:70px auto;padding:32px;background:white;border:1px solid #ddd;border-radius:8px}h1{font-size:26px}small{color:#a13c30}dl{display:grid;grid-template-columns:1fr 1fr;gap:12px}dd{margin:0;text-align:right}button{padding:14px 20px;background:#596947;color:white;border:0;border-radius:6px;font:inherit;cursor:pointer}</style><main><small>LOCAL MOCK - BUKAN HALAMAN XENDIT</small><h1>Pembayaran Simulasi</h1><p>Order ${escape(order.code)}</p><dl><dt>Bunga</dt><dd>${money(order.subtotal)}</dd><dt>Ongkir Instant</dt><dd>${money(order.shipping_cost)}</dd><dt><strong>Total</strong></dt><dd><strong>${money(order.total)}</strong></dd></dl><p>Tidak ada uang, saldo, atau metode pembayaran nyata yang digunakan. Tombol ini mengirim callback PAID simulasi ke aplikasi lokal.</p><form method="post"><button>Simulasikan pembayaran berhasil</button></form></main></html>`);
    } catch { json(res, { error: 'Local payment simulation failed' }, 500); }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve); });
  return { origin, close: () => new Promise(resolve => server.close(resolve)) };
}
