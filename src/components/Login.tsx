import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { UserProfile, DatabaseStatus } from '../types';
import { Lock, User, ShieldCheck, Database, CheckCircle2 } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: UserProfile) => void;
  onOpenMySQLModal: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess, onOpenMySQLModal }) => {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState<DatabaseStatus>({ type: 'local', connected: false });

  useEffect(() => {
    checkDb();
  }, []);

  const checkDb = async () => {
    const s = await db.getDatabaseStatus();
    setDbStatus(s);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Password validation: 8 characters or alphanumeric
    if (!password || (password.length < 8 && !/^[a-zA-Z0-9]+$/.test(password))) {
      setError('Password must be at least 8 characters or alphanumeric.');
      return;
    }

    setLoading(true);

    try {
      const users = await db.getUsers();
      const input = usernameOrEmail.toLowerCase().trim();
      const found = users.find(
        u =>
          (u.username.toLowerCase() === input ||
            (u.email && u.email.toLowerCase() === input)) &&
          u.active
      );

      if (!found) {
        setError('Invalid login name or password.');
        setLoading(false);
        return;
      }

      // Verify password against stored user record password or fallback defaults
      const storedPwd = (found as any).password;
      if (storedPwd) {
        if (storedPwd !== password) {
          setError('Invalid login name or password.');
          setLoading(false);
          return;
        }
      } else {
        // Fallback for default seed accounts if password not explicitly set
        if (found.username === 'admin' && password !== 'admin123') {
          setError('Invalid login name or password.');
          setLoading(false);
          return;
        }
        if (found.username === 'accountant' && password !== 'nasir123') {
          setError('Invalid login name or password.');
          setLoading(false);
          return;
        }
      }

      onLoginSuccess(found);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fillDefaultAdmin = () => {
    setUsernameOrEmail('admin');
    setPassword('admin123');
  };

  const fillDefaultAccountant = () => {
    setUsernameOrEmail('accountant');
    setPassword('nasir123');
  };

  return (
    <div className="min-h-screen bg-radial-[at_top_left] from-emerald-950 via-emerald-900 to-gray-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-emerald-800/40">
        {/* Header Banner */}
        <div className="bg-emerald-900 p-6 text-center text-white relative">
          <button
            onClick={onOpenMySQLModal}
            className="absolute top-4 right-4 flex items-center space-x-1.5 bg-emerald-800/90 hover:bg-emerald-700 text-xs px-2.5 py-1.5 rounded-lg border border-emerald-600 transition-colors shadow-xs cursor-pointer"
            title="Configure MySQL Backend"
          >
            <Database className="w-3.5 h-3.5 text-emerald-300" />
            <span>{dbStatus.connected ? 'MySQL Live' : 'MySQL Setup'}</span>
            {dbStatus.connected && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
          </button>

          <div className="mx-auto w-20 h-20 rounded-2xl bg-white flex items-center justify-center mb-3 shadow-md border-2 border-emerald-400 p-1 overflow-hidden">
            <img
              src="/augusta_seed_logo.jpg"
              alt="Augusta Seed Company"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>

          <h1 className="text-xl font-black tracking-wide uppercase text-white">AUGUSTA SEED COMPANY</h1>
          <p className="text-xs text-emerald-200 mt-1 font-semibold">UNITED FARM ROAD, GULSHAN-E-ALI BY PASS, SAHIWAL</p>
          <p className="text-xs text-emerald-300 mt-0.5 font-medium">PH: 03023576036</p>
        </div>

        {/* Form Body */}
        <div className="p-8">
          <div className="mb-6 text-center">
            <h2 className="text-lg font-bold text-gray-800">Enterprise Accounting & ERP</h2>
            <p className="text-xs text-gray-500 mt-1">Sign in to manage certified seeds, ledgers, vouchers, and invoices</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                Username / Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={usernameOrEmail}
                  onChange={e => setUsernameOrEmail(e.target.value)}
                  placeholder="admin or accountant"
                  className="w-full pl-10 pr-3 py-2.5 text-sm rounded-lg border border-gray-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-2.5 text-sm rounded-lg border border-gray-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg shadow-md transition-colors text-sm flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{loading ? 'Authenticating...' : 'Sign In to ERP System'}</span>
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={fillDefaultAdmin}
                className="text-emerald-700 hover:underline font-semibold cursor-pointer"
              >
                Quick Fill Admin (admin)
              </button>
              <button
                type="button"
                onClick={fillDefaultAccountant}
                className="text-emerald-700 hover:underline font-semibold cursor-pointer"
              >
                Quick Fill Accountant (accountant)
              </button>
            </div>
            <p className="text-[11px] text-gray-400 text-center pt-1">
              StackCP MySQL Host: <span className="font-mono text-emerald-800">mysql.gb.stackcp.com:45713</span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-500 font-medium">Augusta Seed Company • Sahiwal</p>
        </div>
      </div>
    </div>
  );
};
