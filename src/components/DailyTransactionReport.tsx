import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Invoice, Voucher, CompanyProfileData, Account } from '../types';
import { Printer, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export const DailyTransactionReportComponent: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfileData | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const invs = await db.getInvoices();
    const vocs = await db.getVouchers();
    const accs = await db.getAccounts();
    const profile = await db.getCompanyProfile();
    setInvoices(invs);
    setVouchers(vocs);
    setAccounts(accs);
    setCompanyProfile(profile);
  };

  const getAccountCode = (name: string) => {
    const acc = accounts.find(a => a.name.toLowerCase() === name.toLowerCase());
    return acc ? acc.code : '1001';
  };

  const filteredInvoices = invoices.filter(i => {
    const matchDate = i.date >= dateFrom && i.date <= dateTo;
    const matchSearch =
      !searchQuery ||
      i.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.accountName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.items.some(it => it.productName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchDate && matchSearch;
  });

  const filteredVouchers = vouchers.filter(v => {
    const matchDate = v.date >= dateFrom && v.date <= dateTo;
    const matchSearch =
      !searchQuery ||
      v.voucherNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.narration.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.lines.some(l => l.accountName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchDate && matchSearch;
  });

  const salesReturns = filteredInvoices.filter(i => i.invoiceType === 'SALES_RETURN');
  const purchaseReturns = filteredInvoices.filter(i => i.invoiceType === 'PURCHASE_RETURN');
  const payments = filteredVouchers.filter(v => v.voucherType === 'CASH_PAYMENT');
  const receipts = filteredVouchers.filter(v => v.voucherType === 'CASH_RECEIPT');
  const journals = filteredVouchers.filter(v => v.voucherType === 'JOURNAL');
  const purchases = filteredInvoices.filter(
    i => i.invoiceType === 'PURCHASE_CASH' || i.invoiceType === 'PURCHASE_CREDIT'
  );
  const sales = filteredInvoices.filter(
    i => i.invoiceType === 'SALES_CASH' || i.invoiceType === 'SALES_CREDIT'
  );

  const totalCashSales = sales.filter(i => i.invoiceType === 'SALES_CASH').reduce((sum, i) => sum + i.netTotal, 0);
  const totalCreditSales = sales.filter(i => i.invoiceType === 'SALES_CREDIT').reduce((sum, i) => sum + i.netTotal, 0);
  const totalExps = payments.reduce((sum, v) => sum + v.totalAmount, 0);
  const totalPurchases = purchases.reduce((sum, i) => sum + i.netTotal, 0);
  const totalSalesBills = sales.length;
  const todayProfit = totalCashSales + totalCreditSales - totalPurchases - totalExps;

  // Cash in hand balance calculation
  const calculateCashBalanceUpTo = (targetDate: string, inclusive: boolean = true) => {
    const cashAcc = accounts.find(a => a.code === '1001' || a.name.toLowerCase().includes('cash in hand'));
    const cashAccId = cashAcc ? cashAcc.id : '';
    const cashAccName = cashAcc ? cashAcc.name : '';

    let balance = cashAcc ? (cashAcc.openingBalanceType === 'Dr' ? Number(cashAcc.openingBalance) : -Number(cashAcc.openingBalance)) : 150000;

    vouchers.forEach(v => {
      const condition = inclusive ? v.date <= targetDate : v.date < targetDate;
      if (condition) {
        v.lines.forEach(l => {
          if (l.accountId === cashAccId || (cashAccName && l.accountName.toLowerCase() === cashAccName.toLowerCase())) {
            balance += Number(l.debit || 0) - Number(l.credit || 0);
          }
        });
      }
    });

    invoices.forEach(inv => {
      const condition = inclusive ? inv.date <= targetDate : inv.date < targetDate;
      if (condition) {
        if (inv.invoiceType === 'SALES_CASH') {
          balance += Number(inv.netTotal || 0);
        } else if (inv.invoiceType === 'PURCHASE_CASH') {
          balance -= Number(inv.netTotal || 0);
        }
      }
    });

    return balance;
  };

  const cashBalanceFrom = calculateCashBalanceUpTo(dateFrom, false);
  const cashBalanceTo = calculateCashBalanceUpTo(dateTo, true);

  const exportPdf = () => {
    const doc = new jsPDF('landscape');
    const compName = companyProfile?.companyName || 'AUGUSTA SEED COMPANY';
    doc.setFontSize(14);
    doc.text(compName, 14, 12);
    doc.setFontSize(12);
    doc.text('DAILY TRANSACTION REPORT / REGISTER', 14, 18);
    doc.setFontSize(10);
    doc.text(`Period: ${dateFrom} to ${dateTo}`, 14, 24);

    const rows: any[] = [];
    const addSectionHeader = (title: string) => {
      rows.push([{ content: title.toUpperCase(), colSpan: 6, styles: { fontStyle: 'bold', fillColor: [230, 230, 230], textColor: [0, 0, 0] } }]);
    };

    if (salesReturns.length > 0) {
      addSectionHeader('SALES RETURN');
      salesReturns.forEach(inv => {
        inv.items.forEach(item => {
          rows.push([
            getAccountCode(inv.accountName),
            `${inv.invoiceNo} - ${item.productName}`,
            `${item.quantity} ${item.unit} @ ${item.rate} - ${inv.accountName}`,
            '',
            item.amount.toLocaleString(),
            inv.netTotal.toLocaleString()
          ]);
        });
      });
    }

    if (purchaseReturns.length > 0) {
      addSectionHeader('PURCHASE RETURN');
      purchaseReturns.forEach(inv => {
        inv.items.forEach(item => {
          rows.push([
            getAccountCode(inv.accountName),
            `${inv.invoiceNo} - ${item.productName}`,
            `${item.quantity} ${item.unit} @ ${item.rate} - ${inv.accountName}`,
            item.amount.toLocaleString(),
            '',
            inv.netTotal.toLocaleString()
          ]);
        });
      });
    }

    if (payments.length > 0) {
      addSectionHeader('PAYMENTS (CPV)');
      payments.forEach(v => {
        rows.push([
          getAccountCode(v.lines?.[0]?.accountName || ''),
          v.voucherNo,
          v.narration || 'Cash Payment',
          v.totalAmount.toLocaleString(),
          '',
          ''
        ]);
      });
    }

    if (receipts.length > 0) {
      addSectionHeader('RECEIPTS (CRV)');
      receipts.forEach(v => {
        rows.push([
          getAccountCode(v.lines?.[1]?.accountName || ''),
          v.voucherNo,
          v.narration || 'Cash Receipt',
          '',
          v.totalAmount.toLocaleString(),
          ''
        ]);
      });
    }

    if (journals.length > 0) {
      addSectionHeader('JOURNAL VOUCHERS (JV)');
      journals.forEach(v => {
        v.lines.forEach(l => {
          rows.push([
            getAccountCode(l.accountName),
            v.voucherNo,
            l.description || v.narration || 'Journal Entry',
            l.debit ? l.debit.toLocaleString() : '',
            l.credit ? l.credit.toLocaleString() : '',
            ''
          ]);
        });
      });
    }

    if (purchases.length > 0) {
      addSectionHeader('PURCHASES');
      purchases.forEach(inv => {
        inv.items.forEach(item => {
          rows.push([
            getAccountCode(inv.accountName),
            `${inv.invoiceNo} - ${item.productName}`,
            `${item.quantity} ${item.unit} @ ${item.rate} - ${inv.accountName}`,
            item.amount.toLocaleString(),
            '',
            inv.netTotal.toLocaleString()
          ]);
        });
      });
    }

    if (sales.length > 0) {
      addSectionHeader('SALES');
      sales.forEach(inv => {
        inv.items.forEach(item => {
          rows.push([
            getAccountCode(inv.accountName),
            `${inv.invoiceNo} - ${item.productName}`,
            `${item.quantity} ${item.unit} @ ${item.rate} - ${inv.accountName}`,
            '',
            item.amount.toLocaleString(),
            inv.netTotal.toLocaleString()
          ]);
        });
      });
    }

    autoTable(doc, {
      startY: 28,
      head: [['CODE', 'INV&DOC', 'DESCRIPTION AND ACCOUNT HEAD', 'DEBIT', 'CREDIT', 'TOTAL']],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [6, 95, 70], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      styles: { fontSize: 8, cellPadding: 2 }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 150;
    doc.setFontSize(9);
    doc.text(`CASH IN HAND (FROM DATE ${dateFrom}): ${cashBalanceFrom.toLocaleString()} PKR`, 14, finalY + 10);
    doc.text(`CASH IN HAND (TO DATE ${dateTo}): ${cashBalanceTo.toLocaleString()} PKR`, 100, finalY + 10);
    doc.text(`TODAY EXPS = ${totalExps.toLocaleString()} PKR`, 180, finalY + 10);
    doc.text(`CASH SALES = ${totalCashSales.toLocaleString()} PKR`, 14, finalY + 16);
    doc.text(`CREDIT SALES = ${totalCreditSales.toLocaleString()} PKR`, 100, finalY + 16);
    doc.text(`TODAY PROFIT = ${todayProfit.toLocaleString()} PKR`, 180, finalY + 16);

    doc.save(`daily-transaction-report-${dateFrom}-to-${dateTo}.pdf`);
  };

  const exportExcel = () => {
    const wsData: any[] = [];
    filteredInvoices.forEach(inv => {
      inv.items.forEach(item => {
        wsData.push({
          Date: inv.date,
          Code: getAccountCode(inv.accountName),
          'Doc No': inv.invoiceNo,
          Type: inv.invoiceType,
          'Account / Party': inv.accountName,
          'Product / Details': `${item.productName} (${item.quantity} ${item.unit} @ ${item.rate})`,
          'Item Amount': item.amount,
          'Invoice Total': inv.netTotal
        });
      });
    });

    filteredVouchers.forEach(v => {
      v.lines.forEach(l => {
        wsData.push({
          Date: v.date,
          Code: getAccountCode(l.accountName),
          'Doc No': v.voucherNo,
          Type: v.voucherType,
          'Account / Party': l.accountName,
          'Product / Details': l.description || v.narration,
          Debit: l.debit,
          Credit: l.credit
        });
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(wsData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Daily Transactions');
    XLSX.writeFile(workbook, `daily-transactions-${dateFrom}-to-${dateTo}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-xs">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">DAILY TRANSACTION REPORT & REGISTER</h2>
          <p className="text-sm text-gray-500 mt-0.5">Augusta Seed Company • Period: {dateFrom} to {dateTo}</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>
          <button
            onClick={exportPdf}
            className="flex items-center space-x-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export PDF</span>
          </button>
          <button
            onClick={exportExcel}
            className="flex items-center space-x-1.5 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-4">
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
        <div>
          <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Search Details / Party</label>
          <input
            type="text"
            placeholder="Search invoice no, party, seed..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-hidden"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-300 shadow-sm overflow-hidden font-mono text-xs">
        <div className="bg-emerald-950 text-white px-6 py-3 flex justify-between items-center font-sans">
          <span className="font-bold">AUGUSTA SEED COMPANY - DAILY TRANSACTION LEDGER</span>
          <span>PERIOD: {dateFrom} TO {dateTo}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300 text-gray-700 font-bold uppercase">
                <th className="py-2.5 px-3 border-r border-gray-300 w-20">CODE</th>
                <th className="py-2.5 px-3 border-r border-gray-300 w-44">INV & DOC</th>
                <th className="py-2.5 px-3 border-r border-gray-300">DESCRIPTION AND ACCOUNT HEAD</th>
                <th className="py-2.5 px-3 border-r border-gray-300 text-right w-28">DEBIT</th>
                <th className="py-2.5 px-3 border-r border-gray-300 text-right w-28">CREDIT</th>
                <th className="py-2.5 px-3 text-right w-28">TOTAL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {salesReturns.length > 0 && (
                <>
                  <tr className="bg-amber-50 font-bold text-amber-900">
                    <td colSpan={6} className="py-1.5 px-3 uppercase">SALES RETURN INVOICES</td>
                  </tr>
                  {salesReturns.map(inv =>
                    inv.items.map((item, idx) => (
                      <tr key={`${inv.id}-${idx}`} className="hover:bg-gray-50">
                        <td className="py-1.5 px-3 border-r border-gray-200 font-bold text-emerald-800">
                          {getAccountCode(inv.accountName)}
                        </td>
                        <td className="py-1.5 px-3 border-r border-gray-200 font-semibold">{inv.invoiceNo}</td>
                        <td className="py-1.5 px-3 border-r border-gray-200">
                          {item.quantity} {item.unit} @ {item.rate} {item.productName} • {inv.accountName}
                        </td>
                        <td className="py-1.5 px-3 border-r border-gray-200 text-right"></td>
                        <td className="py-1.5 px-3 border-r border-gray-200 text-right">{item.amount.toLocaleString()}</td>
                        <td className="py-1.5 px-3 text-right font-bold">
                          {idx === 0 ? inv.netTotal.toLocaleString() : ''}
                        </td>
                      </tr>
                    ))
                  )}
                </>
              )}

              {purchaseReturns.length > 0 && (
                <>
                  <tr className="bg-rose-50 font-bold text-rose-900">
                    <td colSpan={6} className="py-1.5 px-3 uppercase">PURCHASE RETURN INVOICES</td>
                  </tr>
                  {purchaseReturns.map(inv =>
                    inv.items.map((item, idx) => (
                      <tr key={`${inv.id}-${idx}`} className="hover:bg-gray-50">
                        <td className="py-1.5 px-3 border-r border-gray-200 font-bold text-emerald-800">
                          {getAccountCode(inv.accountName)}
                        </td>
                        <td className="py-1.5 px-3 border-r border-gray-200 font-semibold">{inv.invoiceNo}</td>
                        <td className="py-1.5 px-3 border-r border-gray-200">
                          {item.quantity} {item.unit} @ {item.rate} {item.productName} • {inv.accountName}
                        </td>
                        <td className="py-1.5 px-3 border-r border-gray-200 text-right">{item.amount.toLocaleString()}</td>
                        <td className="py-1.5 px-3 border-r border-gray-200 text-right"></td>
                        <td className="py-1.5 px-3 text-right font-bold">
                          {idx === 0 ? inv.netTotal.toLocaleString() : ''}
                        </td>
                      </tr>
                    ))
                  )}
                </>
              )}

              {payments.length > 0 && (
                <>
                  <tr className="bg-red-50 font-bold text-red-900">
                    <td colSpan={6} className="py-1.5 px-3 uppercase">CASH PAYMENT VOUCHERS (CPV)</td>
                  </tr>
                  {payments.map(v => (
                    <tr key={v.id} className="hover:bg-gray-50">
                      <td className="py-1.5 px-3 border-r border-gray-200 font-bold text-emerald-800">
                        {getAccountCode(v.lines?.[0]?.accountName || '')}
                      </td>
                      <td className="py-1.5 px-3 border-r border-gray-200 font-semibold">{v.voucherNo}</td>
                      <td className="py-1.5 px-3 border-r border-gray-200">
                        {v.narration || 'Cash Payment'} • {v.lines?.[0]?.accountName}
                      </td>
                      <td className="py-1.5 px-3 border-r border-gray-200 text-right font-bold">
                        {v.totalAmount.toLocaleString()}
                      </td>
                      <td className="py-1.5 px-3 border-r border-gray-200 text-right"></td>
                      <td className="py-1.5 px-3 text-right"></td>
                    </tr>
                  ))}
                </>
              )}

              {receipts.length > 0 && (
                <>
                  <tr className="bg-emerald-50 font-bold text-emerald-900">
                    <td colSpan={6} className="py-1.5 px-3 uppercase">CASH RECEIPT VOUCHERS (CRV)</td>
                  </tr>
                  {receipts.map(v => (
                    <tr key={v.id} className="hover:bg-gray-50">
                      <td className="py-1.5 px-3 border-r border-gray-200 font-bold text-emerald-800">
                        {getAccountCode(v.lines?.[1]?.accountName || '')}
                      </td>
                      <td className="py-1.5 px-3 border-r border-gray-200 font-semibold">{v.voucherNo}</td>
                      <td className="py-1.5 px-3 border-r border-gray-200">
                        {v.narration || 'Cash Receipt'} • {v.lines?.[1]?.accountName}
                      </td>
                      <td className="py-1.5 px-3 border-r border-gray-200 text-right"></td>
                      <td className="py-1.5 px-3 border-r border-gray-200 text-right font-bold">
                        {v.totalAmount.toLocaleString()}
                      </td>
                      <td className="py-1.5 px-3 text-right"></td>
                    </tr>
                  ))}
                </>
              )}

              {journals.length > 0 && (
                <>
                  <tr className="bg-purple-50 font-bold text-purple-900">
                    <td colSpan={6} className="py-1.5 px-3 uppercase">JOURNAL VOUCHERS (JV)</td>
                  </tr>
                  {journals.map(v =>
                    v.lines.map((l, idx) => (
                      <tr key={`${v.id}-${idx}`} className="hover:bg-gray-50">
                        <td className="py-1.5 px-3 border-r border-gray-200 font-bold text-emerald-800">
                          {getAccountCode(l.accountName)}
                        </td>
                        <td className="py-1.5 px-3 border-r border-gray-200 font-semibold">{v.voucherNo}</td>
                        <td className="py-1.5 px-3 border-r border-gray-200">
                          {l.description || v.narration || 'Journal Entry'} • {l.accountName}
                        </td>
                        <td className="py-1.5 px-3 border-r border-gray-200 text-right">
                          {l.debit ? l.debit.toLocaleString() : ''}
                        </td>
                        <td className="py-1.5 px-3 border-r border-gray-200 text-right">
                          {l.credit ? l.credit.toLocaleString() : ''}
                        </td>
                        <td className="py-1.5 px-3 text-right font-bold">
                          {idx === 0 ? v.totalAmount.toLocaleString() : ''}
                        </td>
                      </tr>
                    ))
                  )}
                </>
              )}

              {purchases.length > 0 && (
                <>
                  <tr className="bg-indigo-50 font-bold text-indigo-900">
                    <td colSpan={6} className="py-1.5 px-3 uppercase">PURCHASE INVOICES / PROCUREMENT</td>
                  </tr>
                  {purchases.map(inv =>
                    inv.items.map((item, idx) => (
                      <tr key={`${inv.id}-${idx}`} className="hover:bg-gray-50">
                        <td className="py-1.5 px-3 border-r border-gray-200 font-bold text-emerald-800">
                          {getAccountCode(inv.accountName)}
                        </td>
                        <td className="py-1.5 px-3 border-r border-gray-200 font-semibold">{inv.invoiceNo}</td>
                        <td className="py-1.5 px-3 border-r border-gray-200">
                          {item.quantity} {item.unit} @ {item.rate} {item.productName} • {inv.accountName}
                        </td>
                        <td className="py-1.5 px-3 border-r border-gray-200 text-right">{item.amount.toLocaleString()}</td>
                        <td className="py-1.5 px-3 border-r border-gray-200 text-right"></td>
                        <td className="py-1.5 px-3 text-right font-bold">
                          {idx === 0 ? inv.netTotal.toLocaleString() : ''}
                        </td>
                      </tr>
                    ))
                  )}
                </>
              )}

              {sales.length > 0 && (
                <>
                  <tr className="bg-blue-50 font-bold text-blue-900">
                    <td colSpan={6} className="py-1.5 px-3 uppercase">SALES INVOICES</td>
                  </tr>
                  {sales.map(inv =>
                    inv.items.map((item, idx) => (
                      <tr key={`${inv.id}-${idx}`} className="hover:bg-gray-50">
                        <td className="py-1.5 px-3 border-r border-gray-200 font-bold text-emerald-800">
                          {getAccountCode(inv.accountName)}
                        </td>
                        <td className="py-1.5 px-3 border-r border-gray-200 font-semibold">{inv.invoiceNo}</td>
                        <td className="py-1.5 px-3 border-r border-gray-200">
                          {item.quantity} {item.unit} @ {item.rate} {item.productName} • {inv.accountName}
                        </td>
                        <td className="py-1.5 px-3 border-r border-gray-200 text-right"></td>
                        <td className="py-1.5 px-3 border-r border-gray-200 text-right">{item.amount.toLocaleString()}</td>
                        <td className="py-1.5 px-3 text-right font-bold">
                          {idx === 0 ? inv.netTotal.toLocaleString() : ''}
                        </td>
                      </tr>
                    ))
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Summary Footer Box with Cash Balances */}
        <div className="bg-gray-100 border-t border-gray-300 p-4 grid grid-cols-2 md:grid-cols-6 gap-4 font-sans text-xs">
          <div>
            <p className="text-gray-500 font-semibold uppercase">Cash in Hand (From {dateFrom})</p>
            <p className="text-base font-bold text-emerald-800">PKR {cashBalanceFrom.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-500 font-semibold uppercase">Cash in Hand (To {dateTo})</p>
            <p className="text-base font-bold text-emerald-900">PKR {cashBalanceTo.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-500 font-semibold uppercase">Today Expenses</p>
            <p className="text-base font-bold text-red-700">PKR {totalExps.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-500 font-semibold uppercase">Today Profit / Net</p>
            <p className={`text-base font-bold ${todayProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
              PKR {todayProfit.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-gray-500 font-semibold uppercase">Cash Sales</p>
            <p className="text-base font-bold text-gray-800">PKR {totalCashSales.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-500 font-semibold uppercase">Credit Sales</p>
            <p className="text-base font-bold text-gray-800">PKR {totalCreditSales.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
