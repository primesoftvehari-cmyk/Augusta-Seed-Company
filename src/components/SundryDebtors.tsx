import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Account, Voucher, Invoice } from '../types';
import { Printer, Download, Search, Users } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export const SundryDebtorsComponent: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [companyProfile, setCompanyProfile] = useState<any>(null);

  const [dateFrom, setDateFrom] = useState('2026-01-01');
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debtorsData, setDebtorsData] = useState<any[]>([]);
  const [totals, setTotals] = useState({ opening: 0, debit: 0, credit: 0, closing: 0 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const accs = await db.getAccounts();
    const vocs = await db.getVouchers();
    const invs = await db.getInvoices();
    const profile = await db.getCompanyProfile();
    setAccounts(accs);
    setVouchers(vocs);
    setInvoices(invs);
    setCompanyProfile(profile);
    calculateDebtors(accs, vocs, invs);
  };

  const calculateDebtors = (accs: Account[], vocs: Voucher[], invs: Invoice[]) => {
    const debtorAccs = accs.filter(
      a =>
        a.accountType === 'Assets' ||
        a.name.toLowerCase().includes('customer') ||
        a.name.toLowerCase().includes('debtor') ||
        a.name.toLowerCase().includes('party') ||
        a.name.toLowerCase().includes('farmer') ||
        a.name.toLowerCase().includes('grower') ||
        (a.parentAccount && a.parentAccount.toLowerCase().includes('customer'))
    );

    const rows: any[] = [];
    let totOpening = 0;
    let totDebit = 0;
    let totCredit = 0;
    let totClosing = 0;

    debtorAccs.forEach(acc => {
      let transDr = 0;
      let transCr = 0;

      // Vouchers
      vocs.forEach(v => {
        if (v.date >= dateFrom && v.date <= dateTo) {
          v.lines.forEach(l => {
            if (l.accountId === acc.id) {
              transDr += Number(l.debit || 0);
              transCr += Number(l.credit || 0);
            }
          });
        }
      });

      // Invoices
      invs.forEach(inv => {
        if (inv.date >= dateFrom && inv.date <= dateTo) {
          const isTargetAccount =
            inv.accountName === acc.name ||
            inv.accountName === acc.id ||
            inv.accountName.toLowerCase() === acc.name.toLowerCase();

          if (isTargetAccount) {
            if (inv.invoiceType === 'SALES_CASH' || inv.invoiceType === 'SALES_CREDIT') {
              transDr += Number(inv.netTotal || 0);
            } else if (inv.invoiceType === 'SALES_RETURN') {
              transCr += Number(inv.netTotal || 0);
            }
          }
        }
      });

      const openingAmt = acc.openingBalanceType === 'Dr' ? Number(acc.openingBalance) : -Number(acc.openingBalance);
      const closingNet = openingAmt + transDr - transCr;

      const openingDisplay =
        Math.abs(openingAmt) > 0 ? `${Math.abs(openingAmt).toLocaleString()} ${openingAmt >= 0 ? 'Dr' : 'Cr'}` : '-';
      const closingDisplay =
        Math.abs(closingNet) > 0 ? `${Math.abs(closingNet).toLocaleString()} ${closingNet >= 0 ? 'Dr' : 'Cr'}` : '-';

      totOpening += openingAmt;
      totDebit += transDr;
      totCredit += transCr;
      totClosing += closingNet;

      rows.push({
        code: acc.code,
        name: acc.name,
        phone: acc.phone || '03023576036',
        salesStaff: acc.salesStaff || 'N/A',
        openingAmt,
        openingDisplay,
        transDr,
        transCr,
        closingNet,
        closingDisplay
      });
    });

    setDebtorsData(rows);
    setTotals({
      opening: totOpening,
      debit: totDebit,
      credit: totCredit,
      closing: totClosing
    });
  };

  const handleFilter = () => {
    calculateDebtors(accounts, vouchers, invoices);
  };

  const filteredRows = debtorsData.filter(
    r =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.salesStaff.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const exportPdf = () => {
    const doc = new jsPDF();
    const compName = companyProfile?.companyName || 'AUGUSTA SEED COMPANY';
    const compAddr = companyProfile?.headOfficeAddress || 'UNITED FARM ROAD, GULSHAN-E-ALI BY PASS, SAHIWAL';
    const compPhone = companyProfile?.phone || '03023576036';

    doc.setFontSize(16);
    doc.text(compName, 14, 15);
    doc.setFontSize(9);
    doc.text(`Address: ${compAddr} | Phone: ${compPhone}`, 14, 21);
    doc.setFontSize(12);
    doc.text('SUNDRY DEBTORS LIST REPORT', 14, 29);
    doc.setFontSize(10);
    doc.text(`Period: ${dateFrom} to ${dateTo}`, 14, 36);

    autoTable(doc, {
      startY: 42,
      head: [['Code', 'Account Name', 'Phone', 'Sales Staff', 'Opening (PKR)', 'Debit (PKR)', 'Credit (PKR)', 'Closing (PKR)']],
      body: filteredRows.map(r => [
        r.code,
        r.name,
        r.phone,
        r.salesStaff,
        r.openingDisplay,
        r.transDr > 0 ? r.transDr.toLocaleString() : '-',
        r.transCr > 0 ? r.transCr.toLocaleString() : '-',
        r.closingDisplay
      ]),
      styles: { fontSize: 8 }
    });

    doc.save('augusta-sundry-debtors-report.pdf');
  };

  const exportExcel = () => {
    const wsData = filteredRows.map(r => ({
      'Account Code': r.code,
      'Account Name': r.name,
      Phone: r.phone,
      'Sales Staff': r.salesStaff,
      'Opening Balance': r.openingDisplay,
      Debit: r.transDr,
      Credit: r.transCr,
      'Closing Balance': r.closingDisplay
    }));

    const worksheet = XLSX.utils.json_to_sheet(wsData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sundry Debtors');
    XLSX.writeFile(workbook, 'augusta-sundry-debtors-report.xlsx');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center space-x-2">
            <Users className="w-7 h-7 text-emerald-700" />
            <span>Sundry Debtors & Seed Growers List</span>
          </h2>
          <p className="text-sm text-gray-500">Comprehensive customer and grower balances with contact details, activity, and closing dues</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Search Debtor / Party</label>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search name, code, phone..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-emerald-600 focus:outline-hidden"
              />
            </div>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleFilter}
              className="w-full flex items-center justify-center space-x-2 bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>Generate Report</span>
            </button>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-2">
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

      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-xs font-semibold uppercase text-gray-500 bg-gray-50">
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Account Name</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Sales Staff</th>
                <th className="py-3 px-4 text-right">Opening Balance</th>
                <th className="py-3 px-4 text-right">Debit</th>
                <th className="py-3 px-4 text-right">Credit</th>
                <th className="py-3 px-4 text-right">Closing Balance (PKR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">
                    No sundry debtors found for the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredRows.map((r, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50">
                    <td className="py-3 px-4 font-mono font-bold text-emerald-800">{r.code}</td>
                    <td className="py-3 px-4 font-semibold text-gray-800">{r.name}</td>
                    <td className="py-3 px-4 text-gray-600 font-mono text-xs">{r.phone}</td>
                    <td className="py-3 px-4 text-gray-600">{r.salesStaff}</td>
                    <td className="py-3 px-4 text-right text-gray-700 font-mono">{r.openingDisplay}</td>
                    <td className="py-3 px-4 text-right text-gray-700 font-mono">
                      {r.transDr > 0 ? r.transDr.toLocaleString() : '-'}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-700 font-mono">
                      {r.transCr > 0 ? r.transCr.toLocaleString() : '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-emerald-800 font-mono">{r.closingDisplay}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex justify-between items-center flex-wrap gap-2">
          <span className="font-bold text-emerald-950 text-sm">Total Sundry Debtors Net Balance:</span>
          <span className="text-xl font-black text-emerald-900 font-mono">
            PKR {Math.abs(totals.closing).toLocaleString()} {totals.closing >= 0 ? 'Dr' : 'Cr'}
          </span>
        </div>
      </div>
    </div>
  );
};
