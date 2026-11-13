import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Account, AccountType, SalesStaff, UserProfile } from '../types';
import { Plus, Search, Edit, Trash2, Save, Table, CheckCircle2 } from 'lucide-react';

export const ChartOfAccounts: React.FC<{ currentUser: UserProfile }> = ({ currentUser }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [staffList, setStaffList] = useState<SalesStaff[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  // Speedy Data Browser local edits state
  const [speedyEdits, setSpeedyEdits] = useState<Record<string, Partial<Account>>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [parentAccount, setParentAccount] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('Assets');
  const [salesStaff, setSalesStaff] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
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
      setSpeedyEdits({});
    } catch (e) {
      console.error('Error loading accounts:', e);
      setAccounts([]);
      setStaffList([]);
    }
  };

  const getBaseSeriesForType = (type: AccountType): number => {
    switch (type) {
      case 'Cash/Banks': return 10001;
      case 'Assets': return 20000;
      case 'Expenses': return 30000;
      case 'Liabilities': return 40000;
      case 'General Ledgers': return 50000;
      case 'Equity': return 60000;
      case 'Revenue': return 70000;
      default: return 20000;
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
      setAddress(acc.address || '');
      setOpeningBalance(acc.openingBalance);
      setOpeningBalanceType(acc.openingBalanceType);
      setDescription(acc.description || '');
      setActive(acc.active);
    } else {
      setEditingAccount(null);
      const defaultType: AccountType = 'Assets';
      setAccountType(defaultType);
      const baseSeries = getBaseSeriesForType(defaultType);
      const upperLimit = baseSeries + 9999;
      const typeCodes = accounts
        .filter(a => a.accountType === defaultType)
        .map(a => parseInt(a.code, 10))
        .filter(n => !isNaN(n) && n >= baseSeries && n <= upperLimit);
      const nextCodeNum = typeCodes.length > 0 ? Math.max(...typeCodes) + 1 : baseSeries;
      setCode(`${nextCodeNum}`);
      setName('');
      setParentAccount('');
      setSalesStaff('');
      setPhone('');
      setAddress('');
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
      const baseSeries = getBaseSeriesForType(newType);
      const upperLimit = baseSeries + 9999;

      const typeCodes = accounts
        .filter(a => a.accountType === newType)
        .map(a => parseInt(a.code, 10))
        .filter(n => !isNaN(n) && n >= baseSeries && n <= upperLimit);

      let nextCodeNum = baseSeries;
      if (typeCodes.length > 0) {
        nextCodeNum = Math.max(...typeCodes) + 1;
      } else {
        const rangeCodes = accounts
          .map(a => parseInt(a.code, 10))
          .filter(n => !isNaN(n) && n >= baseSeries && n <= upperLimit);
        if (rangeCodes.length > 0) {
          nextCodeNum = Math.max(...rangeCodes) + 1;
        }
      }

      if (nextCodeNum > upperLimit) {
        nextCodeNum = upperLimit;
      }
      setCode(`${nextCodeNum}`);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedCode = code.trim();
    if (!trimmedCode) {
      alert('Account code cannot be empty.');
      return;
    }
    const duplicate = accounts.some(
      a => (!editingAccount || a.id !== editingAccount.id) && a.code.trim().toLowerCase() === trimmedCode.toLowerCase()
    );
    if (duplicate) {
      alert(`Account code "${trimmedCode}" already exists. Code must remain unique.`);
      return;
    }

    const newAccount: Account = {
      id: editingAccount ? editingAccount.id : `acc_${Date.now()}`,
      code: trimmedCode,
      name: name.trim(),
      parentAccount: parentAccount || undefined,
      accountType,
      salesStaff: salesStaff || undefined,
      phone: phone || undefined,
      address: address || undefined,
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

  const handleSpeedyChange = (id: string, field: keyof Account, value: any) => {
    setSpeedyEdits(prev => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        [field]: value
      }
    }));
  };

  const handleSpeedySave = async (acc: Account) => {
    const edits = speedyEdits[acc.id];
    if (!edits) return;

    const newCode = edits.code !== undefined ? String(edits.code).trim() : acc.code.trim();
    if (!newCode) {
      alert('Account code cannot be empty.');
      return;
    }

    const duplicate = accounts.some(
      a => a.id !== acc.id && a.code.trim().toLowerCase() === newCode.toLowerCase()
    );
    if (duplicate) {
      alert(`Account code "${newCode}" already exists. Code must remain unique.`);
      return;
    }

    const updatedAccount: Account = {
      ...acc,
      ...edits,
      code: newCode,
      openingBalance: edits.openingBalance !== undefined ? Number(edits.openingBalance) : acc.openingBalance
    };

    try {
      setSavingId(acc.id);
      await db.saveAccount(updatedAccount);
      setSpeedyEdits(prev => {
        const copy = { ...prev };
        delete copy[acc.id];
        return copy;
      });
      loadAccounts();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingId(null);
    }
  };

  const filteredAccounts = accounts.filter(
    a =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.accountType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight uppercase">Chart of Accounts — Speedy Data Browser</h2>
          <p className="text-xs text-gray-500">Edit Name, Type, and Opening Balance instantly in the data grid below, or add new accounts</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center space-x-1.5 bg-red-700 hover:bg-red-800 text-white px-3.5 py-2 rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Account</span>
        </button>
      </div>

      <div className="flex items-center space-x-3 bg-white p-3 rounded-xl border border-gray-200 shadow-xs">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search by code, account name, or type..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-gray-300 focus:border-red-700 focus:outline-hidden"
          />
        </div>
        <div className="flex items-center space-x-1.5 text-xs font-bold text-red-700 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200">
          <Table className="w-4 h-4" />
          <span>Speedy Inline Browse Active</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-[10px] font-bold uppercase text-gray-500 bg-gray-50">
                <th className="py-3 px-3">Code (Speedy Edit)</th>
                <th className="py-3 px-3">Account Name (Speedy Edit)</th>
                <th className="py-3 px-3">Account Type (Speedy Edit)</th>
                <th className="py-3 px-3 text-right">Opening Balance (Speedy Edit)</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    No accounts found. Click "Add Account" to create one.
                  </td>
                </tr>
              ) : (
                filteredAccounts.map(acc => {
                  const currentEdit = speedyEdits[acc.id] || {};
                  const editCode = currentEdit.code !== undefined ? currentEdit.code : acc.code;
                  const editName = currentEdit.name !== undefined ? currentEdit.name : acc.name;
                  const editType = currentEdit.accountType !== undefined ? currentEdit.accountType : acc.accountType;
                  const editBal = currentEdit.openingBalance !== undefined ? currentEdit.openingBalance : acc.openingBalance;
                  const editBalType = currentEdit.openingBalanceType !== undefined ? currentEdit.openingBalanceType : acc.openingBalanceType;
                  const isModified = speedyEdits[acc.id] !== undefined;

                  return (
                    <tr key={acc.id} className="hover:bg-red-50/20 transition-colors">
                      {/* Speedy Code Edit */}
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={editCode}
                          onChange={e => handleSpeedyChange(acc.id, 'code', e.target.value)}
                          className="w-24 bg-white border border-gray-300 rounded px-2 py-1 text-xs font-mono font-bold text-red-800 focus:border-red-700 focus:outline-hidden"
                        />
                      </td>
                      
                      {/* Speedy Name Edit */}
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={editName}
                          onChange={e => handleSpeedyChange(acc.id, 'name', e.target.value)}
                          className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-xs font-semibold text-gray-900 focus:border-red-700 focus:outline-hidden"
                        />
                      </td>

                      {/* Speedy Type Edit */}
                      <td className="py-2.5 px-3">
                        <select
                          value={editType}
                          onChange={e => handleSpeedyChange(acc.id, 'accountType', e.target.value as AccountType)}
                          className="bg-white border border-gray-300 rounded px-2 py-1 text-xs font-semibold text-gray-800 focus:border-red-700 focus:outline-hidden"
                        >
                          <option value="Assets">Assets</option>
                          <option value="Liabilities">Liabilities</option>
                          <option value="Equity">Equity</option>
                          <option value="Revenue">Revenue</option>
                          <option value="Expenses">Expenses</option>
                          <option value="Cash/Banks">Cash/Banks</option>
                          <option value="General Ledgers">General Ledgers</option>
                        </select>
                      </td>

                      {/* Speedy Opening Balance Edit */}
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <input
                            type="number"
                            step="0.01"
                            value={editBal}
                            onChange={e => handleSpeedyChange(acc.id, 'openingBalance', Number(e.target.value))}
                            className="w-32 bg-white border border-gray-300 rounded px-2 py-1 text-xs font-mono font-bold text-right text-gray-900 focus:border-red-700 focus:outline-hidden"
                          />
                          <select
                            value={editBalType}
                            onChange={e => handleSpeedyChange(acc.id, 'openingBalanceType', e.target.value as 'Dr' | 'Cr')}
                            className="bg-white border border-gray-300 rounded px-1.5 py-1 text-[11px] font-bold text-gray-800 focus:border-red-700 focus:outline-hidden"
                          >
                            <option value="Dr">Dr</option>
                            <option value="Cr">Cr</option>
                          </select>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                            acc.active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {acc.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-right space-x-1.5 whitespace-nowrap">
                        {isModified ? (
                          <button
                            onClick={() => handleSpeedySave(acc)}
                            disabled={savingId === acc.id}
                            className="inline-flex items-center space-x-1 bg-red-700 hover:bg-red-800 text-white px-2.5 py-1 rounded text-xs font-bold shadow-xs transition-colors cursor-pointer"
                            title="Save speedy changes"
                          >
                            <Save className="w-3 h-3" />
                            <span>{savingId === acc.id ? 'Saving...' : 'Save'}</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-gray-400 font-medium inline-block px-2">Synced</span>
                        )}

                        <button
                          onClick={() => handleOpenModal(acc)}
                          className="p-1 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors cursor-pointer"
                          title="Full Edit Details"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        {currentUser.role === 'ADMIN' && (
                          <button
                            onClick={() => handleDelete(acc.id)}
                            className="p-1 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors cursor-pointer"
                            title="Delete Account"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
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
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-700 focus:outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Account Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-700 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Account Type</label>
                  <select
                    value={accountType}
                    onChange={e => handleAccountTypeChange(e.target.value as AccountType)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-700 focus:outline-hidden bg-white"
                  >
                    <option value="Assets">Assets</option>
                    <option value="Liabilities">Liabilities</option>
                    <option value="Equity">Equity</option>
                    <option value="Revenue">Revenue</option>
                    <option value="Expenses">Expenses</option>
                    <option value="Cash/Banks">Cash/Banks</option>
                    <option value="General Ledgers">General Ledgers</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Sales Staff</label>
                  <select
                    value={salesStaff}
                    onChange={e => setSalesStaff(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-700 focus:outline-hidden bg-white"
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Phone / Mobile</label>
                  <input
                    type="text"
                    placeholder="e.g. 0302-3576036"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-700 focus:outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Address</label>
                  <input
                    type="text"
                    placeholder="e.g. United Farm Road, Sahiwal"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-700 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Opening Balance</label>
                  <input
                    type="number"
                    step="0.01"
                    value={openingBalance}
                    onChange={e => setOpeningBalance(Number(e.target.value))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-700 focus:outline-hidden font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Balance Type</label>
                  <select
                    value={openingBalanceType}
                    onChange={e => setOpeningBalanceType(e.target.value as 'Dr' | 'Cr')}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-700 focus:outline-hidden bg-white font-semibold"
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
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-700 focus:outline-hidden"
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
