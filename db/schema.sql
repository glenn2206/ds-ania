-- db/schema.sql — MySQL / MariaDB (cPanel). Impor via phpMyAdmin → Import.
-- Untuk PostgreSQL: pakai db/schema.pg.sql.

CREATE TABLE IF NOT EXISTS users (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  username    VARCHAR(64)  NOT NULL UNIQUE,
  pass_hash   VARCHAR(255) NOT NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS products (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  slug        VARCHAR(120) NOT NULL UNIQUE,
  name        VARCHAR(200) NOT NULL,
  category    ENUM('premium-wrapped','bloom-box','standing','vase','accessory') NOT NULL DEFAULT 'premium-wrapped',
  pill        VARCHAR(60)  NOT NULL DEFAULT '',
  flowers     TEXT,
  size        VARCHAR(200),
  price       INT UNSIGNED,
  price_note  VARCHAR(255),
  stock       INT,
  description TEXT,
  occasion    VARCHAR(255),
  drive       VARCHAR(500),
  featured    VARCHAR(60),
  sort_order  INT          NOT NULL DEFAULT 0,
  status      ENUM('draft','published') NOT NULL DEFAULT 'published',
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_products_status_sort (status, sort_order, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS product_images (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  product_id  INT UNSIGNED NOT NULL,
  filename    VARCHAR(255) NOT NULL,
  position    INT          NOT NULL DEFAULT 0,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_pi_product_pos (product_id, position),
  CONSTRAINT fk_pi_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS orders (
  id                 INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  code               VARCHAR(32)  NOT NULL UNIQUE,
  status             ENUM('pending','paid','expired','failed','cancelled','fulfilled') NOT NULL DEFAULT 'pending',
  customer_name      VARCHAR(200) NOT NULL,
  customer_phone     VARCHAR(40)  NOT NULL,
  customer_email     VARCHAR(200),
  ship_address       TEXT,
  ship_area_id       VARCHAR(120),
  ship_postal        VARCHAR(12),
  courier            VARCHAR(80),
  courier_service    VARCHAR(80),
  shipping_cost      INT          NOT NULL DEFAULT 0,
  subtotal           INT          NOT NULL DEFAULT 0,
  total              INT          NOT NULL DEFAULT 0,
  note               TEXT,
  xendit_invoice_id  VARCHAR(120),
  xendit_invoice_url VARCHAR(500),
  paid_at            TIMESTAMP    NULL,
  created_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_orders_status (status, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS order_items (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  order_id    INT UNSIGNED NOT NULL,
  product_id  INT UNSIGNED NULL,
  slug        VARCHAR(120) NOT NULL,
  name        VARCHAR(200) NOT NULL,
  unit_price  INT          NOT NULL,
  qty         INT          NOT NULL DEFAULT 1,
  line_total  INT          NOT NULL,
  INDEX idx_order_items_order (order_id),
  CONSTRAINT fk_oi_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_oi_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- key/value pengaturan situs yang bisa diubah dari panel admin (mis. bar promo di atas navbar)
CREATE TABLE IF NOT EXISTS site_settings (
  skey        VARCHAR(64)  NOT NULL PRIMARY KEY,
  svalue      TEXT         NOT NULL,
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
