import React, { useState } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  MapPin,
  Package,
  Building,
  Receipt,
  FileText,
  FileSpreadsheet,
  BarChart3,
  ShieldUser,
  ShoppingBag,
  RotateCcw,
  Database,
  Calendar
} from 'lucide-react';

export type ActiveTab =
  | 'dashboard'
  | 'accounts'
  | 'staff'
  | 'territories'
  | 'products'
  | 'company'
  | 'cpv'
  | 'crv'
  | 'jv'
  | 'sales_inv'
  | 'purchase_inv'
  | 'sales_ret'
  | 'purchase_ret'
  | 'ledger'
  | 'product_ledger'
  | 'trial_balance'
  | 'sundry_debtors'
  | 'sales_report'
  | 'purchase_report'
  | 'sales_summary'
  | 'purchase_summary'
  | 'sales_staff_balance'
  | 'daily_transaction_report'
  | 'mysql_database'
  | 'users';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isAdmin: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isAdmin }) => {
  const [isHovered, setIsHovered] = useState(false);

  const menuGroups = [
    {
      title: 'Main',
      items: [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }]
    },
    {
      title: 'Masters & Setup',
      items: [
        { id: 'accounts', label: 'Chart of Accounts', icon: BookOpen },
        { id: 'products', label: 'Product & Seed Catalog', icon: Package },
        { id: 'staff', label: 'Sales Staff & Officers', icon: Users },
        { id: 'territories', label: 'Sales Territories', icon: MapPin },
        { id: 'company', label: 'Company Profile', icon: Building }
      ]
    },
    {
      title: 'Financial Vouchers',
      items: [
        { id: 'cpv', label: 'Cash Payment (CPV)', icon: Receipt },
        { id: 'crv', label: 'Cash Receipt (CRV)', icon: Receipt },
        { id: 'jv', label: 'Journal Voucher (JV)', icon: FileSpreadsheet }
      ]
    },
    {
      title: 'Billing & Returns',
      items: [
        { id: 'sales_inv', label: 'Sales Invoice', icon: ShoppingBag },
        { id: 'purchase_inv', label: 'Purchase Invoice', icon: ShoppingBag },
        { id: 'sales_ret', label: 'Sales Return', icon: RotateCcw },
        { id: 'purchase_ret', label: 'Purchase Return', icon: RotateCcw }
      ]
    },
    {
      title: 'Ledgers & Reports',
      items: [
        { id: 'ledger', label: 'Party & General Ledger', icon: FileText },
        { id: 'product_ledger', label: 'Seed Stock Ledger', icon: Package },
        { id: 'trial_balance', label: 'Trial Balance', icon: BarChart3 },
        { id: 'sundry_debtors', label: 'Sundry Debtors List', icon: Users },
        { id: 'daily_transaction_report', label: 'Daily Transaction Register', icon: Calendar },
        { id: 'sales_report', label: 'Sales Report', icon: BarChart3 },
        { id: 'purchase_report', label: 'Purchase Report', icon: BarChart3 },
        { id: 'sales_summary', label: 'Sales Summary', icon: BarChart3 },
        { id: 'purchase_summary', label: 'Purchases Summary', icon: BarChart3 },
        { id: 'sales_staff_balance', label: 'Sales Staff Balance List', icon: Users }
      ]
    },
    ...(isAdmin
      ? [
          {
            title: 'Administration',
            items: [
              { id: 'mysql_database', label: 'MySQL Database & Backup', icon: Database },
              { id: 'users', label: 'User Management', icon: ShieldUser }
            ]
          }
        ]
      : [])
  ];

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`bg-white border-r border-gray-200 flex flex-col shrink-0 overflow-y-auto transition-all duration-300 z-20 ${
        isHovered ? 'w-64 shadow-xl' : 'w-16'
      }`}
    >
      <div className="p-3 space-y-5">
        {menuGroups.map((group, idx) => (
          <div key={idx}>
            {isHovered && (
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 px-3">
                {group.title}
              </p>
            )}
            <nav className="space-y-1">
              {group.items.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as ActiveTab)}
                    title={!isHovered ? item.label : undefined}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-red-50 text-red-900 font-bold border-l-4 border-red-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    } ${!isHovered ? 'justify-center px-0' : ''}`}
                  >
                    <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-red-700' : 'text-gray-500'}`} />
                    {isHovered && <span className="truncate">{item.label}</span>}
                  </button>
                );
              })}
            </nav>
          </div>
        ))}
      </div>
      {isHovered && (
        <div className="mt-auto p-4 border-t border-gray-100 bg-gray-50">
          <p className="text-xs text-gray-800 font-bold">Augusta Seed Company</p>
          <p className="text-[10px] text-gray-500 mt-0.5">United Farm Road, Sahiwal</p>
          <p className="text-[10px] text-red-700 font-semibold mt-0.5">PH: 03023576036</p>
        </div>
      )}
    </aside>
  );
};
