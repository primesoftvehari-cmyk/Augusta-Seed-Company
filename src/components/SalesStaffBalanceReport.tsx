import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Account, SalesStaff, Voucher, Invoice } from '../types';
import { Printer, Download, Search, Users } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export const SalesStaffBalanceReportComponent: React.FC = () => {
  const [staffList, setStaffList] = useState<SalesStaff[]>([]);
  const [selectedStaffName, setSelectedStaffName] = useState<string>('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [companyProfile, setCompanyProfile] = useState<any>(null);

  const [dateFrom, setDateFrom] = useState('2026-01-01');
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [reportRows, setReportRows] = useState<any[]>([]);
  const [totals, setTotals] = useState({ debit: 0, credit: 0 });

  useEffect(() => {
    loadMasters();
  }, []);

  const loadMasters = async () => {
    const staff = await db.getSalesStaff();
    const accs = await db.getAccounts();
    const vocs = await db.getVouchers();
    const invs = await db.getInvoices();
    const profile = await db.getCompanyProfile();

    setStaffList(staff);
    setAccounts(accs);
    setVouchers(vocs);
    setInvoices(invs);
    setCompanyProfile(profile);

    if (staff.length > 0) {
      setSelectedStaffName(staff[0].staffName);
      calculateReport(staff[0].staffName, accs, vocs, invs);
    }
  };

  const calculateReport = (staffName: string, accs: Account[], vocs: Voucher[], invs: Invoice[]) => {
    // Filter accounts belonging to this sales staff
    const assignedAccounts = accs.filter(
      a => a.salesStaff && a.salesStaff.toLowerCase() === staffName.toLowerCase()
    );

    const rows: any[] = [];
    let totalDr = 0;
    let totalCr = 0;

    assignedAccounts.forEach(acc => {
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
            } else if (inv.invoiceType === 'PURCHASE_CASH' || inv.invoiceType === 'PURCHASE_CREDIT') {
              transCr += Number(inv.netTotal || 0);
            } else if (inv.invoiceType === 'PURCHASE_RETURN') {
              transDr += Number(inv.netTotal || 0);
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

      const closingDr = closingNet > 0 ? closingNet : 0;
      const closingCr = closingNet < 0 ? Math.abs(closingNet) : 0;

      totalDr += closingDr;
      totalCr += closingCr;

      rows.push({
        code: acc.code,
        name: acc.name,
        accountType: acc.accountType,
        phone: acc.phone || 'N/A',
        openingDisplay,
        transDr,
        transCr,
        closingDisplay,
        closingDr,
        closingCr
      });
    });

    setReportRows(rows);
    setTotals({ debit: totalDr, credit: totalCr });
  };

  const handleGenerate = () => {
    calculateReport(selectedStaffName, accounts, vouchers, invoices);
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
    doc.setFontSize(12);
    doc.text(`SALES STAFF BALANCE LIST - ${selectedStaffName.toUpperCase()}`, 14, 29);
    doc.setFontSize(10);
    doc.text(`Period: ${dateFrom} to ${dateTo}`, 14, 36);

    autoTable(doc, {
      startY: 42,
      head: [['Code', 'Account Name', 'Type', 'Phone', 'Opening', 'Debit', 'Credit', 'Closing Balance']],
      body: reportRows.map(r => [
        r.code,
        r.name,
        r.accountType,
        r.phone,
        r.openingDisplay,
        r.transDr > 0 ? r.transDr.toLocaleString() : '-',
        r.transCr > 0 ? r.transCr.toLocaleString() : '-',
        r.closingDisplay
      ]),
      styles: { fontSize: 8 }
    });

    doc.save(`augusta-sales-staff-balance-${selectedStaffName}.pdf`);
  };

  const exportExcel = () => {
    const wsData = reportRows.map(r => ({
      'Account Code': r.code,
      'Account Name': r.name,
      'Account Type': r.accountType,
      Phone: r.phone,
      'Opening Balance': r.openingDisplay,
      Debit: r.transDr,
      Credit: r.transCr,
      'Closing Balance': r.closingDisplay
    }));

    const worksheet = XLSX.utils.json_to_sheet(wsData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Staff Balance');
    XLSX.writeFile(workbook, `augusta-sales-staff-balance-${selectedStaffName}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  const currentStaffObj = staffList.find(s => s.staffName === selectedStaffName);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center space-x-2">
            <Users className="w-7 h-7 text-emerald-700" />
            <span>Sales Staff Balance List (Trial Balance Filter)</span>
          </h2>
          <p className="text-sm text-gray-500">View trial balance accounts and ledger balances assigned to a specific sales officer</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Select Sales Staff</label>
            <select
              value={selectedStaffName}
              onChange={e => setSelectedStaffName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-hidden bg-white font-semibold"
            >
              {staffList.map(s => (
                <option key={s.id} value={s.staffName}>
                  {s.staffCode} - {s.staffName} ({s.territory})
                </option>
              ))}
            </select>
          </div>
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

        <div className="flex justify-between items-center pt-2 flex-wrap gap-4">
          <button
            onClick={handleGenerate}
            className="flex items-center space-x-2 bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>Generate Staff Balance List</span>
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

      {currentStaffObj && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center justify-between flex-wrap gap-2 text-xs text-emerald-950 font-medium">
          <div>
            <span className="font-bold">Staff Officer:</span> {currentStaffObj.staffName} ({currentStaffObj.staffCode})
          </div>
          <div>
            <span className="font-bold">Territory:</span> {currentStaffObj.territory} | <span className="font-bold">Mobile:</span> {currentStaffObj.mobile}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-xs font-semibold uppercase text-gray-500 bg-gray-50">
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Account Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4 text-right">Opening Balance</th>
                <th className="py-3 px-4 text-right">Debit</th>
                <th className="py-3 px-4 text-right">Credit</th>
                <th className="py-3 px-4 text-right">Closing Balance (PKR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {reportRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">
                    No accounts assigned to "{selectedStaffName}". Assign this staff member to accounts in the Chart of Accounts master.
                  </td>
                </tr>
              ) : (
                reportRows.map((r, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50">
                    <td className="py-3 px-4 font-mono font-bold text-emerald-800">{r.code}</td>
                    <td className="py-3 px-4 font-semibold text-gray-800">{r.name}</td>
                    <td className="py-3 px-4 text-xs text-gray-600">
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 font-medium">{r.accountType}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 font-mono text-xs">{r.phone}</td>
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
          <span className="font-bold text-emerald-950 text-sm">Total Assigned Accounts: {reportRows.length}</span>
          <div className="text-sm space-x-6 font-semibold font-mono">
            <span>Total Closing Debit: <strong className="text-emerald-950 font-black">{totals.debit.toLocaleString()}</strong></span>
            <span>Total Closing Credit: <strong className="text-emerald-950 font-black">{totals.credit.toLocaleString()}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
