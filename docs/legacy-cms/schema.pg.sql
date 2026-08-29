-- cms/schema.pg.sql — versi PostgreSQL (lokal / opsional).
-- Untuk cPanel pakai schema.sql (MySQL). Aman dijalankan ulang.
--   psql -U postgres -d ania_cms -f schema.pg.sql

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

CREATE TABLE IF NOT EXISTS product_images (
  id          SERIAL PRIMARY KEY,
  product_id  INTEGER      NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  filename    VARCHAR(255) NOT NULL,
  position    INTEGER      NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pi_product_pos ON product_images (product_id, position);

CREATE TABLE IF NOT EXISTS jobs (
  id          SERIAL PRIMARY KEY,
  kind        VARCHAR(32)  NOT NULL DEFAULT 'publish',
  status      VARCHAR(12)  NOT NULL DEFAULT 'queued'
              CHECK (status IN ('queued','running','done','error')),
  log         TEXT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  started_at  TIMESTAMPTZ,
  finished_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs (status, id);
