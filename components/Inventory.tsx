import React, { useState } from 'react';
import { db } from '../services/db';
import { Product } from '../types';
import { Search, Plus, Edit2, Smartphone } from 'lucide-react';

const Inventory: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(db.getProducts());
  const [search, setSearch] = useState('');

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.brand?.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase()) ||
    p.barcode?.toLowerCase().includes(search.toLowerCase()) ||
    (p.availableImeis && p.availableImeis.some(i => i.includes(search)))
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Stock / Inventory</h2>
          <p className="text-slate-500">Manage mobiles, accessories and stock</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition">
          <Plus size={20} /> Add Item
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center gap-3">
          <Search className="text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by Name, Brand, IMEI or Barcode..." 
            className="flex-1 outline-none text-slate-700"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold">
            <tr>
              <th className="px-6 py-4">Brand</th>
              <th className="px-6 py-4">Product Name</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Price</th>
              <th className="px-6 py-4">Stock</th>
              <th className="px-6 py-4">IMEI/SN</th>
              <th className="px-6 py-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(p => (
              <tr key={p.id} className="hover:bg-slate-50">
                 <td className="px-6 py-4 text-slate-600 font-medium">{p.brand || '-'}</td>
                <td className="px-6 py-4 font-medium text-slate-800">
                    <div>{p.name}</div>
                    <div className="text-xs text-slate-400 font-mono">{p.barcode}</div>
                </td>
                <td className="px-6 py-4 text-slate-500">{p.category}</td>
                <td className="px-6 py-4">₹{p.price.toLocaleString()}</td>
                <td className={`px-6 py-4 font-bold ${p.stock < 5 ? 'text-red-500' : 'text-green-600'}`}>
                  {p.stock} {p.unit}
                </td>
                <td className="px-6 py-4 text-xs text-slate-500 max-w-xs truncate">
                    {p.availableImeis && p.availableImeis.length > 0 ? (
                        <div className="flex flex-col gap-1">
                            <span className="flex items-center gap-1"><Smartphone size={10}/> {p.availableImeis.length} units</span>
                            <span className="truncate" title={p.availableImeis.join(', ')}>{p.availableImeis.join(', ')}</span>
                        </div>
                    ) : (
                        <span className="text-slate-400">-</span>
                    )}
                </td>
                <td className="px-6 py-4">
                  <button className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg">
                    <Edit2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Inventory;