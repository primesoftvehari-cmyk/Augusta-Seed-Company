-- =====================================================================
-- AUGUSTA SEED COMPANY - MYSQL / PHPMYADMIN DATABASE SCHEMA
-- Address: UNITED FARM ROAD, GULSHAN-E-ALI BY PASS, SAHIWAL
-- Phone: 03023576036
-- Database: AugustaSeedCompany-3530313592f0
-- Compatible with MySQL 5.7+, MySQL 8.0+, MariaDB 10.3+ & phpMyAdmin
-- =====================================================================

CREATE DATABASE IF NOT EXISTS `AugustaSeedCompany-3530313592f0`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `AugustaSeedCompany-3530313592f0`;

-- ---------------------------------------------------------------------
-- Table 1: company_profile
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `company_profile` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `company_name` VARCHAR(255) NOT NULL,
  `head_office_address` TEXT DEFAULT NULL,
  `phone` VARCHAR(100) DEFAULT NULL,
  `mobile` VARCHAR(100) DEFAULT NULL,
  `email` VARCHAR(100) DEFAULT NULL,
  `website` VARCHAR(100) DEFAULT NULL,
  `ntn` VARCHAR(100) DEFAULT NULL,
  `strn` VARCHAR(100) DEFAULT NULL,
  `logo_url` LONGTEXT DEFAULT NULL,
  `financial_year` VARCHAR(50) DEFAULT '2026-2027',
  `invoice_footer` TEXT DEFAULT NULL,
  `report_footer` TEXT DEFAULT NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table 2: users
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `username` VARCHAR(100) NOT NULL UNIQUE,
  `full_name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(150) DEFAULT NULL,
  `mobile` VARCHAR(100) DEFAULT NULL,
  `role` VARCHAR(50) NOT NULL DEFAULT 'USER',
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `permissions` JSON NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table 3: accounts
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `accounts` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(255) NOT NULL,
  `parent_account` VARCHAR(255) DEFAULT NULL,
  `account_type` ENUM('Assets', 'Liabilities', 'Equity', 'Revenue', 'Expenses', 'General Ledgers') NOT NULL,
  `sales_staff` VARCHAR(255) DEFAULT NULL,
  `phone` VARCHAR(100) DEFAULT NULL,
  `opening_balance` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `opening_balance_type` ENUM('Dr', 'Cr') NOT NULL DEFAULT 'Dr',
  `description` TEXT DEFAULT NULL,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_accounts_type` (`account_type`),
  INDEX `idx_accounts_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table 4: sales_staff
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sales_staff` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `staff_code` VARCHAR(50) NOT NULL UNIQUE,
  `staff_name` VARCHAR(255) NOT NULL,
  `father_name` VARCHAR(255) DEFAULT NULL,
  `mobile` VARCHAR(100) DEFAULT NULL,
  `whatsapp` VARCHAR(100) DEFAULT NULL,
  `address` TEXT DEFAULT NULL,
  `city` VARCHAR(100) DEFAULT NULL,
  `territory` VARCHAR(150) DEFAULT NULL,
  `joining_date` DATE DEFAULT NULL,
  `status` ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
  `remarks` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_staff_code` (`staff_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table 5: territories
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `territories` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `territory_code` VARCHAR(50) NOT NULL UNIQUE,
  `territory_name` VARCHAR(150) NOT NULL,
  `region` VARCHAR(100) DEFAULT NULL,
  `assigned_manager` VARCHAR(150) DEFAULT NULL,
  `status` ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
  `remarks` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table 6: products
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `products` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `product_code` VARCHAR(50) NOT NULL UNIQUE,
  `product_name` VARCHAR(255) NOT NULL,
  `variety` VARCHAR(150) NOT NULL,
  `unit` VARCHAR(50) NOT NULL DEFAULT 'Bag',
  `pack_size` VARCHAR(50) NOT NULL DEFAULT '40kg',
  `purchase_rate` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `sale_rate` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `current_stock` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `minimum_stock` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `lot_no` VARCHAR(100) DEFAULT NULL,
  `status` ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
  `remarks` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_prod_code` (`product_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table 7: vouchers
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `vouchers` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `voucher_no` VARCHAR(50) NOT NULL UNIQUE,
  `voucher_type` ENUM('CASH_PAYMENT', 'CASH_RECEIPT', 'JOURNAL') NOT NULL,
  `date` DATE NOT NULL,
  `sales_staff` VARCHAR(150) DEFAULT NULL,
  `lines` JSON NOT NULL,
  `total_amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `narration` TEXT DEFAULT NULL,
  `created_by` VARCHAR(150) NOT NULL DEFAULT 'System',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_vch_date` (`date`),
  INDEX `idx_vch_type` (`voucher_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table 8: invoices
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `invoices` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `invoice_no` VARCHAR(50) NOT NULL UNIQUE,
  `invoice_type` ENUM('SALES_CASH', 'SALES_CREDIT', 'PURCHASE_CASH', 'PURCHASE_CREDIT', 'SALES_RETURN', 'PURCHASE_RETURN') NOT NULL,
  `date` DATE NOT NULL,
  `account_name` VARCHAR(255) NOT NULL,
  `sales_staff` VARCHAR(150) DEFAULT NULL,
  `territory` VARCHAR(150) DEFAULT NULL,
  `original_invoice_no` VARCHAR(50) DEFAULT NULL,
  `reason` TEXT DEFAULT NULL,
  `items` JSON NOT NULL,
  `gross_total` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `discount_total` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `net_total` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `remarks` TEXT DEFAULT NULL,
  `created_by` VARCHAR(150) NOT NULL DEFAULT 'System',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_inv_date` (`date`),
  INDEX `idx_inv_type` (`invoice_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Initial Seed Data
INSERT INTO `company_profile` (`id`, `company_name`, `head_office_address`, `phone`, `mobile`, `email`, `website`, `ntn`, `strn`, `financial_year`, `invoice_footer`, `report_footer`) VALUES (
  'default',
  'AUGUSTA SEED COMPANY',
  'UNITED FARM ROAD, GULSHAN-E-ALI BY PASS, SAHIWAL',
  '03023576036',
  '03023576036',
  'info@augustaseed.com',
  'www.augustaseed.com',
  '3023576-0',
  '30-02-3576-036-01',
  '2026-2027',
  'Seeds sold are verified under Punjab Seed Corporation & FSC&RD certification standards. Goods once sold will not be accepted without valid batch verification.',
  'System-Generated Report by Augusta Seed Company ERP'
) ON DUPLICATE KEY UPDATE `company_name`=VALUES(`company_name`);
