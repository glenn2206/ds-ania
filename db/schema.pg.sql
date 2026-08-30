-- db/schema.pg.sql — PostgreSQL (lokal & cPanel PostgreSQL). Aman dijalankan ulang.
--   psql -U postgres -d ania -f db/schema.pg.sql
-- Untuk cPanel MySQL: pakai db/schema.sql.

CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  username    VARCHAR(64)  NOT NULL UNIQUE,
  pass_hash   VARCHAR(255) NOT NULL,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id          SERIAL PRIMARY KEY,
  slug        VARCHAR(120) NOT NULL UNIQUE,
  name        VARCHAR(200) NOT NULL,
  category    VARCHAR(20)  NOT NULL DEFAULT 'premium-wrapped'
              CHECK (category IN ('premium-wrapped','bloom-box','standing','vase','accessory')),
  pill        VARCHAR(60)  NOT NULL DEFAULT '',
  flowers     TEXT,
  size        VARCHAR(200),
  price       INTEGER,                       -- IDR tanpa pemisah; NULL = "By request"
  price_note  VARCHAR(255),
  stock       INTEGER,                       -- NULL = tidak dilacak (selalu tersedia); angka = sisa stok
  description TEXT,
  occasion    VARCHAR(255),
  drive       VARCHAR(500),
  featured    VARCHAR(60),
  sort_order  INTEGER      NOT NULL DEFAULT 0,
  status      VARCHAR(12)  NOT NULL DEFAULT 'published'
              CHECK (status IN ('draft','published')),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_products_status_sort ON products (status, sort_order, id);

-- kolom stock menyusul untuk DB yang sudah ada sebelum kolom ini ada:
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INTEGER;

CREATE TABLE IF NOT EXISTS product_images (
  id          SERIAL PRIMARY KEY,
  product_id  INTEGER      NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  filename    VARCHAR(255) NOT NULL,
  position    INTEGER      NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pi_product_pos ON product_images (product_id, position);

CREATE TABLE IF NOT EXISTS orders (
  id                 SERIAL PRIMARY KEY,
  code               VARCHAR(32)  NOT NULL UNIQUE,
  status             VARCHAR(20)  NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','paid','expired','failed','cancelled','fulfilled')),
  customer_name      VARCHAR(200) NOT NULL,
  customer_phone     VARCHAR(40)  NOT NULL,
  customer_email     VARCHAR(200),
  ship_address       TEXT,
  ship_area_id       VARCHAR(120),
  ship_postal        VARCHAR(12),
  courier            VARCHAR(80),
  courier_service    VARCHAR(80),
  shipping_cost      INTEGER      NOT NULL DEFAULT 0,
  subtotal           INTEGER      NOT NULL DEFAULT 0,
  total              INTEGER      NOT NULL DEFAULT 0,
  note               TEXT,
  xendit_invoice_id  VARCHAR(120),
  xendit_invoice_url VARCHAR(500),
  paid_at            TIMESTAMPTZ,
  created_at         TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status, id DESC);

CREATE TABLE IF NOT EXISTS order_items (
  id          SERIAL PRIMARY KEY,
  order_id    INTEGER      NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  INTEGER      REFERENCES products(id) ON DELETE SET NULL,
  slug        VARCHAR(120) NOT NULL,
  name        VARCHAR(200) NOT NULL,
  unit_price  INTEGER      NOT NULL,
  qty         INTEGER      NOT NULL DEFAULT 1,
  line_total  INTEGER      NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items (order_id);

-- key/value pengaturan situs yang bisa diubah dari panel admin (mis. bar promo di atas navbar)
CREATE TABLE IF NOT EXISTS site_settings (
  skey        VARCHAR(64)  PRIMARY KEY,
  svalue      TEXT         NOT NULL DEFAULT '',
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
