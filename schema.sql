-- ============================================================
-- Khantoke Gold System - โครงสร้างฐานข้อมูล (MySQL / MariaDB)
-- รันไฟล์นี้เพื่อสร้างฐานข้อมูล ตาราง และข้อมูลตัวอย่างเริ่มต้น
--   mysql -u root < schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS khantoke_gold
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE khantoke_gold;

-- ── การตั้งค่าโดยรวม (มีแถวเดียวเสมอ id=1) ──────────────────────
DROP TABLE IF EXISTS settings;
CREATE TABLE settings (
  id TINYINT PRIMARY KEY DEFAULT 1,
  dark_mode TINYINT(1) NOT NULL DEFAULT 0,
  order_date DATE NOT NULL,
  CONSTRAINT chk_settings_single_row CHECK (id = 1)
) ENGINE=InnoDB;

-- ── สต๊อกวัตถุดิบ ────────────────────────────────────────────
DROP TABLE IF EXISTS stock;
CREATE TABLE stock (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  qty DECIMAL(10,2) NOT NULL DEFAULT 0,
  unit VARCHAR(20) NOT NULL,
  min_qty DECIMAL(10,2) NOT NULL DEFAULT 0,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ── เมนู / สูตรอาหาร ─────────────────────────────────────────
DROP TABLE IF EXISTS recipe_ingredients;
DROP TABLE IF EXISTS recipes;
CREATE TABLE recipes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_today TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE recipe_ingredients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  recipe_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  qty_label VARCHAR(50) NOT NULL,
  cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── น้ำจิ้ม ──────────────────────────────────────────────────
DROP TABLE IF EXISTS sauce_ingredients;
DROP TABLE IF EXISTS sauces;
CREATE TABLE sauces (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  stock_qty DECIMAL(10,2) NOT NULL DEFAULT 0,
  max_price_per_bag DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE sauce_ingredients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sauce_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  qty_per_round DECIMAL(10,2) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  FOREIGN KEY (sauce_id) REFERENCES sauces(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── ลูกค้า / ผู้จำหน่าย ───────────────────────────────────────
DROP TABLE IF EXISTS vendors;
CREATE TABLE vendors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(30) NOT NULL DEFAULT '',
  address VARCHAR(255) NOT NULL DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ── ออเดอร์ ──────────────────────────────────────────────────
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_date DATE NOT NULL,
  customer_name VARCHAR(100) NOT NULL,
  order_time VARCHAR(10) NOT NULL,
  paid TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_orders_date (order_date)
) ENGINE=InnoDB;

CREATE TABLE order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  menu_name VARCHAR(100) NOT NULL,
  qty INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── บันทึกการผลิต (แยกตามสถานี + วันที่ผลิต) ───────────────────
DROP TABLE IF EXISTS station_logs;
CREATE TABLE station_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  station_key ENUM('soup','rice','meat') NOT NULL,
  production_date DATE NOT NULL,
  name VARCHAR(100) NOT NULL,
  qty DECIMAL(10,2) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  cost DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_station_logs_date (production_date)
) ENGINE=InnoDB;

-- ── รายจ่าย (ต้นทุนวัตถุดิบ / ค่าแรง / อื่นๆ) ──────────────────
DROP TABLE IF EXISTS expenses;
CREATE TABLE expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  expense_date DATE NOT NULL,
  category ENUM('material','labor','other') NOT NULL,
  stock_id INT NULL,
  description VARCHAR(150) NOT NULL,
  qty DECIMAL(10,2) NULL,
  unit VARCHAR(20) NULL,
  unit_price DECIMAL(10,2) NULL,
  amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_expenses_date (expense_date)
) ENGINE=InnoDB;

-- ============================================================
-- ข้อมูลตัวอย่างเริ่มต้น (เหมือนต้นฉบับดีไซน์ Khantoke Gold)
-- ============================================================

INSERT INTO settings (id, dark_mode, order_date) VALUES
  (1, 0, DATE_ADD(CURDATE(), INTERVAL 1 DAY));

INSERT INTO stock (name, qty, unit, min_qty, price) VALUES
  ('ข้าวสาร', 8, 'กก.', 5, 0),
  ('ไก่', 3, 'กก.', 4, 0),
  ('หมู', 5, 'กก.', 3, 0),
  ('กะเพรา', 2, 'กรัม', 3, 0),
  ('กระเทียม', 0.5, 'กก.', 2, 0),
  ('น้ำมัน', 4, 'ลิตร', 2, 0),
  ('ไข่', 30, 'ฟอง', 24, 0),
  ('ซีอิ้ว', 2, 'ขวด', 1, 0);

INSERT INTO recipes (id, name, price, is_today) VALUES
  (1, 'ข้าวไก่ทอดกระเทียม', 65, 1),
  (2, 'ข้าวหมูกรอบ', 70, 1),
  (3, 'ข้าวผัดกะเพราไก่', 60, 1),
  (4, 'ข้าวมันไก่', 55, 1),
  (5, 'ข้าวหน้าเป็ด', 75, 0),
  (6, 'ข้าวผัดข้าว', 45, 0);

INSERT INTO recipe_ingredients (recipe_id, name, qty_label, cost) VALUES
  (1, 'ข้าวสาร', '150 กรัม', 4.5), (1, 'ไก่', '120 กรัม', 18), (1, 'กระเทียม', '15 กรัม', 1.5), (1, 'น้ำมัน', '30 มล.', 1.5), (1, 'เครื่องปรุง', '1 set', 12.5),
  (2, 'ข้าวสาร', '150 กรัม', 4.5), (2, 'หมูกรอบ', '130 กรัม', 26), (2, 'ผักสด', '50 กรัม', 4), (2, 'เครื่องปรุง', '1 set', 7.5),
  (3, 'ข้าวสาร', '150 กรัม', 4.5), (3, 'ไก่สับ', '100 กรัม', 15), (3, 'กะเพรา', '1/4 กำ', 3), (3, 'ไข่', '1 ฟอง', 4), (3, 'เครื่องปรุง', '1 set', 8.5),
  (4, 'ข้าวสาร', '150 กรัม', 4.5), (4, 'ไก่ต้ม', '100 กรัม', 15), (4, 'น้ำซุป', '200 มล.', 3), (4, 'เครื่องปรุง', '1 set', 7.5),
  (5, 'ข้าวสาร', '150 กรัม', 4.5), (5, 'เป็ดพะโล้', '120 กรัม', 30), (5, 'ผักสด', '50 กรัม', 4), (5, 'เครื่องปรุง', '1 set', 9.5),
  (6, 'ข้าวสาร', '200 กรัม', 6), (6, 'ไข่', '2 ฟอง', 8), (6, 'ผักสด', '50 กรัม', 3), (6, 'เครื่องปรุง', '1 set', 5);

INSERT INTO sauces (id, name, stock_qty, max_price_per_bag) VALUES
  (1, 'น้ำจิ้มไก่', 5, 0);

INSERT INTO sauce_ingredients (sauce_id, name, qty_per_round, unit) VALUES
  (1, 'กระเทียม', 0.5, 'กก.'),
  (1, 'ซีอิ้ว', 1, 'ขวด');

INSERT INTO vendors (id, name, phone, address) VALUES
  (1, 'แม่สมหมาย', '081-234-5678', 'ตลาดสด แผงที่ 12'),
  (2, 'ร้านสี่แยก', '089-876-5432', 'สี่แยกไฟแดงหน้าตลาด'),
  (3, 'ป้าจันทร์', '086-111-2222', ''),
  (4, 'ลุงมานะ', '087-333-4444', 'ตลาดนัดเช้า');

INSERT INTO orders (id, order_date, customer_name, order_time, paid) VALUES
  (1, CURDATE(), 'แม่สมหมาย', '06:30', 1),
  (2, CURDATE(), 'ร้านสี่แยก', '06:45', 1),
  (3, CURDATE(), 'ป้าจันทร์', '07:15', 0),
  (4, CURDATE(), 'ลุงมานะ', '07:20', 0);

INSERT INTO order_items (order_id, menu_name, qty, price) VALUES
  (1, 'ข้าวไก่ทอดกระเทียม', 10, 65), (1, 'ข้าวหมูกรอบ', 5, 70),
  (2, 'ข้าวมันไก่', 20, 55),
  (3, 'ข้าวผัดกะเพราไก่', 18, 60), (3, 'ข้าวหน้าเป็ด', 15, 75),
  (4, 'ข้าวไก่ทอดกระเทียม', 20, 65), (4, 'ข้าวหมูกรอบ', 20, 70);
