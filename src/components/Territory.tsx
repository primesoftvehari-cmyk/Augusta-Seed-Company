import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Territory, UserProfile } from '../types';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';

export const TerritoryComponent: React.FC<{ currentUser: UserProfile }> = ({ currentUser }) => {
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTerritory, setEditingTerritory] = useState<Territory | null>(null);

  const [territoryCode, setTerritoryCode] = useState('');
  const [territoryName, setTerritoryName] = useState('');
  const [region, setRegion] = useState('Sahiwal Division');
  const [assignedManager, setAssignedManager] = useState('');
  const [city, setCity] = useState('Sahiwal');
  const [district, setDistrict] = useState('Sahiwal');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');

  useEffect(() => {
    loadTerritories();
  }, []);

  const loadTerritories = async () => {
    const list = await db.getTerritories();
    setTerritories(list);
  };

  const handleOpenModal = (t?: Territory) => {
    if (t) {
      setEditingTerritory(t);
      setTerritoryCode(t.territoryCode);
      setTerritoryName(t.territoryName);
      setRegion(t.region || 'Sahiwal Division');
      setAssignedManager(t.assignedManager || '');
      setCity(t.city || 'Sahiwal');
      setDistrict(t.district || 'Sahiwal');
      setDescription(t.description || t.remarks || '');
      setStatus(t.status);
    } else {
      setEditingTerritory(null);
      setTerritoryCode(`TR-SWL-${Math.floor(10 + Math.random() * 90)}`);
      setTerritoryName('');
      setRegion('Sahiwal Division');
      setAssignedManager('');
      setCity('Sahiwal');
      setDistrict('Sahiwal');
      setDescription('');
      setStatus('Active');
    }
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const newTerritory: Territory = {
      id: editingTerritory ? editingTerritory.id : `ter_${Date.now()}`,
      territoryCode,
      territoryName,
      region,
      assignedManager,
      city,
      district,
      description,
      remarks: description,
      status
    };

    await db.saveTerritory(newTerritory);
    setShowModal(false);
    loadTerritories();
  };

  const handleDelete = async (id: string) => {
    if (currentUser.role !== 'ADMIN') {
      alert('Normal users cannot delete territories.');
      return;
    }
    if (confirm('Delete this territory?')) {
      await db.deleteTerritory(id);
      loadTerritories();
    }
  };

  const filtered = territories.filter(
    t =>
      t.territoryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.territoryCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.city && t.city.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Territory Profiles & Regional Divisions</h2>
          <p className="text-sm text-gray-500">Manage agricultural distribution territories across Sahiwal Division and surrounding zones</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center space-x-2 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Territory</span>
        </button>
      </div>

      <div className="flex items-center space-x-4 bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search by territory code, name, or city..."
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
              <th className="py-3.5 px-4">Territory Name</th>
              <th className="py-3.5 px-4">Region</th>
              <th className="py-3.5 px-4">Assigned Manager</th>
              <th className="py-3.5 px-4">City / District</th>
              <th className="py-3.5 px-4 text-center">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400">
                  No territories defined yet. Click "Add Territory" to create one.
                </td>
              </tr>
            ) : (
              filtered.map(t => (
                <tr key={t.id} className="hover:bg-gray-50/50">
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-800">{t.territoryCode}</td>
                  <td className="py-3.5 px-4 font-bold text-gray-800">{t.territoryName}</td>
                  <td className="py-3.5 px-4 text-gray-600 font-medium">{t.region || 'Sahiwal Division'}</td>
                  <td className="py-3.5 px-4 text-gray-700">{t.assignedManager || 'Unassigned'}</td>
                  <td className="py-3.5 px-4 text-gray-600 text-xs">{t.city || t.district || 'Sahiwal'}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                        t.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    {(currentUser.role === 'ADMIN' || !editingTerritory) && (
                      <button
                        onClick={() => handleOpenModal(t)}
                        className="p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    {currentUser.role === 'ADMIN' && (
                      <button
                        onClick={() => handleDelete(t.id)}
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
          <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden">
            <div className="bg-emerald-900 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="text-lg font-bold">{editingTerritory ? 'Edit Territory' : 'Add New Territory'}</h3>
              <button onClick={() => setShowModal(false)} className="text-emerald-200 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Territory Code</label>
                  <input
                    type="text"
                    required
                    value={territoryCode}
                    onChange={e => setTerritoryCode(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Territory Name</label>
                  <input
                    type="text"
                    required
                    value={territoryName}
                    onChange={e => setTerritoryName(e.target.value)}
                    placeholder="e.g. Sahiwal Head Office"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Region</label>
                  <input
                    type="text"
                    value={region}
                    onChange={e => setRegion(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Assigned Manager</label>
                  <input
                    type="text"
                    value={assignedManager}
                    onChange={e => setAssignedManager(e.target.value)}
                    placeholder="e.g. Nasir Ali"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">District</label>
                  <input
                    type="text"
                    value={district}
                    onChange={e => setDistrict(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Description / Remarks</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={2}
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
                  Save Territory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
