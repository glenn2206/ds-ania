-- db/drop.pg.sql — HAPUS semua tabel app (untuk mulai ulang bersih).
-- Jalankan lalu: schema.pg.sql → seed.pg.sql
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS product_images CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS site_settings CASCADE;
DROP TABLE IF EXISTS users CASCADE;
