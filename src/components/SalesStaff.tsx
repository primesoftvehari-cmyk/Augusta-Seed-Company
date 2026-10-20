import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { SalesStaff, UserProfile, Territory } from '../types';
import { Plus, Search, Edit, Trash2, Printer } from 'lucide-react';

export const SalesStaffComponent: React.FC<{ currentUser: UserProfile }> = ({ currentUser }) => {
  const [staffList, setStaffList] = useState<SalesStaff[]>([]);
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<SalesStaff | null>(null);

  const [staffCode, setStaffCode] = useState('');
  const [staffName, setStaffName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [mobile, setMobile] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Sahiwal');
  const [territory, setTerritory] = useState('');
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const staff = await db.getSalesStaff();
    const terrs = await db.getTerritories();
    setStaffList(staff);
    setTerritories(terrs);
  };

  const handleOpenModal = (s?: SalesStaff) => {
    if (s) {
      setEditingStaff(s);
      setStaffCode(s.staffCode);
      setStaffName(s.staffName);
      setFatherName(s.fatherName);
      setMobile(s.mobile);
      setWhatsapp(s.whatsapp);
      setAddress(s.address);
      setCity(s.city);
      setTerritory(s.territory);
      setJoiningDate(s.joiningDate);
      setStatus(s.status);
      setRemarks(s.remarks || '');
    } else {
      setEditingStaff(null);
      setStaffCode(`STF-${Math.floor(100 + Math.random() * 900)}`);
      setStaffName('');
      setFatherName('');
      setMobile('');
      setWhatsapp('');
      setAddress('');
      setCity('Sahiwal');
      setTerritory(territories[0]?.territoryName || 'Sahiwal Head Office');
      setJoiningDate(new Date().toISOString().split('T')[0]);
      setStatus('Active');
      setRemarks('');
    }
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const newStaff: SalesStaff = {
      id: editingStaff ? editingStaff.id : `stf_${Date.now()}`,
      staffCode,
      staffName,
      fatherName,
      mobile,
      whatsapp,
      address,
      city,
      territory,
      joiningDate,
      status,
      remarks
    };

    await db.saveSalesStaff(newStaff);
    setShowModal(false);
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (currentUser.role !== 'ADMIN') {
      alert('Normal users cannot delete records.');
      return;
    }
    if (confirm('Delete this sales staff member?')) {
      await db.deleteSalesStaff(id);
      loadData();
    }
  };

  const filtered = staffList.filter(
    s =>
      s.staffName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.staffCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.territory.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Sales Staff & Field Officers</h2>
          <p className="text-sm text-gray-500">Manage field sales personnel and territory assignments for Augusta Seed Company</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print List</span>
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center space-x-2 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Sales Staff</span>
          </button>
        </div>
      </div>

      <div className="flex items-center space-x-4 bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search by staff code, name, or territory..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 text-sm rounded-lg border border-gray-300 focus:border-emerald-600 focus:outline-hidden"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200 text-xs font-semibold uppercase text-gray-500 bg-gray-50">
              <th className="py-3.5 px-4">Code</th>
              <th className="py-3.5 px-4">Staff Name / Father Name</th>
              <th className="py-3.5 px-4">Contact (Mobile / WhatsApp)</th>
              <th className="py-3.5 px-4">Territory / City</th>
              <th className="py-3.5 px-4">Joining Date</th>
              <th className="py-3.5 px-4 text-center">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400">
                  No sales staff registered. Click "Add Sales Staff" to create one.
                </td>
              </tr>
            ) : (
              filtered.map(s => (
                <tr key={s.id} className="hover:bg-gray-50/50">
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-800">{s.staffCode}</td>
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-gray-800">{s.staffName}</p>
                    <p className="text-xs text-gray-400">S/O: {s.fatherName}</p>
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="text-gray-800 font-mono font-semibold">{s.mobile}</p>
                    <p className="text-xs text-gray-500 font-mono">WA: {s.whatsapp || s.mobile}</p>
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-gray-800">{s.territory}</p>
                    <p className="text-xs text-gray-500">{s.city}</p>
                  </td>
                  <td className="py-3.5 px-4 text-gray-600 font-mono text-xs">{s.joiningDate}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                        s.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    {(currentUser.role === 'ADMIN' || !editingStaff) && (
                      <button
                        onClick={() => handleOpenModal(s)}
                        className="p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    {currentUser.role === 'ADMIN' && (
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="p-1.5 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white rounded-xl shadow-2xl overflow-hidden">
            <div className="bg-emerald-900 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="text-lg font-bold">{editingStaff ? 'Edit Sales Staff' : 'Add New Sales Staff'}</h3>
              <button onClick={() => setShowModal(false)} className="text-emerald-200 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Staff Code</label>
                  <input
                    type="text"
                    required
                    value={staffCode}
                    onChange={e => setStaffCode(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Staff Name</label>
                  <input
                    type="text"
                    required
                    value={staffName}
                    onChange={e => setStaffName(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-hidden font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Father Name</label>
                  <input
                    type="text"
                    value={fatherName}
                    onChange={e => setFatherName(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Mobile No</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 03023576036"
                    value={mobile}
                    onChange={e => setMobile(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">WhatsApp</label>
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={e => setWhatsapp(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Territory</label>
                  <input
                    type="text"
                    value={territory}
                    onChange={e => setTerritory(e.target.value)}
                    placeholder="e.g. Sahiwal Head Office, Chichawatni"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Joining Date</label>
                  <input
                    type="date"
                    value={joiningDate}
                    onChange={e => setJoiningDate(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm cursor-pointer"
                >
                  Save Sales Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
