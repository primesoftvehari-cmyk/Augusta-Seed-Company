import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Account, Product } from '../types';
import { Printer, Download, Search } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export const LedgersComponent: React.FC = () => {
  const [ledgerType, setLedgerType] = useState<'account' | 'product'>('account');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [companyProfile, setCompanyProfile] = useState<any>(null);

  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [accountSearch, setAccountSearch] = useState('');

  const [dateFrom, setDateFrom] = useState('2026-01-01');
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);

  const [accountLedgerData, setAccountLedgerData] = useState<any[]>([]);
  const [productLedgerData, setProductLedgerData] = useState<any[]>([]);

  useEffect(() => {
    loadMasters();
  }, []);

  const loadMasters = async () => {
    const accs = await db.getAccounts();
    const prods = await db.getProducts();
    const profile = await db.getCompanyProfile();
    setAccounts(accs);
    setProducts(prods);
    setCompanyProfile(profile);

    if (accs.length > 0) setSelectedAccountId(accs[0].id);
    if (prods.length > 0) setSelectedProductId(prods[0].id);
  };

  const handleGenerate = async () => {
    if (ledgerType === 'account') {
      const acc = accounts.find(a => a.id === selectedAccountId);
      if (!acc) return;

      const vouchers = await db.getVouchers();
      const invoices = await db.getInvoices();

      // 1. Calculate Opening Balance strictly before dateFrom
      let openingBalance = acc.openingBalanceType === 'Dr' ? Number(acc.openingBalance) : -Number(acc.openingBalance);

      vouchers.forEach(v => {
        if (v.date < dateFrom) {
          v.lines.forEach(l => {
            if (l.accountId === selectedAccountId || (l.accountName && l.accountName.toLowerCase() === acc.name.toLowerCase())) {
              openingBalance += Number(l.debit || 0) - Number(l.credit || 0);
            }
          });
        }
      });

      invoices.forEach(inv => {
        if (inv.date < dateFrom) {
          if (
            inv.accountName === acc.name ||
            inv.accountName === acc.id ||
            inv.accountName.toLowerCase() === acc.name.toLowerCase()
          ) {
            let debit = 0;
            let credit = 0;
            if (
              inv.invoiceType === 'SALES_CASH' ||
              inv.invoiceType === 'SALES_CREDIT' ||
              inv.invoiceType === 'SALES_MAUND' ||
              inv.invoiceType === 'PURCHASE_RETURN'
            ) {
              debit = Number(inv.netTotal || 0);
            } else if (
              inv.invoiceType === 'SALES_RETURN' ||
              inv.invoiceType === 'PURCHASE_CASH' ||
              inv.invoiceType === 'PURCHASE_CREDIT' ||
              inv.invoiceType === 'PURCHASE_MAUND'
            ) {
              credit = Number(inv.netTotal || 0);
            }
            openingBalance += debit - credit;
          }
        }
      });

      let runningBalance = openingBalance;
      const rawEntries: any[] = [];

      // Collect entries from vouchers referencing this account within period
      vouchers.forEach(v => {
        if (v.date >= dateFrom && v.date <= dateTo) {
          v.lines.forEach(l => {
            if (l.accountId === selectedAccountId || (l.accountName && l.accountName.toLowerCase() === acc.name.toLowerCase())) {
              rawEntries.push({
                date: v.date,
                voucherNo: v.voucherNo,
                description: v.narration || `${v.voucherType.replace('_', ' ')}`,
                debit: Number(l.debit || 0),
                credit: Number(l.credit || 0),
                timestamp: new Date(v.date).getTime()
              });
            }
          });
        }
      });

      // Collect entries from invoices referencing this account within period
      invoices.forEach(inv => {
        if (inv.date >= dateFrom && inv.date <= dateTo) {
          if (
            inv.accountName === acc.name ||
            inv.accountName === acc.id ||
            inv.accountName.toLowerCase() === acc.name.toLowerCase()
          ) {
            let debit = 0;
            let credit = 0;
            let desc = '';

            if (inv.invoiceType === 'SALES_CASH' || inv.invoiceType === 'SALES_CREDIT') {
              debit = Number(inv.netTotal || 0);
              desc = `Sales Invoice #${inv.invoiceNo}`;
            } else if (inv.invoiceType === 'SALES_MAUND') {
              debit = Number(inv.netTotal || 0);
              desc = `Sales (Maund) #${inv.invoiceNo}`;
            } else if (inv.invoiceType === 'SALES_RETURN') {
              credit = Number(inv.netTotal || 0);
              desc = `Sales Return #${inv.invoiceNo}`;
            } else if (inv.invoiceType === 'PURCHASE_CASH' || inv.invoiceType === 'PURCHASE_CREDIT') {
              credit = Number(inv.netTotal || 0);
              desc = `Purchase Invoice #${inv.invoiceNo}`;
            } else if (inv.invoiceType === 'PURCHASE_MAUND') {
              credit = Number(inv.netTotal || 0);
              desc = `Purchase (Maund) #${inv.invoiceNo}`;
            } else if (inv.invoiceType === 'PURCHASE_RETURN') {
              debit = Number(inv.netTotal || 0);
              desc = `Purchase Return #${inv.invoiceNo}`;
            }

            if (debit > 0 || credit > 0) {
              rawEntries.push({
                date: inv.date,
                voucherNo: inv.invoiceNo,
                description: desc,
                items: inv.items || [],
                debit,
                credit,
                timestamp: new Date(inv.date).getTime()
              });
            }
          }
        }
      });

      rawEntries.sort((a, b) => a.timestamp - b.timestamp);

      const entries: any[] = [
        {
          date: '-',
          voucherNo: 'OPENING',
          description: 'Opening Balance (Up to ' + dateFrom + ')',
          debit: 0,
          credit: 0,
          balance: runningBalance
        }
      ];

      rawEntries.forEach(e => {
        runningBalance += e.debit - e.credit;
        entries.push({
          date: e.date,
          voucherNo: e.voucherNo,
          description: e.description,
          items: e.items,
          debit: e.debit,
          credit: e.credit,
          balance: runningBalance
        });
      });

      setAccountLedgerData(entries);
    } else {
      const prod = products.find(p => p.id === selectedProductId);
      if (!prod) return;

      const invoices = await db.getInvoices();
      let runningQty = prod.currentStock || prod.openingStock || 0;

      const entries: any[] = [
        {
          date: 'Opening',
          referenceNo: 'OPENING',
          transaction: 'Opening Stock',
          inQty: prod.openingStock || 0,
          outQty: 0,
          rate: prod.openingStockRate || prod.purchaseRate || 0,
          balanceQty: runningQty
        }
      ];

      invoices.forEach(inv => {
        if (inv.date >= dateFrom && inv.date <= dateTo) {
          inv.items.forEach(item => {
            if (item.productId === selectedProductId) {
              const isIn = inv.invoiceType.includes('PURCHASE') || inv.invoiceType.includes('SALES_RETURN');
              const inQty = isIn ? item.quantity : 0;
              const outQty = !isIn ? item.quantity : 0;
              runningQty += inQty - outQty;

              entries.push({
                date: inv.date,
                referenceNo: inv.invoiceNo,
                transaction: inv.invoiceType.replace('_', ' '),
                inQty,
                outQty,
                rate: item.rate,
                balanceQty: runningQty
              });
            }
          });
        }
      });

      setProductLedgerData(entries);
    }
  };

  const exportPdf = () => {
    const doc = new jsPDF();
    const compName = companyProfile?.companyName || 'AUGUSTA SEED COMPANY';
    const compAddr = companyProfile?.headOfficeAddress || 'UNITED FARM ROAD, GULSHAN-E-ALI BY PASS, SAHIWAL';
    const compPhone = companyProfile?.phone || '03023576036';

    doc.setFontSize(16);
    doc.text(compName, 14, 15);
    doc.setFontSize(9);
    doc.text(`Address: ${compAddr} | Phone: ${compPhone}`, 14, 21);

    if (ledgerType === 'account') {
      const acc = accounts.find(a => a.id === selectedAccountId);
      doc.setFontSize(12);
      doc.text('ACCOUNT LEDGER REPORT', 14, 29);
      doc.setFontSize(10);
      doc.text(`Account Name: ${acc?.name || 'N/A'} (Code: ${acc?.code || 'N/A'})`, 14, 36);
      doc.text(`Period: ${dateFrom} to ${dateTo}`, 14, 43);

      autoTable(doc, {
        startY: 48,
        head: [['Date', 'Voucher / Ref', 'Description', 'Debit (PKR)', 'Credit (PKR)', 'Balance']],
        body: accountLedgerData.map(e => [
          e.date,
          e.voucherNo,
          e.description,
          e.debit ? e.debit.toLocaleString() : '-',
          e.credit ? e.credit.toLocaleString() : '-',
          e.balance.toLocaleString()
        ]),
        styles: { fontSize: 8 }
      });
    } else {
      const prod = products.find(p => p.id === selectedProductId);
      doc.setFontSize(12);
      doc.text('PRODUCT STOCK LEDGER REPORT', 14, 29);
      doc.setFontSize(10);
      doc.text(`Seed Variety: ${prod?.productName || 'N/A'} (Code: ${prod?.productCode || 'N/A'})`, 14, 36);
      doc.text(`Period: ${dateFrom} to ${dateTo}`, 14, 43);

      autoTable(doc, {
        startY: 48,
        head: [['Date', 'Reference', 'Transaction', 'In Qty', 'Out Qty', 'Rate', 'Balance Qty']],
        body: productLedgerData.map(e => [
          e.date,
          e.referenceNo,
          e.transaction,
          e.inQty || '-',
          e.outQty || '-',
          e.rate.toLocaleString(),
          e.balanceQty
        ]),
        styles: { fontSize: 8 }
      });
    }

    doc.save('augusta-seed-ledger-report.pdf');
  };

  const handlePrint = () => {
    window.print();
  };

  const exportExcel = () => {
    const dataToExport = ledgerType === 'account' ? accountLedgerData : productLedgerData;
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ledger');
    XLSX.writeFile(workbook, 'augusta-seed-ledger-report.xlsx');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Financial & Seed Stock Ledgers</h2>
          <p className="text-sm text-gray-500">View detailed account ledgers with running balance and certified seed inventory stock movements</p>
        </div>
        <div className="flex space-x-2 bg-white p-1 rounded-xl border border-gray-200">
          <button
            onClick={() => setLedgerType('account')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
              ledgerType === 'account' ? 'bg-emerald-700 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Party / Account Ledger
          </button>
          <button
            onClick={() => setLedgerType('product')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
              ledgerType === 'product' ? 'bg-emerald-700 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Seed Stock Ledger
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {ledgerType === 'account' ? (
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Select Account</label>
              <input
                type="text"
                placeholder="Search account by name or code..."
                value={accountSearch}
                onChange={e => setAccountSearch(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs mb-2 focus:border-emerald-600 focus:outline-hidden"
              />
              <select
                value={selectedAccountId}
                onChange={e => setSelectedAccountId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-hidden bg-white"
              >
                {accounts
                  .filter(
                    a =>
                      a.name.toLowerCase().includes(accountSearch.toLowerCase()) ||
                      a.code.toLowerCase().includes(accountSearch.toLowerCase())
                  )
                  .map(a => (
                    <option key={a.id} value={a.id}>
                      {a.code} - {a.name} ({a.accountType})
                    </option>
                  ))}
              </select>
            </div>
          ) : (
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Select Seed Variety</label>
              <select
                value={selectedProductId}
                onChange={e => setSelectedProductId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-hidden bg-white"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.productCode} - {p.productName} ({p.packSize})
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Date From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Date To</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-hidden"
            />
          </div>
        </div>

        <div className="flex justify-between items-center pt-2">
          <button
            onClick={handleGenerate}
            className="flex items-center space-x-2 bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>Generate Ledger</span>
          </button>

          <div className="flex space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-semibold cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
            <button
              onClick={exportPdf}
              className="flex items-center space-x-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-3 py-2 rounded-lg text-sm font-semibold border border-emerald-200 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>PDF</span>
            </button>
            <button
              onClick={exportExcel}
              className="flex items-center space-x-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 px-3 py-2 rounded-lg text-sm font-semibold border border-blue-200 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Ledger Output */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-gray-200 pb-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-white border border-emerald-300 rounded-xl overflow-hidden p-0.5 shadow-xs flex items-center justify-center shrink-0">
              <img
                src="/augusta_seed_logo.jpg"
                alt="Augusta Seed Company"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h2 className="text-xl font-black text-emerald-950 uppercase tracking-wide">
                AUGUSTA SEED COMPANY
              </h2>
              <p className="text-xs text-gray-600 font-medium">
                UNITED FARM ROAD, GULSHAN-E-ALI BY PASS, SAHIWAL | PH: 03023576036
              </p>
            </div>
          </div>
          <div className="text-right">
            <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wider">
              {ledgerType === 'account' ? 'Account Ledger Statement' : 'Seed Variety Stock Ledger'}
            </h3>
            <p className="text-xs text-gray-500 font-mono">Period: {dateFrom} to {dateTo}</p>
          </div>
        </div>

        {ledgerType === 'account' && (() => {
          const acc = accounts.find(a => a.id === selectedAccountId);
          return (
            <div className="bg-emerald-50/60 border border-emerald-200 rounded-lg p-3.5 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs shadow-xs">
              <div>
                <span className="text-gray-500 block font-semibold uppercase text-[10px]">Account Code</span>
                <span className="font-mono font-bold text-emerald-900 text-sm">{acc?.code || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-500 block font-semibold uppercase text-[10px]">Account Name</span>
                <span className="font-bold text-gray-900 text-sm">{acc?.name || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-500 block font-semibold uppercase text-[10px]">Address</span>
                <span className="font-medium text-gray-800">{acc?.address || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-500 block font-semibold uppercase text-[10px]">Phone / Mobile</span>
                <span className="font-mono font-medium text-gray-800">{acc?.phone || 'N/A'}</span>
              </div>
            </div>
          );
        })()}

        {ledgerType === 'account' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-gray-300">
              <thead>
                <tr className="border-b border-gray-300 text-xs font-bold uppercase text-gray-700 bg-gray-100">
                  <th className="py-2.5 px-3 border-r border-gray-300">Date</th>
                  <th className="py-2.5 px-3 border-r border-gray-300">Voucher / Ref</th>
                  <th className="py-2.5 px-3 border-r border-gray-300">Description</th>
                  <th className="py-2.5 px-3 border-r border-gray-300 text-right">Debit (PKR)</th>
                  <th className="py-2.5 px-3 border-r border-gray-300 text-right">Credit (PKR)</th>
                  <th className="py-2.5 px-3 text-right">Balance (PKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-300 text-sm">
                {accountLedgerData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-400">
                      Click "Generate Ledger" to view account transactions.
                    </td>
                  </tr>
                ) : (
                  accountLedgerData.map((e, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 align-top">
                      <td className="py-3 px-3 border-r border-gray-300 text-gray-600 font-mono text-xs">{e.date}</td>
                      <td className="py-3 px-3 border-r border-gray-300 font-mono font-bold text-emerald-800">
                        {e.voucherNo}
                      </td>
                      <td className="py-3 px-3 border-r border-gray-300 text-gray-800">
                        <div className="font-semibold">{e.description}</div>
                        {e.items && e.items.length > 0 && (
                          <div className="mt-2 text-xs bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                            <div className="font-bold text-gray-700 uppercase text-[10px] tracking-wider mb-1.5 flex items-center justify-between">
                              <span>Invoice Item Breakdown:</span>
                              <span className="text-emerald-700">{e.items.length} item(s)</span>
                            </div>
                            <table className="w-full text-left">
                              <thead>
                                <tr className="text-[10px] text-gray-500 border-b border-gray-200 uppercase">
                                  <th className="pb-1 font-semibold">Seed Product</th>
                                  <th className="pb-1 font-semibold text-right">Qty</th>
                                  <th className="pb-1 font-semibold text-right">Rate</th>
                                  <th className="pb-1 font-semibold text-right">Disc</th>
                                  <th className="pb-1 font-semibold text-right">Amount</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {e.items.map((item: any, iIdx: number) => (
                                  <tr key={iIdx}>
                                    <td className="py-1 text-gray-800 font-medium">
                                      {item.productName}{' '}
                                      {item.packSize ? (
                                        <span className="text-gray-500 text-[11px]">({item.packSize})</span>
                                      ) : (
                                        ''
                                      )}
                                    </td>
                                    <td className="py-1 text-right text-gray-600">
                                      {item.quantity} {item.unit}
                                    </td>
                                    <td className="py-1 text-right text-gray-600">
                                      {Number(item.rate || 0).toLocaleString()}
                                    </td>
                                    <td className="py-1 text-right text-gray-600">
                                      {Number(item.discount || 0).toLocaleString()}
                                    </td>
                                    <td className="py-1 text-right font-semibold text-gray-900">
                                      {Number(item.amount || 0).toLocaleString()}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 border-r border-gray-300 text-right font-semibold text-gray-800">
                        {e.debit ? e.debit.toLocaleString() : '-'}
                      </td>
                      <td className="py-3 px-3 border-r border-gray-300 text-right font-semibold text-gray-800">
                        {e.credit ? e.credit.toLocaleString() : '-'}
                      </td>
                      <td className="py-3 px-3 text-right font-black text-emerald-800">
                        {e.balance.toLocaleString()} {e.balance >= 0 ? 'Dr' : 'Cr'}
                      </td>
                    </tr>
                  ))
                )}
                {accountLedgerData.length > 0 && (
                  <tr className="bg-gray-100 font-bold border-t-2 border-gray-400">
                    <td colSpan={3} className="py-3 px-3 text-right uppercase text-xs text-gray-700">Total Period Transactions:</td>
                    <td className="py-3 px-3 border-r border-gray-300 text-right text-gray-900">
                      {accountLedgerData.filter(e => e.voucherNo !== 'OPENING').reduce((sum, e) => sum + Number(e.debit || 0), 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 border-r border-gray-300 text-right text-gray-900">
                      {accountLedgerData.filter(e => e.voucherNo !== 'OPENING').reduce((sum, e) => sum + Number(e.credit || 0), 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-900 font-black">
                      {accountLedgerData[accountLedgerData.length - 1].balance.toLocaleString()} {accountLedgerData[accountLedgerData.length - 1].balance >= 0 ? 'Dr' : 'Cr'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-gray-300">
              <thead>
                <tr className="border-b border-gray-300 text-xs font-bold uppercase text-gray-700 bg-gray-100">
                  <th className="py-2.5 px-3 border-r border-gray-300">Date</th>
                  <th className="py-2.5 px-3 border-r border-gray-300">Reference</th>
                  <th className="py-2.5 px-3 border-r border-gray-300">Transaction</th>
                  <th className="py-2.5 px-3 border-r border-gray-300 text-right">In Qty</th>
                  <th className="py-2.5 px-3 border-r border-gray-300 text-right">Out Qty</th>
                  <th className="py-2.5 px-3 border-r border-gray-300 text-right">Rate</th>
                  <th className="py-2.5 px-3 text-right">Balance Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-300 text-sm">
                {productLedgerData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-400">
                      Click "Generate Ledger" to view product stock movements.
                    </td>
                  </tr>
                ) : (
                  productLedgerData.map((e, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="py-2 px-3 border-r border-gray-300 text-gray-600 font-mono text-xs">{e.date}</td>
                      <td className="py-2 px-3 border-r border-gray-300 font-mono font-bold text-emerald-800">
                        {e.referenceNo}
                      </td>
                      <td className="py-2 px-3 border-r border-gray-300 font-medium text-gray-800">{e.transaction}</td>
                      <td className="py-2 px-3 border-r border-gray-300 text-right font-bold text-emerald-700">
                        {e.inQty || '-'}
                      </td>
                      <td className="py-2 px-3 border-r border-gray-300 text-right font-bold text-rose-600">
                        {e.outQty || '-'}
                      </td>
                      <td className="py-2 px-3 border-r border-gray-300 text-right text-gray-700">
                        {e.rate.toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-right font-black text-gray-900">{e.balanceQty}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
