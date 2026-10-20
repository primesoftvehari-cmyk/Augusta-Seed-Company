import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/db';
import { Voucher, VoucherType, Account, SalesStaff, UserProfile, VoucherLine } from '../types';
import { Trash2, Save, Printer, Edit } from 'lucide-react';

export const VouchersComponent: React.FC<{ currentUser: UserProfile; defaultType?: VoucherType }> = ({
  currentUser,
  defaultType = 'CASH_PAYMENT'
}) => {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [staffList, setStaffList] = useState<SalesStaff[]>([]);
  const [activeTab, setActiveTab] = useState<VoucherType>(defaultType);

  // Form state
  const [voucherNo, setVoucherNo] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [narration, setNarration] = useState('');
  const [debitNarration, setDebitNarration] = useState('');
  const [creditNarration, setCreditNarration] = useState('');
  const [salesStaff, setSalesStaff] = useState('');
  const [debitAccountId, setDebitAccountId] = useState('');
  const [creditAccountId, setCreditAccountId] = useState('');
  const [debitSearch, setDebitSearch] = useState('');
  const [creditSearch, setCreditSearch] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);

  // Refs for auto-focus workflow
  const dateInputRef = useRef<HTMLInputElement>(null);
  const debitSelectRef = useRef<HTMLSelectElement>(null);
  const creditSelectRef = useRef<HTMLSelectElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);

  const handleEdit = (v: Voucher) => {
    setEditingVoucher(v);
    setVoucherNo(v.voucherNo);
    setDate(v.date);
    setNarration(v.narration);
    setSalesStaff(v.salesStaff || '');
    if (v.lines && v.lines.length >= 2) {
      setDebitAccountId(v.lines[0].accountId);
      setCreditAccountId(v.lines[1].accountId);
      setAmount(v.lines[0].debit || v.lines[1].credit || 0);
      setDebitNarration(v.lines[0].description || '');
      setCreditNarration(v.lines[1].description || '');
    }
  };

  const handleCancelEdit = () => {
    setEditingVoucher(null);
    setVoucherNo(`${activeTab.substring(0, 3)}-${Math.floor(1000 + Math.random() * 9000)}`);
    setNarration('');
    setDebitNarration('');
    setCreditNarration('');
    setSalesStaff('');
    setDebitSearch('');
    setCreditSearch('');
    setAmount(0);
    applyFixedAccounts(accounts);
  };

  useEffect(() => {
    loadData();
    setTimeout(() => {
      dateInputRef.current?.focus();
    }, 100);
  }, [activeTab]);

  const loadData = async () => {
    const list = await db.getVouchers();
    const accs = await db.getAccounts();
    const staff = await db.getSalesStaff();
    setVouchers(list.filter(v => v.voucherType === activeTab));
    setAccounts(accs);
    setStaffList(staff);
    setVoucherNo(`${activeTab.substring(0, 3)}-${Math.floor(1000 + Math.random() * 9000)}`);
    setNarration('');
    setDebitNarration('');
    setCreditNarration('');
    setSalesStaff('');
    setAmount(0);
    setEditingVoucher(null);
    setDebitSearch('');
    setCreditSearch('');

    applyFixedAccounts(accs);
    setTimeout(() => {
      dateInputRef.current?.focus();
    }, 100);
  };

  const applyFixedAccounts = (accs: Account[]) => {
    const cashAcc = accs.find(a => a.code === '1001' || a.name.toLowerCase().includes('cash in hand'));
    const cashId = cashAcc ? cashAcc.id : (accs[0]?.id || '');

    if (activeTab === 'CASH_PAYMENT') {
      setCreditAccountId(cashId);
      setDebitAccountId('');
    } else if (activeTab === 'CASH_RECEIPT') {
      setDebitAccountId(cashId);
      setCreditAccountId('');
    } else {
      setDebitAccountId('');
      setCreditAccountId('');
    }
  };

  // Date enter -> focus next input
  const handleDateKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (activeTab === 'CASH_PAYMENT' || activeTab === 'JOURNAL') {
        debitSelectRef.current?.focus();
      } else if (activeTab === 'CASH_RECEIPT') {
        creditSelectRef.current?.focus();
      }
    }
  };

  // When Debit account selected in CASH_PAYMENT or JOURNAL
  const handleDebitChange = (accId: string) => {
    setDebitAccountId(accId);
    if (activeTab === 'CASH_PAYMENT' && accId) {
      const acc = accounts.find(a => a.id === accId);
      if (acc) {
        setNarration(`Cash paid to ${acc.name}`);
      }
      amountInputRef.current?.focus();
    } else if (activeTab === 'JOURNAL' && accId) {
      const dAcc = accounts.find(a => a.id === accId);
      const cAcc = accounts.find(a => a.id === creditAccountId);
      if (dAcc) {
        setDebitNarration(`Tr. to.${dAcc.name}from. ${cAcc ? cAcc.name : ''}`);
      }
    }
  };

  // When Credit account selected in CASH_RECEIPT or JOURNAL
  const handleCreditChange = (accId: string) => {
    setCreditAccountId(accId);
    if (activeTab === 'CASH_RECEIPT' && accId) {
      const acc = accounts.find(a => a.id === accId);
      if (acc) {
        setNarration(`Cash received from ${acc.name}`);
      }
      amountInputRef.current?.focus();
    } else if (activeTab === 'JOURNAL' && accId) {
      const dAcc = accounts.find(a => a.id === debitAccountId);
      const cAcc = accounts.find(a => a.id === accId);
      if (cAcc) {
        setCreditNarration(`Tr. to.${cAcc.name}from. ${dAcc ? dAcc.name : ''}`);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!debitAccountId || !creditAccountId) {
      alert('Please select both Debit and Credit accounts.');
      return;
    }
    if (debitAccountId === creditAccountId) {
      alert('Debit account and Credit account cannot be the same.');
      return;
    }
    if (amount <= 0) {
      alert('Please enter a valid voucher amount greater than 0.');
      return;
    }

    const debitAcc = accounts.find(a => a.id === debitAccountId);
    const creditAcc = accounts.find(a => a.id === creditAccountId);

    const debitLineDesc = activeTab === 'JOURNAL'
      ? debitNarration
      : narration;
    const creditLineDesc = activeTab === 'JOURNAL'
      ? creditNarration
      : narration;

    const lines: VoucherLine[] = [
      {
        accountId: debitAccountId,
        accountName: debitAcc ? debitAcc.name : '',
        description: debitLineDesc,
        debit: amount,
        credit: 0
      },
      {
        accountId: creditAccountId,
        accountName: creditAcc ? creditAcc.name : '',
        description: creditLineDesc,
        debit: 0,
        credit: amount
      }
    ];

    const newVoucher: Voucher = {
      id: editingVoucher ? editingVoucher.id : `vch_${Date.now()}`,
      voucherNo,
      voucherType: activeTab,
      date,
      salesStaff,
      lines,
      totalAmount: amount,
      narration,
      createdBy: currentUser.fullName,
      createdAt: editingVoucher ? editingVoucher.createdAt : new Date().toISOString()
    };

    await db.saveVoucher(newVoucher);
    alert(editingVoucher ? 'Voucher updated successfully!' : 'Voucher posted successfully!');
    loadData();
    dateInputRef.current?.focus();
  };

  const handleDelete = async (id: string) => {
    if (currentUser.role !== 'ADMIN') {
      alert('Normal users cannot delete saved vouchers.');
      return;
    }
    if (confirm('Are you sure you want to delete this voucher?')) {
      await db.deleteVoucher(id);
      loadData();
    }
  };

  const cashInHandAccount = accounts.find(a => a.code === '1001' || a.name.toLowerCase().includes('cash in hand'));
  const cashInHandLabel = cashInHandAccount ? `ACC-${cashInHandAccount.code} - ${cashInHandAccount.name}` : 'ACC-10000 - CASH IN HAND';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {activeTab === 'CASH_PAYMENT' && 'Cash Payment Voucher (CPV)'}
            {activeTab === 'CASH_RECEIPT' && 'Cash Receipt Voucher (CRV)'}
            {activeTab === 'JOURNAL' && 'Journal Voucher (JV)'}
          </h2>
          <p className="text-sm text-gray-500">Record financial receipts, payments, and double-entry general ledger journals</p>
        </div>
        <div className="flex space-x-2 bg-white p-1 rounded-xl border border-gray-200">
          <button
            onClick={() => setActiveTab('CASH_PAYMENT')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'CASH_PAYMENT' ? 'bg-red-700 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Payment (CPV)
          </button>
          <button
            onClick={() => setActiveTab('CASH_RECEIPT')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'CASH_RECEIPT' ? 'bg-red-700 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Receipt (CRV)
          </button>
          <button
            onClick={() => setActiveTab('JOURNAL')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'JOURNAL' ? 'bg-red-700 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Journal (JV)
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-200 shadow-xs p-6 space-y-6">
        {editingVoucher && (
          <div className="flex items-center justify-between bg-amber-50 border border-amber-200 p-3 rounded-lg text-amber-900 text-sm">
            <span>Editing Voucher: <strong>{editingVoucher.voucherNo}</strong></span>
            <button type="button" onClick={handleCancelEdit} className="text-xs text-amber-800 underline font-semibold cursor-pointer">
              Cancel Edit
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Voucher No</label>
            <input
              type="text"
              required
              value={voucherNo}
              onChange={e => setVoucherNo(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-hidden font-mono font-bold"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Voucher Date</label>
            <input
              type="date"
              required
              ref={dateInputRef}
              value={date}
              onChange={e => setDate(e.target.value)}
              onKeyDown={handleDateKeyDown}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-hidden"
            />
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
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
              {activeTab === 'JOURNAL' ? 'General Remarks (Optional)' : 'Narration / Remarks'}
            </label>
            <input
              type="text"
              required={activeTab !== 'JOURNAL'}
              placeholder="Description of transaction..."
              value={narration}
              onChange={e => setNarration(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-hidden font-medium"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700">
            {activeTab === 'CASH_PAYMENT' && 'Cash Payment Details (Debit Expense/Vendor & Fixed Credit Cash in Hand)'}
            {activeTab === 'CASH_RECEIPT' && 'Cash Receipt Details (Fixed Debit Cash in Hand & Credit Customer/Party)'}
            {activeTab === 'JOURNAL' && 'Journal Entry Details (Debit Account & Credit Account)'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* DEBIT ACCOUNT */}
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                {activeTab === 'CASH_RECEIPT' ? 'Debit Account (Fixed)' : 'Debit Account'}
              </label>
              {activeTab === 'CASH_RECEIPT' ? (
                <input
                  type="text"
                  disabled
                  value={creditAccountId ? `${cashInHandLabel} from. ${accounts.find(a => a.id === creditAccountId)?.name || ''}` : cashInHandLabel}
                  className="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm font-mono font-bold text-emerald-900 cursor-not-allowed"
                />
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="Search debit account..."
                    value={debitSearch}
                    onChange={e => setDebitSearch(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs mb-2 focus:border-emerald-600 focus:outline-hidden"
                  />
                  <select
                    required
                    ref={debitSelectRef}
                    value={debitAccountId}
                    onChange={e => handleDebitChange(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-hidden bg-white"
                  >
                    <option value="">Select Debit Account...</option>
                    {accounts
                      .filter(acc =>
                        acc.name.toLowerCase().includes(debitSearch.toLowerCase()) ||
                        acc.code.toLowerCase().includes(debitSearch.toLowerCase()) ||
                        acc.accountType.toLowerCase().includes(debitSearch.toLowerCase())
                      )
                      .map(acc => (
                        <option key={acc.id} value={acc.id}>
                          {acc.code} - {acc.name} ({acc.accountType})
                        </option>
                      ))}
                  </select>
                  {activeTab === 'JOURNAL' && (
                    <div className="mt-2">
                      <label className="block text-[10px] font-semibold uppercase text-gray-500 mb-0.5">Debit Narration</label>
                      <input
                        type="text"
                        required
                        value={debitNarration}
                        onChange={e => setDebitNarration(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs focus:border-emerald-600 focus:outline-hidden"
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            {/* CREDIT ACCOUNT */}
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                {activeTab === 'CASH_PAYMENT' ? 'Credit Account (Fixed)' : 'Credit Account'}
              </label>
              {activeTab === 'CASH_PAYMENT' ? (
                <input
                  type="text"
                  disabled
                  value={cashInHandLabel}
                  className="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm font-mono font-bold text-emerald-900 cursor-not-allowed"
                />
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="Search credit account..."
                    value={creditSearch}
                    onChange={e => setCreditSearch(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs mb-2 focus:border-emerald-600 focus:outline-hidden"
                  />
                  <select
                    required
                    ref={creditSelectRef}
                    value={creditAccountId}
                    onChange={e => handleCreditChange(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-hidden bg-white"
                  >
                    <option value="">Select Credit Account...</option>
                    {accounts
                      .filter(acc =>
                        acc.name.toLowerCase().includes(creditSearch.toLowerCase()) ||
                        acc.code.toLowerCase().includes(creditSearch.toLowerCase()) ||
                        acc.accountType.toLowerCase().includes(creditSearch.toLowerCase())
                      )
                      .map(acc => (
                        <option key={acc.id} value={acc.id}>
                          {acc.code} - {acc.name} ({acc.accountType})
                        </option>
                      ))}
                  </select>
                  {activeTab === 'JOURNAL' && (
                    <div className="mt-2">
                      <label className="block text-[10px] font-semibold uppercase text-gray-500 mb-0.5">Credit Narration</label>
                      <input
                        type="text"
                        required
                        value={creditNarration}
                        onChange={e => setCreditNarration(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs focus:border-emerald-600 focus:outline-hidden"
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            {/* AMOUNT */}
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Amount (PKR)</label>
              <input
                type="number"
                step="0.01"
                required
                min="0.01"
                ref={amountInputRef}
                placeholder="0.00"
                value={amount || ''}
                onChange={e => setAmount(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-hidden font-bold text-emerald-800"
              />
            </div>
          </div>

          <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div className="flex space-x-6 text-sm">
              <p>Debit: <span className="font-bold text-gray-800">PKR {amount.toLocaleString()}</span></p>
              <p>Credit: <span className="font-bold text-gray-800">PKR {amount.toLocaleString()}</span></p>
              <p className="font-semibold text-red-700">(Balanced Double-Entry)</p>
            </div>
            <button
              type="submit"
              className={`flex items-center space-x-2 ${
                editingVoucher ? 'bg-amber-600 hover:bg-amber-700' : 'bg-red-700 hover:bg-red-800'
              } text-white px-6 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-colors cursor-pointer`}
            >
              <Save className="w-4 h-4" />
              <span>{editingVoucher ? 'Update Voucher' : 'Post Voucher'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Recent vouchers */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6 space-y-4">
        <h3 className="text-lg font-bold text-gray-800">Recent {activeTab.replace('_', ' ')} Vouchers</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-xs font-semibold uppercase text-gray-500 bg-gray-50">
                <th className="py-3 px-4">Voucher No</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Narration</th>
                <th className="py-3 px-4 text-right">Amount (PKR)</th>
                <th className="py-3 px-4">Created By</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {vouchers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">
                    No vouchers recorded for this type.
                  </td>
                </tr>
              ) : (
                vouchers.map(v => (
                  <tr key={v.id} className="hover:bg-gray-50/50">
                    <td className="py-3 px-4 font-mono font-bold text-emerald-800">{v.voucherNo}</td>
                    <td className="py-3 px-4 text-gray-600 font-mono text-xs">{v.date}</td>
                    <td className="py-3 px-4 font-medium text-gray-800">{v.narration}</td>
                    <td className="py-3 px-4 text-right font-bold text-gray-900">{v.totalAmount.toLocaleString()}</td>
                    <td className="py-3 px-4 text-xs text-gray-500">{v.createdBy}</td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => window.print()}
                        className="p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-pointer"
                        title="Print"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(v)}
                        className="p-1.5 text-gray-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg cursor-pointer"
                        title="Edit / Amend"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {currentUser.role === 'ADMIN' && (
                        <button
                          onClick={() => handleDelete(v.id)}
                          className="p-1.5 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
                          title="Delete"
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
      </div>
    </div>
  );
};
