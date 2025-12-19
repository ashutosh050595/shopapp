import React from 'react';
import { ViewState, User } from '../types';
import { LayoutDashboard, ShoppingCart, Package, Users, FileText, Settings, LogOut } from 'lucide-react';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  currentUser: User | null;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, currentUser, onLogout }) => {
  const isAdmin = currentUser?.role === 'ADMIN';

  const menuItems: { id: ViewState; label: string; icon: React.ReactNode; hidden?: boolean }[] = [
    { id: 'DASHBOARD', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'BILLING', label: 'Billing / POS', icon: <ShoppingCart size={20} /> },
    { id: 'INVENTORY', label: 'Stock / Inventory', icon: <Package size={20} /> },
    { id: 'CUSTOMERS', label: 'Customers', icon: <Users size={20} /> },
    { id: 'REPORTS', label: 'Reports', icon: <FileText size={20} />, hidden: !isAdmin },
    { id: 'SETTINGS', label: 'Settings', icon: <Settings size={20} />, hidden: !isAdmin },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white h-screen flex flex-col fixed left-0 top-0 shadow-xl z-20">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
          ShopFlow
        </h1>
        <div className="mt-2 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <p className="text-xs text-slate-300">
            {currentUser?.name} ({currentUser?.role})
          </p>
        </div>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1">
          {menuItems.filter(item => !item.hidden).map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onChangeView(item.id)}
                className={`w-full flex items-center px-6 py-3 transition-colors duration-200 ${
                  currentView === item.id
                    ? 'bg-blue-600 text-white border-r-4 border-blue-300'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button 
          onClick={onLogout}
          className="flex items-center text-red-400 hover:text-red-300 transition-colors w-full px-4 py-2 hover:bg-slate-800 rounded-lg"
        >
          <LogOut size={18} className="mr-3" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;