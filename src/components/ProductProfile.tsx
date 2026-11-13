import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Product, UserProfile } from '../types';
import { Plus, Search, Edit, Trash2, Printer, Sprout, Save, Table } from 'lucide-react';

export const ProductProfileComponent: React.FC<{ currentUser: UserProfile }> = ({ currentUser }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Speedy Data Browser local edits state
  const [speedyEdits, setSpeedyEdits] = useState<Record<string, Partial<Product>>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const [productCode, setProductCode] = useState('');
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('Certified Seeds');
  const [variety, setVariety] = useState('');
  const [unit, setUnit] = useState('Bag');
  const [packSize, setPackSize] = useState('50kg');
  const [purchaseRate, setPurchaseRate] = useState<number>(0);
  const [saleRate, setSaleRate] = useState<number>(0);
  const [openingStock, setOpeningStock] = useState<number>(0);
  const [openingStockRate, setOpeningStockRate] = useState<number>(0);
  const [minimumStock, setMinimumStock] = useState<number>(20);
  const [lotNo, setLotNo] = useState('');
  const [description, setDescription] = useState('');
  const [active, setActive] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const list = await db.getProducts();
    setProducts(Array.isArray(list) ? list : []);
    setSpeedyEdits({});
  };

  const handlePrint = () => {
    window.print();
  };

  const handleOpenModal = (p?: Product) => {
    if (p) {
      setEditingProduct(p);
      setProductCode(p.productCode);
      setProductName(p.productName);
      setCategory(p.category || 'Certified Seeds');
      setVariety(p.variety);
      setUnit(p.unit);
      setPackSize(p.packSize);
      setPurchaseRate(p.purchaseRate);
      setSaleRate(p.saleRate);
      setOpeningStock(p.openingStock || p.currentStock || 0);
      setOpeningStockRate(p.openingStockRate || p.purchaseRate || 0);
      setMinimumStock(p.minimumStock);
      setLotNo(p.lotNo || '');
      setDescription(p.description || p.remarks || '');
      setActive(p.active !== false);
    } else {
      setEditingProduct(null);
      setProductCode(`SD-${Math.floor(100 + Math.random() * 900)}`);
      setProductName('');
      setCategory('Certified Seeds');
      setVariety('');
      setUnit('Bag');
      setPackSize('50kg');
      setPurchaseRate(0);
      setSaleRate(0);
      setOpeningStock(0);
      setOpeningStockRate(0);
      setMinimumStock(20);
      setLotNo(`LOT-${new Date().getFullYear()}`);
      setDescription('');
      setActive(true);
    }
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const newProduct: Product = {
      id: editingProduct ? editingProduct.id : `prd_${Date.now()}`,
      productCode,
      productName,
      category,
      variety: variety || productName,
      unit,
      packSize,
      purchaseRate: Number(purchaseRate),
      saleRate: Number(saleRate),
      openingStock: Number(openingStock),
      currentStock: Number(openingStock),
      openingStockRate: Number(openingStockRate),
      minimumStock: Number(minimumStock),
      lotNo,
      description,
      remarks: description,
      status: active ? 'Active' : 'Inactive',
      active,
      createdAt: editingProduct ? editingProduct.createdAt : new Date().toISOString()
    };

    await db.saveProduct(newProduct);
    setShowModal(false);
    loadProducts();
  };

  const handleDelete = async (id: string) => {
    if (currentUser.role !== 'ADMIN') {
      alert('Normal users cannot delete products.');
      return;
    }
    if (confirm('Delete this seed product?')) {
      await db.deleteProduct(id);
      loadProducts();
    }
  };

  const handleSpeedyChange = (id: string, field: keyof Product, value: any) => {
    setSpeedyEdits(prev => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        [field]: value
      }
    }));
  };

  const handleSpeedySave = async (p: Product) => {
    const edits = speedyEdits[p.id];
    if (!edits) return;

    const updatedProduct: Product = {
      ...p,
      ...edits,
      purchaseRate: edits.purchaseRate !== undefined ? Number(edits.purchaseRate) : p.purchaseRate,
      saleRate: edits.saleRate !== undefined ? Number(edits.saleRate) : p.saleRate,
      openingStock: edits.openingStock !== undefined ? Number(edits.openingStock) : (p.openingStock || p.currentStock || 0),
      currentStock: edits.openingStock !== undefined ? Number(edits.openingStock) : (p.currentStock || p.openingStock || 0)
    };

    try {
      setSavingId(p.id);
      await db.saveProduct(updatedProduct);
      setSpeedyEdits(prev => {
        const copy = { ...prev };
        delete copy[p.id];
        return copy;
      });
      loadProducts();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingId(null);
    }
  };

  const filtered = products.filter(
    p =>
      p.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.productCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.variety && p.variety.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-950 tracking-tight uppercase">Certified Seed Catalog — Speedy Data Browser</h2>
          <p className="text-xs text-gray-500">Edit Name, Pack, Buy Rate, Sale Rate, and Opening Balance instantly in the data grid below</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1 bg-white hover:bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-300 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Catalog</span>
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center space-x-1.5 bg-red-700 hover:bg-red-800 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Seed Variety</span>
          </button>
        </div>
      </div>

      <div className="flex items-center space-x-3 bg-white p-3 rounded-xl border border-gray-200 shadow-xs">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search by seed code, variety name, or crop..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-gray-300 focus:border-red-700 focus:outline-hidden"
          />
        </div>
        <div className="flex items-center space-x-1.5 text-xs font-bold text-red-700 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200">
          <Table className="w-4 h-4" />
          <span>Speedy Inline Browse Active</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-[10px] font-bold uppercase text-gray-500 bg-gray-50">
                <th className="py-3 px-3">Code</th>
                <th className="py-3 px-3">Seed Name / Variety (Speedy Edit)</th>
                <th className="py-3 px-3">Pack / Unit (Speedy Edit)</th>
                <th className="py-3 px-3 text-right">Buy Rate (Speedy Edit)</th>
                <th className="py-3 px-3 text-right">Sale Rate (Speedy Edit)</th>
                <th className="py-3 px-3 text-right">Opening Balance (Speedy Edit)</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">
                    No products found. Click "Add Seed Variety" to create one.
                  </td>
                </tr>
              ) : (
                filtered.map(p => {
                  const currentEdit = speedyEdits[p.id] || {};
                  const editName = currentEdit.productName !== undefined ? currentEdit.productName : p.productName;
                  const editPack = currentEdit.packSize !== undefined ? currentEdit.packSize : p.packSize;
                  const editBuyRate = currentEdit.purchaseRate !== undefined ? currentEdit.purchaseRate : p.purchaseRate;
                  const editSaleRate = currentEdit.saleRate !== undefined ? currentEdit.saleRate : p.saleRate;
                  const editOpening = currentEdit.openingStock !== undefined ? currentEdit.openingStock : (p.openingStock || p.currentStock || 0);
                  const isModified = speedyEdits[p.id] !== undefined;

                  return (
                    <tr key={p.id} className="hover:bg-red-50/20 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-red-800">{p.productCode}</td>
                      
                      {/* Speedy Name Edit */}
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={editName}
                          onChange={e => handleSpeedyChange(p.id, 'productName', e.target.value)}
                          className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-xs font-semibold text-gray-900 focus:border-red-700 focus:outline-hidden"
                        />
                      </td>

                      {/* Speedy Pack Edit */}
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={editPack}
                          onChange={e => handleSpeedyChange(p.id, 'packSize', e.target.value)}
                          className="w-28 bg-white border border-gray-300 rounded px-2 py-1 text-xs font-medium text-gray-800 focus:border-red-700 focus:outline-hidden"
                        />
                      </td>

                      {/* Speedy Buy Rate Edit */}
                      <td className="py-2.5 px-3 text-right">
                        <input
                          type="number"
                          step="0.01"
                          value={editBuyRate}
                          onChange={e => handleSpeedyChange(p.id, 'purchaseRate', Number(e.target.value))}
                          className="w-24 bg-white border border-gray-300 rounded px-2 py-1 text-xs font-mono font-medium text-right text-gray-800 focus:border-red-700 focus:outline-hidden"
                        />
                      </td>

                      {/* Speedy Sale Rate Edit */}
                      <td className="py-2.5 px-3 text-right">
                        <input
                          type="number"
                          step="0.01"
                          value={editSaleRate}
                          onChange={e => handleSpeedyChange(p.id, 'saleRate', Number(e.target.value))}
                          className="w-24 bg-white border border-gray-300 rounded px-2 py-1 text-xs font-mono font-bold text-right text-red-700 focus:border-red-700 focus:outline-hidden"
                        />
                      </td>

                      {/* Speedy Opening Balance Edit */}
                      <td className="py-2.5 px-3 text-right">
                        <input
                          type="number"
                          step="1"
                          value={editOpening}
                          onChange={e => handleSpeedyChange(p.id, 'openingStock', Number(e.target.value))}
                          className="w-24 bg-white border border-gray-300 rounded px-2 py-1 text-xs font-mono font-bold text-right text-gray-900 focus:border-red-700 focus:outline-hidden"
                        />
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                            p.active !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {p.active !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-right space-x-1.5 whitespace-nowrap">
                        {isModified ? (
                          <button
                            onClick={() => handleSpeedySave(p)}
                            disabled={savingId === p.id}
                            className="inline-flex items-center space-x-1 bg-red-700 hover:bg-red-800 text-white px-2.5 py-1 rounded text-xs font-bold shadow-xs transition-colors cursor-pointer"
                            title="Save speedy changes"
                          >
                            <Save className="w-3 h-3" />
                            <span>{savingId === p.id ? 'Saving...' : 'Save'}</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-gray-400 font-medium inline-block px-2">Synced</span>
                        )}

                        <button
                          onClick={() => handleOpenModal(p)}
                          className="p-1 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors cursor-pointer"
                          title="Full Edit Details"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        {currentUser.role === 'ADMIN' && (
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="p-1 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white rounded-xl shadow-2xl overflow-hidden">
            <div className="bg-black px-6 py-4 text-white flex items-center justify-between">
              <h3 className="text-lg font-bold">{editingProduct ? 'Edit Seed Product' : 'Add New Seed Product'}</h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Seed Code</label>
                  <input
                    type="text"
                    required
                    value={productCode}
                    onChange={e => setProductCode(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-700 focus:outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Seed Name / Variety</label>
                  <input
                    type="text"
                    required
                    value={productName}
                    onChange={e => setProductName(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-700 focus:outline-hidden font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Unit</label>
                  <select
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-700 focus:outline-hidden bg-white"
                  >
                    <option value="Bag">Bag</option>
                    <option value="Packet">Packet</option>
                    <option value="Kg">Kg</option>
                    <option value="Maund">Maund</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Pack Size</label>
                  <input
                    type="text"
                    value={packSize}
                    onChange={e => setPackSize(e.target.value)}
                    placeholder="e.g. 40kg, 50kg, 10kg"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-700 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Buy Rate (Purchase PKR)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={purchaseRate}
                    onChange={e => setPurchaseRate(Number(e.target.value))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-700 focus:outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Sale Rate (PKR)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={saleRate}
                    onChange={e => setSaleRate(Number(e.target.value))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-700 focus:outline-hidden font-mono font-bold text-red-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Opening Balance Stock</label>
                  <input
                    type="number"
                    step="1"
                    value={openingStock}
                    onChange={e => setOpeningStock(Number(e.target.value))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-700 focus:outline-hidden font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Lot No (FSC&RD)</label>
                  <input
                    type="text"
                    value={lotNo}
                    onChange={e => setLotNo(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-700 focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Description / Remarks</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-700 focus:outline-hidden"
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
                  className="px-5 py-2 text-sm font-semibold text-white bg-red-700 hover:bg-red-800 rounded-lg shadow-sm cursor-pointer"
                >
                  Save Seed Variety
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
