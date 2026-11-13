import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initial Default Company Profile
const DEFAULT_COMPANY_PROFILE = {
  companyName: 'AUGUSTA SEED COMPANY',
  headOfficeAddress: 'UNITED FARM ROAD, GULSHAN-E-ALI BY PASS, SAHIWAL',
  phone: '03023576036',
  mobile: '03023576036',
  email: 'info@augustaseed.com',
  website: 'www.augustaseed.com',
  ntn: '3023576-0',
  strn: '30-02-3576-036-01',
  logoUrl: '/augusta_seed_logo.jpg',
  financialYear: '2026-2027',
  invoiceFooter: 'Seeds sold are verified under Punjab Seed Corporation & FSC&RD certification standards. Goods once sold will not be accepted without valid batch verification.',
  reportFooter: 'Computer generated official document. Augusta Seed Company Sahiwal.'
};

const DEFAULT_ADMIN = {
  id: 'usr_admin_01',
  username: 'admin',
  fullName: 'System Administrator',
  email: 'admin@augustaseed.com',
  mobile: '03023576036',
  role: 'ADMIN',
  active: true,
  permissions: {
    canManageUsers: true,
    canManageAccounts: true,
    canManageProducts: true,
    canManageStaff: true,
    canManageTerritories: true,
    canManageCompany: true,
    canCreateVouchers: true,
    canCreateInvoices: true,
    canViewReports: true,
    canEditDelete: true
  },
  createdAt: '2026-10-01T10:00:00.000Z'
};

const DEFAULT_USER = {
  id: 'usr_accountant_02',
  username: 'accountant',
  fullName: 'Muhammad Nasir',
  email: 'nasir@augustaseed.com',
  mobile: '03023576036',
  role: 'USER',
  active: true,
  permissions: {
    canManageUsers: false,
    canManageAccounts: true,
    canManageProducts: true,
    canManageStaff: false,
    canManageTerritories: false,
    canManageCompany: false,
    canCreateVouchers: true,
    canCreateInvoices: true,
    canViewReports: true,
    canEditDelete: false
  },
  createdAt: '2026-10-01T10:00:00.000Z'
};

const DEFAULT_ACCOUNTS = [
  { id: 'acc_1', code: '1001', name: 'Cash in Hand (Sahiwal Office)', parentAccount: 'Cash & Bank Balances', accountType: 'Cash/Banks', salesStaff: 'Nasir Ali Sahiwal', phone: '03023576036', openingBalance: 150000, openingBalanceType: 'Dr', description: 'Primary operational cash vault', active: true, createdAt: '2026-10-01T10:00:00.000Z' },
  { id: 'acc_2', code: '1002', name: 'Habib Bank Limited (HBL Sahiwal)', parentAccount: 'Cash & Bank Balances', accountType: 'Cash/Banks', salesStaff: 'Nasir Ali Sahiwal', phone: '0404466221', openingBalance: 850000, openingBalanceType: 'Dr', description: 'Main company corporate account', active: true, createdAt: '2026-10-01T10:00:00.000Z' },
  { id: 'acc_3', code: '1003', name: 'MCB Bank Islamic (Sahiwal)', parentAccount: 'Cash & Bank Balances', accountType: 'Cash/Banks', salesStaff: 'Nasir Ali Sahiwal', phone: '0404466222', openingBalance: 450000, openingBalanceType: 'Dr', description: 'Seed vendor clearing account', active: true, createdAt: '2026-10-01T10:00:00.000Z' },
  { id: 'acc_4', code: '1004', name: 'Sundry Debtors / Seed Growers (Receivables)', parentAccount: 'Current Assets', accountType: 'Assets', salesStaff: 'Nasir Ali Sahiwal', phone: '03023576036', openingBalance: 320000, openingBalanceType: 'Dr', description: 'Receivables from seed dealers & farmers', active: true, createdAt: '2026-10-01T10:00:00.000Z' },
  { id: 'acc_5', code: '1005', name: 'Stock in Trade (Certified Seeds)', parentAccount: 'Inventories', accountType: 'Assets', salesStaff: 'Nasir Ali Sahiwal', phone: '03023576036', openingBalance: 1250000, openingBalanceType: 'Dr', description: 'Certified seed stock in godown', active: true, createdAt: '2026-10-01T10:00:00.000Z' },
  { id: 'acc_6', code: '2001', name: 'Sundry Creditors (Seed Producers/Farms)', parentAccount: 'Current Liabilities', accountType: 'Liabilities', salesStaff: 'Nasir Ali Sahiwal', phone: '03023576036', openingBalance: 180000, openingBalanceType: 'Cr', description: 'Payables to registered seed producers', active: true, createdAt: '2026-10-01T10:00:00.000Z' },
  { id: 'acc_7', code: '3001', name: 'Capital Account (Owners Equity)', parentAccount: 'Equity & Reserves', accountType: 'Equity', phone: '03023576036', openingBalance: 2500000, openingBalanceType: 'Cr', description: 'Owner investment & seed plant equity', active: true, createdAt: '2026-10-01T10:00:00.000Z' },
  { id: 'acc_8', code: '4001', name: 'Seed Sales Revenue', parentAccount: 'Operating Revenue', accountType: 'Revenue', salesStaff: 'Nasir Ali Sahiwal', phone: '03023576036', openingBalance: 0, openingBalanceType: 'Cr', description: 'Revenue from certified seed sales', active: true, createdAt: '2026-10-01T10:00:00.000Z' },
  { id: 'acc_9', code: '5001', name: 'Seed Procurement Cost', parentAccount: 'Cost of Sales', accountType: 'Expenses', salesStaff: 'Nasir Ali Sahiwal', phone: '03023576036', openingBalance: 0, openingBalanceType: 'Dr', description: 'Raw seed acquisition from growers', active: true, createdAt: '2026-10-01T10:00:00.000Z' },
  { id: 'acc_10', code: '5002', name: 'Seed Processing & Grading Expenses', parentAccount: 'Processing Costs', accountType: 'Expenses', salesStaff: 'Nasir Ali Sahiwal', phone: '03023576036', openingBalance: 0, openingBalanceType: 'Dr', description: 'Seed cleaner, gravity separator & chemical treatment', active: true, createdAt: '2026-10-01T10:00:00.000Z' },
  { id: 'acc_11', code: '5003', name: 'Packaging & Bag Printing Expenses', parentAccount: 'Processing Costs', accountType: 'Expenses', salesStaff: 'Nasir Ali Sahiwal', phone: '03023576036', openingBalance: 0, openingBalanceType: 'Dr', description: 'PP Woven bags, tags, and certification seals', active: true, createdAt: '2026-10-01T10:00:00.000Z' },
  { id: 'acc_12', code: '5004', name: 'Staff Salaries & Field Allowances', parentAccount: 'Operating Expenses', accountType: 'Expenses', salesStaff: 'Nasir Ali Sahiwal', phone: '03023576036', openingBalance: 0, openingBalanceType: 'Dr', description: 'Monthly field officer salaries and fuel', active: true, createdAt: '2026-10-01T10:00:00.000Z' },
  { id: 'acc_13', code: '5005', name: 'Godown Rent & Electric Bill', parentAccount: 'Operating Expenses', accountType: 'Expenses', salesStaff: 'Nasir Ali Sahiwal', phone: '03023576036', openingBalance: 0, openingBalanceType: 'Dr', description: 'United Farm Road seed godown rent', active: true, createdAt: '2026-10-01T10:00:00.000Z' }
];

const DEFAULT_TERRITORIES = [
  { id: 'tr_1', territoryCode: 'TR-SWL-01', territoryName: 'Sahiwal Head Office', city: 'Sahiwal', district: 'Sahiwal', description: 'Central seed distribution zone', status: 'Active' },
  { id: 'tr_2', territoryCode: 'TR-CHW-02', territoryName: 'Chichawatni Zone', city: 'Chichawatni', district: 'Sahiwal', description: 'Cotton and wheat grower hub', status: 'Active' },
  { id: 'tr_3', territoryCode: 'TR-HRP-03', territoryName: 'Harappa & Noor Shah', city: 'Harappa', district: 'Sahiwal', description: 'Certified seed multiplication zone', status: 'Active' },
  { id: 'tr_4', territoryCode: 'TR-OKR-04', territoryName: 'Okara & Renala Khurd', city: 'Okara', district: 'Okara', description: 'Maize, potato, and wheat seed belt', status: 'Active' },
  { id: 'tr_5', territoryCode: 'TR-PKP-05', territoryName: 'Pakpattan & Arifwala', city: 'Pakpattan', district: 'Pakpattan', description: 'Basmati rice & cotton belt', status: 'Active' }
];

const DEFAULT_SALES_STAFF = [
  { id: 'stf_1', staffCode: 'STF-001', staffName: 'Nasir Ali Sahiwal', fatherName: 'Muhammad Anwar', mobile: '03023576036', whatsapp: '03023576036', address: 'United Farm Road Gulshan-e-Ali By Pass', city: 'Sahiwal', territory: 'Sahiwal Head Office', joiningDate: '2024-01-01', status: 'Active', remarks: 'Senior Sales & Accounts Officer' },
  { id: 'stf_2', staffCode: 'STF-002', staffName: 'Tariq Mehmood', fatherName: 'Haji Ghulam Rasool', mobile: '03007554433', whatsapp: '03007554433', address: 'Main Bazar Chichawatni', city: 'Chichawatni', territory: 'Chichawatni Zone', joiningDate: '2024-03-15', status: 'Active', remarks: 'Field Officer - Seeds' },
  { id: 'stf_3', staffCode: 'STF-003', staffName: 'Zahid Hussain', fatherName: 'Allah Ditta', mobile: '03016644221', whatsapp: '03016644221', address: 'GT Road Harappa', city: 'Harappa', territory: 'Harappa & Noor Shah', joiningDate: '2024-06-01', status: 'Active', remarks: 'Area Sales Manager' }
];

const DEFAULT_PRODUCTS = [
  { id: 'p_1', productCode: 'SD-WHT-01', productName: 'Wheat Seed Akbar 2019 Certified', category: 'Seeds', variety: 'Akbar 2019', unit: 'Bag', packSize: '50kg', purchaseRate: 4200, saleRate: 4800, openingStock: 450, openingStockRate: 4200, minimumStock: 50, lotNo: 'LOT-AKB-2026', status: 'Active', description: 'High yielding rust resistant wheat seed', active: true },
  { id: 'p_2', productCode: 'SD-WHT-02', productName: 'Wheat Seed Dilkash 2020 Certified', category: 'Seeds', variety: 'Dilkash 2020', unit: 'Bag', packSize: '50kg', purchaseRate: 4300, saleRate: 4900, openingStock: 380, openingStockRate: 4300, minimumStock: 50, lotNo: 'LOT-DLK-2026', status: 'Active', description: 'Premium grain quality wheat seed', active: true },
  { id: 'p_3', productCode: 'SD-COT-03', productName: 'Cotton Seed Triple Gene Bt-886', category: 'Seeds', variety: 'Bt-886', unit: 'Bag', packSize: '40kg', purchaseRate: 7500, saleRate: 8500, openingStock: 220, openingStockRate: 7500, minimumStock: 30, lotNo: 'LOT-COT-886', status: 'Active', description: 'Bollworm and pink bollworm tolerant', active: true },
  { id: 'p_4', productCode: 'SD-COT-04', productName: 'Cotton Seed Super BS-15 Hybrid', category: 'Seeds', variety: 'BS-15', unit: 'Bag', packSize: '40kg', purchaseRate: 7800, saleRate: 8900, openingStock: 180, openingStockRate: 7800, minimumStock: 25, lotNo: 'LOT-BS-15-26', status: 'Active', description: 'Early maturing heat tolerant variety', active: true },
  { id: 'p_5', productCode: 'SD-MAZ-05', productName: 'Hybrid Corn / Maize Augusta-999', category: 'Seeds', variety: 'Augusta-999', unit: 'Bag', packSize: '20kg', purchaseRate: 9500, saleRate: 11000, openingStock: 150, openingStockRate: 9500, minimumStock: 20, lotNo: 'LOT-MZ-999', status: 'Active', description: 'High fodder and grain yield spring/autumn corn', active: true },
  { id: 'p_6', productCode: 'SD-RIC-06', productName: 'Rice Seed Kainat 1121 Steam Basmati', category: 'Seeds', variety: 'Kainat 1121', unit: 'Bag', packSize: '25kg', purchaseRate: 3800, saleRate: 4400, openingStock: 300, openingStockRate: 3800, minimumStock: 40, lotNo: 'LOT-RC-1121', status: 'Active', description: 'Extra long grain export quality basmati seed', active: true }
];

const DATA_FILE = path.resolve(process.cwd(), 'database_storage.json');

interface MemoryStore {
  companyProfile: typeof DEFAULT_COMPANY_PROFILE;
  users: any[];
  accounts: any[];
  salesStaff: any[];
  territories: any[];
  products: any[];
  vouchers: any[];
  invoices: any[];
  mysqlConfig?: {
    host: string;
    port: number;
    user: string;
    password?: string;
    database: string;
    ssl?: boolean;
  };
}

let store: MemoryStore = {
  companyProfile: DEFAULT_COMPANY_PROFILE,
  users: [DEFAULT_ADMIN, DEFAULT_USER],
  accounts: DEFAULT_ACCOUNTS,
  salesStaff: DEFAULT_SALES_STAFF,
  territories: DEFAULT_TERRITORIES,
  products: DEFAULT_PRODUCTS,
  vouchers: [],
  invoices: [],
  mysqlConfig: {
    host: process.env.MYSQL_HOST || 'mysql.gb.stackcp.com',
    port: Number(process.env.MYSQL_PORT || 43100),
    user: process.env.MYSQL_USER || 'nasir-3d52',
    password: process.env.MYSQL_PASSWORD || 'Nasir@22wb',
    database: process.env.MYSQL_DATABASE || 'augustaseedcompany-353031357119',
    ssl: false
  }
};

// Load saved local storage file if exists
try {
  if (fs.existsSync(DATA_FILE)) {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    store = { ...store, ...parsed };
  }
  // Ensure Augusta Seed Company branding
  store.companyProfile = {
    ...DEFAULT_COMPANY_PROFILE,
    ...(store.companyProfile || {})
  };
  store.companyProfile.companyName = 'AUGUSTA SEED COMPANY';
  store.companyProfile.headOfficeAddress = 'UNITED FARM ROAD, GULSHAN-E-ALI BY PASS, SAHIWAL';
  store.companyProfile.phone = '03023576036';
  store.companyProfile.mobile = '03023576036';
} catch (e) {
  console.warn('Could not read existing local store:', e);
}

function saveLocalStore() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to write local store:', e);
  }
}

// MySQL Connection State
let mysqlPool: mysql.Pool | null = null;
let mysqlConnected = false;
let mysqlErrorMessage = '';
let outboundServerIp = '34.96.48.119';

(async () => {
  try {
    const res = await fetch('https://api.ipify.org');
    if (res.ok) {
      outboundServerIp = (await res.text()).trim();
    }
  } catch {}
})();

const MYSQL_SCHEMA_SQL = `-- ========================================================
-- AUGUSTA SEED COMPANY - MYSQL RELATIONAL SCHEMA
-- Address: UNITED FARM ROAD, GULSHAN-E-ALI BY PASS, SAHIWAL
-- Phone: 03023576036
-- Database: augustaseedcompany-353031357119
-- ========================================================

CREATE DATABASE IF NOT EXISTS \`augustaseedcompany-353031357119\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`augustaseedcompany-353031357119\`;

-- 1. Company Profile
CREATE TABLE IF NOT EXISTS company_profile (
  id VARCHAR(50) PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  head_office_address TEXT,
  phone VARCHAR(100),
  mobile VARCHAR(100),
  email VARCHAR(100),
  website VARCHAR(100),
  ntn VARCHAR(100),
  strn VARCHAR(100),
  logo_url LONGTEXT,
  financial_year VARCHAR(50),
  invoice_footer TEXT,
  report_footer TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(50) PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(150),
  mobile VARCHAR(100),
  role VARCHAR(50) NOT NULL DEFAULT 'USER',
  active TINYINT(1) NOT NULL DEFAULT 1,
  permissions JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Chart of Accounts
CREATE TABLE IF NOT EXISTS accounts (
  id VARCHAR(50) PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  parent_account VARCHAR(255),
  account_type VARCHAR(100) NOT NULL,
  sales_staff VARCHAR(255),
  phone VARCHAR(100),
  address VARCHAR(255),
  opening_balance DECIMAL(15,2) DEFAULT 0.00,
  opening_balance_type VARCHAR(10) DEFAULT 'Dr',
  description TEXT,
  active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Sales Staff
CREATE TABLE IF NOT EXISTS sales_staff (
  id VARCHAR(50) PRIMARY KEY,
  staff_code VARCHAR(50) UNIQUE NOT NULL,
  staff_name VARCHAR(255) NOT NULL,
  father_name VARCHAR(255),
  mobile VARCHAR(100),
  whatsapp VARCHAR(100),
  address TEXT,
  city VARCHAR(100),
  territory VARCHAR(150),
  joining_date DATE,
  status VARCHAR(50) DEFAULT 'Active',
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Territories
CREATE TABLE IF NOT EXISTS territories (
  id VARCHAR(50) PRIMARY KEY,
  territory_code VARCHAR(50) UNIQUE NOT NULL,
  territory_name VARCHAR(255) NOT NULL,
  region VARCHAR(100),
  assigned_manager VARCHAR(150),
  status VARCHAR(50) DEFAULT 'Active',
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Products & Seeds
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(50) PRIMARY KEY,
  product_code VARCHAR(50) UNIQUE NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  variety VARCHAR(100),
  unit VARCHAR(50),
  pack_size VARCHAR(50),
  purchase_rate DECIMAL(15,2) DEFAULT 0.00,
  sale_rate DECIMAL(15,2) DEFAULT 0.00,
  current_stock DECIMAL(15,2) DEFAULT 0.00,
  minimum_stock DECIMAL(15,2) DEFAULT 0.00,
  lot_no VARCHAR(100),
  status VARCHAR(50) DEFAULT 'Active',
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Vouchers (CPV, CRV, JV)
CREATE TABLE IF NOT EXISTS vouchers (
  id VARCHAR(50) PRIMARY KEY,
  voucher_no VARCHAR(100) UNIQUE NOT NULL,
  voucher_type VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  sales_staff VARCHAR(255),
  \`lines\` LONGTEXT NOT NULL,
  total_amount DECIMAL(15,2) NOT NULL,
  narration TEXT,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Invoices (Sales, Purchases, Returns)
CREATE TABLE IF NOT EXISTS invoices (
  id VARCHAR(50) PRIMARY KEY,
  invoice_no VARCHAR(100) UNIQUE NOT NULL,
  invoice_type VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  account_name VARCHAR(255) NOT NULL,
  sales_staff VARCHAR(255),
  territory VARCHAR(150),
  original_invoice_no VARCHAR(100),
  reason TEXT,
  \`items\` LONGTEXT NOT NULL,
  gross_total DECIMAL(15,2) NOT NULL,
  discount_total DECIMAL(15,2) NOT NULL,
  net_total DECIMAL(15,2) NOT NULL,
  description TEXT,
  remarks TEXT,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;

// Initialize MySQL if config is provided
async function initMySQL(config?: { host: string; port: number; user: string; password?: string; database: string; ssl?: boolean }) {
  const host = (config?.host || process.env.MYSQL_HOST || 'mysql.gb.stackcp.com').trim();
  const port = Number(config?.port || process.env.MYSQL_PORT || 45713);
  const user = (config?.user || process.env.MYSQL_USER || 'nasir-8e7b').trim();
  const password = config?.password !== undefined ? config.password : (process.env.MYSQL_PASSWORD || 'GtPyXs|u4Oc');
  const database = (config?.database || process.env.MYSQL_DATABASE || 'AugustaSeedCompany-3530313592f0').trim();

  if (!host || !user || !database) {
    mysqlConnected = false;
    return false;
  }

  try {
    if (mysqlPool) {
      await mysqlPool.end().catch(() => {});
      mysqlPool = null;
    }

    let pool: mysql.Pool;
    try {
      pool = mysql.createPool({
        host,
        port,
        user,
        password,
        database,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        connectTimeout: 7000,
        ssl: config?.ssl ? { rejectUnauthorized: false } : undefined
      });
      const connection = await pool.getConnection();
      connection.release();
    } catch (connErr: any) {
      if (connErr.code === 'ER_BAD_DB_ERROR' || (connErr.message && connErr.message.includes('Unknown database'))) {
        const rootPool = mysql.createPool({
          host,
          port,
          user,
          password,
          waitForConnections: true,
          connectionLimit: 2,
          connectTimeout: 7000,
          ssl: config?.ssl ? { rejectUnauthorized: false } : undefined
        });
        const rootConn = await rootPool.getConnection();
        await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        rootConn.release();
        await rootPool.end().catch(() => {});

        pool = mysql.createPool({
          host,
          port,
          user,
          password,
          database,
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0,
          connectTimeout: 7000,
          ssl: config?.ssl ? { rejectUnauthorized: false } : undefined
        });
        const conn2 = await pool.getConnection();
        conn2.release();
      } else {
        throw connErr;
      }
    }

    // Verify / create tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS company_profile (
        id VARCHAR(50) PRIMARY KEY,
        company_name VARCHAR(255) NOT NULL,
        head_office_address TEXT,
        phone VARCHAR(100),
        mobile VARCHAR(100),
        email VARCHAR(100),
        website VARCHAR(100),
        ntn VARCHAR(100),
        strn VARCHAR(100),
        logo_url LONGTEXT,
        financial_year VARCHAR(50),
        invoice_footer TEXT,
        report_footer TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(150),
        mobile VARCHAR(100),
        role VARCHAR(50) NOT NULL DEFAULT 'USER',
        active TINYINT(1) NOT NULL DEFAULT 1,
        permissions JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS accounts (
        id VARCHAR(50) PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        parent_account VARCHAR(255),
        account_type VARCHAR(100) NOT NULL,
        sales_staff VARCHAR(255),
        phone VARCHAR(100),
        address VARCHAR(255),
        opening_balance DECIMAL(15,2) DEFAULT 0.00,
        opening_balance_type VARCHAR(10) DEFAULT 'Dr',
        description TEXT,
        active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS sales_staff (
        id VARCHAR(50) PRIMARY KEY,
        staff_code VARCHAR(50) UNIQUE NOT NULL,
        staff_name VARCHAR(255) NOT NULL,
        father_name VARCHAR(255),
        mobile VARCHAR(100),
        whatsapp VARCHAR(100),
        address TEXT,
        city VARCHAR(100),
        territory VARCHAR(150),
        joining_date DATE,
        status VARCHAR(50) DEFAULT 'Active',
        remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS territories (
        id VARCHAR(50) PRIMARY KEY,
        territory_code VARCHAR(50) UNIQUE NOT NULL,
        territory_name VARCHAR(255) NOT NULL,
        region VARCHAR(100),
        assigned_manager VARCHAR(150),
        status VARCHAR(50) DEFAULT 'Active',
        remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(50) PRIMARY KEY,
        product_code VARCHAR(50) UNIQUE NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        variety VARCHAR(100),
        unit VARCHAR(50),
        pack_size VARCHAR(50),
        purchase_rate DECIMAL(15,2) DEFAULT 0.00,
        sale_rate DECIMAL(15,2) DEFAULT 0.00,
        current_stock DECIMAL(15,2) DEFAULT 0.00,
        minimum_stock DECIMAL(15,2) DEFAULT 0.00,
        lot_no VARCHAR(100),
        status VARCHAR(50) DEFAULT 'Active',
        remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS vouchers (
        id VARCHAR(50) PRIMARY KEY,
        voucher_no VARCHAR(100) UNIQUE NOT NULL,
        voucher_type VARCHAR(50) NOT NULL,
        date DATE NOT NULL,
        sales_staff VARCHAR(255),
        \`lines\` LONGTEXT NOT NULL,
        total_amount DECIMAL(15,2) NOT NULL,
        narration TEXT,
        created_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id VARCHAR(50) PRIMARY KEY,
        invoice_no VARCHAR(100) UNIQUE NOT NULL,
        invoice_type VARCHAR(50) NOT NULL,
        date DATE NOT NULL,
        account_name VARCHAR(255) NOT NULL,
        sales_staff VARCHAR(255),
        territory VARCHAR(150),
        original_invoice_no VARCHAR(100),
        reason TEXT,
        \`items\` LONGTEXT NOT NULL,
        gross_total DECIMAL(15,2) NOT NULL,
        discount_total DECIMAL(15,2) NOT NULL,
        net_total DECIMAL(15,2) NOT NULL,
        description TEXT,
        remarks TEXT,
        created_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Ensure columns exist on existing tables if created previously without them
    const addCol = async (tableName: string, colDef: string) => {
      try {
        await pool.query(`ALTER TABLE ${tableName} ADD COLUMN ${colDef}`);
      } catch (e: any) {
        // Ignore duplicate column errors (ER_DUP_FIELDNAME / 1060)
      }
    };

    await addCol('accounts', 'address VARCHAR(255)');
    await addCol('accounts', 'phone VARCHAR(100)');
    await addCol('accounts', 'sales_staff VARCHAR(255)');
    await addCol('accounts', 'parent_account VARCHAR(255)');
    await addCol('accounts', 'opening_balance DECIMAL(15,2) DEFAULT 0.00');
    await addCol('accounts', 'opening_balance_type VARCHAR(10) DEFAULT "Dr"');
    await addCol('accounts', 'description TEXT');
    await addCol('accounts', 'active TINYINT(1) DEFAULT 1');

    await addCol('invoices', 'description TEXT');
    await addCol('invoices', 'territory VARCHAR(150)');
    await addCol('invoices', 'original_invoice_no VARCHAR(100)');
    await addCol('invoices', 'reason TEXT');
    await addCol('invoices', 'discount_total DECIMAL(15,2) DEFAULT 0.00');

    await addCol('sales_staff', 'father_name VARCHAR(255)');
    await addCol('sales_staff', 'whatsapp VARCHAR(100)');
    await addCol('sales_staff', 'address TEXT');
    await addCol('sales_staff', 'city VARCHAR(100)');
    await addCol('sales_staff', 'territory VARCHAR(150)');
    await addCol('sales_staff', 'joining_date DATE');
    await addCol('sales_staff', 'status VARCHAR(50) DEFAULT "Active"');
    await addCol('sales_staff', 'remarks TEXT');

    await addCol('products', 'category VARCHAR(100)');
    await addCol('products', 'variety VARCHAR(100)');
    await addCol('products', 'unit VARCHAR(50)');
    await addCol('products', 'pack_size VARCHAR(50)');
    await addCol('products', 'purchase_rate DECIMAL(15,2) DEFAULT 0.00');
    await addCol('products', 'sale_rate DECIMAL(15,2) DEFAULT 0.00');
    await addCol('products', 'current_stock DECIMAL(15,2) DEFAULT 0.00');
    await addCol('products', 'minimum_stock DECIMAL(15,2) DEFAULT 0.00');
    await addCol('products', 'lot_no VARCHAR(100)');
    await addCol('products', 'status VARCHAR(50) DEFAULT "Active"');
    await addCol('products', 'remarks TEXT');


    mysqlPool = pool;
    mysqlConnected = true;
    mysqlErrorMessage = '';
    store.mysqlConfig = { host, port, user, password, database, ssl: Boolean(config?.ssl) };
    saveLocalStore();
    console.log(`Connected to MySQL database "${database}" on ${host}:${port}`);
    return true;
  } catch (err: any) {
    mysqlConnected = false;
    const isStackcp = host.toLowerCase().includes('stackcp');
    if (err?.code === 'ENOTFOUND' || err?.message?.includes('ENOTFOUND')) {
      mysqlErrorMessage = `DNS lookup failed for ${host}. Verify your StackCP database host.`;
    } else if (err?.code === 'ECONNREFUSED' || err?.message?.includes('ECONNREFUSED')) {
      if (isStackcp) {
        mysqlErrorMessage = `connect ECONNREFUSED ${host}:${port}. StackCP firewall requires Remote MySQL Access. In StackCP -> Web Tools -> Remote MySQL Access, add '%' under 'Add Access Host' for user '${user}'.`;
      } else {
        mysqlErrorMessage = `connect ECONNREFUSED ${host}:${port}. Server refused connection. Check host and port.`;
      }
    } else if (err?.code === 'ER_ACCESS_DENIED_ERROR' || err?.message?.includes('Access denied')) {
      mysqlErrorMessage = `Access denied for user '${user}'. Check username and password credentials.`;
    } else if (err?.code === 'ETIMEDOUT' || err?.code === 'EHOSTUNREACH') {
      mysqlErrorMessage = `Connection to ${host}:${port} timed out. StackCP firewall blocked connection. Whitelist '%' in StackCP -> Remote MySQL Access.`;
    } else {
      mysqlErrorMessage = err?.message || 'Failed to connect to MySQL';
    }
    console.warn('MySQL connection notice:', mysqlErrorMessage);
    return false;
  }
}

// Initial DB connect
initMySQL(store.mysqlConfig);

// API Routes
app.get('/api/database/status', (req: Request, res: Response) => {
  const currentHost = store.mysqlConfig?.host || process.env.MYSQL_HOST || 'mysql.gb.stackcp.com';
  const currentPort = store.mysqlConfig?.port || Number(process.env.MYSQL_PORT || 45713);
  const currentUser = store.mysqlConfig?.user || process.env.MYSQL_USER || 'nasir-8e7b';
  const currentDatabase = store.mysqlConfig?.database || process.env.MYSQL_DATABASE || 'AugustaSeedCompany-3530313592f0';

  res.json({
    type: mysqlConnected ? 'mysql' : 'local',
    connected: mysqlConnected,
    host: currentHost,
    port: currentPort,
    database: currentDatabase,
    user: currentUser,
    outboundIp: outboundServerIp,
    message: mysqlErrorMessage || (mysqlConnected ? `Connected to MySQL (${currentDatabase} @ ${currentHost}:${currentPort})` : `Backend configured for MySQL (${currentDatabase} @ ${currentHost}:${currentPort}).`),
    isStackcp: currentHost.toLowerCase().includes('stackcp'),
    suggestedHost: currentHost
  });
});

app.post('/api/database/config', async (req: Request, res: Response) => {
  const { host, port, user, password, database, ssl } = req.body;
  if (!host || !user || !database) {
    return res.status(400).json({ success: false, error: 'Host, user, and database name are required.' });
  }

  const cleanHost = String(host).trim();
  const cleanPort = Number(port || 45713);
  const success = await initMySQL({
    host: cleanHost,
    port: cleanPort,
    user: String(user).trim(),
    password: password || '',
    database: String(database).trim(),
    ssl: Boolean(ssl)
  });

  if (success) {
    store.mysqlConfig = { host: cleanHost, port: cleanPort, user: String(user).trim(), password: password || '', database: String(database).trim(), ssl: Boolean(ssl) };
    saveLocalStore();
    return res.json({ success: true, message: 'MySQL connected successfully and schema initialized!' });
  } else {
    return res.status(400).json({
      success: false,
      error: mysqlErrorMessage,
      isStackcp: cleanHost.toLowerCase().includes('stackcp'),
      suggestedHost: cleanHost,
      host: cleanHost,
      port: cleanPort
    });
  }
});

app.post('/api/database/disconnect', async (req: Request, res: Response) => {
  if (mysqlPool) {
    await mysqlPool.end().catch(() => {});
    mysqlPool = null;
  }
  mysqlConnected = false;
  store.mysqlConfig = undefined;
  saveLocalStore();
  res.json({ success: true, message: 'Disconnected from MySQL. Switched to local storage.' });
});

app.get('/api/database/schema', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/plain');
  res.send(MYSQL_SCHEMA_SQL);
});

app.get('/api/database/export-sql', (req: Request, res: Response) => {
  const dbName = store.mysqlConfig?.database || 'AugustaSeedCompany-3530313592f0';
  const now = new Date().toISOString();

  const escapeSql = (val: any): string => {
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'number') return String(val);
    if (typeof val === 'boolean') return val ? '1' : '0';
    if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
    return `'${String(val).replace(/'/g, "''")}'`;
  };

  let sql = `-- ============================================================
-- AUGUSTA SEED COMPANY - SQL Dump & Restore
-- Database: \`${dbName}\`
-- Export Date: ${now}
-- Address: UNITED FARM ROAD, GULSHAN-E-ALI BY PASS, SAHIWAL
-- Phone: 03023576036
-- ============================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

CREATE DATABASE IF NOT EXISTS \`${dbName}\`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE \`${dbName}\`;

${MYSQL_SCHEMA_SQL}

-- ------------------------------------------------------------
-- Dumping data for table \`company_profile\`
-- ------------------------------------------------------------
REPLACE INTO \`company_profile\` (\`id\`, \`company_name\`, \`head_office_address\`, \`phone\`, \`mobile\`, \`email\`, \`website\`, \`ntn\`, \`strn\`, \`logo_url\`, \`financial_year\`, \`invoice_footer\`, \`report_footer\`) VALUES ('default', ${escapeSql(store.companyProfile.companyName)}, ${escapeSql(store.companyProfile.headOfficeAddress)}, ${escapeSql(store.companyProfile.phone)}, ${escapeSql(store.companyProfile.mobile)}, ${escapeSql(store.companyProfile.email)}, ${escapeSql(store.companyProfile.website)}, ${escapeSql(store.companyProfile.ntn)}, ${escapeSql(store.companyProfile.strn)}, ${escapeSql(store.companyProfile.logoUrl)}, ${escapeSql(store.companyProfile.financialYear)}, ${escapeSql(store.companyProfile.invoiceFooter)}, ${escapeSql(store.companyProfile.reportFooter)});\n`;

  if (store.users.length > 0) {
    sql += `\n-- Dumping users\n`;
    for (const u of store.users) {
      sql += `REPLACE INTO \`users\` (\`id\`, \`username\`, \`full_name\`, \`email\`, \`mobile\`, \`role\`, \`active\`, \`permissions\`, \`created_at\`) VALUES (${escapeSql(u.id)}, ${escapeSql(u.username)}, ${escapeSql(u.fullName)}, ${escapeSql(u.email)}, ${escapeSql(u.mobile)}, ${escapeSql(u.role)}, ${u.active ? 1 : 0}, ${escapeSql(u.permissions)}, ${escapeSql(u.createdAt)});\n`;
    }
  }

  if (store.accounts.length > 0) {
    sql += `\n-- Dumping accounts\n`;
    for (const a of store.accounts) {
      sql += `REPLACE INTO \`accounts\` (\`id\`, \`code\`, \`name\`, \`parent_account\`, \`account_type\`, \`sales_staff\`, \`phone\`, \`address\`, \`opening_balance\`, \`opening_balance_type\`, \`description\`, \`active\`, \`created_at\`) VALUES (${escapeSql(a.id)}, ${escapeSql(a.code)}, ${escapeSql(a.name)}, ${escapeSql(a.parentAccount)}, ${escapeSql(a.accountType)}, ${escapeSql(a.salesStaff)}, ${escapeSql(a.phone)}, ${escapeSql(a.address)}, ${Number(a.openingBalance || 0)}, ${escapeSql(a.openingBalanceType || 'Dr')}, ${escapeSql(a.description)}, ${a.active ? 1 : 0}, ${escapeSql(a.createdAt)});\n`;
    }
  }

  if (store.products.length > 0) {
    sql += `\n-- Dumping products\n`;
    for (const p of store.products) {
      sql += `REPLACE INTO \`products\` (\`id\`, \`product_code\`, \`product_name\`, \`category\`, \`variety\`, \`unit\`, \`pack_size\`, \`purchase_rate\`, \`sale_rate\`, \`current_stock\`, \`minimum_stock\`, \`lot_no\`, \`status\`, \`remarks\`, \`created_at\`) VALUES (${escapeSql(p.id)}, ${escapeSql(p.productCode)}, ${escapeSql(p.productName)}, ${escapeSql(p.category || 'Seeds')}, ${escapeSql(p.variety)}, ${escapeSql(p.unit)}, ${escapeSql(p.packSize)}, ${Number(p.purchaseRate || 0)}, ${Number(p.saleRate || 0)}, ${Number(p.currentStock || p.openingStock || 0)}, ${Number(p.minimumStock || 0)}, ${escapeSql(p.lotNo || '')}, ${escapeSql(p.status || 'Active')}, ${escapeSql(p.description || '')}, ${escapeSql(p.createdAt)});\n`;
    }
  }

  sql += `\nCOMMIT;\n`;
  res.setHeader('Content-Type', 'text/plain');
  res.send(sql);
});

app.post('/api/database/clear-all', async (req: Request, res: Response) => {
  store.vouchers = [];
  store.invoices = [];
  saveLocalStore();
  if (mysqlConnected && mysqlPool) {
    try {
      await mysqlPool.query('DELETE FROM invoices');
      await mysqlPool.query('DELETE FROM vouchers');
    } catch (e) {
      console.error('MySQL clear error:', e);
    }
  }
  res.json({ success: true, message: 'All transactions cleared.' });
});

app.post('/api/database/restore-sql', async (req: Request, res: Response) => {
  const { sqlScript } = req.body;
  if (!sqlScript || typeof sqlScript !== 'string') {
    return res.status(400).json({ success: false, error: 'Valid SQL script string is required.' });
  }
  if (!mysqlConnected || !mysqlPool) {
    return res.status(500).json({ success: false, error: 'MySQL Database is not connected. Cannot execute SQL restore.' });
  }
  try {
    const statements = sqlScript
      .split(/;\s*[\r\n]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const stmt of statements) {
      await mysqlPool.query(stmt);
    }
    res.json({ success: true, message: 'SQL database restored successfully!' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'SQL execution failed during restore.' });
  }
});

app.post('/api/database/query', async (req: Request, res: Response) => {
  const { sql } = req.body;
  if (!sql || typeof sql !== 'string') {
    return res.status(400).json({ success: false, error: 'SQL query string is required.' });
  }
  if (!mysqlConnected || !mysqlPool) {
    return res.status(500).json({ success: false, error: 'MySQL Database is not connected. Cannot execute query.' });
  }
  try {
    const [result] = await mysqlPool.query(sql);
    res.json({ success: true, result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'SQL execution failed.' });
  }
});


// Company Profile API
app.get('/api/company-profile', async (req: Request, res: Response) => {
  if (mysqlConnected && mysqlPool) {
    try {
      const [rows] = await mysqlPool.query<any[]>('SELECT * FROM company_profile WHERE id = ?', ['default']);
      if (rows && rows.length > 0) {
        const r = rows[0];
        return res.json({
          companyName: r.company_name,
          headOfficeAddress: r.head_office_address,
          phone: r.phone,
          mobile: r.mobile,
          email: r.email,
          website: r.website,
          ntn: r.ntn,
          strn: r.strn,
          logoUrl: r.logo_url || '/augusta_seed_logo.jpg',
          financialYear: r.financial_year,
          invoiceFooter: r.invoice_footer,
          reportFooter: r.report_footer
        });
      }
    } catch (e) {
      console.warn('MySQL read error (company_profile):', e);
    }
  }
  res.json(store.companyProfile);
});

app.post('/api/company-profile', async (req: Request, res: Response) => {
  const profile = req.body;
  store.companyProfile = { ...DEFAULT_COMPANY_PROFILE, ...profile };
  saveLocalStore();
  if (mysqlConnected && mysqlPool) {
    try {
      await mysqlPool.query(`
        INSERT INTO company_profile (id, company_name, head_office_address, phone, mobile, email, website, ntn, strn, logo_url, financial_year, invoice_footer, report_footer)
        VALUES ('default', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          company_name=VALUES(company_name),
          head_office_address=VALUES(head_office_address),
          phone=VALUES(phone),
          mobile=VALUES(mobile),
          email=VALUES(email),
          website=VALUES(website),
          ntn=VALUES(ntn),
          strn=VALUES(strn),
          logo_url=VALUES(logo_url),
          financial_year=VALUES(financial_year),
          invoice_footer=VALUES(invoice_footer),
          report_footer=VALUES(report_footer)
      `, [
        profile.companyName,
        profile.headOfficeAddress,
        profile.phone,
        profile.mobile,
        profile.email,
        profile.website,
        profile.ntn,
        profile.strn,
        profile.logoUrl || '/augusta_seed_logo.jpg',
        profile.financialYear,
        profile.invoiceFooter,
        profile.reportFooter
      ]);
    } catch (e) {
      console.error('MySQL write error (company_profile):', e);
    }
  }
  res.json({ success: true, profile: store.companyProfile });
});

// Users API
app.get('/api/users', async (req: Request, res: Response) => {
  if (mysqlConnected && mysqlPool) {
    try {
      const [rows] = await mysqlPool.query<any[]>('SELECT * FROM users ORDER BY created_at ASC');
      if (rows && rows.length > 0) {
        return res.json(rows.map(r => ({
          id: r.id,
          username: r.username,
          fullName: r.full_name,
          email: r.email,
          mobile: r.mobile,
          role: r.role,
          active: Boolean(r.active),
          permissions: typeof r.permissions === 'string' ? JSON.parse(r.permissions) : r.permissions,
          createdAt: r.created_at
        })));
      }
    } catch (e) {
      console.warn('MySQL read error (users):', e);
    }
  }
  res.json(store.users);
});

app.post('/api/users', async (req: Request, res: Response) => {
  const user = req.body;
  const idx = store.users.findIndex(u => u.id === user.id);
  if (idx >= 0) store.users[idx] = user;
  else store.users.push(user);
  saveLocalStore();
  if (mysqlConnected && mysqlPool) {
    try {
      await mysqlPool.query(`
        INSERT INTO users (id, username, full_name, email, mobile, role, active, permissions, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          username=VALUES(username),
          full_name=VALUES(full_name),
          email=VALUES(email),
          mobile=VALUES(mobile),
          role=VALUES(role),
          active=VALUES(active),
          permissions=VALUES(permissions)
      `, [
        user.id,
        user.username,
        user.fullName,
        user.email,
        user.mobile,
        user.role,
        user.active ? 1 : 0,
        JSON.stringify(user.permissions),
        user.createdAt || new Date()
      ]);
    } catch (e) {
      console.error('MySQL write error (users):', e);
    }
  }
  res.json({ success: true, user });
});

app.delete('/api/users/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  store.users = store.users.filter(u => u.id !== id);
  saveLocalStore();
  if (mysqlConnected && mysqlPool) {
    try {
      await mysqlPool.query('DELETE FROM users WHERE id = ?', [id]);
    } catch (e) {
      console.error('MySQL delete error (users):', e);
    }
  }
  res.json({ success: true });
});

// Accounts API
app.get('/api/accounts', async (req: Request, res: Response) => {
  if (mysqlConnected && mysqlPool) {
    try {
      const [rows] = await mysqlPool.query<any[]>('SELECT * FROM accounts ORDER BY code ASC');
      if (rows && rows.length > 0) {
        return res.json(rows.map(r => ({
          id: r.id,
          code: r.code,
          name: r.name,
          parentAccount: r.parent_account,
          accountType: r.account_type,
          salesStaff: r.sales_staff,
          phone: r.phone,
          address: r.address,
          openingBalance: Number(r.opening_balance || 0),
          openingBalanceType: r.opening_balance_type || 'Dr',
          description: r.description,
          active: Boolean(r.active),
          createdAt: r.created_at
        })));
      }
    } catch (e) {
      console.warn('MySQL read error (accounts):', e);
    }
  }
  res.json(store.accounts);
});

app.post('/api/accounts', async (req: Request, res: Response) => {
  const account = req.body;
  const duplicate = store.accounts.find(a => a.code === account.code && a.id !== account.id);
  if (duplicate) {
    return res.status(400).json({ error: `Account code "${account.code}" is already in use.` });
  }

  const idx = store.accounts.findIndex(a => a.id === account.id);
  if (idx >= 0) store.accounts[idx] = account;
  else store.accounts.push(account);
  saveLocalStore();

  if (mysqlConnected && mysqlPool) {
    try {
      await mysqlPool.query(`
        INSERT INTO accounts (id, code, name, parent_account, account_type, sales_staff, phone, address, opening_balance, opening_balance_type, description, active, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          code=VALUES(code),
          name=VALUES(name),
          parent_account=VALUES(parent_account),
          account_type=VALUES(account_type),
          sales_staff=VALUES(sales_staff),
          phone=VALUES(phone),
          address=VALUES(address),
          opening_balance=VALUES(opening_balance),
          opening_balance_type=VALUES(opening_balance_type),
          description=VALUES(description),
          active=VALUES(active)
      `, [
        account.id,
        account.code,
        account.name,
        account.parentAccount || null,
        account.accountType,
        account.salesStaff || null,
        account.phone || null,
        account.address || null,
        account.openingBalance || 0,
        account.openingBalanceType || 'Dr',
        account.description || null,
        account.active ? 1 : 0,
        account.createdAt || new Date()
      ]);
    } catch (e: any) {
      console.error('MySQL write error (accounts):', e);
      return res.status(500).json({ error: e.message || 'Failed to save account to MySQL database.' });
    }
  }
  res.json({ success: true, account });
});

app.delete('/api/accounts/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  store.accounts = store.accounts.filter(a => a.id !== id);
  saveLocalStore();
  if (mysqlConnected && mysqlPool) {
    try {
      await mysqlPool.query('DELETE FROM accounts WHERE id = ?', [id]);
    } catch (e) {
      console.error('MySQL delete error (accounts):', e);
    }
  }
  res.json({ success: true });
});

// Sales Staff API
app.get('/api/sales-staff', async (req: Request, res: Response) => {
  if (mysqlConnected && mysqlPool) {
    try {
      const [rows] = await mysqlPool.query<any[]>('SELECT * FROM sales_staff ORDER BY staff_name ASC');
      if (rows && rows.length > 0) {
        return res.json(rows.map(r => ({
          id: r.id,
          staffCode: r.staff_code,
          staffName: r.staff_name,
          fatherName: r.father_name,
          mobile: r.mobile,
          whatsapp: r.whatsapp,
          address: r.address,
          city: r.city,
          territory: r.territory,
          joiningDate: r.joining_date ? new Date(r.joining_date).toISOString().split('T')[0] : '',
          status: r.status,
          remarks: r.remarks
        })));
      }
    } catch (e) {
      console.warn('MySQL read error (sales_staff):', e);
    }
  }
  res.json(store.salesStaff);
});

app.post('/api/sales-staff', async (req: Request, res: Response) => {
  const staff = req.body;
  const idx = store.salesStaff.findIndex(s => s.id === staff.id);
  if (idx >= 0) store.salesStaff[idx] = staff;
  else store.salesStaff.push(staff);
  saveLocalStore();
  if (mysqlConnected && mysqlPool) {
    try {
      await mysqlPool.query(`
        INSERT INTO sales_staff (id, staff_code, staff_name, father_name, mobile, whatsapp, address, city, territory, joining_date, status, remarks)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          staff_code=VALUES(staff_code),
          staff_name=VALUES(staff_name),
          father_name=VALUES(father_name),
          mobile=VALUES(mobile),
          whatsapp=VALUES(whatsapp),
          address=VALUES(address),
          city=VALUES(city),
          territory=VALUES(territory),
          joining_date=VALUES(joining_date),
          status=VALUES(status),
          remarks=VALUES(remarks)
      `, [
        staff.id,
        staff.staffCode,
        staff.staffName,
        staff.fatherName || null,
        staff.mobile,
        staff.whatsapp || null,
        staff.address || null,
        staff.city || null,
        staff.territory || null,
        staff.joiningDate || null,
        staff.status || 'Active',
        staff.remarks || null
      ]);
    } catch (e) {
      console.error('MySQL write error (sales_staff):', e);
    }
  }
  res.json({ success: true, staff });
});

app.delete('/api/sales-staff/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  store.salesStaff = store.salesStaff.filter(s => s.id !== id);
  saveLocalStore();
  if (mysqlConnected && mysqlPool) {
    try {
      await mysqlPool.query('DELETE FROM sales_staff WHERE id = ?', [id]);
    } catch (e) {
      console.error('MySQL delete error (sales_staff):', e);
    }
  }
  res.json({ success: true });
});

// Territories API
app.get('/api/territories', async (req: Request, res: Response) => {
  if (mysqlConnected && mysqlPool) {
    try {
      const [rows] = await mysqlPool.query<any[]>('SELECT * FROM territories ORDER BY territory_name ASC');
      if (rows && rows.length > 0) {
        return res.json(rows.map(r => ({
          id: r.id,
          territoryCode: r.territory_code,
          territoryName: r.territory_name,
          region: r.region,
          assignedManager: r.assigned_manager,
          status: r.status,
          remarks: r.remarks
        })));
      }
    } catch (e) {
      console.warn('MySQL read error (territories):', e);
    }
  }
  res.json(store.territories);
});

app.post('/api/territories', async (req: Request, res: Response) => {
  const terr = req.body;
  const idx = store.territories.findIndex(t => t.id === terr.id);
  if (idx >= 0) store.territories[idx] = terr;
  else store.territories.push(terr);
  saveLocalStore();
  if (mysqlConnected && mysqlPool) {
    try {
      await mysqlPool.query(`
        INSERT INTO territories (id, territory_code, territory_name, region, assigned_manager, status, remarks)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          territory_code=VALUES(territory_code),
          territory_name=VALUES(territory_name),
          region=VALUES(region),
          assigned_manager=VALUES(assigned_manager),
          status=VALUES(status),
          remarks=VALUES(remarks)
      `, [
        terr.id,
        terr.territoryCode,
        terr.territoryName,
        terr.region || null,
        terr.assignedManager || null,
        terr.status || 'Active',
        terr.remarks || null
      ]);
    } catch (e) {
      console.error('MySQL write error (territories):', e);
    }
  }
  res.json({ success: true, territory: terr });
});

app.delete('/api/territories/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  store.territories = store.territories.filter(t => t.id !== id);
  saveLocalStore();
  if (mysqlConnected && mysqlPool) {
    try {
      await mysqlPool.query('DELETE FROM territories WHERE id = ?', [id]);
    } catch (e) {
      console.error('MySQL delete error (territories):', e);
    }
  }
  res.json({ success: true });
});

// Products API
app.get('/api/products', async (req: Request, res: Response) => {
  if (mysqlConnected && mysqlPool) {
    try {
      const [rows] = await mysqlPool.query<any[]>('SELECT * FROM products ORDER BY product_name ASC');
      if (rows && rows.length > 0) {
        return res.json(rows.map(r => ({
          id: r.id,
          productCode: r.product_code,
          productName: r.product_name,
          category: r.category,
          variety: r.variety,
          unit: r.unit,
          packSize: r.pack_size,
          purchaseRate: Number(r.purchase_rate || 0),
          saleRate: Number(r.sale_rate || 0),
          currentStock: Number(r.current_stock || 0),
          openingStock: Number(r.current_stock || 0),
          openingStockRate: Number(r.purchase_rate || 0),
          minimumStock: Number(r.minimum_stock || 0),
          lotNo: r.lot_no,
          status: r.status,
          remarks: r.remarks,
          description: r.remarks || '',
          active: r.status === 'Active'
        })));
      }
    } catch (e) {
      console.warn('MySQL read error (products):', e);
    }
  }
  res.json(store.products);
});

app.post('/api/products', async (req: Request, res: Response) => {
  const product = req.body;
  const idx = store.products.findIndex(p => p.id === product.id);
  if (idx >= 0) store.products[idx] = product;
  else store.products.push(product);
  saveLocalStore();
  if (mysqlConnected && mysqlPool) {
    try {
      await mysqlPool.query(`
        INSERT INTO products (id, product_code, product_name, category, variety, unit, pack_size, purchase_rate, sale_rate, current_stock, minimum_stock, lot_no, status, remarks)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          product_code=VALUES(product_code),
          product_name=VALUES(product_name),
          category=VALUES(category),
          variety=VALUES(variety),
          unit=VALUES(unit),
          pack_size=VALUES(pack_size),
          purchase_rate=VALUES(purchase_rate),
          sale_rate=VALUES(sale_rate),
          current_stock=VALUES(current_stock),
          minimum_stock=VALUES(minimum_stock),
          lot_no=VALUES(lot_no),
          status=VALUES(status),
          remarks=VALUES(remarks)
      `, [
        product.id,
        product.productCode,
        product.productName,
        product.category || 'Seeds',
        product.variety || '',
        product.unit || 'Bag',
        product.packSize || '40kg',
        product.purchaseRate || 0,
        product.saleRate || 0,
        product.openingStock || product.currentStock || 0,
        product.minimumStock || 0,
        product.lotNo || null,
        product.active !== false ? 'Active' : 'Inactive',
        product.description || product.remarks || null
      ]);
    } catch (e) {
      console.error('MySQL write error (products):', e);
    }
  }
  res.json({ success: true, product });
});

app.delete('/api/products/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  store.products = store.products.filter(p => p.id !== id);
  saveLocalStore();
  if (mysqlConnected && mysqlPool) {
    try {
      await mysqlPool.query('DELETE FROM products WHERE id = ?', [id]);
    } catch (e) {
      console.error('MySQL delete error (products):', e);
    }
  }
  res.json({ success: true });
});

// Vouchers API
app.get('/api/vouchers', async (req: Request, res: Response) => {
  if (mysqlConnected && mysqlPool) {
    try {
      const [rows] = await mysqlPool.query<any[]>('SELECT * FROM `vouchers` ORDER BY `date` DESC, `created_at` DESC');
      return res.json(rows.map(r => ({
        id: r.id,
        voucherNo: r.voucher_no,
        voucherType: r.voucher_type,
        date: r.date ? (typeof r.date === 'string' ? r.date.split('T')[0] : new Date(r.date).toISOString().split('T')[0]) : '',
        salesStaff: r.sales_staff,
        lines: typeof r.lines === 'string' ? JSON.parse(r.lines || '[]') : (r.lines || []),
        totalAmount: Number(r.total_amount || 0),
        narration: r.narration,
        createdBy: r.created_by,
        createdAt: r.created_at
      })));
    } catch (e) {
      console.warn('MySQL read error (vouchers):', e);
    }
  }
  res.json(store.vouchers);
});

app.post('/api/vouchers', async (req: Request, res: Response) => {
  const voucher = req.body;
  const idx = store.vouchers.findIndex(v => v.id === voucher.id);
  if (idx >= 0) store.vouchers[idx] = voucher;
  else store.vouchers.push(voucher);
  saveLocalStore();
  if (mysqlConnected && mysqlPool) {
    try {
      const formattedDate = voucher.date ? String(voucher.date).split('T')[0] : new Date().toISOString().split('T')[0];
      const linesJson = typeof voucher.lines === 'string' ? voucher.lines : JSON.stringify(voucher.lines || []);
      await mysqlPool.query(`
        REPLACE INTO \`vouchers\` (\`id\`, \`voucher_no\`, \`voucher_type\`, \`date\`, \`sales_staff\`, \`lines\`, \`total_amount\`, \`narration\`, \`created_by\`, \`created_at\`)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        voucher.id,
        voucher.voucherNo,
        voucher.voucherType,
        formattedDate,
        voucher.salesStaff || null,
        linesJson,
        Number(voucher.totalAmount || 0),
        voucher.narration || null,
        voucher.createdBy || 'System',
        voucher.createdAt ? new Date(voucher.createdAt) : new Date()
      ]);
    } catch (e: any) {
      console.error('MySQL write error (vouchers):', e);
      return res.status(500).json({ error: e.message || 'Failed to save voucher to MySQL.' });
    }
  }
  res.json({ success: true, voucher });
});

app.delete('/api/vouchers/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  store.vouchers = store.vouchers.filter(v => v.id !== id);
  saveLocalStore();
  if (mysqlConnected && mysqlPool) {
    try {
      await mysqlPool.query('DELETE FROM `vouchers` WHERE `id` = ?', [id]);
    } catch (e: any) {
      console.error('MySQL delete error (vouchers):', e);
      return res.status(500).json({ error: e.message || 'Failed to delete voucher from MySQL.' });
    }
  }
  res.json({ success: true });
});

// Invoices API
app.get('/api/invoices', async (req: Request, res: Response) => {
  if (mysqlConnected && mysqlPool) {
    try {
      const [rows] = await mysqlPool.query<any[]>('SELECT * FROM `invoices` ORDER BY `date` DESC, `created_at` DESC');
      return res.json(rows.map(r => ({
        id: r.id,
        invoiceNo: r.invoice_no,
        invoiceType: r.invoice_type,
        date: r.date ? (typeof r.date === 'string' ? r.date.split('T')[0] : new Date(r.date).toISOString().split('T')[0]) : '',
        accountName: r.account_name,
        salesStaff: r.sales_staff,
        territory: r.territory,
        originalInvoiceNo: r.original_invoice_no,
        reason: r.reason,
        items: typeof r.items === 'string' ? JSON.parse(r.items || '[]') : (r.items || []),
        grossTotal: Number(r.gross_total || 0),
        discountTotal: Number(r.discount_total || 0),
        netTotal: Number(r.net_total || 0),
        description: r.description || r.remarks,
        remarks: r.remarks,
        createdBy: r.created_by,
        createdAt: r.created_at
      })));
    } catch (e) {
      console.warn('MySQL read error (invoices):', e);
    }
  }
  res.json(store.invoices);
});

app.post('/api/invoices', async (req: Request, res: Response) => {
  const invoice = req.body;
  const idx = store.invoices.findIndex(i => i.id === invoice.id);
  if (idx >= 0) store.invoices[idx] = invoice;
  else store.invoices.push(invoice);
  saveLocalStore();
  if (mysqlConnected && mysqlPool) {
    try {
      const formattedDate = invoice.date ? String(invoice.date).split('T')[0] : new Date().toISOString().split('T')[0];
      const itemsJson = typeof invoice.items === 'string' ? invoice.items : JSON.stringify(invoice.items || []);
      await mysqlPool.query(`
        REPLACE INTO \`invoices\` (\`id\`, \`invoice_no\`, \`invoice_type\`, \`date\`, \`account_name\`, \`sales_staff\`, \`territory\`, \`original_invoice_no\`, \`reason\`, \`items\`, \`gross_total\`, \`discount_total\`, \`net_total\`, \`description\`, \`remarks\`, \`created_by\`, \`created_at\`)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        invoice.id,
        invoice.invoiceNo,
        invoice.invoiceType,
        formattedDate,
        invoice.accountName,
        invoice.salesStaff || null,
        invoice.territory || null,
        invoice.originalInvoiceNo || null,
        invoice.reason || null,
        itemsJson,
        Number(invoice.grossTotal || 0),
        Number(invoice.discountTotal || 0),
        Number(invoice.netTotal || 0),
        invoice.description || invoice.remarks || null,
        invoice.remarks || null,
        invoice.createdBy || 'System',
        invoice.createdAt ? new Date(invoice.createdAt) : new Date()
      ]);
    } catch (e: any) {
      console.error('MySQL write error (invoices):', e);
      return res.status(500).json({ error: e.message || 'Failed to save invoice to MySQL database.' });
    }
  }
  res.json({ success: true, invoice });
});

app.delete('/api/invoices/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  store.invoices = store.invoices.filter(i => i.id !== id);
  saveLocalStore();
  if (mysqlConnected && mysqlPool) {
    try {
      await mysqlPool.query('DELETE FROM `invoices` WHERE `id` = ?', [id]);
    } catch (e) {
      console.error('MySQL delete error (invoices):', e);
    }
  }
  res.json({ success: true });
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Augusta Seed ERP Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
