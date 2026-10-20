import {
  UserProfile,
  Account,
  SalesStaff,
  Territory,
  Product,
  CompanyProfileData,
  Voucher,
  Invoice,
  MySQLConfig,
  DatabaseStatus
} from '../types';

export const DEFAULT_COMPANY_PROFILE: CompanyProfileData = {
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

export const DEFAULT_ADMIN_USER: UserProfile = {
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

class DatabaseService {
  private useLocalStorage: boolean = true;
  private memoryStore: Record<string, any> = {};

  private getLocal<T>(key: string, defaultValue: T): T {
    if (!this.useLocalStorage) {
      return this.memoryStore[key] !== undefined ? this.memoryStore[key] : defaultValue;
    }
    try {
      const data = localStorage.getItem(`augusta_${key}`);
      if (!data) return defaultValue;
      return JSON.parse(data);
    } catch {
      return defaultValue;
    }
  }

  private setLocal<T>(key: string, value: T): void {
    if (!this.useLocalStorage) {
      this.memoryStore[key] = value;
      return;
    }
    try {
      localStorage.setItem(`augusta_${key}`, JSON.stringify(value));
    } catch (e) {
      console.error('LocalStorage save error:', e);
    }
  }

  public async getDatabaseStatus(): Promise<DatabaseStatus> {
    try {
      const res = await fetch('/api/database/status');
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Backend status check failed, running locally:', e);
    }
    return {
      type: 'local',
      connected: false,
      message: 'Running on local browser storage'
    };
  }

  public async setMySQLConfig(config: MySQLConfig): Promise<{
    success: boolean;
    message?: string;
    error?: string;
    isStackcp?: boolean;
    suggestedHost?: string;
    host?: string;
    port?: number;
  }> {
    try {
      const res = await fetch('/api/database/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to connect to MySQL backend' };
    }
  }

  public async disconnectMySQL(): Promise<void> {
    try {
      await fetch('/api/database/disconnect', { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
  }

  public async getMySQLSchema(): Promise<string> {
    try {
      const res = await fetch('/api/database/schema');
      if (res.ok) {
        return await res.text();
      }
    } catch (e) {
      console.error(e);
    }
    return `-- CREATE DATABASE IF NOT EXISTS \`AugustaSeedCompany-3530313592f0\`;`;
  }

  public async getMySQLExportDataSql(): Promise<string> {
    try {
      const res = await fetch('/api/database/export-sql');
      if (res.ok) {
        return await res.text();
      }
    } catch (e) {
      console.error(e);
    }
    return await this.getMySQLSchema();
  }

  public detachLocalStorage() {
    this.useLocalStorage = false;
    const keys = Object.keys(localStorage);
    keys.forEach(k => {
      if (k.startsWith('augusta_') || k.startsWith('ittehad_')) {
        localStorage.removeItem(k);
      }
    });
    this.memoryStore = {};
  }

  public async clearAllData(): Promise<void> {
    try {
      await fetch('/api/database/clear-all', { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
    const keys = Object.keys(localStorage);
    keys.forEach(k => {
      if (k.startsWith('augusta_') || k.startsWith('ittehad_')) {
        localStorage.removeItem(k);
      }
    });
    this.memoryStore = {};
  }

  // --- COMPANY PROFILE ---
  public async getCompanyProfile(): Promise<CompanyProfileData> {
    try {
      const res = await fetch('/api/company-profile');
      if (res.ok) {
        const data = await res.json();
        this.setLocal('company_profile', data);
        return data;
      }
    } catch (e) {
      console.warn('API fetch company_profile fallback:', e);
    }
    return this.getLocal<CompanyProfileData>('company_profile', DEFAULT_COMPANY_PROFILE);
  }

  public async saveCompanyProfile(profile: CompanyProfileData): Promise<void> {
    this.setLocal('company_profile', profile);
    try {
      await fetch('/api/company-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
    } catch (e) {
      console.error('API save company_profile error:', e);
    }
  }

  // --- USERS ---
  public async getUsers(): Promise<UserProfile[]> {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const list = await res.json();
        this.setLocal('users', list);
        return list;
      }
    } catch (e) {
      console.warn('API fetch users fallback:', e);
    }
    return this.getLocal<UserProfile[]>('users', [DEFAULT_ADMIN_USER]);
  }

  public async saveUser(user: UserProfile): Promise<void> {
    const list = await this.getUsers();
    const idx = list.findIndex(u => u.id === user.id);
    if (idx >= 0) list[idx] = user;
    else list.push(user);
    this.setLocal('users', list);
    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
      });
    } catch (e) {
      console.error('API save user error:', e);
    }
  }

  public async deleteUser(id: string): Promise<void> {
    const list = await this.getUsers();
    this.setLocal('users', list.filter(u => u.id !== id));
    try {
      await fetch(`/api/users/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error(e);
    }
  }

  // --- ACCOUNTS ---
  public async getAccounts(): Promise<Account[]> {
    try {
      const res = await fetch('/api/accounts');
      if (res.ok) {
        const list = await res.json();
        this.setLocal('accounts', list);
        return list;
      }
    } catch (e) {
      console.warn('API fetch accounts fallback:', e);
    }
    return this.getLocal<Account[]>('accounts', [
      { id: 'acc_1', code: '1001', name: 'Cash in Hand (Sahiwal Office)', parentAccount: 'Cash & Bank Balances', accountType: 'Assets', salesStaff: 'Nasir Ali Sahiwal', phone: '03023576036', openingBalance: 150000, openingBalanceType: 'Dr', description: 'Primary operational cash vault', active: true, createdAt: '2026-10-01T10:00:00.000Z' },
      { id: 'acc_2', code: '1002', name: 'Habib Bank Limited (HBL Sahiwal)', parentAccount: 'Cash & Bank Balances', accountType: 'Assets', salesStaff: 'Nasir Ali Sahiwal', phone: '0404466221', openingBalance: 850000, openingBalanceType: 'Dr', description: 'Main company corporate account', active: true, createdAt: '2026-10-01T10:00:00.000Z' },
      { id: 'acc_3', code: '1003', name: 'MCB Bank Islamic (Sahiwal)', parentAccount: 'Cash & Bank Balances', accountType: 'Assets', salesStaff: 'Nasir Ali Sahiwal', phone: '0404466222', openingBalance: 450000, openingBalanceType: 'Dr', description: 'Seed vendor clearing account', active: true, createdAt: '2026-10-01T10:00:00.000Z' },
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
    ]);
  }

  public async saveAccount(account: Account): Promise<void> {
    const list = await this.getAccounts();
    const dup = list.find(a => a.code === account.code && a.id !== account.id);
    if (dup) {
      throw new Error(`Account code "${account.code}" is already in use.`);
    }
    const idx = list.findIndex(a => a.id === account.id);
    if (idx >= 0) list[idx] = account;
    else list.push(account);
    this.setLocal('accounts', list);
    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(account)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save account');
      }
    } catch (e: any) {
      if (e.message && e.message.includes('Account code')) throw e;
      console.warn('API save account warning:', e);
    }
  }

  public async deleteAccount(id: string): Promise<void> {
    const list = await this.getAccounts();
    this.setLocal('accounts', list.filter(a => a.id !== id));
    try {
      const res = await fetch(`/api/accounts/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete account');
      }
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  // --- SALES STAFF ---
  public async getSalesStaff(): Promise<SalesStaff[]> {
    try {
      const res = await fetch('/api/sales-staff');
      if (res.ok) {
        const list = await res.json();
        this.setLocal('sales_staff', list);
        return list;
      }
    } catch (e) {
      console.warn('API fetch sales_staff fallback:', e);
    }
    return this.getLocal<SalesStaff[]>('sales_staff', [
      { id: 'stf_1', staffCode: 'STF-001', staffName: 'Nasir Ali Sahiwal', fatherName: 'Muhammad Anwar', mobile: '03023576036', whatsapp: '03023576036', address: 'United Farm Road Gulshan-e-Ali By Pass', city: 'Sahiwal', territory: 'Sahiwal Head Office', joiningDate: '2024-01-01', status: 'Active', remarks: 'Senior Sales & Accounts Officer' },
      { id: 'stf_2', staffCode: 'STF-002', staffName: 'Tariq Mehmood', fatherName: 'Haji Ghulam Rasool', mobile: '03007554433', whatsapp: '03007554433', address: 'Main Bazar Chichawatni', city: 'Chichawatni', territory: 'Chichawatni Zone', joiningDate: '2024-03-15', status: 'Active', remarks: 'Field Officer - Seeds' },
      { id: 'stf_3', staffCode: 'STF-003', staffName: 'Zahid Hussain', fatherName: 'Allah Ditta', mobile: '03016644221', whatsapp: '03016644221', address: 'GT Road Harappa', city: 'Harappa', territory: 'Harappa & Noor Shah', joiningDate: '2024-06-01', status: 'Active', remarks: 'Area Sales Manager' }
    ]);
  }

  public async saveSalesStaff(staff: SalesStaff): Promise<void> {
    const list = await this.getSalesStaff();
    const idx = list.findIndex(s => s.id === staff.id);
    if (idx >= 0) list[idx] = staff;
    else list.push(staff);
    this.setLocal('sales_staff', list);
    try {
      await fetch('/api/sales-staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(staff)
      });
    } catch (e) {
      console.error(e);
    }
  }

  public async deleteSalesStaff(id: string): Promise<void> {
    const list = await this.getSalesStaff();
    this.setLocal('sales_staff', list.filter(s => s.id !== id));
    try {
      await fetch(`/api/sales-staff/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error(e);
    }
  }

  // --- TERRITORIES ---
  public async getTerritories(): Promise<Territory[]> {
    try {
      const res = await fetch('/api/territories');
      if (res.ok) {
        const list = await res.json();
        this.setLocal('territories', list);
        return list;
      }
    } catch (e) {
      console.warn('API fetch territories fallback:', e);
    }
    return this.getLocal<Territory[]>('territories', [
      { id: 'tr_1', territoryCode: 'TR-SWL-01', territoryName: 'Sahiwal Head Office', city: 'Sahiwal', district: 'Sahiwal', description: 'Central seed distribution zone', status: 'Active' },
      { id: 'tr_2', territoryCode: 'TR-CHW-02', territoryName: 'Chichawatni Zone', city: 'Chichawatni', district: 'Sahiwal', description: 'Cotton and wheat grower hub', status: 'Active' },
      { id: 'tr_3', territoryCode: 'TR-HRP-03', territoryName: 'Harappa & Noor Shah', city: 'Harappa', district: 'Sahiwal', description: 'Certified seed multiplication zone', status: 'Active' },
      { id: 'tr_4', territoryCode: 'TR-OKR-04', territoryName: 'Okara & Renala Khurd', city: 'Okara', district: 'Okara', description: 'Maize, potato, and wheat seed belt', status: 'Active' },
      { id: 'tr_5', territoryCode: 'TR-PKP-05', territoryName: 'Pakpattan & Arifwala', city: 'Pakpattan', district: 'Pakpattan', description: 'Basmati rice & cotton belt', status: 'Active' }
    ]);
  }

  public async saveTerritory(terr: Territory): Promise<void> {
    const list = await this.getTerritories();
    const idx = list.findIndex(t => t.id === terr.id);
    if (idx >= 0) list[idx] = terr;
    else list.push(terr);
    this.setLocal('territories', list);
    try {
      await fetch('/api/territories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(terr)
      });
    } catch (e) {
      console.error(e);
    }
  }

  public async deleteTerritory(id: string): Promise<void> {
    const list = await this.getTerritories();
    this.setLocal('territories', list.filter(t => t.id !== id));
    try {
      await fetch(`/api/territories/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error(e);
    }
  }

  // --- PRODUCTS ---
  public async getProducts(): Promise<Product[]> {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const list = await res.json();
        this.setLocal('products', list);
        return list;
      }
    } catch (e) {
      console.warn('API fetch products fallback:', e);
    }
    return this.getLocal<Product[]>('products', [
      { id: 'p_1', productCode: 'SD-WHT-01', productName: 'Wheat Seed Akbar 2019 Certified', category: 'Seeds', variety: 'Akbar 2019', unit: 'Bag', packSize: '50kg', purchaseRate: 4200, saleRate: 4800, openingStock: 450, openingStockRate: 4200, minimumStock: 50, lotNo: 'LOT-AKB-2026', status: 'Active', description: 'High yielding rust resistant wheat seed', active: true },
      { id: 'p_2', productCode: 'SD-WHT-02', productName: 'Wheat Seed Dilkash 2020 Certified', category: 'Seeds', variety: 'Dilkash 2020', unit: 'Bag', packSize: '50kg', purchaseRate: 4300, saleRate: 4900, openingStock: 380, openingStockRate: 4300, minimumStock: 50, lotNo: 'LOT-DLK-2026', status: 'Active', description: 'Premium grain quality wheat seed', active: true },
      { id: 'p_3', productCode: 'SD-COT-03', productName: 'Cotton Seed Triple Gene Bt-886', category: 'Seeds', variety: 'Bt-886', unit: 'Bag', packSize: '40kg', purchaseRate: 7500, saleRate: 8500, openingStock: 220, openingStockRate: 7500, minimumStock: 30, lotNo: 'LOT-COT-886', status: 'Active', description: 'Bollworm and pink bollworm tolerant', active: true },
      { id: 'p_4', productCode: 'SD-COT-04', productName: 'Cotton Seed Super BS-15 Hybrid', category: 'Seeds', variety: 'BS-15', unit: 'Bag', packSize: '40kg', purchaseRate: 7800, saleRate: 8900, openingStock: 180, openingStockRate: 7800, minimumStock: 25, lotNo: 'LOT-BS-15-26', status: 'Active', description: 'Early maturing heat tolerant variety', active: true },
      { id: 'p_5', productCode: 'SD-MAZ-05', productName: 'Hybrid Corn / Maize Augusta-999', category: 'Seeds', variety: 'Augusta-999', unit: 'Bag', packSize: '20kg', purchaseRate: 9500, saleRate: 11000, openingStock: 150, openingStockRate: 9500, minimumStock: 20, lotNo: 'LOT-MZ-999', status: 'Active', description: 'High fodder and grain yield spring/autumn corn', active: true },
      { id: 'p_6', productCode: 'SD-RIC-06', productName: 'Rice Seed Kainat 1121 Steam Basmati', category: 'Seeds', variety: 'Kainat 1121', unit: 'Bag', packSize: '25kg', purchaseRate: 3800, saleRate: 4400, openingStock: 300, openingStockRate: 3800, minimumStock: 40, lotNo: 'LOT-RC-1121', status: 'Active', description: 'Extra long grain export quality basmati seed', active: true }
    ]);
  }

  public async saveProduct(prod: Product): Promise<void> {
    const list = await this.getProducts();
    const idx = list.findIndex(p => p.id === prod.id);
    if (idx >= 0) list[idx] = prod;
    else list.push(prod);
    this.setLocal('products', list);
    try {
      await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prod)
      });
    } catch (e) {
      console.error(e);
    }
  }

  public async deleteProduct(id: string): Promise<void> {
    const list = await this.getProducts();
    this.setLocal('products', list.filter(p => p.id !== id));
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error(e);
    }
  }

  // --- VOUCHERS ---
  public async getVouchers(): Promise<Voucher[]> {
    try {
      const res = await fetch('/api/vouchers');
      if (res.ok) {
        const list = await res.json();
        this.setLocal('vouchers', list);
        return list;
      }
    } catch (e) {
      console.warn('API fetch vouchers fallback:', e);
    }
    return this.getLocal<Voucher[]>('vouchers', []);
  }

  public async saveVoucher(voucher: Voucher): Promise<void> {
    const list = await this.getVouchers();
    const idx = list.findIndex(v => v.id === voucher.id);
    if (idx >= 0) list[idx] = voucher;
    else list.unshift(voucher);
    this.setLocal('vouchers', list);
    try {
      await fetch('/api/vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(voucher)
      });
    } catch (e) {
      console.error(e);
    }
  }

  public async deleteVoucher(id: string): Promise<void> {
    const list = await this.getVouchers();
    this.setLocal('vouchers', list.filter(v => v.id !== id));
    try {
      await fetch(`/api/vouchers/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error(e);
    }
  }

  // --- INVOICES ---
  public async getInvoices(): Promise<Invoice[]> {
    try {
      const res = await fetch('/api/invoices');
      if (res.ok) {
        const list = await res.json();
        this.setLocal('invoices', list);
        return list;
      }
    } catch (e) {
      console.warn('API fetch invoices fallback:', e);
    }
    return this.getLocal<Invoice[]>('invoices', []);
  }

  public async saveInvoice(invoice: Invoice): Promise<void> {
    const list = await this.getInvoices();
    const idx = list.findIndex(i => i.id === invoice.id);
    if (idx >= 0) list[idx] = invoice;
    else list.unshift(invoice);
    this.setLocal('invoices', list);
    try {
      await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoice)
      });
    } catch (e) {
      console.error(e);
    }
  }

  public async deleteInvoice(id: string): Promise<void> {
    const list = await this.getInvoices();
    this.setLocal('invoices', list.filter(i => i.id !== id));
    try {
      await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error(e);
    }
  }

  // --- DASHBOARD STATS ---
  public async getDashboardStats() {
    const accounts = await this.getAccounts();
    const products = await this.getProducts();
    const invoices = await this.getInvoices();
    const vouchers = await this.getVouchers();

    const salesInvoices = invoices.filter(i => i.invoiceType === 'SALES_CASH' || i.invoiceType === 'SALES_CREDIT');
    const purchaseInvoices = invoices.filter(i => i.invoiceType === 'PURCHASE_CASH' || i.invoiceType === 'PURCHASE_CREDIT');

    const totalSales = salesInvoices.reduce((acc, curr) => acc + curr.netTotal, 0);
    const totalPurchases = purchaseInvoices.reduce((acc, curr) => acc + curr.netTotal, 0);

    const cashReceipts = vouchers.filter(v => v.voucherType === 'CASH_RECEIPT').reduce((acc, curr) => acc + curr.totalAmount, 0);
    const cashPayments = vouchers.filter(v => v.voucherType === 'CASH_PAYMENT').reduce((acc, curr) => acc + curr.totalAmount, 0);

    const todayStr = new Date().toISOString().split('T')[0];
    const todaysSales = salesInvoices.filter(i => i.date.startsWith(todayStr)).reduce((acc, curr) => acc + curr.netTotal, 0);
    const todaysPurchases = purchaseInvoices.filter(i => i.date.startsWith(todayStr)).reduce((acc, curr) => acc + curr.netTotal, 0);

    const cashAccount = accounts.find(a => a.name.toLowerCase().includes('cash') || a.code === '1001');
    let cashBalance = cashAccount ? (cashAccount.openingBalanceType === 'Dr' ? cashAccount.openingBalance : -cashAccount.openingBalance) : 0;
    cashBalance += cashReceipts - cashPayments;
    salesInvoices.filter(i => i.invoiceType === 'SALES_CASH').forEach(i => cashBalance += i.netTotal);
    purchaseInvoices.filter(i => i.invoiceType === 'PURCHASE_CASH').forEach(i => cashBalance -= i.netTotal);

    return {
      totalAccounts: accounts.length,
      totalProducts: products.length,
      totalSales,
      totalPurchases,
      cashReceipts,
      cashPayments,
      outstandingReceivables: 0,
      outstandingPayables: 0,
      todaysSales,
      todaysPurchases,
      cashBalance,
      recentTransactions: [
        ...salesInvoices.map(i => ({ id: i.id, date: i.date, type: 'Sale Invoice', ref: i.invoiceNo, amount: i.netTotal })),
        ...purchaseInvoices.map(i => ({ id: i.id, date: i.date, type: 'Purchase Invoice', ref: i.invoiceNo, amount: i.netTotal })),
        ...vouchers.map(v => ({ id: v.id, date: v.date, type: v.voucherType.replace('_', ' '), ref: v.voucherNo, amount: v.totalAmount }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10)
    };
  }
}

export const db = new DatabaseService();
