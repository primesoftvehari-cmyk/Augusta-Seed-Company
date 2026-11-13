import React, { useState, useEffect } from 'react';
import { UserProfile, DatabaseStatus } from '../types';
import { db } from '../services/db';
import { Database, Download, Upload, ShieldCheck, AlertTriangle, FileJson, HardDrive, CheckCircle2, Terminal } from 'lucide-react';

interface DatabaseBackupProps {
  currentUser: UserProfile;
  onOpenMySQLModal: () => void;
}

export const DatabaseBackupComponent: React.FC<DatabaseBackupProps> = ({ currentUser, onOpenMySQLModal }) => {
  const [stats, setStats] = useState({
    accounts: 0,
    products: 0,
    staff: 0,
    territories: 0,
    vouchers: 0,
    invoices: 0,
    users: 0
  });

  const [dbStatus, setDbStatus] = useState<DatabaseStatus>({ type: 'mysql', connected: false });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [showConfirmRestore, setShowConfirmRestore] = useState(false);

  const [sqlQuery, setSqlQuery] = useState(`-- Sales Invoice SQL Example for Augusta Seed Company
INSERT INTO \`invoices\` (
  \`id\`, \`invoice_no\`, \`invoice_type\`, \`date\`, \`account_name\`, 
  \`sales_staff\`, \`territory\`, \`items\`, \`gross_total\`, \`discount_total\`, \`net_total\`, \`description\`, \`remarks\`, \`created_by\`, \`created_at\`
) VALUES (
  'inv_sample_01', 'SI-2026-001', 'SALES_CREDIT', '2026-10-30', 
  'Sundry Debtors / Seed Growers (Receivables)', 'Nasir Ali Sahiwal', 
  'Sahiwal Head Office',
  '[{"productId":"p_1","productCode":"SD-WHT-01","productName":"Wheat Seed Akbar 2019 Certified","packSize":"50kg","quantity":10,"rate":4800,"amount":48000}]',
  48000.00, 0.00, 48000.00, 
  'Certified Wheat Seed supply for Rabi sowing season', 
  'Verified by Punjab Seed Corp', 'admin', NOW()
);

SELECT invoice_no, invoice_type, date, account_name, net_total, description 
FROM invoices 
WHERE invoice_type LIKE 'SALES_%' 
ORDER BY date DESC;`);
  const [queryResult, setQueryResult] = useState<any>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [queryRunning, setQueryRunning] = useState(false);

  const handleRunQuery = async () => {
    if (!sqlQuery.trim()) return;
    try {
      setQueryRunning(true);
      setQueryError(null);
      setQueryResult(null);
      const res = await db.executeSQLQuery(sqlQuery);
      if (!res.success) {
        throw new Error(res.error || 'SQL execution failed.');
      }
      setQueryResult(res.result);
    } catch (e: any) {
      setQueryError(e.message || String(e));
    } finally {
      setQueryRunning(false);
    }
  };

  useEffect(() => {
    loadStats();
    checkDb();
  }, []);

  const loadStats = async () => {
    try {
      const accounts = await db.getAccounts();
      const products = await db.getProducts();
      const staff = await db.getSalesStaff();
      const territories = await db.getTerritories();
      const vouchers = await db.getVouchers();
      const invoices = await db.getInvoices();
      const users = await db.getUsers();

      setStats({
        accounts: accounts.length,
        products: products.length,
        staff: staff.length,
        territories: territories.length,
        vouchers: vouchers.length,
        invoices: invoices.length,
        users: users.length
      });
    } catch (e) {
      console.error('Error loading stats:', e);
    }
  };

  const checkDb = async () => {
    const s = await db.getDatabaseStatus();
    setDbStatus(s);
  };

  const handleDownloadJsonBackup = async () => {
    try {
      setLoading(true);
      setMessage(null);
      const accounts = await db.getAccounts();
      const products = await db.getProducts();
      const staff = await db.getSalesStaff();
      const territories = await db.getTerritories();
      const companyProfile = await db.getCompanyProfile();
      const vouchers = await db.getVouchers();
      const invoices = await db.getInvoices();
      const users = await db.getUsers();

      const backupData = {
        version: '1.0',
        appName: 'Augusta Seed Company ERP',
        exportedAt: new Date().toISOString(),
        exportedBy: currentUser.username,
        data: {
          accounts,
          products,
          staff,
          territories,
          companyProfile,
          vouchers,
          invoices,
          users
        }
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      const dateStr = new Date().toISOString().split('T')[0];
      downloadAnchor.setAttribute('download', `augusta_seed_backup_${dateStr}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setMessage({ type: 'success', text: 'JSON database backup downloaded successfully!' });
    } catch (e: any) {
      setMessage({ type: 'error', text: `Failed to generate JSON backup: ${e.message || e}` });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSqlBackup = async () => {
    try {
      setLoading(true);
      setMessage(null);
      const sql = await db.getMySQLExportDataSql();
      const blob = new Blob([sql], { type: 'text/sql' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      a.download = `augusta_seed_mysql_dump_${dateStr}.sql`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setMessage({ type: 'success', text: 'MySQL SQL database dump downloaded successfully!' });
    } catch (e: any) {
      setMessage({ type: 'error', text: `Failed to download SQL dump: ${e.message || e}` });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setRestoreFile(e.target.files[0]);
      setShowConfirmRestore(true);
      setMessage(null);
    }
  };

  const handleExecuteRestore = async () => {
    if (!restoreFile) return;
    try {
      setLoading(true);
      setMessage(null);
      const fileText = await restoreFile.text();

      // Check if uploaded file is SQL dump (.sql)
      if (restoreFile.name.endsWith('.sql') || fileText.includes('CREATE TABLE') || fileText.includes('REPLACE INTO')) {
        const res = await fetch('/api/database/restore-sql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sqlScript: fileText })
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'SQL restore failed.');
        }
        await loadStats();
        setMessage({ type: 'success', text: 'MySQL database restored successfully from SQL dump!' });
        setShowConfirmRestore(false);
        setRestoreFile(null);
        setLoading(false);
        return;
      }

      // Otherwise treat as JSON backup
      const parsed = JSON.parse(fileText);
      const payload = parsed.data || parsed;

      if (!payload) {
        throw new Error('Invalid backup file structure.');
      }

      const { accounts, products, staff, territories, companyProfile, vouchers, invoices, users } = payload;

      if (companyProfile) {
        await db.saveCompanyProfile(companyProfile);
      }
      if (Array.isArray(accounts)) {
        for (const acc of accounts) {
          await db.saveAccount(acc);
        }
      }
      if (Array.isArray(products)) {
        for (const prod of products) {
          await db.saveProduct(prod);
        }
      }
      if (Array.isArray(staff)) {
        for (const st of staff) {
          await db.saveSalesStaff(st);
        }
      }
      if (Array.isArray(territories)) {
        for (const terr of territories) {
          await db.saveTerritory(terr);
        }
      }
      if (Array.isArray(vouchers)) {
        for (const v of vouchers) {
          await db.saveVoucher(v);
        }
      }
      if (Array.isArray(invoices)) {
        for (const inv of invoices) {
          await db.saveInvoice(inv);
        }
      }
      if (Array.isArray(users)) {
        for (const u of users) {
          await db.saveUser(u);
        }
      }

      await loadStats();
      setMessage({ type: 'success', text: 'Database restored successfully from JSON backup file!' });
      setShowConfirmRestore(false);
      setRestoreFile(null);
    } catch (e: any) {
      setMessage({ type: 'error', text: `Failed to restore database: ${e.message || e}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6">
        <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-700 flex items-center justify-center font-bold">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 uppercase">Database & Backup Management</h2>
              <p className="text-sm text-gray-500">
                MySQL connection status, JSON snapshots, and SQL dump backup & restore
              </p>
            </div>
          </div>
          <div className="flex space-x-3 flex-wrap gap-2">
            <button
              onClick={onOpenMySQLModal}
              className="flex items-center space-x-2 bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Database className="w-4 h-4" />
              <span>Configure MySQL Server</span>
            </button>
            <button
              onClick={handleDownloadSqlBackup}
              className="flex items-center space-x-1.5 bg-gray-900 hover:bg-black text-white px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
            >
              <Terminal className="w-4 h-4 text-red-400" />
              <span>Download SQL Dump</span>
            </button>
          </div>
        </div>

        {/* Database backend status bar */}
        <div className="mt-4 p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <span className={`w-3 h-3 rounded-full ${dbStatus.connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
            <span className="font-bold text-gray-800">
              Active Storage: {dbStatus.connected ? `MySQL (${dbStatus.host}:${dbStatus.port} - ${dbStatus.database})` : 'MySQL Disconnected'}
            </span>
          </div>
          <span className="text-gray-500">{dbStatus.message}</span>
        </div>

        {message && (
          <div
            className={`mt-4 p-4 rounded-lg flex items-center space-x-3 ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 shrink-0 text-red-600" />
            )}
            <p className="text-sm font-medium">{message.text}</p>
          </div>
        )}
      </div>

      {/* Database Statistics Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs text-center">
          <p className="text-xs font-semibold text-gray-500 uppercase">Accounts</p>
          <p className="text-2xl font-black text-gray-900 mt-1">{stats.accounts}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs text-center">
          <p className="text-xs font-semibold text-gray-500 uppercase">Products / Seeds</p>
          <p className="text-2xl font-black text-gray-900 mt-1">{stats.products}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs text-center">
          <p className="text-xs font-semibold text-gray-500 uppercase">Vouchers</p>
          <p className="text-2xl font-black text-gray-900 mt-1">{stats.vouchers}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs text-center">
          <p className="text-xs font-semibold text-gray-500 uppercase">Invoices</p>
          <p className="text-2xl font-black text-gray-900 mt-1">{stats.invoices}</p>
        </div>
      </div>

      {/* Backup & Restore Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export / Backup Card */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center space-x-3 text-red-700">
              <Download className="w-6 h-6" />
              <h3 className="text-lg font-bold text-gray-900">Backup & Export Database</h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Export a complete snapshot of all Augusta Seed Company accounts, inventory, sales staff, territories, vouchers, and invoices. You can download as a JSON backup or a fully executable MySQL `.sql` dump file.
            </p>
          </div>
          <div className="pt-6 space-y-3">
            <button
              onClick={handleDownloadJsonBackup}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 bg-red-700 hover:bg-red-800 text-white py-2.5 rounded-lg text-sm font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <FileJson className="w-4 h-4" />
              <span>Download JSON Backup</span>
            </button>
            <button
              onClick={handleDownloadSqlBackup}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 bg-gray-800 hover:bg-black text-white py-2.5 rounded-lg text-sm font-bold transition-colors cursor-pointer disabled:opacity-50"
            >
              <Terminal className="w-4 h-4 text-red-400" />
              <span>Download MySQL SQL Dump (.sql)</span>
            </button>
          </div>
        </div>

        {/* Import / Restore Card */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center space-x-3 text-gray-900">
              <Upload className="w-6 h-6 text-red-700" />
              <h3 className="text-lg font-bold text-gray-900">Restore Database</h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Restore your database by uploading a previously saved backup file (`.json` or `.sql`). All records will be safely merged and imported into your MySQL database.
            </p>
          </div>
          <div className="pt-6">
            <label className="block w-full border-2 border-dashed border-gray-300 hover:border-red-700 rounded-xl p-6 text-center cursor-pointer transition-colors bg-gray-50 hover:bg-red-50/20">
              <Upload className="w-8 h-8 text-red-700 mx-auto mb-2" />
              <span className="text-sm font-bold text-gray-700 block">Click to select backup file (.json or .sql)</span>
              <span className="text-xs text-gray-400 mt-1 block">Ensure you have an active MySQL connection</span>
              <input
                type="file"
                accept=".json,.sql"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* SQL Editor & Sales Invoice Runner Card */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-3 text-gray-900">
            <Terminal className="w-6 h-6 text-red-700" />
            <div>
              <h3 className="text-lg font-bold text-gray-900">MySQL SQL Editor & Sales Invoice Runner</h3>
              <p className="text-xs text-gray-500">Run custom SQL queries (including Sales Invoice inserts and selects) directly on your MySQL database</p>
            </div>
          </div>
          <button
            onClick={handleRunQuery}
            disabled={queryRunning}
            className="flex items-center space-x-2 bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Terminal className="w-4 h-4" />
            <span>{queryRunning ? 'Executing SQL...' : 'Run SQL Query'}</span>
          </button>
        </div>

        <div>
          <textarea
            value={sqlQuery}
            onChange={e => setSqlQuery(e.target.value)}
            rows={8}
            className="w-full font-mono text-xs p-3 rounded-xl border border-gray-300 focus:border-red-700 focus:outline-hidden bg-gray-900 text-emerald-300"
            placeholder="Type your SQL query here..."
          />
        </div>

        {queryError && (
          <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-lg text-xs font-mono">
            Error: {queryError}
          </div>
        )}

        {queryResult !== null && (
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-600">Query Execution Result:</p>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 overflow-x-auto max-h-96">
              {Array.isArray(queryResult) ? (
                queryResult.length === 0 ? (
                  <p className="text-xs text-gray-500 italic">Query executed successfully. 0 rows returned.</p>
                ) : (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-100 font-bold text-gray-700">
                        {Object.keys(queryResult[0]).map((key, i) => (
                          <th key={i} className="p-2">{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {queryResult.map((row: any, rIdx: number) => (
                        <tr key={rIdx} className="hover:bg-gray-100/50">
                          {Object.values(row).map((val: any, cIdx: number) => (
                            <td key={cIdx} className="p-2 font-mono text-[11px] text-gray-800">
                              {typeof val === 'object' ? JSON.stringify(val) : String(val ?? '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              ) : (
                <pre className="text-xs font-mono text-emerald-800 whitespace-pre-wrap">
                  {JSON.stringify(queryResult, null, 2)}
                </pre>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmRestore && restoreFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center space-x-3 text-amber-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-bold text-gray-900">Confirm Database Restore</h3>
            </div>
            <p className="text-sm text-gray-600">
              You are about to restore data from <span className="font-bold text-gray-900">{restoreFile.name}</span> into your active MySQL database. Existing records with matching IDs will be updated.
            </p>
            <div className="bg-gray-50 p-3 rounded-lg text-xs font-mono text-gray-700 border border-gray-200">
              Size: {(restoreFile.size / 1024).toFixed(2)} KB
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowConfirmRestore(false);
                  setRestoreFile(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteRestore}
                disabled={loading}
                className="px-5 py-2 text-sm font-bold text-white bg-red-700 hover:bg-red-800 rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Restoring...' : 'Confirm & Restore'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
