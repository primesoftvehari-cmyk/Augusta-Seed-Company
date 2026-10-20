import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Account, AccountType, SalesStaff, UserProfile } from '../types';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';

export const ChartOfAccounts: React.FC<{ currentUser: UserProfile }> = ({ currentUser }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [staffList, setStaffList] = useState<SalesStaff[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [parentAccount, setParentAccount] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('Assets');
  const [salesStaff, setSalesStaff] = useState('');
  const [phone, setPhone] = useState('');
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [openingBalanceType, setOpeningBalanceType] = useState<'Dr' | 'Cr'>('Dr');
  const [description, setDescription] = useState('');
  const [active, setActive] = useState(true);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const list = await db.getAccounts();
      const staff = await db.getSalesStaff();
      setAccounts(Array.isArray(list) ? list : []);
      setStaffList(Array.isArray(staff) ? staff : []);
    } catch (e) {
      console.error('Error loading accounts:', e);
      setAccounts([]);
      setStaffList([]);
    }
  };

  const handleOpenModal = (acc?: Account) => {
    if (acc) {
      setEditingAccount(acc);
      setCode(acc.code);
      setName(acc.name);
      setParentAccount(acc.parentAccount || '');
      setAccountType(acc.accountType);
      setSalesStaff(acc.salesStaff || '');
      setPhone(acc.phone || '');
      setOpeningBalance(acc.openingBalance);
      setOpeningBalanceType(acc.openingBalanceType);
      setDescription(acc.description || '');
      setActive(acc.active);
    } else {
      setEditingAccount(null);
      const numericCodes = accounts
        .map(a => parseInt(a.code, 10))
        .filter(n => !isNaN(n));
      const maxCode = numericCodes.length > 0 ? Math.max(...numericCodes) : 1000;
      const nextCode = `${maxCode + 1}`;
      setCode(nextCode);
      setName('');
      setParentAccount('');
      setAccountType('Assets');
      setSalesStaff('');
      setPhone('');
      setOpeningBalance(0);
      setOpeningBalanceType('Dr');
      setDescription('');
      setActive(true);
    }
    setShowModal(true);
  };

  const handleAccountTypeChange = (newType: AccountType) => {
    setAccountType(newType);
    if (!editingAccount) {
      // Suggest series based on type
      let baseSeries = 1000;
      if (newType === 'Liabilities') baseSeries = 2000;
      else if (newType === 'Equity') baseSeries = 3000;
      else if (newType === 'Revenue') baseSeries = 4000;
      else if (newType === 'Expenses') baseSeries = 5000;
      else if (newType === 'General Ledgers') baseSeries = 6000;

      const typeCodes = accounts
        .filter(a => a.accountType === newType)
        .map(a => parseInt(a.code, 10))
        .filter(n => !isNaN(n));

      if (typeCodes.length > 0) {
        setCode(`${Math.max(...typeCodes) + 1}`);
      } else {
        const numericCodes = accounts.map(a => parseInt(a.code, 10)).filter(n => !isNaN(n));
        const maxCode = numericCodes.length > 0 ? Math.max(...numericCodes) : baseSeries;
        setCode(`${Math.max(baseSeries, maxCode + 1)}`);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const newAccount: Account = {
      id: editingAccount ? editingAccount.id : `acc_${Date.now()}`,
      code: code.trim(),
      name: name.trim(),
      parentAccount: parentAccount || undefined,
      accountType,
      salesStaff: salesStaff || undefined,
      phone: phone || undefined,
      openingBalance: Number(openingBalance),
      openingBalanceType,
      description: description || undefined,
      active,
      createdAt: editingAccount ? editingAccount.createdAt : new Date().toISOString()
    };

    try {
      await db.saveAccount(newAccount);
      setShowModal(false);
      loadAccounts();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (currentUser.role !== 'ADMIN') {
      alert('Normal users are not allowed to delete accounts.');
      return;
    }
    if (confirm('Are you sure you want to delete this account?')) {
      try {
        await db.deleteAccount(id);
        loadAccounts();
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const filteredAccounts = accounts.filter(
    a =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.accountType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Chart of Accounts</h2>
          <p className="text-sm text-gray-500">Manage hierarchical ledger accounts across assets, liabilities, equity, revenue, and expenses</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center space-x-2 bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Account</span>
        </button>
      </div>

      <div className="flex items-center space-x-4 bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search by account code, name, or type..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 text-sm rounded-lg border border-gray-300 focus:border-emerald-600 focus:outline-hidden"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200 text-xs font-semibold uppercase text-gray-500 bg-gray-50">
              <th className="py-3.5 px-4">Code</th>
              <th className="py-3.5 px-4">Account Name</th>
              <th className="py-3.5 px-4">Type</th>
              <th className="py-3.5 px-4">Parent Account</th>
              <th className="py-3.5 px-4 text-right">Opening Balance</th>
              <th className="py-3.5 px-4 text-center">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {filteredAccounts.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400">
                  No accounts found. Click "Add Account" to create one.
                </td>
              </tr>
            ) : (
              filteredAccounts.map(acc => (
                <tr key={acc.id} className="hover:bg-gray-50/50">
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-800">{acc.code}</td>
                  <td className="py-3.5 px-4 font-semibold text-gray-800">{acc.name}</td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {acc.accountType}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-gray-600">{acc.parentAccount || 'Primary Head'}</td>
                  <td className="py-3.5 px-4 text-right font-bold text-gray-800">
                    {acc.openingBalance.toLocaleString()} {acc.openingBalanceType}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                        acc.active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {acc.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    {(currentUser.role === 'ADMIN' || !editingAccount) && (
                      <button
                        onClick={() => handleOpenModal(acc)}
                        className="p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit Account"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    {currentUser.role === 'ADMIN' && (
                      <button
                        onClick={() => handleDelete(acc.id)}
                        className="p-1.5 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Account"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden">
            <div className="bg-black px-6 py-4 text-white flex items-center justify-between">
              <h3 className="text-lg font-bold">{editingAccount ? 'Edit Account' : 'Add New Account'}</h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Account Code</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Account Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Account Type</label>
                  <select
                    value={accountType}
                    onChange={e => handleAccountTypeChange(e.target.value as AccountType)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-hidden bg-white"
                  >
                    <option value="Assets">Assets</option>
                    <option value="Liabilities">Liabilities</option>
                    <option value="Equity">Equity</option>
                    <option value="Revenue">Revenue</option>
                    <option value="Expenses">Expenses</option>
                    <option value="General Ledgers">General Ledgers</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Sales Staff</label>
                  <select
                    value={salesStaff}
                    onChange={e => setSalesStaff(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-hidden bg-white"
                  >
                    <option value="">Select Sales Staff (Optional)...</option>
                    {staffList.map(s => (
                      <option key={s.id} value={s.staffName}>
                        {s.staffCode} - {s.staffName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Phone / Mobile</label>
                <input
                  type="text"
                  placeholder="e.g. 0302-3576036"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-hidden font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Opening Balance</label>
                  <input
                    type="number"
                    step="0.01"
                    value={openingBalance}
                    onChange={e => setOpeningBalance(Number(e.target.value))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-hidden font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Balance Type</label>
                  <select
                    value={openingBalanceType}
                    onChange={e => setOpeningBalanceType(e.target.value as 'Dr' | 'Cr')}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-hidden bg-white font-semibold"
                  >
                    <option value="Dr">Debit (Dr)</option>
                    <option value="Cr">Credit (Cr)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Description / Remarks</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-red-700 hover:bg-red-800 rounded-lg shadow-sm cursor-pointer"
                >
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
