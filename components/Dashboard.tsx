import React, { useMemo } from 'react';
import { db } from '../services/db';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { DollarSign, ShoppingBag, AlertTriangle, TrendingUp } from 'lucide-react';

const Dashboard: React.FC = () => {
  const products = db.getProducts();
  const invoices = db.getInvoices();

  const stats = useMemo(() => {
    const totalSales = invoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
    const lowStockCount = products.filter(p => p.stock < 20).length;
    const totalInvoices = invoices.length;
    const today = new Date().toISOString().split('T')[0];
    const todaySales = invoices
      .filter(inv => inv.date.startsWith(today))
      .reduce((acc, inv) => acc + inv.totalAmount, 0);

    return { totalSales, lowStockCount, totalInvoices, todaySales };
  }, [products, invoices]);

  const salesData = useMemo(() => {
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    return last7Days.map(date => {
      const dayTotal = invoices
        .filter(inv => inv.date.startsWith(date))
        .reduce((acc, inv) => acc + inv.totalAmount, 0);
      return { date: date.slice(5), sales: dayTotal };
    });
  }, [invoices]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800">Dashboard</h2>
        <p className="text-slate-500">Overview of your shop's performance</p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Today's Sales</p>
            <h3 className="text-2xl font-bold text-slate-900">₹{stats.todaySales.toLocaleString()}</h3>
          </div>
          <div className="p-3 bg-green-100 text-green-600 rounded-lg">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Total Invoices</p>
            <h3 className="text-2xl font-bold text-slate-900">{stats.totalInvoices}</h3>
          </div>
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
            <ShoppingBag size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Total Revenue</p>
            <h3 className="text-2xl font-bold text-slate-900">₹{stats.totalSales.toLocaleString()}</h3>
          </div>
          <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Low Stock Items</p>
            <h3 className="text-2xl font-bold text-orange-600">{stats.lowStockCount}</h3>
          </div>
          <div className="p-3 bg-orange-100 text-orange-600 rounded-lg">
            <AlertTriangle size={24} />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Sales Trends (Last 7 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748B'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B'}} dx={-10} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#F1F5F9' }}
                />
                <Bar dataKey="sales" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Stock Overview</h3>
           <div className="h-64 overflow-y-auto pr-2 no-scrollbar">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3 text-right">Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.sort((a,b) => a.stock - b.stock).slice(0, 8).map(p => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-800">{p.name}</td>
                      <td className="px-4 py-3 text-slate-500">{p.category}</td>
                      <td className={`px-4 py-3 text-right font-bold ${p.stock < 20 ? 'text-red-500' : 'text-slate-700'}`}>
                        {p.stock} {p.unit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;