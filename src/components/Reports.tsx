import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Invoice } from '../types';
import { Printer, Download, Search } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export const ReportsComponent: React.FC<{
  defaultReport?: 'sales' | 'purchase' | 'summary' | 'purchase-summary';
}> = ({ defaultReport = 'sales' }) => {
  const [reportType, setReportType] = useState<'sales' | 'purchase' | 'summary' | 'purchase-summary'>(defaultReport);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [dateFrom, setDateFrom] = useState('2026-01-01');
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState<any[]>([]);

  useEffect(() => {
    loadInvoices();
  }, [reportType]);

  const loadInvoices = async () => {
    const invs = await db.getInvoices();
    setInvoices(invs);
    generateReport(invs);
  };

  const generateReport = (allInvoices = invoices) => {
    const filteredInvs = allInvoices.filter(i => i.date >= dateFrom && i.date <= dateTo);

    if (reportType === 'sales') {
      const sales = filteredInvs.filter(i => i.invoiceType === 'SALES_CASH' || i.invoiceType === 'SALES_CREDIT');
      const rows: any[] = [];
      sales.forEach(inv => {
        inv.items.forEach(item => {
          rows.push({
            invoiceNo: inv.invoiceNo,
            date: inv.date,
            customer: inv.accountName,
            staff: inv.salesStaff || 'N/A',
            product: item.productName,
            qty: item.quantity,
            rate: item.rate,
            discount: item.discount,
            netAmount: item.amount
          });
        });
      });
      setReportData(rows);
    } else if (reportType === 'purchase') {
      const purchases = filteredInvs.filter(i => i.invoiceType === 'PURCHASE_CASH' || i.invoiceType === 'PURCHASE_CREDIT');
      const rows: any[] = [];
      purchases.forEach(inv => {
        inv.items.forEach(item => {
          rows.push({
            invoiceNo: inv.invoiceNo,
            date: inv.date,
            supplier: inv.accountName,
            product: item.productName,
            qty: item.quantity,
            rate: item.rate,
            discount: item.discount,
            netAmount: item.amount
          });
        });
      });
      setReportData(rows);
    } else if (reportType === 'summary') {
      const sales = filteredInvs.filter(i => i.invoiceType === 'SALES_CASH' || i.invoiceType === 'SALES_CREDIT');
      const summaryMap: { [key: string]: { customer: string; invoicesCount: number; totalAmount: number } } = {};
      sales.forEach(inv => {
        if (!summaryMap[inv.accountName]) {
          summaryMap[inv.accountName] = { customer: inv.accountName, invoicesCount: 0, totalAmount: 0 };
        }
        summaryMap[inv.accountName].invoicesCount += 1;
        summaryMap[inv.accountName].totalAmount += Number(inv.netTotal || 0);
      });
      setReportData(Object.values(summaryMap));
    } else if (reportType === 'purchase-summary') {
      const purchases = filteredInvs.filter(i => i.invoiceType === 'PURCHASE_CASH' || i.invoiceType === 'PURCHASE_CREDIT');
      const summaryMap: { [key: string]: { supplier: string; invoicesCount: number; totalAmount: number } } = {};
      purchases.forEach(inv => {
        if (!summaryMap[inv.accountName]) {
          summaryMap[inv.accountName] = { supplier: inv.accountName, invoicesCount: 0, totalAmount: 0 };
        }
        summaryMap[inv.accountName].invoicesCount += 1;
        summaryMap[inv.accountName].totalAmount += Number(inv.netTotal || 0);
      });
      setReportData(Object.values(summaryMap));
    }
  };

  const exportPdf = () => {
    const doc = new jsPDF();
    doc.text(`AUGUSTA SEED COMPANY - ${reportType.toUpperCase()} REPORT`, 14, 15);
    doc.text(`United Farm Road, Sahiwal | Period: ${dateFrom} to ${dateTo}`, 14, 22);

    if (reportType === 'sales') {
      autoTable(doc, {
        startY: 30,
        head: [['Invoice No', 'Date', 'Customer', 'Staff', 'Product', 'Qty', 'Rate', 'Net Amount']],
        body: reportData.map(r => [
          r.invoiceNo,
          r.date,
          r.customer,
          r.staff,
          r.product,
          r.qty,
          r.rate.toLocaleString(),
          r.netAmount.toLocaleString()
        ])
      });
    } else if (reportType === 'purchase') {
      autoTable(doc, {
        startY: 30,
        head: [['Invoice No', 'Date', 'Supplier', 'Product', 'Qty', 'Rate', 'Net Amount']],
        body: reportData.map(r => [
          r.invoiceNo,
          r.date,
          r.supplier,
          r.product,
          r.qty,
          r.rate.toLocaleString(),
          r.netAmount.toLocaleString()
        ])
      });
    } else if (reportType === 'summary') {
      autoTable(doc, {
        startY: 30,
        head: [['Customer Account', 'Total Invoices', 'Total Amount (PKR)']],
        body: reportData.map(r => [r.customer, r.invoicesCount, r.totalAmount.toLocaleString()])
      });
    } else if (reportType === 'purchase-summary') {
      autoTable(doc, {
        startY: 30,
        head: [['Supplier Account', 'Total Invoices', 'Total Amount (PKR)']],
        body: reportData.map(r => [r.supplier, r.invoicesCount, r.totalAmount.toLocaleString()])
      });
    }

    doc.save(`augusta-${reportType}-report.pdf`);
  };

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(reportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
    XLSX.writeFile(workbook, `augusta-${reportType}-report.xlsx`);
  };

  const totalSum = reportData.reduce(
    (acc, curr) => acc + Number(curr.netAmount || curr.totalAmount || 0),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {reportType === 'sales' && 'Sales Report'}
            {reportType === 'purchase' && 'Procurement / Purchase Report'}
            {reportType === 'summary' && 'Sales Summary Report'}
            {reportType === 'purchase-summary' && 'Purchases Summary Report'}
          </h2>
          <p className="text-sm text-gray-500">Comprehensive seed sales and procurement transaction summaries with export tools</p>
        </div>
        <div className="flex flex-wrap gap-1 bg-white p-1 rounded-xl border border-gray-200">
          <button
            onClick={() => setReportType('sales')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
              reportType === 'sales' ? 'bg-emerald-700 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Sales Report
          </button>
          <button
            onClick={() => setReportType('purchase')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
              reportType === 'purchase' ? 'bg-emerald-700 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Purchase Report
          </button>
          <button
            onClick={() => setReportType('summary')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
              reportType === 'summary' ? 'bg-emerald-700 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Sales Summary
          </button>
          <button
            onClick={() => setReportType('purchase-summary')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
              reportType === 'purchase-summary' ? 'bg-emerald-700 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Purchases Summary
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <div className="flex items-end">
            <button
              onClick={() => generateReport()}
              className="w-full flex items-center justify-center space-x-2 bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>Filter Report</span>
            </button>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-2">
          <button
            onClick={() => window.print()}
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
        {reportType === 'sales' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-xs font-semibold uppercase text-gray-500 bg-gray-50">
                  <th className="py-3 px-4">Invoice No</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Staff</th>
                  <th className="py-3 px-4">Seed Product</th>
                  <th className="py-3 px-4 text-right">Qty</th>
                  <th className="py-3 px-4 text-right">Rate</th>
                  <th className="py-3 px-4 text-right">Net Amount (PKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {reportData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-gray-400">
                      No sales records found.
                    </td>
                  </tr>
                ) : (
                  reportData.map((r, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="py-3 px-4 font-mono font-bold text-emerald-800">{r.invoiceNo}</td>
                      <td className="py-3 px-4 text-gray-600 font-mono text-xs">{r.date}</td>
                      <td className="py-3 px-4 font-semibold text-gray-800">{r.customer}</td>
                      <td className="py-3 px-4 text-gray-600">{r.staff}</td>
                      <td className="py-3 px-4 text-gray-800">{r.product}</td>
                      <td className="py-3 px-4 text-right font-bold text-gray-800">{r.qty}</td>
                      <td className="py-3 px-4 text-right text-gray-700">{r.rate.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-black text-emerald-800">{r.netAmount.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {reportType === 'purchase' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-xs font-semibold uppercase text-gray-500 bg-gray-50">
                  <th className="py-3 px-4">Invoice No</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Seed Variety</th>
                  <th className="py-3 px-4 text-right">Qty</th>
                  <th className="py-3 px-4 text-right">Rate</th>
                  <th className="py-3 px-4 text-right">Net Amount (PKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {reportData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-400">
                      No purchase records found.
                    </td>
                  </tr>
                ) : (
                  reportData.map((r, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="py-3 px-4 font-mono font-bold text-emerald-800">{r.invoiceNo}</td>
                      <td className="py-3 px-4 text-gray-600 font-mono text-xs">{r.date}</td>
                      <td className="py-3 px-4 font-semibold text-gray-800">{r.supplier}</td>
                      <td className="py-3 px-4 text-gray-800">{r.product}</td>
                      <td className="py-3 px-4 text-right font-bold text-gray-800">{r.qty}</td>
                      <td className="py-3 px-4 text-right text-gray-700">{r.rate.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-black text-emerald-800">{r.netAmount.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {reportType === 'summary' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-xs font-semibold uppercase text-gray-500 bg-gray-50">
                  <th className="py-3 px-4">Customer Account</th>
                  <th className="py-3 px-4 text-center">Total Invoices</th>
                  <th className="py-3 px-4 text-right">Total Amount (PKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {reportData.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-12 text-gray-400">
                      No summary records found.
                    </td>
                  </tr>
                ) : (
                  reportData.map((r, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="py-3 px-4 font-bold text-gray-800">{r.customer}</td>
                      <td className="py-3 px-4 text-center font-semibold text-gray-600">{r.invoicesCount}</td>
                      <td className="py-3 px-4 text-right font-black text-emerald-800 font-mono">
                        {r.totalAmount.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {reportType === 'purchase-summary' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-xs font-semibold uppercase text-gray-500 bg-gray-50">
                  <th className="py-3 px-4">Supplier Account</th>
                  <th className="py-3 px-4 text-center">Total Invoices</th>
                  <th className="py-3 px-4 text-right">Total Amount (PKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {reportData.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-12 text-gray-400">
                      No purchase summary records found.
                    </td>
                  </tr>
                ) : (
                  reportData.map((r, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="py-3 px-4 font-bold text-gray-800">{r.supplier}</td>
                      <td className="py-3 px-4 text-center font-semibold text-gray-600">{r.invoicesCount}</td>
                      <td className="py-3 px-4 text-right font-black text-emerald-800 font-mono">
                        {r.totalAmount.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex justify-between items-center">
          <span className="font-bold text-emerald-950 text-sm">Total Report Amount:</span>
          <span className="text-xl font-black text-emerald-900 font-mono">PKR {totalSum.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};
