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
  public async getDatabaseStatus(): Promise<DatabaseStatus> {
    try {
      const res = await fetch('/api/database/status');
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.error('Database status check failed:', e);
    }
    return {
      type: 'mysql',
      connected: false,
      message: 'MySQL Database is not connected or available. Please configure MySQL connection.'
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
    const res = await fetch('/api/database/schema');
    if (res.ok) {
      return await res.text();
    }
    throw new Error('MySQL Database schema unavailable.');
  }

  public async getMySQLExportDataSql(): Promise<string> {
    const res = await fetch('/api/database/export-sql');
    if (res.ok) {
      return await res.text();
    }
    throw new Error('MySQL Database export unavailable.');
  }

  public async executeSQLQuery(sql: string): Promise<{ success: boolean; result?: any; error?: string }> {
    try {
      const res = await fetch('/api/database/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql })
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to execute SQL query.' };
    }
  }

  public async clearAllData(): Promise<void> {
    const res = await fetch('/api/database/clear-all', { method: 'POST' });
    if (!res.ok) {
      throw new Error('Failed to clear database data. MySQL is required.');
    }
  }

  public detachLocalStorage() {
    // No-op as built-in storage engine is disabled; MySQL is strictly required.
  }

  private async handleResponse(res: Response, errorMsg: string) {
    if (!res.ok) {
      let errText = errorMsg;
      try {
        const json = await res.json();
        if (json.error) errText = json.error;
      } catch {}
      throw new Error(`MySQL Error: ${errText}`);
    }
    return res.json();
  }

  // --- COMPANY PROFILE ---
  public async getCompanyProfile(): Promise<CompanyProfileData> {
    const res = await fetch('/api/company-profile');
    const data = await this.handleResponse(res, 'Failed to fetch company profile from MySQL.');
    return data;
  }

  public async saveCompanyProfile(profile: CompanyProfileData): Promise<void> {
    const res = await fetch('/api/company-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    });
    await this.handleResponse(res, 'Failed to save company profile to MySQL.');
  }

  // --- USERS ---
  public async getUsers(): Promise<UserProfile[]> {
    const res = await fetch('/api/users');
    const data = await this.handleResponse(res, 'Failed to fetch users from MySQL.');
    return data;
  }

  public async saveUser(user: UserProfile): Promise<void> {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });
    await this.handleResponse(res, 'Failed to save user to MySQL.');
  }

  public async deleteUser(id: string): Promise<void> {
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
    await this.handleResponse(res, 'Failed to delete user from MySQL.');
  }

  // --- ACCOUNTS ---
  public async getAccounts(): Promise<Account[]> {
    const res = await fetch('/api/accounts');
    const data = await this.handleResponse(res, 'Failed to fetch Chart of Accounts from MySQL.');
    return data;
  }

  public async saveAccount(account: Account): Promise<void> {
    const res = await fetch('/api/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(account)
    });
    await this.handleResponse(res, 'Failed to save account to MySQL.');
  }

  public async deleteAccount(id: string): Promise<void> {
    const res = await fetch(`/api/accounts/${id}`, { method: 'DELETE' });
    await this.handleResponse(res, 'Failed to delete account from MySQL.');
  }

  // --- SALES STAFF ---
  public async getSalesStaff(): Promise<SalesStaff[]> {
    const res = await fetch('/api/sales-staff');
    const data = await this.handleResponse(res, 'Failed to fetch sales staff from MySQL.');
    return data;
  }

  public async saveSalesStaff(staff: SalesStaff): Promise<void> {
    const res = await fetch('/api/sales-staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(staff)
    });
    await this.handleResponse(res, 'Failed to save sales staff to MySQL.');
  }

  public async deleteSalesStaff(id: string): Promise<void> {
    const res = await fetch(`/api/sales-staff/${id}`, { method: 'DELETE' });
    await this.handleResponse(res, 'Failed to delete sales staff from MySQL.');
  }

  // --- TERRITORIES ---
  public async getTerritories(): Promise<Territory[]> {
    const res = await fetch('/api/territories');
    const data = await this.handleResponse(res, 'Failed to fetch territories from MySQL.');
    return data;
  }

  public async saveTerritory(territory: Territory): Promise<void> {
    const res = await fetch('/api/territories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(territory)
    });
    await this.handleResponse(res, 'Failed to save territory to MySQL.');
  }

  public async deleteTerritory(id: string): Promise<void> {
    const res = await fetch(`/api/territories/${id}`, { method: 'DELETE' });
    await this.handleResponse(res, 'Failed to delete territory from MySQL.');
  }

  // --- PRODUCTS ---
  public async getProducts(): Promise<Product[]> {
    const res = await fetch('/api/products');
    const data = await this.handleResponse(res, 'Failed to fetch products from MySQL.');
    return data;
  }

  public async saveProduct(product: Product): Promise<void> {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    await this.handleResponse(res, 'Failed to save product to MySQL.');
  }

  public async deleteProduct(id: string): Promise<void> {
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    await this.handleResponse(res, 'Failed to delete product from MySQL.');
  }

  // --- VOUCHERS ---
  public async getVouchers(): Promise<Voucher[]> {
    const res = await fetch('/api/vouchers');
    const data = await this.handleResponse(res, 'Failed to fetch vouchers from MySQL.');
    return data;
  }

  public async saveVoucher(voucher: Voucher): Promise<void> {
    const res = await fetch('/api/vouchers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(voucher)
    });
    await this.handleResponse(res, 'Failed to save voucher to MySQL.');
  }

  public async deleteVoucher(id: string): Promise<void> {
    const res = await fetch(`/api/vouchers/${id}`, { method: 'DELETE' });
    await this.handleResponse(res, 'Failed to delete voucher from MySQL.');
  }

  // --- INVOICES ---
  public async getInvoices(): Promise<Invoice[]> {
    const res = await fetch('/api/invoices');
    const data = await this.handleResponse(res, 'Failed to fetch invoices from MySQL.');
    return data;
  }

  public async saveInvoice(invoice: Invoice): Promise<void> {
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoice)
    });
    await this.handleResponse(res, 'Failed to save invoice to MySQL.');
  }

  public async deleteInvoice(id: string): Promise<void> {
    const res = await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
    await this.handleResponse(res, 'Failed to delete invoice from MySQL.');
  }

  // --- DASHBOARD STATS ---
  public async getDashboardStats(): Promise<any> {
    const [accounts, products, vouchers, invoices] = await Promise.all([
      this.getAccounts(),
      this.getProducts(),
      this.getVouchers(),
      this.getInvoices()
    ]);

    let totalSales = 0;
    let totalPurchases = 0;
    let cashReceipts = 0;
    let cashPayments = 0;
    let todaysSales = 0;
    let todaysPurchases = 0;

    const todayStr = new Date().toISOString().split('T')[0];

    invoices.forEach(inv => {
      const net = Number(inv.netTotal || 0);
      if (inv.invoiceType === 'SALES_CASH' || inv.invoiceType === 'SALES_CREDIT') {
        totalSales += net;
        if (inv.date === todayStr) todaysSales += net;
      } else if (inv.invoiceType === 'PURCHASE_CASH' || inv.invoiceType === 'PURCHASE_CREDIT') {
        totalPurchases += net;
        if (inv.date === todayStr) todaysPurchases += net;
      }
    });

    vouchers.forEach(v => {
      const amt = Number(v.totalAmount || 0);
      if (v.voucherType === 'CASH_RECEIPT') cashReceipts += amt;
      if (v.voucherType === 'CASH_PAYMENT') cashPayments += amt;
    });

    // Calculate cash balance
    let cashBalance = 0;
    accounts.forEach(a => {
      if (a.name.toLowerCase().includes('cash') || a.accountType === 'Cash/Banks') {
        const op = Number(a.openingBalance || 0);
        cashBalance += a.openingBalanceType === 'Dr' ? op : -op;
      }
    });

    const recentTransactions: any[] = [];
    invoices.forEach(i => {
      recentTransactions.push({
        date: i.date,
        type: i.invoiceType.includes('SALES') ? 'Sale Invoice' : 'Purchase Invoice',
        ref: i.invoiceNo,
        amount: i.netTotal
      });
    });
    vouchers.forEach(v => {
      recentTransactions.push({
        date: v.date,
        type: v.voucherType.replace('_', ' '),
        ref: v.voucherNo,
        amount: v.totalAmount
      });
    });

    recentTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      totalAccounts: accounts.length,
      totalProducts: products.length,
      totalSales,
      totalPurchases,
      cashReceipts,
      cashPayments,
      todaysSales,
      todaysPurchases,
      cashBalance,
      recentTransactions: recentTransactions.slice(0, 10)
    };
  }
}

export const db = new DatabaseService();
