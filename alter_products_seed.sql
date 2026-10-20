-- =====================================================================
-- AUGUSTA SEED COMPANY - SQL SCRIPT FOR ALTERING PRODUCTS & ADDING SEED PRODUCTS
-- Database: AugustaSeedCompany-3530313592f0
-- =====================================================================

USE `AugustaSeedCompany-3530313592f0`;

-- 1. Alter products table if any new columns are required (e.g. seed category, certification grade, germination rate)
ALTER TABLE `products` 
  ADD COLUMN IF NOT EXISTS `seed_category` VARCHAR(100) DEFAULT 'Certified Seed' AFTER `variety`,
  ADD COLUMN IF NOT EXISTS `germination_percentage` DECIMAL(5,2) DEFAULT 95.00 AFTER `minimum_stock`,
  ADD COLUMN IF NOT EXISTS `crop_season` VARCHAR(50) DEFAULT 'Kharif/Rabi' AFTER `germination_percentage`;

-- 2. Insert / Add New Seed Products into `products` table
INSERT INTO `products` (
  `id`, 
  `product_code`, 
  `product_name`, 
  `variety`, 
  `seed_category`,
  `unit`, 
  `pack_size`, 
  `purchase_rate`, 
  `sale_rate`, 
  `current_stock`, 
  `minimum_stock`, 
  `germination_percentage`,
  `crop_season`,
  `lot_no`, 
  `status`, 
  `remarks`
) VALUES 
(
  'PROD-SEED-001', 
  'AG-COTTON-888', 
  'Augusta Gold Bt Cotton Seed', 
  'MNH-888 Premium', 
  'Pre-Basic Certified',
  'Bag', 
  '40kg', 
  7500.00, 
  8200.00, 
  250.00, 
  20.00, 
  98.50,
  'Kharif',
  'LOT-COTTON-2026-01', 
  'Active', 
  'High yielding insect resistant Bt Cotton seed variety approved for Punjab region.'
),
(
  'PROD-SEED-002', 
  'AG-WHEAT-101', 
  'Augusta Super Gold Wheat Seed', 
  'Akbar-2019 / Millat-11', 
  'Certified Seed',
  'Bag', 
  '50kg', 
  4200.00, 
  4650.00, 
  500.00, 
  50.00, 
  96.00,
  'Rabi',
  'LOT-WHEAT-2026-02', 
  'Active', 
  'Disease resistant high protein wheat seed tested by FSC&RD.'
),
(
  'PROD-SEED-003', 
  'AG-CORN-99', 
  'Augusta Hybrid Maize (Corn) Seed', 
  'Pioneer 30Y87 Equivalent', 
  'Hybrid F1',
  'Bag', 
  '10kg', 
  12500.00, 
  14000.00, 
  150.00, 
  15.00, 
  99.00,
  'Kharif/Spring',
  'LOT-CORN-2026-03', 
  'Active', 
  'High cob weight and stay-green hybrid corn seed for maximum grain yield.'
),
(
  'PROD-SEED-004', 
  'AG-RICE-921', 
  'Augusta Super Basmati Rice Seed', 
  'Basmati 921 / 1121', 
  'Certified Seed',
  'Bag', 
  '40kg', 
  6800.00, 
  7400.00, 
  300.00, 
  30.00, 
  94.50,
  'Kharif',
  'LOT-RICE-2026-04', 
  'Active', 
  'Extra long grain aromatic basmati paddy seed with high purity.'
)
ON DUPLICATE KEY UPDATE 
  `product_name` = VALUES(`product_name`),
  `variety` = VALUES(`variety`),
  `sale_rate` = VALUES(`sale_rate`),
  `purchase_rate` = VALUES(`purchase_rate`);

-- 3. Verify inserted records
SELECT * FROM `products`;
