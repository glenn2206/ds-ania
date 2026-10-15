-- Additive migration. Run as database owner before deploying courier booking.
CREATE TABLE IF NOT EXISTS order_shipments (
  order_id INTEGER PRIMARY KEY REFERENCES orders(id) ON DELETE CASCADE,
  snapshot TEXT NOT NULL,
  reference_id VARCHAR(100) NOT NULL UNIQUE,
  state VARCHAR(20) NOT NULL DEFAULT 'ready',
  provider_id VARCHAR(120) UNIQUE,
  provider_data TEXT,
  provider_mode VARCHAR(10),
  last_error TEXT,
  booked_by VARCHAR(64),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
