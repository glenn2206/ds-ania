BEGIN;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conrelid='public.orders'::regclass AND conname='orders_status_check'
      AND pg_get_constraintdef(oid) LIKE '%refund_requested%' AND pg_get_constraintdef(oid) LIKE '%refunded%'
  ) THEN
    ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
    ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN ('pending','paid','expired','failed','cancelled','fulfilled','refund_requested','refunded'));
  END IF;
END $$;
CREATE TABLE IF NOT EXISTS order_emails (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  event VARCHAR(24) NOT NULL,
  recipient_kind VARCHAR(12) NOT NULL,
  recipient VARCHAR(200),
  state VARCHAR(12) NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(order_id,event,recipient_kind)
);
CREATE TABLE IF NOT EXISTS order_refunds (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL UNIQUE REFERENCES orders(id),
  reference_id VARCHAR(100) NOT NULL UNIQUE,
  refund_id VARCHAR(100),
  amount INTEGER NOT NULL,
  state VARCHAR(12) NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMIT;
