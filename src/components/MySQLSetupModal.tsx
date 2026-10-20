import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { DatabaseStatus, MySQLConfig } from '../types';
import {
  X,
  Database,
  CheckCircle2,
  Copy,
  Terminal,
  Download,
  RefreshCw,
  AlertCircle,
  Server,
  FileText,
  Check,
  Globe
} from 'lucide-react';

interface MySQLSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigured: () => void;
}

export const MySQLSetupModal: React.FC<MySQLSetupModalProps> = ({ isOpen, onClose, onConfigured }) => {
  const [status, setStatus] = useState<DatabaseStatus>({ type: 'local', connected: false });
  const [host, setHost] = useState('mysql.gb.stackcp.com');
  const [port, setPort] = useState(45713);
  const [user, setUser] = useState('nasir-8e7b');
  const [password, setPassword] = useState('GtPyXs|u4Oc');
  const [database, setDatabase] = useState('AugustaSeedCompany-3530313592f0');
  const [ssl, setSsl] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'stackcp' | 'sql'>('config');
  const [sqlMode, setSqlMode] = useState<'schema' | 'full'>('schema');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
    isStackcp?: boolean;
    suggestedHost?: string;
  } | null>(null);
  const [sqlSchema, setSqlSchema] = useState('');
  const [fullSqlDump, setFullSqlDump] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadStatus();
      loadSchema();
    }
  }, [isOpen]);

  const loadStatus = async () => {
    const s = await db.getDatabaseStatus();
    setStatus(s);
    if (s.host) setHost(s.host);
    if (s.port) setPort(s.port);
    if (s.database) setDatabase(s.database);
    if (s.user) setUser(s.user);
    if (s.connected) {
      setMessage({ type: 'success', text: s.message || 'Connected to MySQL Server successfully!' });
    } else if (s.message && !s.message.includes('Running on local')) {
      setMessage({
        type: 'error',
        text: s.message,
        isStackcp: s.isStackcp,
        suggestedHost: s.suggestedHost
      });
    }
  };

  const loadSchema = async () => {
    const schema = await db.getMySQLSchema();
    setSqlSchema(schema);
    const dump = await db.getMySQLExportDataSql();
    setFullSqlDump(dump);
  };

  if (!isOpen) return null;

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const cleanHost = host.trim();
    const cleanPort = Number(port);
    const config: MySQLConfig = {
      host: cleanHost,
      port: cleanPort,
      user: user.trim(),
      password,
      database: database.trim(),
      ssl
    };

    const res = await db.setMySQLConfig(config);
    setLoading(false);
    if (res.success) {
      setMessage({ type: 'success', text: res.message || 'Connected to MySQL successfully!' });
      await loadStatus();
      onConfigured();
    } else {
      const isStackcp = Boolean(
        res.isStackcp ||
        cleanHost.toLowerCase().includes('stackcp') ||
        res.error?.toLowerCase().includes('stackcp')
      );
      setMessage({
        type: 'error',
        text: res.error || `Could not connect to ${cleanHost}:${cleanPort}`,
        isStackcp,
        suggestedHost: res.suggestedHost || cleanHost
      });
    }
  };

  const handleDisconnect = async () => {
    await db.disconnectMySQL();
    await loadStatus();
    setMessage({ type: 'success', text: 'Disconnected from MySQL. Switched to high-performance local storage engine.' });
    onConfigured();
  };

  const handleCopyText = (text: string, id?: string) => {
    navigator.clipboard.writeText(text);
    if (id) {
      setCopiedCmd(id);
      setTimeout(() => setCopiedCmd(null), 2000);
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadSql = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between bg-emerald-900 px-6 py-4 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-800 flex items-center justify-center border border-emerald-700 shadow-inner">
              <Database className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold">MySQL Database Configuration</h2>
              <p className="text-xs text-emerald-200">
                Augusta Seed Company • Database: <span className="font-mono text-white font-semibold">AugustaSeedCompany-3530313592f0</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status banner */}
        <div
          className={`px-6 py-2.5 flex items-center justify-between text-xs font-semibold ${
            status.connected
              ? 'bg-emerald-100 text-emerald-900 border-b border-emerald-200'
              : 'bg-amber-50 text-amber-900 border-b border-amber-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                status.connected ? 'bg-emerald-600 animate-pulse' : 'bg-amber-600'
              }`}
            ></span>
            <span>
              {status.connected
                ? `MySQL Status: Live connected to database "${status.database}" on ${status.host}:${status.port || 45713}`
                : 'Storage Status: Built-in High-Performance Storage Engine Active (All records persistent & safe)'}
            </span>
          </div>
          <button
            onClick={loadStatus}
            className="text-xs underline hover:no-underline flex items-center space-x-1 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-gray-200 bg-gray-50 px-6">
          <button
            onClick={() => setActiveTab('config')}
            className={`py-3 px-4 font-semibold text-sm border-b-2 transition-colors flex items-center space-x-2 cursor-pointer ${
              activeTab === 'config'
                ? 'border-emerald-700 text-emerald-800 bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Connection Parameters</span>
          </button>
          <button
            onClick={() => setActiveTab('stackcp')}
            className={`py-3 px-4 font-semibold text-sm border-b-2 transition-colors flex items-center space-x-2 cursor-pointer ${
              activeTab === 'stackcp'
                ? 'border-emerald-700 text-emerald-800 bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Globe className="w-4 h-4 text-emerald-600" />
            <span>StackCP Whitelist Guide</span>
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`py-3 px-4 font-semibold text-sm border-b-2 transition-colors flex items-center space-x-2 cursor-pointer ${
              activeTab === 'sql'
                ? 'border-emerald-700 text-emerald-800 bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>phpMyAdmin SQL Scripts</span>
          </button>
        </div>

        {/* Tab content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: CONNECTION PARAMETERS */}
          {activeTab === 'config' && (
            <div className="space-y-4">
              {message && (
                <div
                  className={`p-4 rounded-xl flex items-center space-x-3 text-sm ${
                    message.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {message.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
                  )}
                  <span className="font-medium text-xs leading-relaxed">{message.text}</span>
                </div>
              )}

              <form onSubmit={handleConnect} className="space-y-4">
                <div className="rounded-xl bg-emerald-50/70 p-4 text-xs text-emerald-900 border border-emerald-200 space-y-1">
                  <p className="font-bold text-emerald-950 flex items-center space-x-1.5">
                    <Database className="w-4 h-4 text-emerald-700" />
                    <span>StackCP MySQL Cloud Integration</span>
                  </p>
                  <p className="text-gray-700">
                    Connect to your StackCP MySQL database. Tables, indexes, and initial company records are verified automatically upon connection.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                      MySQL Host / IP Address
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="mysql.gb.stackcp.com"
                      value={host}
                      onChange={e => setHost(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-hidden font-mono"
                    />
                    <p className="text-[11px] text-gray-500 mt-1">
                      StackCP remote gateway: <span className="font-mono text-emerald-700 font-semibold">mysql.gb.stackcp.com</span>
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">Port</label>
                    <input
                      type="number"
                      required
                      value={port}
                      onChange={e => setPort(Number(e.target.value))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-hidden font-mono"
                    />
                    <p className="text-[11px] text-gray-500 mt-1">
                      Assigned StackCP port: <span className="font-mono font-semibold">45713</span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                      Database Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="AugustaSeedCompany-3530313592f0"
                      value={database}
                      onChange={e => setDatabase(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-hidden font-mono text-xs font-semibold text-emerald-900 bg-emerald-50/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">Username</label>
                    <input
                      type="text"
                      required
                      placeholder="nasir-8e7b"
                      value={user}
                      onChange={e => setUser(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-hidden font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    placeholder="Database password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-hidden font-mono"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="checkbox"
                    id="sslCheck"
                    checked={ssl}
                    onChange={e => setSsl(e.target.checked)}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="sslCheck" className="text-xs text-gray-700 font-medium cursor-pointer">
                    Enable SSL / TLS Encryption
                  </label>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  {status.connected ? (
                    <button
                      type="button"
                      onClick={handleDisconnect}
                      className="px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors cursor-pointer"
                    >
                      Disconnect MySQL (Use Built-in Storage)
                    </button>
                  ) : (
                    <span className="text-xs text-gray-500 font-medium">
                      Built-in storage engine currently active
                    </span>
                  )}
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2.5 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-colors flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
                    >
                      <Database className="w-4 h-4" />
                      <span>{loading ? 'Testing & Connecting...' : 'Connect & Sync MySQL'}</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: STACKCP WHITELIST GUIDE */}
          {activeTab === 'stackcp' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl space-y-2">
                <h3 className="text-sm font-bold text-emerald-950 flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-emerald-700" />
                  <span>StackCP Remote MySQL Access Configuration</span>
                </h3>
                <p className="text-xs text-emerald-900 leading-relaxed">
                  StackCP hosting security blocks remote connections by default until an Access Host is whitelisted. To allow this cloud application to connect, follow these 3 quick steps:
                </p>
              </div>

              <div className="space-y-4">
                <div className="border border-gray-200 rounded-xl p-4 bg-white space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-800 text-white text-xs font-bold flex items-center justify-center">1</span>
                    <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                      Log in to StackCP Control Panel
                    </h4>
                  </div>
                  <p className="text-xs text-gray-700 pl-8 leading-relaxed">
                    Open your StackCP hosting control panel for <strong className="text-emerald-800">Augusta Seed Company</strong>.
                  </p>
                </div>

                <div className="border border-amber-200 rounded-xl p-4 bg-amber-50/50 space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-full bg-amber-600 text-white text-xs font-bold flex items-center justify-center">2</span>
                    <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                      Add Access Host in Remote MySQL Access
                    </h4>
                  </div>
                  <div className="text-xs text-amber-950 pl-8 space-y-1.5 leading-relaxed">
                    <ol className="list-decimal pl-5 space-y-1">
                      <li>Go to <strong>Web Tools</strong> → click <strong>Remote MySQL Access</strong>.</li>
                      <li>Under <strong>Add Access Host</strong>, select user <code className="font-mono font-bold bg-white px-1.5 py-0.5 rounded text-emerald-800">{user}</code>.</li>
                      <li>
                        In the <strong>Access Host</strong> field, enter <code className="font-mono font-bold bg-white px-1.5 py-0.5 rounded text-emerald-800">%</code> (wildcard allowing any connection) or the outbound cloud IP:
                      </li>
                    </ol>
                    <div className="flex items-center space-x-2 pt-1">
                      <div className="bg-gray-900 text-emerald-400 font-mono text-xs px-3 py-1.5 rounded-lg flex-1">
                        {status.outboundIp || '34.96.48.119'}
                      </div>
                      <button
                        onClick={() => handleCopyText(status.outboundIp || '34.96.48.119', 'ip')}
                        className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-xs flex items-center space-x-1 cursor-pointer"
                      >
                        {copiedCmd === 'ip' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedCmd === 'ip' ? 'Copied' : 'Copy IP'}</span>
                      </button>
                    </div>
                    <li>Click <strong>Add Host</strong>.</li>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-xl p-4 bg-white space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-800 text-white text-xs font-bold flex items-center justify-center">3</span>
                    <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                      Return here and click "Connect & Sync MySQL"
                    </h4>
                  </div>
                  <p className="text-xs text-gray-700 pl-8 leading-relaxed">
                    Once the host is added in StackCP, click the button below to connect immediately.
                  </p>
                  <div className="pl-8 pt-2">
                    <button
                      onClick={() => setActiveTab('config')}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Go to Connection Tab
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PHPMYADMIN SQL SCRIPTS */}
          {activeTab === 'sql' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2 bg-gray-50 p-3 rounded-xl border border-gray-200">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSqlMode('schema')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      sqlMode === 'schema'
                        ? 'bg-emerald-700 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    1. Table Creation DDL (Schema)
                  </button>
                  <button
                    onClick={() => setSqlMode('full')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center space-x-1.5 ${
                      sqlMode === 'full'
                        ? 'bg-emerald-700 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>2. Complete Database & Data Dump (phpMyAdmin)</span>
                  </button>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleCopyText(sqlMode === 'schema' ? sqlSchema : fullSqlDump)}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-medium cursor-pointer"
                  >
                    {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied to Clipboard!' : 'Copy SQL'}</span>
                  </button>
                  <button
                    onClick={() =>
                      handleDownloadSql(
                        sqlMode === 'schema' ? sqlSchema : fullSqlDump,
                        sqlMode === 'schema'
                          ? 'augusta_seed_company_mysql_schema.sql'
                          : 'augustaseed_database_backup.sql'
                      )
                    }
                    className="flex items-center space-x-1 px-3 py-1.5 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-xs font-medium cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .sql</span>
                  </button>
                </div>
              </div>

              <div className="text-xs text-gray-600 space-y-1">
                <p>
                  <strong>How to run in phpMyAdmin:</strong>
                </p>
                <ol className="list-decimal pl-5 space-y-0.5 text-gray-700">
                  <li>In StackCP, open <strong>phpMyAdmin</strong> from your MySQL databases section.</li>
                  <li>Click on the <strong>SQL</strong> tab at the top.</li>
                  <li>Paste the SQL script below and click <strong>Go</strong>.</li>
                </ol>
              </div>

              <pre className="p-4 bg-gray-950 text-emerald-400 text-xs rounded-xl font-mono overflow-x-auto max-h-96 border border-gray-800 leading-relaxed select-all">
                {sqlMode === 'schema' ? sqlSchema : fullSqlDump}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
