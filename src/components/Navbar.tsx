import React, { useState, useEffect } from 'react';
import { UserProfile, CompanyProfileData, DatabaseStatus } from '../types';
import { db } from '../services/db';
import { LogOut, Database, Shield, User as UserIcon, CheckCircle2 } from 'lucide-react';

interface NavbarProps {
  currentUser: UserProfile;
  companyProfile: CompanyProfileData;
  onLogout: () => void;
  onOpenMySQLModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentUser, companyProfile, onLogout, onOpenMySQLModal }) => {
  const [dbStatus, setDbStatus] = useState<DatabaseStatus>({ type: 'local', connected: false });

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    const s = await db.getDatabaseStatus();
    setDbStatus(s);
  };

  return (
    <header className="bg-black text-white shadow-md sticky top-0 z-30 border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center border-2 border-red-700 shadow-inner overflow-hidden p-0.5 shrink-0">
            <img
              src={companyProfile.logoUrl || '/augusta_seed_logo.jpg'}
              alt="Augusta Seed Company"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/augusta_seed_logo.jpg';
              }}
            />
          </div>
          <div>
            <h1 className="text-base font-black tracking-wider uppercase text-white flex items-center space-x-2">
              <span>{companyProfile.companyName || 'AUGUSTA SEED COMPANY'}</span>
            </h1>
            <p className="text-xs text-zinc-400 font-medium">
              {companyProfile.headOfficeAddress || 'UNITED FARM ROAD, GULSHAN-E-ALI BY PASS, SAHIWAL'} | PH: {companyProfile.phone || '03023576036'}
            </p>
          </div>
        </div>

        {/* Actions & User */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenMySQLModal}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              dbStatus.connected
                ? 'bg-zinc-900 text-red-100 border-red-700 shadow-xs'
                : 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:bg-zinc-800'
            }`}
            title="Configure MySQL Backend Database"
          >
            <Database className="w-3.5 h-3.5 text-red-500" />
            <span>{dbStatus.connected ? 'MySQL Connected' : 'MySQL Database'}</span>
            {dbStatus.connected ? (
              <CheckCircle2 className="w-3 h-3 text-red-500" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            )}
          </button>

          <div className="flex items-center space-x-2 bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800">
            {currentUser.role === 'ADMIN' ? (
              <Shield className="w-4 h-4 text-red-500" />
            ) : (
              <UserIcon className="w-4 h-4 text-zinc-400" />
            )}
            <div className="text-left">
              <p className="text-xs font-bold leading-tight text-white">{currentUser.fullName}</p>
              <p className="text-[10px] text-red-400 uppercase tracking-wider font-mono">{currentUser.role}</p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="flex items-center space-x-1 px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};
