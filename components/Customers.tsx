import React, { useState } from 'react';
import { db } from '../services/db';
import { Customer } from '../types';
import { Search, UserPlus, Phone, Mail, MapPin } from 'lucide-react';

const Customers: React.FC = () => {
  const [customers] = useState<Customer[]>(db.getCustomers());
  const [search, setSearch] = useState('');

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.mobile.includes(search)
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Customers</h2>
          <p className="text-slate-500">Manage customer details</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition">
          <UserPlus size={20} /> Add Customer
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
        <input 
          type="text" 
          placeholder="Search by Name or Mobile..." 
          className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(c => (
          <div key={c.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:border-blue-300 transition-colors">
            <h3 className="text-lg font-bold text-slate-800 mb-2">{c.name}</h3>
            <div className="space-y-2 text-slate-600 text-sm">
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-slate-400" /> {c.mobile || 'N/A'}
              </div>
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-slate-400" /> {c.email || 'N/A'}
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-slate-400" /> {c.address || 'N/A'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Customers;