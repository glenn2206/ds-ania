-- cms/schema.sql — impor via phpMyAdmin ke DB  <cpuser>_aniacms_dev
-- Aman dijalankan ulang (IF NOT EXISTS). TIDAK menyentuh DB lain.

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS users (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  username     VARCHAR(64)  NOT NULL UNIQUE,
  pass_hash    VARCHAR(255) NOT NULL,
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS products (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  slug         VARCHAR(120) NOT NULL UNIQUE,
  name         VARCHAR(200) NOT NULL,
  category     ENUM('premium-wrapped','bloom-box','standing','vase','accessory') NOT NULL DEFAULT 'premium-wrapped',
  pill         VARCHAR(60)  NOT NULL DEFAULT '',
  flowers      TEXT         NULL,
  size         VARCHAR(200) NULL,
  price        INT UNSIGNED NULL,                 -- IDR, tanpa pemisah; NULL = "By request"
  price_note   VARCHAR(255) NULL,
  description  TEXT         NULL,
  occasion     VARCHAR(255) NULL,
  drive        VARCHAR(500) NULL,
  featured     VARCHAR(60)  NULL,
  sort_order   INT          NOT NULL DEFAULT 0,
  status       ENUM('draft','published') NOT NULL DEFAULT 'published',
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status_sort (status, sort_order, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS product_images (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  product_id   INT UNSIGNED NOT NULL,
  filename     VARCHAR(255) NOT NULL,             -- <slug>-<pos+1>.jpg di ~/ania-cms/uploads
  position     INT          NOT NULL DEFAULT 0,
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pi_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product_pos (product_id, position)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS jobs (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  kind         VARCHAR(32)  NOT NULL DEFAULT 'publish',
  status       ENUM('queued','running','done','error') NOT NULL DEFAULT 'queued',
  log          MEDIUMTEXT   NULL,
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  started_at   TIMESTAMP    NULL,
  finished_at  TIMESTAMP    NULL,
  INDEX idx_status (status, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
