ALTER TABLE orders MODIFY status ENUM('pending','paid','expired','failed','cancelled','fulfilled','refund_requested','refunded') NOT NULL DEFAULT 'pending';
CREATE TABLE IF NOT EXISTS order_emails (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  order_id INT UNSIGNED NOT NULL,
  event VARCHAR(24) NOT NULL,
  recipient_kind VARCHAR(12) NOT NULL,
  recipient VARCHAR(200),
  state VARCHAR(12) NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMP NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY order_email_event (order_id,event,recipient_kind),
  FOREIGN KEY (order_id) REFERENCES orders(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS order_refunds (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  order_id INT UNSIGNED NOT NULL UNIQUE,
  reference_id VARCHAR(100) NOT NULL UNIQUE,
  refund_id VARCHAR(100),
  amount INT NOT NULL,
  state VARCHAR(12) NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
