import React, { useEffect, useState } from 'react';
import { db } from '../services/db';
import {
  BookOpen,
  Package,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  Clock,
  Building2,
  Phone,
  PlusCircle,
  FileText,
  BarChart3,
  Receipt,
  ShoppingBag,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

interface DashboardProps {
  onNavigate?: (tab: string, ref?: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<any>({
    totalAccounts: 0,
    totalProducts: 0,
    totalSales: 0,
    totalPurchases: 0,
    cashReceipts: 0,
    cashPayments: 0,
    todaysSales: 0,
    todaysPurchases: 0,
    cashBalance: 0,
    recentTransactions: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await db.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-semibold text-xs tracking-wider uppercase">Loading Augusta Seed Company Command Center...</p>
      </div>
    );
  }

  const kpiCards = [
    {
      title: 'Current Cash Balance',
      value: `PKR ${stats.cashBalance.toLocaleString()}`,
      icon: Wallet,
      gradient: 'from-red-50 via-white to-red-100/50',
      textColor: 'text-red-900',
      badge: 'Liquid Assets'
    },
    {
      title: "Today's Sales",
      value: `PKR ${stats.todaysSales.toLocaleString()}`,
      icon: TrendingUp,
      gradient: 'from-emerald-50 via-white to-emerald-100/50',
      textColor: 'text-emerald-900',
      badge: 'Live Revenue'
    },
    {
      title: "Today's Purchases",
      value: `PKR ${stats.todaysPurchases.toLocaleString()}`,
      icon: TrendingDown,
      gradient: 'from-amber-50 via-white to-amber-100/50',
      textColor: 'text-amber-900',
      badge: 'Live Procurements'
    },
    {
      title: 'Total Seed Sales',
      value: `PKR ${stats.totalSales.toLocaleString()}`,
      icon: ArrowUpRight,
      gradient: 'from-red-50 via-white to-red-100/50',
      textColor: 'text-red-900',
      badge: 'Cumulative'
    },
    {
      title: 'Total Procurements',
      value: `PKR ${stats.totalPurchases.toLocaleString()}`,
      icon: ArrowDownLeft,
      gradient: 'from-gray-50 via-white to-gray-100',
      textColor: 'text-gray-900',
      badge: 'Cumulative'
    },
    {
      title: 'Cash Receipts (CRV)',
      value: `PKR ${stats.cashReceipts.toLocaleString()}`,
      icon: DollarSign,
      gradient: 'from-emerald-50 via-white to-emerald-100/50',
      textColor: 'text-emerald-900',
      badge: 'Inflows'
    },
    {
      title: 'Cash Payments (CPV)',
      value: `PKR ${stats.cashPayments.toLocaleString()}`,
      icon: DollarSign,
      gradient: 'from-red-50 via-white to-red-100/50',
      textColor: 'text-red-900',
      badge: 'Outflows'
    },
    {
      title: 'Chart of Accounts',
      value: stats.totalAccounts,
      icon: BookOpen,
      gradient: 'from-blue-50 via-white to-blue-100/50',
      textColor: 'text-blue-900',
      badge: 'Ledger Heads'
    },
    {
      title: 'Certified Seed Varieties',
      value: stats.totalProducts,
      icon: Package,
      gradient: 'from-purple-50 via-white to-purple-100/50',
      textColor: 'text-purple-900',
      badge: 'Inventory'
    }
  ];

  const quickActions = [
    { label: 'New Sales Invoice', tab: 'sales_inv', icon: ShoppingBag, color: 'bg-red-700 hover:bg-red-800 text-white' },
    { label: 'New Purchase', tab: 'purchase_inv', icon: ShoppingBag, color: 'bg-gray-800 hover:bg-gray-900 text-white' },
    { label: 'Cash Payment', tab: 'cpv', icon: Receipt, color: 'bg-red-600 hover:bg-red-700 text-white' },
    { label: 'Cash Receipt', tab: 'crv', icon: Receipt, color: 'bg-gray-700 hover:bg-gray-800 text-white' },
    { label: 'Account Ledger', tab: 'ledger', icon: FileText, color: 'bg-red-800 hover:bg-red-900 text-white' },
    { label: 'Trial Balance', tab: 'trial_balance', icon: BarChart3, color: 'bg-gray-900 hover:bg-black text-white' }
  ];

  const maxVal = Math.max(stats.totalSales, stats.totalPurchases, 1);
  const salesPct = Math.min(Math.round((stats.totalSales / maxVal) * 100), 100);
  const purchasePct = Math.min(Math.round((stats.totalPurchases / maxVal) * 100), 100);

  return (
    <div className="space-y-4 pb-8 bg-gray-50 min-h-screen -m-6 p-4 md:p-6">
      {/* Top Compact Shiny Light Hero Banner (Single Pad) */}
      <div className="relative bg-gradient-to-r from-red-50 via-white to-red-100/60 rounded-2xl p-5 text-gray-800 shadow-sm border border-red-200 overflow-hidden">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center p-1 shadow-sm border border-red-300 overflow-hidden shrink-0">
              <img
                src="/augusta_seed_logo.jpg"
                alt="Augusta Seed Company"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="inline-flex items-center space-x-1 bg-red-100 text-red-800 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border border-red-300 mb-0.5">
                <Sparkles className="w-2.5 h-2.5 text-red-700" />
                <span>Enterprise ERP</span>
              </div>
              <h2 className="text-xl font-black tracking-tight uppercase text-gray-900">
                AUGUSTA SEED COMPANY
              </h2>
              <div className="flex items-center space-x-3 text-[11px] text-gray-600 flex-wrap gap-1">
                <span className="flex items-center space-x-1 font-medium">
                  <Building2 className="w-3.5 h-3.5 text-red-700" />
                  <span>Sahiwal</span>
                </span>
                <span>•</span>
                <span className="flex items-center space-x-1 font-medium">
                  <Phone className="w-3.5 h-3.5 text-red-700" />
                  <span>03023576036</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="bg-white/80 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-red-200 shadow-xs text-right">
              <p className="text-[9px] uppercase font-bold text-gray-500">Fiscal Period</p>
              <p className="text-xs font-black text-gray-900">2026-2027</p>
            </div>
            <div className="bg-white/80 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-red-200 shadow-xs text-right">
              <p className="text-[9px] uppercase font-bold text-gray-500">Status</p>
              <p className="text-xs font-bold text-red-700 flex items-center justify-end space-x-1">
                <ShieldCheck className="w-3 h-3 text-red-600 inline" />
                <span>MySQL Live</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Shortcut Tiles (Compact & Shiny Lite) */}
      <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-xs flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center space-x-1.5 px-1">
          <PlusCircle className="w-4 h-4 text-red-700" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-700">Quick Shortcuts:</span>
        </div>
        <div className="flex items-center space-x-1.5 flex-wrap gap-1.5">
          {quickActions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <button
                key={idx}
                onClick={() => onNavigate && onNavigate(action.tab)}
                className={`flex items-center space-x-1.5 ${action.color} px-3 py-1.5 rounded-lg text-[11px] font-bold shadow-xs transition-transform transform hover:scale-102 cursor-pointer`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI Cards Grid (Compact & Shiny Light) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {kpiCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`relative bg-gradient-to-br ${card.gradient} rounded-xl p-4 text-gray-900 shadow-xs overflow-hidden border border-red-200/60 hover:shadow-md transition-all`}
            >
              <div className="absolute right-3 -bottom-3 opacity-10 transform rotate-12 pointer-events-none">
                <Icon className="w-20 h-20 text-red-900" />
              </div>
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-red-100 text-red-800 mb-1 border border-red-200">
                    {card.badge}
                  </span>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-600">{card.title}</p>
                  <p className="text-lg font-black tracking-tight mt-0.5 text-gray-900">{card.value}</p>
                </div>
                <div className="w-9 h-9 rounded-lg bg-white shadow-xs flex items-center justify-center border border-red-200 shrink-0">
                  <Icon className="w-4 h-4 text-red-700" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Financial Performance Visualizer & Recent Transactions Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Visualizer */}
        <div className="lg:col-span-2 bg-white rounded-xl p-4 border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-red-700" />
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide">Financial Performance Visualizer</h3>
            </div>
            <span className="text-[11px] font-semibold text-gray-500">Live Cumulative Metrics</span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-[11px] font-bold uppercase mb-1">
                <span className="text-red-800">Total Seed Sales Revenue</span>
                <span className="text-gray-900 font-mono">PKR {stats.totalSales.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden p-0.5 shadow-inner">
                <div
                  className="bg-gradient-to-r from-red-600 to-red-800 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${salesPct}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-bold uppercase mb-1">
                <span className="text-gray-800">Total Procurements / Purchases</span>
                <span className="text-gray-900 font-mono">PKR {stats.totalPurchases.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden p-0.5 shadow-inner">
                <div
                  className="bg-gradient-to-r from-gray-700 to-gray-900 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${purchasePct}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-emerald-50/50 border border-emerald-200 rounded-lg p-3 text-center">
                <p className="text-[10px] font-semibold uppercase text-emerald-800 mb-0.5">Cash Inflows (CRV)</p>
                <p className="text-sm font-black text-emerald-950">PKR {stats.cashReceipts.toLocaleString()}</p>
              </div>
              <div className="bg-red-50/50 border border-red-200 rounded-lg p-3 text-center">
                <p className="text-[10px] font-semibold uppercase text-red-800 mb-0.5">Cash Outflows (CPV)</p>
                <p className="text-sm font-black text-red-950">PKR {stats.cashPayments.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Compact Summary Pad */}
        <div className="bg-gradient-to-br from-red-50 via-white to-red-100/50 text-gray-800 rounded-xl p-4 shadow-xs flex flex-col justify-between border border-red-200">
          <div className="space-y-3">
            <div className="flex items-center space-x-1.5 text-red-700">
              <Sparkles className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider">ERP Highlights</h3>
            </div>
            <p className="text-[11px] text-gray-600 leading-relaxed">
              Certified seed inventory, double-entry vouchers, account ledgers, and barcode/maund unit management.
            </p>
            <div className="space-y-2 pt-1 text-[11px]">
              <div className="flex justify-between bg-white px-2.5 py-1.5 rounded-lg border border-red-200 shadow-xs">
                <span className="text-gray-500 font-medium">Chart of Accounts:</span>
                <span className="font-bold text-gray-900">{stats.totalAccounts}</span>
              </div>
              <div className="flex justify-between bg-white px-2.5 py-1.5 rounded-lg border border-red-200 shadow-xs">
                <span className="text-gray-500 font-medium">Seed Varieties:</span>
                <span className="font-bold text-gray-900">{stats.totalProducts}</span>
              </div>
              <div className="flex justify-between bg-white px-2.5 py-1.5 rounded-lg border border-red-200 shadow-xs">
                <span className="text-gray-500 font-medium">Cash Reserve:</span>
                <span className="font-bold text-red-700">PKR {stats.cashBalance.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div className="pt-4">
            <button
              onClick={() => onNavigate && onNavigate('ledger')}
              className="w-full bg-red-700 text-white hover:bg-red-800 py-2 rounded-lg text-[11px] font-extrabold uppercase tracking-wider transition-colors shadow-xs cursor-pointer"
            >
              View Detailed Ledgers &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-700 flex items-center justify-center border border-red-200">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide">Recent Transactions Feed</h3>
              <p className="text-[10px] text-gray-500">Click any row to inspect details</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate && onNavigate('daily_transaction_report')}
            className="text-[11px] font-bold text-red-700 hover:text-red-900 underline cursor-pointer"
          >
            View Daily Report &rarr;
          </button>
        </div>

        {stats.recentTransactions.length === 0 ? (
          <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <p className="text-xs font-medium">No transactions recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-[10px] font-semibold uppercase text-gray-500 bg-gray-50">
                  <th className="py-2.5 px-3 rounded-l-lg">Date</th>
                  <th className="py-2.5 px-3">Transaction Type</th>
                  <th className="py-2.5 px-3">Reference No</th>
                  <th className="py-2.5 px-3 text-right rounded-r-lg">Amount (PKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {stats.recentTransactions.map((tx: any, idx: number) => {
                  let targetTab = 'sales_inv';
                  let badgeColor = 'bg-gray-100 text-gray-800 border border-gray-200';
                  if (tx.type === 'Sale Invoice') {
                    targetTab = 'sales_inv';
                    badgeColor = 'bg-red-50 text-red-800 border border-red-200';
                  } else if (tx.type === 'Purchase Invoice') {
                    targetTab = 'purchase_inv';
                    badgeColor = 'bg-zinc-100 text-zinc-800 border border-zinc-300';
                  } else if (tx.type === 'CASH PAYMENT') {
                    targetTab = 'cpv';
                    badgeColor = 'bg-red-100 text-red-900 border border-red-300';
                  } else if (tx.type === 'CASH RECEIPT') {
                    targetTab = 'crv';
                    badgeColor = 'bg-emerald-100 text-emerald-900 border border-emerald-300';
                  } else if (tx.type === 'JOURNAL') {
                    targetTab = 'jv';
                    badgeColor = 'bg-blue-100 text-blue-900 border border-blue-300';
                  }

                  return (
                    <tr
                      key={idx}
                      className="hover:bg-red-50/40 cursor-pointer transition-colors group"
                      onClick={() => onNavigate && onNavigate(targetTab, tx.ref)}
                      title="Click to open this transaction"
                    >
                      <td className="py-2.5 px-3 text-gray-600 font-mono text-[11px] font-medium">{tx.date}</td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-md ${badgeColor}`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-red-800 font-mono font-bold group-hover:underline text-[11px]">
                        {tx.ref}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-gray-900 text-[11px]">
                        {tx.amount.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
