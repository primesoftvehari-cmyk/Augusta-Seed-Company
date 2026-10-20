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
      <div className="p-16 text-center text-gray-500 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-red-700 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-semibold text-sm tracking-wider uppercase">Loading Augusta Seed Company Enterprise Command Center...</p>
      </div>
    );
  }

  const kpiCards = [
    {
      title: 'Current Cash Balance',
      value: `PKR ${stats.cashBalance.toLocaleString()}`,
      icon: Wallet,
      gradient: 'from-red-900 to-black',
      textColor: 'text-red-50',
      badge: 'Liquid Assets'
    },
    {
      title: "Today's Sales",
      value: `PKR ${stats.todaysSales.toLocaleString()}`,
      icon: TrendingUp,
      gradient: 'from-zinc-900 to-zinc-800',
      textColor: 'text-zinc-50',
      badge: 'Live Revenue'
    },
    {
      title: "Today's Purchases",
      value: `PKR ${stats.todaysPurchases.toLocaleString()}`,
      icon: TrendingDown,
      gradient: 'from-red-800 to-zinc-900',
      textColor: 'text-red-50',
      badge: 'Live Procurements'
    },
    {
      title: 'Total Seed Sales',
      value: `PKR ${stats.totalSales.toLocaleString()}`,
      icon: ArrowUpRight,
      gradient: 'from-black to-red-950',
      textColor: 'text-red-50',
      badge: 'Cumulative'
    },
    {
      title: 'Total Procurements',
      value: `PKR ${stats.totalPurchases.toLocaleString()}`,
      icon: ArrowDownLeft,
      gradient: 'from-zinc-800 to-black',
      textColor: 'text-zinc-50',
      badge: 'Cumulative'
    },
    {
      title: 'Cash Receipts (CRV)',
      value: `PKR ${stats.cashReceipts.toLocaleString()}`,
      icon: DollarSign,
      gradient: 'from-red-700 to-zinc-900',
      textColor: 'text-red-50',
      badge: 'Inflows'
    },
    {
      title: 'Cash Payments (CPV)',
      value: `PKR ${stats.cashPayments.toLocaleString()}`,
      icon: DollarSign,
      gradient: 'from-zinc-900 to-red-950',
      textColor: 'text-zinc-50',
      badge: 'Outflows'
    },
    {
      title: 'Chart of Accounts',
      value: stats.totalAccounts,
      icon: BookOpen,
      gradient: 'from-black to-zinc-900',
      textColor: 'text-zinc-50',
      badge: 'Ledger Heads'
    },
    {
      title: 'Certified Seed Varieties',
      value: stats.totalProducts,
      icon: Package,
      gradient: 'from-red-950 to-black',
      textColor: 'text-red-50',
      badge: 'Inventory'
    }
  ];

  const quickActions = [
    { label: 'New Sales Invoice', tab: 'sales_inv', icon: ShoppingBag, color: 'bg-red-700 hover:bg-red-800' },
    { label: 'New Purchase', tab: 'purchase_inv', icon: ShoppingBag, color: 'bg-black hover:bg-zinc-800' },
    { label: 'Cash Payment', tab: 'cpv', icon: Receipt, color: 'bg-red-800 hover:bg-red-900' },
    { label: 'Cash Receipt', tab: 'crv', icon: Receipt, color: 'bg-zinc-900 hover:bg-black' },
    { label: 'Account Ledger', tab: 'ledger', icon: FileText, color: 'bg-red-700 hover:bg-red-800' },
    { label: 'Trial Balance', tab: 'trial_balance', icon: BarChart3, color: 'bg-black hover:bg-zinc-800' }
  ];

  const maxVal = Math.max(stats.totalSales, stats.totalPurchases, 1);
  const salesPct = Math.min(Math.round((stats.totalSales / maxVal) * 100), 100);
  const purchasePct = Math.min(Math.round((stats.totalPurchases / maxVal) * 100), 100);

  return (
    <div className="space-y-6 pb-12 bg-gray-100 min-h-screen -m-6 p-6">
      {/* Top Graphic Hero Banner */}
      <div className="relative bg-gradient-to-br from-black via-zinc-900 to-red-950 rounded-3xl p-8 text-white shadow-2xl overflow-hidden border border-zinc-800">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute right-1/3 -bottom-16 w-80 h-80 bg-red-900/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex items-center justify-between flex-wrap gap-6">
          <div className="flex items-center space-x-5">
            <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center p-1.5 shadow-xl border-2 border-red-700 overflow-hidden shrink-0 transform hover:scale-105 transition-transform">
              <img
                src="/augusta_seed_logo.jpg"
                alt="Augusta Seed Company"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="space-y-1">
              <div className="inline-flex items-center space-x-1.5 bg-zinc-900 text-red-400 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border border-red-800">
                <Sparkles className="w-3 h-3" />
                <span>Enterprise ERP Command Center</span>
              </div>
              <h2 className="text-3xl font-black tracking-wide uppercase text-white">
                AUGUSTA SEED COMPANY
              </h2>
              <div className="flex items-center space-x-4 text-xs text-zinc-300 flex-wrap gap-2 pt-0.5">
                <span className="flex items-center space-x-1.5 font-medium">
                  <Building2 className="w-4 h-4 text-red-500" />
                  <span>UNITED FARM ROAD, GULSHAN-E-ALI BY PASS, SAHIWAL</span>
                </span>
                <span>•</span>
                <span className="flex items-center space-x-1.5 font-medium">
                  <Phone className="w-4 h-4 text-red-500" />
                  <span>03023576036</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="bg-zinc-900/90 backdrop-blur-md px-5 py-3 rounded-2xl border border-zinc-800 shadow-lg text-right">
              <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Active Fiscal Period</p>
              <p className="text-base font-extrabold text-white">2026 - 2027</p>
            </div>
            <div className="bg-zinc-900/90 backdrop-blur-md px-5 py-3 rounded-2xl border border-zinc-800 shadow-lg text-right">
              <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">System Status</p>
              <p className="text-xs font-bold text-red-400 flex items-center justify-end space-x-1 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-red-500 inline" />
                <span>Secure / MySQL Live</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Shortcut Tiles */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center space-x-2 px-2">
          <PlusCircle className="w-5 h-5 text-red-700" />
          <span className="text-xs font-bold uppercase tracking-wider text-gray-700">Quick Navigation:</span>
        </div>
        <div className="flex items-center space-x-2 flex-wrap gap-2">
          {quickActions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <button
                key={idx}
                onClick={() => onNavigate && onNavigate(action.tab)}
                className={`flex items-center space-x-2 ${action.color} text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all transform hover:-translate-y-0.5 cursor-pointer`}
              >
                <Icon className="w-4 h-4" />
                <span>{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {kpiCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`relative bg-gradient-to-br ${card.gradient} rounded-2xl p-6 text-white shadow-xl overflow-hidden transform hover:-translate-y-1 transition-all duration-300 border border-zinc-800`}
            >
              <div className="absolute right-4 -bottom-4 opacity-15 transform rotate-12 pointer-events-none">
                <Icon className="w-28 h-28" />
              </div>
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/15 text-white mb-2 backdrop-blur-xs border border-white/20">
                    {card.badge}
                  </span>
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-300">{card.title}</p>
                  <p className="text-2xl font-black tracking-tight mt-1 text-white">{card.value}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center shadow-inner border border-white/20 shrink-0">
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Graphic Analytics & Overview Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-red-700" />
              <h3 className="text-base font-bold text-gray-800 uppercase tracking-wide">Financial Performance Visualizer</h3>
            </div>
            <span className="text-xs font-semibold text-gray-500">Live Cumulative Metrics</span>
          </div>

          <div className="space-y-5">
            <div>
              <div className="flex justify-between text-xs font-bold uppercase mb-1.5">
                <span className="text-red-800">Total Seed Sales Revenue</span>
                <span className="text-gray-900 font-mono">PKR {stats.totalSales.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3.5 overflow-hidden p-0.5 shadow-inner">
                <div
                  className="bg-gradient-to-r from-red-700 to-black h-full rounded-full transition-all duration-1000"
                  style={{ width: `${salesPct}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold uppercase mb-1.5">
                <span className="text-zinc-800">Total Procurements / Purchases</span>
                <span className="text-gray-900 font-mono">PKR {stats.totalPurchases.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3.5 overflow-hidden p-0.5 shadow-inner">
                <div
                  className="bg-gradient-to-r from-zinc-700 to-zinc-900 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${purchasePct}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
                <p className="text-xs font-semibold uppercase text-red-800 mb-1">Cash Inflows (CRV)</p>
                <p className="text-lg font-black text-gray-900">PKR {stats.cashReceipts.toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
                <p className="text-xs font-semibold uppercase text-zinc-800 mb-1">Cash Outflows (CPV)</p>
                <p className="text-lg font-black text-gray-900">PKR {stats.cashPayments.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick System Summary Card */}
        <div className="bg-gradient-to-br from-black via-zinc-900 to-red-950 text-white rounded-2xl p-6 shadow-xl flex flex-col justify-between border border-zinc-800">
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-red-500">
              <Sparkles className="w-5 h-5" />
              <h3 className="text-base font-bold uppercase tracking-wider">Augusta ERP Highlights</h3>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Fully integrated accounting, double-entry vouchers, seed inventory management, sales staff tracking, and certified seed unit conversions (Bag/Maund).
            </p>
            <div className="space-y-2.5 pt-2 text-xs">
              <div className="flex justify-between bg-white/5 px-3 py-2 rounded-xl backdrop-blur-xs border border-white/10">
                <span className="text-zinc-400 font-medium">Chart of Accounts Heads:</span>
                <span className="font-bold text-white">{stats.totalAccounts}</span>
              </div>
              <div className="flex justify-between bg-white/5 px-3 py-2 rounded-xl backdrop-blur-xs border border-white/10">
                <span className="text-zinc-400 font-medium">Certified Seed Varieties:</span>
                <span className="font-bold text-white">{stats.totalProducts}</span>
              </div>
              <div className="flex justify-between bg-white/5 px-3 py-2 rounded-xl backdrop-blur-xs border border-white/10">
                <span className="text-zinc-400 font-medium">Liquid Cash Reserve:</span>
                <span className="font-bold text-red-400">PKR {stats.cashBalance.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div className="pt-6">
            <button
              onClick={() => onNavigate && onNavigate('ledger')}
              className="w-full bg-red-700 text-white hover:bg-red-800 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-colors shadow-lg cursor-pointer"
            >
              View Detailed Ledgers &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gray-100 text-red-700 flex items-center justify-center shadow-inner border border-gray-200">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-800">Recent Transactions Feed</h3>
              <p className="text-xs text-gray-500">Click on any reference number to inspect details</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate && onNavigate('daily_transaction_report')}
            className="text-xs font-bold text-red-700 hover:text-red-900 underline cursor-pointer"
          >
            View All Daily Transactions &rarr;
          </button>
        </div>

        {stats.recentTransactions.length === 0 ? (
          <div className="text-center py-16 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <p className="font-medium">No transactions recorded yet.</p>
            <p className="text-xs text-gray-400 mt-1">Add sales invoices, purchase invoices, or cash vouchers to see entries here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-xs font-semibold uppercase text-gray-500 bg-gray-50">
                  <th className="py-3.5 px-4 rounded-l-xl">Date</th>
                  <th className="py-3.5 px-4">Transaction Type</th>
                  <th className="py-3.5 px-4">Reference No</th>
                  <th className="py-3.5 px-4 text-right rounded-r-xl">Amount (PKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
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
                    badgeColor = 'bg-zinc-200 text-zinc-900 border border-zinc-300';
                  } else if (tx.type === 'JOURNAL') {
                    targetTab = 'jv';
                    badgeColor = 'bg-gray-200 text-gray-900 border border-gray-300';
                  }

                  return (
                    <tr
                      key={idx}
                      className="hover:bg-red-50/50 cursor-pointer transition-colors group"
                      onClick={() => onNavigate && onNavigate(targetTab, tx.ref)}
                      title="Click to open this transaction"
                    >
                      <td className="py-3.5 px-4 text-gray-600 font-mono text-xs font-medium">{tx.date}</td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex px-2.5 py-1 text-xs font-bold rounded-lg ${badgeColor}`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-red-800 font-mono font-bold group-hover:underline">
                        {tx.ref}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-gray-900">
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
