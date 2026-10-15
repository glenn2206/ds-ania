-- Additive migration for MySQL/MariaDB.
CREATE TABLE IF NOT EXISTS order_shipments (
  order_id INT UNSIGNED PRIMARY KEY,
  snapshot TEXT NOT NULL,
  reference_id VARCHAR(100) NOT NULL UNIQUE,
  state VARCHAR(20) NOT NULL DEFAULT 'ready',
  provider_id VARCHAR(120) UNIQUE,
  provider_data TEXT,
  provider_mode VARCHAR(10),
  last_error TEXT,
  booked_by VARCHAR(64),
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_shipment_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
