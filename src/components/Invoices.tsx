import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Invoice, InvoiceType, Product, Account, SalesStaff, Territory, UserProfile, InvoiceItem } from '../types';
import { Plus, Trash2, Save, Printer, X, Edit } from 'lucide-react';

export const InvoicesComponent: React.FC<{
  currentUser: UserProfile;
  defaultType?: InvoiceType;
  initialInvoiceNo?: string;
}> = ({
  currentUser,
  defaultType = 'SALES_CREDIT',
  initialInvoiceNo
}) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [staffList, setStaffList] = useState<SalesStaff[]>([]);
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [activeTab, setActiveTab] = useState<InvoiceType>(defaultType);
  const [selectedPrintInvoice, setSelectedPrintInvoice] = useState<Invoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  // Form state
  const [invoiceNo, setInvoiceNo] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [accountName, setAccountName] = useState('');
  const [accountSearch, setAccountSearch] = useState('');
  const [productSearches, setProductSearches] = useState<{ [index: number]: string }>({});
  const [salesStaff, setSalesStaff] = useState('');
  const [territory, setTerritory] = useState('');
  const [reason, setReason] = useState('');
  const [remarks, setRemarks] = useState('');

  const createEmptyItem = (): InvoiceItem => ({
    productId: '',
    productName: '',
    quantity: 1,
    unit: 'Bag',
    rate: 0,
    discountType: 'PERCENT',
    discount: 0,
    discountAmount: 0,
    amount: 0,
    packSize: '50kg',
    scheme: 'CASH SALE',
    lotNo: '',
    gstPercent: 0,
    gstAmount: 0
  });

  const [items, setItems] = useState<InvoiceItem[]>([createEmptyItem()]);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  useEffect(() => {
    if (initialInvoiceNo && invoices.length > 0) {
      const found = invoices.find(i => i.invoiceNo === initialInvoiceNo);
      if (found) {
        setSelectedPrintInvoice(found);
      }
    }
  }, [initialInvoiceNo, invoices]);

  const loadData = async () => {
    const invs = await db.getInvoices();
    const prods = await db.getProducts();
    const accs = await db.getAccounts();
    const staff = await db.getSalesStaff();
    const terrs = await db.getTerritories();
    setInvoices(invs.filter(i => i.invoiceType === activeTab));
    setProducts(prods);
    setAccounts(accs);
    setStaffList(staff);
    setTerritories(terrs);
    setEditingInvoice(null);
    setAccountName('');
    setAccountSearch('');
    setProductSearches({});
    setInvoiceNo(`${activeTab.substring(0, 3)}-${Math.floor(1000 + Math.random() * 9000)}`);
    setItems([createEmptyItem()]);
  };

  const handleEdit = (inv: Invoice) => {
    setEditingInvoice(inv);
    setInvoiceNo(inv.invoiceNo);
    setDate(inv.date);
    setAccountName(inv.accountName);
    setSalesStaff(inv.salesStaff || '');
    setTerritory(inv.territory || '');
    setReason(inv.reason || '');
    setItems(
      inv.items.map(it => {
        const qty = Number(it.quantity || 0);
        const rate = Number(it.rate || 0);
        const gross = qty * rate;
        const disc = Number(it.discount || 0);
        const dType = it.discountType || 'PERCENT';
        let discAmt = it.discountAmount;
        if (discAmt === undefined) {
          if (dType === 'UNIT') discAmt = qty * disc;
          else if (dType === 'FIXED') discAmt = disc;
          else discAmt = (gross * disc) / 100;
        }
        return {
          ...it,
          discountType: dType,
          discountAmount: Math.round(Number(discAmt || 0) * 100) / 100
        };
      })
    );
    setRemarks(inv.remarks || '');
  };

  const handleCancelEdit = () => {
    setEditingInvoice(null);
    setInvoiceNo(`${activeTab.substring(0, 3)}-${Math.floor(1000 + Math.random() * 9000)}`);
    setDate(new Date().toISOString().split('T')[0]);
    setAccountName('');
    setSalesStaff('');
    setTerritory('');
    setReason('');
    setItems([createEmptyItem()]);
    setRemarks('');
  };

  const handleAddItem = () => {
    setItems([...items, createEmptyItem()]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const updated = [...items];
    if (field === 'productId') {
      const prod = products.find(p => p.id === value);
      updated[index].productId = value;
      updated[index].productName = prod ? prod.productName : '';
      updated[index].unit = prod ? prod.unit : 'Bag';
      updated[index].packSize = prod ? prod.packSize : '50kg';
      updated[index].lotNo = prod ? prod.lotNo || '' : '';
      updated[index].scheme = 'CASH SALE';
      updated[index].rate = activeTab.includes('SALES') ? prod?.saleRate || 0 : prod?.purchaseRate || 0;
    } else {
      (updated[index] as any)[field] = value;
    }

    const qty = Number(updated[index].quantity || 0);
    const rate = Number(updated[index].rate || 0);
    const rawDisc = Number(updated[index].discount || 0);
    const dType = updated[index].discountType || 'PERCENT';
    const unit = updated[index].unit || 'Bag';

    let gross = qty * rate;
    if (unit === 'Maund' || unit === 'maund' || unit === 'Kg' || unit === 'kg') {
      gross = (qty / 40) * rate;
    }

    let calcDisc = 0;
    if (dType === 'PERCENT' || (dType as string) === 'PERCENT_AMOUNT') {
      calcDisc = (gross * rawDisc) / 100;
    } else if (dType === 'UNIT') {
      calcDisc = qty * rawDisc;
    } else if (dType === 'FIXED') {
      calcDisc = rawDisc;
    } else {
      calcDisc = (gross * rawDisc) / 100;
    }

    const roundedDisc = Math.max(0, Math.min(gross, Math.round(calcDisc * 100) / 100));
    updated[index].discountAmount = roundedDisc;
    const gstPct = Number(updated[index].gstPercent || 0);
    const baseAmount = gross - roundedDisc;
    const gstAmt = (baseAmount * gstPct) / 100;
    updated[index].gstAmount = Math.round(gstAmt * 100) / 100;
    updated[index].amount = Math.round((baseAmount + gstAmt) * 100) / 100;
    setItems(updated);
  };

  const grossTotal = items.reduce((sum, item) => {
    const q = Number(item.quantity || 0);
    const r = Number(item.rate || 0);
    const u = item.unit || 'Bag';
    if (u === 'Maund' || u === 'maund' || u === 'Kg' || u === 'kg') {
      return sum + (q / 40) * r;
    }
    return sum + q * r;
  }, 0);
  const discountTotal = items.reduce((sum, item) => {
    if (item.discountAmount !== undefined) return sum + Number(item.discountAmount || 0);
    const q = Number(item.quantity || 0);
    const r = Number(item.rate || 0);
    const u = item.unit || 'Bag';
    const grossVal = (u === 'Maund' || u === 'maund' || u === 'Kg' || u === 'kg') ? (q / 40) * r : q * r;
    const d = Number(item.discount || 0);
    const dt = item.discountType || 'PERCENT';
    const val = dt === 'UNIT' ? q * d : dt === 'FIXED' ? d : (grossVal * d) / 100;
    return sum + Math.max(0, Math.min(grossVal, val));
  }, 0);
  const netTotal = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountName) {
      alert('Please select customer or supplier account.');
      return;
    }

    const newInvoice: Invoice = {
      id: editingInvoice ? editingInvoice.id : `inv_${Date.now()}`,
      invoiceNo,
      invoiceType: activeTab,
      date,
      accountName,
      salesStaff,
      territory,
      reason,
      items,
      grossTotal,
      discountTotal,
      netTotal,
      remarks,
      createdBy: currentUser.fullName,
      createdAt: editingInvoice ? editingInvoice.createdAt : new Date().toISOString()
    };

    await db.saveInvoice(newInvoice);
    alert(editingInvoice ? 'Invoice updated successfully!' : 'Invoice saved & posted to MySQL successfully!');
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (currentUser.role !== 'ADMIN') {
      alert('Normal users cannot delete saved invoices.');
      return;
    }
    if (confirm('Are you sure you want to delete this invoice?')) {
      await db.deleteInvoice(id);
      loadData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {activeTab === 'SALES_CASH' && 'Cash Sales Invoice'}
            {activeTab === 'SALES_CREDIT' && 'Credit Sales Invoice'}
            {activeTab === 'PURCHASE_CASH' && 'Cash Purchase Invoice'}
            {activeTab === 'PURCHASE_CREDIT' && 'Credit Purchase Invoice'}
            {activeTab === 'SALES_RETURN' && 'Sales Return Invoice'}
            {activeTab === 'PURCHASE_RETURN' && 'Purchase Return Invoice'}
          </h2>
          <p className="text-sm text-gray-500">Manage seed sales, purchase transactions, discounts, and FSC&RD lot verification</p>
        </div>
        <div className="flex space-x-1 bg-white p-1 rounded-xl border border-gray-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('SALES_CREDIT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer ${
              activeTab === 'SALES_CREDIT' ? 'bg-emerald-700 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Credit Sales
          </button>
          <button
            onClick={() => setActiveTab('SALES_CASH')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer ${
              activeTab === 'SALES_CASH' ? 'bg-emerald-700 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Cash Sales
          </button>
          <button
            onClick={() => setActiveTab('PURCHASE_CREDIT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer ${
              activeTab === 'PURCHASE_CREDIT' ? 'bg-emerald-700 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Purchase
          </button>
          <button
            onClick={() => setActiveTab('SALES_RETURN')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer ${
              activeTab === 'SALES_RETURN' ? 'bg-emerald-700 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Sales Return
          </button>
          <button
            onClick={() => setActiveTab('PURCHASE_RETURN')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer ${
              activeTab === 'PURCHASE_RETURN' ? 'bg-emerald-700 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Purchase Return
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-200 shadow-xs p-6 space-y-6">
        {editingInvoice && (
          <div className="flex items-center justify-between bg-amber-50 border border-amber-200 p-3 rounded-lg text-amber-900 text-sm font-semibold">
            <span>Editing Invoice: {editingInvoice.invoiceNo}</span>
            <button type="button" onClick={handleCancelEdit} className="text-xs text-amber-800 underline font-semibold cursor-pointer">
              Cancel Amendment
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Invoice No</label>
            <input
              type="text"
              required
              value={invoiceNo}
              onChange={e => setInvoiceNo(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-hidden font-mono font-bold"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Invoice Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
              {activeTab.includes('SALES') ? 'Customer / Grower Account' : 'Supplier Account'}
            </label>
            <input
              type="text"
              placeholder="Search account..."
              value={accountSearch}
              onChange={e => setAccountSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs mb-2 focus:border-emerald-600 focus:outline-hidden"
            />
            <select
              required
              value={accountName}
              onChange={e => setAccountName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-hidden bg-white"
            >
              <option value="">Select Account...</option>
              {accounts
                .filter(
                  acc =>
                    acc.name.toLowerCase().includes(accountSearch.toLowerCase()) ||
                    acc.code.toLowerCase().includes(accountSearch.toLowerCase())
                )
                .map(acc => (
                  <option key={acc.id} value={acc.name}>
                    {acc.code} - {acc.name}
                  </option>
                ))}
            </select>
          </div>
          {activeTab.includes('SALES') ? (
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Sales Staff</label>
              <select
                value={salesStaff}
                onChange={e => setSalesStaff(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-hidden bg-white"
              >
                <option value="">Select Staff...</option>
                {staffList.map(s => (
                  <option key={s.id} value={s.staffName}>
                    {s.staffCode} - {s.staffName}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Territory</label>
              <select
                value={territory}
                onChange={e => setTerritory(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-hidden bg-white"
              >
                <option value="">Select Territory...</option>
                {territories.map(t => (
                  <option key={t.id} value={t.territoryName}>
                    {t.territoryCode} - {t.territoryName}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700">Seed Product Line Items</h3>
            <button
              type="button"
              onClick={handleAddItem}
              className="flex items-center space-x-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Product Line</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-xs font-semibold uppercase text-gray-500 bg-gray-50">
                  <th className="py-3 px-3">Product / Seed Variety</th>
                  <th className="py-3 px-3 w-28">Unit</th>
                  <th className="py-3 px-3 w-28">Pack Size</th>
                  <th className="py-3 px-3 w-28">Scheme</th>
                  <th className="py-3 px-3 w-32">Lot No</th>
                  <th className="py-3 px-3 w-24">Qty (Kg/Bags)</th>
                  <th className="py-3 px-3 w-28 text-right">Rate</th>
                  <th className="py-3 px-3 min-w-[190px] text-right">Discount Mode & Value</th>
                  <th className="py-3 px-3 w-32 text-right">Amount (PKR)</th>
                  <th className="py-3 px-3 w-12 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50">
                    <td className="py-3 px-3">
                      <input
                        type="text"
                        placeholder="Search seed product..."
                        value={productSearches[idx] || ''}
                        onChange={e => setProductSearches({ ...productSearches, [idx]: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-2 py-1 text-xs mb-1 focus:border-emerald-600 focus:outline-hidden"
                      />
                      <select
                        required
                        value={item.productId}
                        onChange={e => handleItemChange(idx, 'productId', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-hidden bg-white font-medium"
                      >
                        <option value="">Select Seed Product...</option>
                        {products
                          .filter(p => {
                            const q = (productSearches[idx] || '').toLowerCase();
                            return (
                              p.productName.toLowerCase().includes(q) ||
                              p.productCode.toLowerCase().includes(q) ||
                              p.variety.toLowerCase().includes(q)
                            );
                          })
                          .map(p => (
                            <option key={p.id} value={p.id}>
                              {p.productCode} - {p.productName} ({p.packSize})
                            </option>
                          ))}
                      </select>
                    </td>
                    <td className="py-3 px-3">
                      <select
                        value={item.unit || 'Bag'}
                        onChange={e => handleItemChange(idx, 'unit', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm bg-white font-semibold"
                      >
                        <option value="Bag">Bag (Pcs)</option>
                        <option value="Maund">Maund (Kg)</option>
                        <option value="Kg">Kg</option>
                      </select>
                    </td>
                    <td className="py-3 px-3">
                      <input
                        type="text"
                        value={item.packSize || ''}
                        onChange={e => handleItemChange(idx, 'packSize', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <input
                        type="text"
                        value={item.scheme || ''}
                        onChange={e => handleItemChange(idx, 'scheme', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <input
                        type="text"
                        value={item.lotNo || ''}
                        onChange={e => handleItemChange(idx, 'lotNo', e.target.value)}
                        placeholder="LOT-2026"
                        className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm font-mono text-emerald-800 font-bold"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <input
                        type="number"
                        min="1"
                        required
                        value={item.quantity}
                        onChange={e => handleItemChange(idx, 'quantity', Number(e.target.value))}
                        className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm font-semibold"
                      />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={item.rate}
                        onChange={e => handleItemChange(idx, 'rate', Number(e.target.value))}
                        className="w-full text-right rounded-lg border border-gray-300 px-2 py-2 text-sm font-semibold"
                      />
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="space-y-1.5">
                        <div className="flex rounded-md border border-gray-300 overflow-hidden text-[10px] font-bold">
                          <button
                            type="button"
                            onClick={() => handleItemChange(idx, 'discountType', 'PERCENT')}
                            className={`flex-1 py-1 px-1.5 transition-colors cursor-pointer ${
                              item.discountType === 'PERCENT' || !item.discountType || (item.discountType as string) === 'PERCENT_AMOUNT'
                                ? 'bg-emerald-700 text-white font-black'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                            title="Percentage on total: % of (Qty × Rate)"
                          >
                            % Amt
                          </button>
                          <button
                            type="button"
                            onClick={() => handleItemChange(idx, 'discountType', 'UNIT')}
                            className={`flex-1 py-1 px-1.5 transition-colors border-l border-gray-300 cursor-pointer ${
                              item.discountType === 'UNIT'
                                ? 'bg-emerald-700 text-white font-black'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                            title="Discount per Unit / Bag: Qty × Rs/unit"
                          >
                            /Unit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleItemChange(idx, 'discountType', 'FIXED')}
                            className={`flex-1 py-1 px-1 transition-colors border-l border-gray-300 cursor-pointer ${
                              item.discountType === 'FIXED'
                                ? 'bg-emerald-700 text-white font-black'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                            title="Flat fixed Rs off this line"
                          >
                            Flat Rs
                          </button>
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.discount}
                            onChange={e => handleItemChange(idx, 'discount', Number(e.target.value))}
                            placeholder={item.discountType === 'UNIT' ? 'Rs / unit' : item.discountType === 'FIXED' ? 'Flat Rs' : '% discount'}
                            className="w-full text-right rounded-lg border border-gray-300 px-2 py-1.5 text-sm font-semibold focus:border-emerald-600 focus:outline-hidden"
                          />
                          <span className="absolute left-2 top-1.5 text-[11px] text-gray-400 font-bold pointer-events-none uppercase">
                            {item.discountType === 'UNIT' ? 'Rs/unit' : item.discountType === 'FIXED' ? 'Flat' : '%'}
                          </span>
                        </div>
                        {item.discount > 0 && (
                          <div className="text-[11px] text-right font-semibold text-emerald-800">
                            -PKR {(item.discountAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            <span className="text-gray-500 font-normal ml-1">
                              {item.discountType === 'UNIT'
                                ? `(@${item.discount}/unit)`
                                : item.discountType === 'FIXED'
                                ? '(flat)'
                                : `(${item.discount}%)`}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="font-bold text-gray-900 font-mono text-sm">{item.amount.toLocaleString()}</div>
                      {item.discount > 0 && (
                        <div className="text-[10px] text-gray-400 font-mono">
                          Gross: {(item.quantity * item.rate).toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-200 flex-wrap gap-4">
            <div className="flex space-x-6 text-sm">
              <p>
                Gross Total: <span className="font-bold text-gray-800">PKR {grossTotal.toLocaleString()}</span>
              </p>
              <p>
                Discount: <span className="font-bold text-gray-800">PKR {discountTotal.toLocaleString()}</span>
              </p>
              <p className="text-base">
                Net Total: <span className="font-black text-red-900">PKR {netTotal.toLocaleString()}</span>
              </p>
            </div>
            <button
              type="submit"
              className={`flex items-center space-x-2 ${
                editingInvoice ? 'bg-amber-600 hover:bg-amber-700' : 'bg-red-700 hover:bg-red-800'
              } text-white px-6 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-colors cursor-pointer`}
            >
              <Save className="w-4 h-4" />
              <span>{editingInvoice ? 'Update Invoice' : 'Save & Post Invoice'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Recent Invoices list */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6 space-y-4">
        <h3 className="text-lg font-bold text-gray-800">Recent Invoices</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-xs font-semibold uppercase text-gray-500 bg-gray-50">
                <th className="py-3 px-4">Invoice No</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Account / Customer</th>
                <th className="py-3 px-4">Sales Staff</th>
                <th className="py-3 px-4 text-right">Net Amount (PKR)</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">
                    No invoices recorded for this module.
                  </td>
                </tr>
              ) : (
                invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-gray-50/50">
                    <td className="py-3 px-4 font-mono font-bold text-emerald-800">{inv.invoiceNo}</td>
                    <td className="py-3 px-4 text-gray-600 font-mono text-xs">{inv.date}</td>
                    <td className="py-3 px-4 font-semibold text-gray-800">{inv.accountName}</td>
                    <td className="py-3 px-4 text-gray-600">{inv.salesStaff || 'N/A'}</td>
                    <td className="py-3 px-4 text-right font-black text-emerald-700">{inv.netTotal.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedPrintInvoice(inv)}
                        className="p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-pointer"
                        title="Print Invoice"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(inv)}
                        className="p-1.5 text-gray-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg cursor-pointer"
                        title="Edit / Amend"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {currentUser.role === 'ADMIN' && (
                        <button
                          onClick={() => handleDelete(inv.id)}
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

      {/* PRINT PREVIEW MODAL */}
      {selectedPrintInvoice && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between px-6 py-4 bg-gray-900 text-white print:hidden">
              <h3 className="font-bold text-lg flex items-center space-x-2">
                <Printer className="w-5 h-5 text-emerald-400" />
                <span>Augusta Seed Company - Invoice Print Preview</span>
              </h3>
              <div className="flex space-x-3">
                <button
                  onClick={() => window.print()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center space-x-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Invoice</span>
                </button>
                <button
                  onClick={() => setSelectedPrintInvoice(null)}
                  className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-8 overflow-y-auto bg-white text-black font-sans space-y-6 print:p-0">
              {/* Header */}
              <div className="flex items-start justify-between border-b-2 border-emerald-800 pb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-xl bg-white border border-emerald-300 flex items-center justify-center p-1 shadow-xs overflow-hidden shrink-0">
                    <img
                      src="/augusta_seed_logo.jpg"
                      alt="Augusta Seed Company"
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <h1 className="text-2xl font-black text-emerald-900 tracking-wider uppercase">
                      AUGUSTA SEED COMPANY
                    </h1>
                    <p className="text-xs font-bold text-gray-700 mt-0.5">
                      UNITED FARM ROAD, GULSHAN-E-ALI BY PASS, SAHIWAL • PH: 03023576036
                    </p>
                  </div>
                </div>
                <div className="text-center border-2 border-emerald-800 px-6 py-1.5 rounded bg-emerald-50">
                  <span className="text-sm font-black text-emerald-900 uppercase tracking-widest">
                    {selectedPrintInvoice.invoiceType === 'SALES_CASH' && 'CASH SALES INVOICE'}
                    {selectedPrintInvoice.invoiceType === 'SALES_CREDIT' && 'SALES INVOICE'}
                    {selectedPrintInvoice.invoiceType === 'PURCHASE_CASH' && 'CASH PURCHASE INVOICE'}
                    {selectedPrintInvoice.invoiceType === 'PURCHASE_CREDIT' && 'PURCHASE INVOICE'}
                    {selectedPrintInvoice.invoiceType === 'SALES_RETURN' && 'SALES RETURN INVOICE'}
                    {selectedPrintInvoice.invoiceType === 'PURCHASE_RETURN' && 'PURCHASE RETURN INVOICE'}
                  </span>
                </div>
              </div>

              {/* Meta Grid */}
              {(() => {
                const matchedAccount = accounts.find(
                  acc => acc.name === selectedPrintInvoice.accountName || acc.id === selectedPrintInvoice.accountName
                );
                const accountPhone = matchedAccount?.phone || '03023576036';
                const accountDescription = matchedAccount?.description || '';

                return (
                  <div className="grid grid-cols-2 gap-8 text-sm">
                    <div className="space-y-1">
                      <p className="font-bold text-gray-900">
                        {selectedPrintInvoice.invoiceType.includes('SALES') ? 'CUSTOMER / GROWER' : 'SUPPLIER'} :{' '}
                        <span className="font-semibold uppercase">{selectedPrintInvoice.accountName}</span>
                      </p>
                      <p className="text-gray-700 font-medium">
                        Contact #: <span className="font-mono">{accountPhone}</span>
                      </p>
                      {accountDescription && (
                        <p className="text-gray-600 text-xs italic mt-0.5">Remarks: {accountDescription}</p>
                      )}
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="font-bold">
                        INVOICE NO. : <span className="font-mono">{selectedPrintInvoice.invoiceNo}</span>
                      </p>
                      <p className="font-bold">
                        Date : <span className="font-mono">{selectedPrintInvoice.date}</span>
                      </p>
                      <p className="font-bold">
                        TERRITORY :{' '}
                        <span className="font-normal uppercase">{selectedPrintInvoice.territory || 'SAHIWAL'}</span>
                      </p>
                      <p className="font-bold">
                        SALE OFFICER :{' '}
                        <span className="font-normal uppercase">{selectedPrintInvoice.salesStaff || 'HEAD OFFICE'}</span>
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Items Table */}
              <table className="w-full border-collapse border border-gray-400 text-xs">
                <thead>
                  <tr className="bg-emerald-900 text-white font-bold uppercase text-center">
                    <th className="border border-emerald-900 py-2 px-2 text-left">Products / Variety</th>
                    <th className="border border-emerald-900 py-2 px-2">Pack size</th>
                    <th className="border border-emerald-900 py-2 px-2">Scheme</th>
                    <th className="border border-emerald-900 py-2 px-2">Lot No</th>
                    <th className="border border-emerald-900 py-2 px-2">Quantity (Bags)</th>
                    <th className="border border-emerald-900 py-2 px-2 text-right">Price</th>
                    <th className="border border-emerald-900 py-2 px-2 text-right">Dis.</th>
                    <th className="border border-emerald-900 py-2 px-2 text-center">GST%</th>
                    <th className="border border-emerald-900 py-2 px-2 text-right">Total (PKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-300">
                  {selectedPrintInvoice.items.map((item, idx) => (
                    <tr key={idx} className="text-gray-900 font-medium">
                      <td className="border border-gray-300 py-2 px-2 uppercase font-bold">{item.productName}</td>
                      <td className="border border-gray-300 py-2 px-2 text-center">{item.packSize || '50kg'}</td>
                      <td className="border border-gray-300 py-2 px-2 text-center">{item.scheme || 'CASH SALE'}</td>
                      <td className="border border-gray-300 py-2 px-2 text-center font-mono font-bold text-emerald-900">{item.lotNo || ''}</td>
                      <td className="border border-gray-300 py-2 px-2 text-center font-bold">{item.quantity}</td>
                      <td className="border border-gray-300 py-2 px-2 text-right font-mono">{item.rate.toFixed(2)}</td>
                      <td className="border border-gray-300 py-2 px-2 text-right font-mono">
                        {item.discount > 0 ? (
                          <div>
                            <div>
                              {(item.discountAmount !== undefined
                                ? item.discountAmount
                                : item.discountType === 'UNIT'
                                ? item.quantity * item.discount
                                : item.discountType === 'FIXED'
                                ? item.discount
                                : (item.quantity * item.rate * item.discount) / 100
                              ).toFixed(2)}
                            </div>
                            <div className="text-[10px] text-gray-500 font-sans">
                              {item.discountType === 'UNIT'
                                ? `@${item.discount}/unit`
                                : item.discountType === 'FIXED'
                                ? 'flat'
                                : `${item.discount}%`}
                            </div>
                          </div>
                        ) : (
                          '0.00'
                        )}
                      </td>
                      <td className="border border-gray-300 py-2 px-2 text-center font-mono">{item.gstPercent || 0}</td>
                      <td className="border border-gray-300 py-2 px-2 text-right font-bold font-mono">
                        {item.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Summary Section */}
              <div className="grid grid-cols-3 gap-4 pt-2 text-xs">
                <div className="border border-gray-400 p-3 space-y-1 bg-gray-50 rounded-lg">
                  <div className="flex justify-between font-semibold">
                    <span>Payment Mode :</span>
                    <span className="font-mono">{selectedPrintInvoice.invoiceType.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Invoice Total:</span>
                    <span className="font-mono">{selectedPrintInvoice.netTotal.toLocaleString()}</span>
                  </div>
                  <hr className="border-gray-300 my-1" />
                  <div className="flex justify-between font-bold text-gray-900 text-sm">
                    <span>Net Due :</span>
                    <span className="font-mono">{selectedPrintInvoice.netTotal.toLocaleString()} PKR</span>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center border border-gray-400 p-3 bg-gray-50 rounded-lg">
                  <span className="font-bold text-gray-700 uppercase">TOTAL UNITS / BAGS</span>
                  <span className="text-2xl font-black text-emerald-900 mt-1">
                    {selectedPrintInvoice.items.reduce((sum, i) => sum + Number(i.quantity || 0), 0)}
                  </span>
                </div>

                <div className="border border-gray-400 p-3 space-y-1 bg-gray-50 rounded-lg">
                  <div className="flex justify-between font-semibold">
                    <span>Gross Amount:</span>
                    <span className="font-mono">PKR {selectedPrintInvoice.grossTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Discount:</span>
                    <span className="font-mono">PKR - {selectedPrintInvoice.discountTotal.toLocaleString()}</span>
                  </div>
                  <hr className="border-gray-300 my-1" />
                  <div className="flex justify-between font-bold text-gray-900 text-sm border-t border-black pt-1">
                    <span>Net Total :</span>
                    <span className="font-mono font-black text-emerald-900">
                      PKR {selectedPrintInvoice.netTotal.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stock Verification Box */}
              <div className="border border-gray-300 bg-gray-50/80 p-3.5 rounded-lg space-y-2 text-[11px] text-gray-800">
                <p className="font-bold text-emerald-950 flex items-center space-x-1.5 uppercase tracking-wide">
                  <span>📦 اسٹاک کی وصولی اور چینگنگ (Stock Verification)</span>
                </p>
                <ul className="list-disc pl-4 space-y-1 text-gray-700 leading-relaxed font-medium" style={{ direction: 'rtl', textAlign: 'right' }}>
                  <li>فوری چیکنگ: خریدار سامان وصول کرتے ہی اس کی تعداد اور حالت کو اچھی طرح چیک کرنے کا پابند ہے۔</li>
                  <li>شکایت کا وقت: اسٹاک میں کسی بھی قسم کی کمی، خرابی یا نقصان کی صورت میں 24 سے 48 گھنٹوں کے اندر کمپنی کو مطلع کرنا لازمی ہے۔ اس وقت کے بعد کوئی بھی شکایت قابل قبول نہیں ہوگی۔</li>
                  <li>دستخط کی اہمیت: سامان کی رسید (Delivery Challan/Invoice) پر خریدار یا اس کے نمائندے کے دستخط اس بات کا ثبوت ہیں کہ مال مکمل اور تسلی بخش حالت میں موصول ہو چکا ہے۔</li>
                </ul>
              </div>

              {/* Signatures */}
              <div className="pt-6 space-y-4 text-xs font-semibold">
                <div className="grid grid-cols-3 gap-6 border-t-2 border-emerald-950 pt-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-700">Prepared By:</span>
                    <span className="font-mono uppercase">{selectedPrintInvoice.createdBy}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-700">Store Keeper:</span>
                    <div className="border-b border-black flex-1"></div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-700">Received By:</span>
                    <div className="border-b border-black flex-1"></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-12 pt-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-700">Authorized Signatory:</span>
                    <div className="border-b border-black flex-1"></div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-700">Sign & Stamp:</span>
                    <div className="border-b border-black flex-1"></div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center pt-6 border-t border-gray-300 text-[11px] font-semibold text-gray-500">
                Augusta Seed Company • United Farm Road, Gulshan-e-Ali By Pass, Sahiwal • Phone: 03023576036
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
