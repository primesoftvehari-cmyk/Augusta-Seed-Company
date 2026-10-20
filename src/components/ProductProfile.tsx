import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Product, UserProfile } from '../types';
import { Plus, Search, Edit, Trash2, Printer, Sprout } from 'lucide-react';

export const ProductProfileComponent: React.FC<{ currentUser: UserProfile }> = ({ currentUser }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

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
    setProducts(list);
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
      setActive(p.active);
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
      variety,
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

  const filtered = products.filter(
    p =>
      p.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.productCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.variety && p.variety.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Certified Seed Variety Catalog</h2>
          <p className="text-sm text-gray-500">Manage crop seeds, packaging sizes, rates, FSC&RD certification lot numbers and inventory</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Catalog</span>
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center space-x-2 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Seed Variety</span>
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
            placeholder="Search by seed code, variety name, or crop..."
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
              <th className="py-3.5 px-4">Seed Variety / Lot No</th>
              <th className="py-3.5 px-4">Unit / Pack</th>
              <th className="py-3.5 px-4 text-right">Buy Rate (PKR)</th>
              <th className="py-3.5 px-4 text-right">Sale Rate (PKR)</th>
              <th className="py-3.5 px-4 text-right">Current Stock</th>
              <th className="py-3.5 px-4 text-center">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-gray-400">
                  No products found. Click "Add Seed Variety" to create one.
                </td>
              </tr>
            ) : (
              filtered.map(p => (
                <tr key={p.id} className="hover:bg-gray-50/50">
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-800">{p.productCode}</td>
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-gray-800 flex items-center space-x-1.5">
                      <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{p.productName}</span>
                    </p>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">
                      Lot: {p.lotNo || 'N/A'} | Variety: {p.variety || 'Standard'}
                    </p>
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="text-gray-800 font-medium">{p.unit}</p>
                    <p className="text-xs text-gray-500">{p.packSize}</p>
                  </td>
                  <td className="py-3.5 px-4 text-right font-medium text-gray-700">{p.purchaseRate.toLocaleString()}</td>
                  <td className="py-3.5 px-4 text-right font-bold text-emerald-700">{p.saleRate.toLocaleString()}</td>
                  <td className="py-3.5 px-4 text-right font-bold text-gray-900">{p.currentStock || p.openingStock}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                        p.active !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {p.active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    {(currentUser.role === 'ADMIN' || !editingProduct) && (
                      <button
                        onClick={() => handleOpenModal(p)}
                        className="p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit Product"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    {currentUser.role === 'ADMIN' && (
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1.5 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Product"
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
              <h3 className="text-lg font-bold">{editingProduct ? 'Edit Seed Product' : 'Add New Seed Product'}</h3>
              <button onClick={() => setShowModal(false)} className="text-emerald-200 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Product Code</label>
                  <input
                    type="text"
                    required
                    value={productCode}
                    onChange={e => setProductCode(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Variety / Product Name</label>
                  <input
                    type="text"
                    required
                    value={productName}
                    onChange={e => setProductName(e.target.value)}
                    placeholder="e.g. Wheat Seed Akbar 2019 Certified"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-hidden font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Variety Code/Name</label>
                  <input
                    type="text"
                    value={variety}
                    onChange={e => setVariety(e.target.value)}
                    placeholder="e.g. Akbar 2019, Bt-886"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Lot / Batch No</label>
                  <input
                    type="text"
                    value={lotNo}
                    onChange={e => setLotNo(e.target.value)}
                    placeholder="LOT-AKB-2026"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Buy / Procurement Rate</label>
                  <input
                    type="number"
                    step="0.01"
                    value={purchaseRate}
                    onChange={e => setPurchaseRate(Number(e.target.value))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Sale Rate (PKR)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={saleRate}
                    onChange={e => setSaleRate(Number(e.target.value))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-hidden font-bold text-emerald-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Pack Size & Unit</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={packSize}
                      onChange={e => setPackSize(e.target.value)}
                      placeholder="50kg"
                      className="w-2/3 rounded-lg border border-gray-300 px-2 py-2 text-sm"
                    />
                    <input
                      type="text"
                      value={unit}
                      onChange={e => setUnit(e.target.value)}
                      placeholder="Bag"
                      className="w-1/3 rounded-lg border border-gray-300 px-2 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Current Stock (Bags)</label>
                  <input
                    type="number"
                    value={openingStock}
                    onChange={e => setOpeningStock(Number(e.target.value))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-hidden font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Stock Val. Rate</label>
                  <input
                    type="number"
                    step="0.01"
                    value={openingStockRate}
                    onChange={e => setOpeningStockRate(Number(e.target.value))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Min Stock Warning</label>
                  <input
                    type="number"
                    value={minimumStock}
                    onChange={e => setMinimumStock(Number(e.target.value))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Description / Quality Notes</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="e.g. Certified under FSC&RD standards, 98% germination rate..."
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
                  Save Seed Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
