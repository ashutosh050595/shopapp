import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import BillingPOS from './components/BillingPOS';
import Inventory from './components/Inventory';
import Customers from './components/Customers';
import Settings from './components/Settings';
import Reports from './components/Reports';
import Login from './components/Login';
import { ViewState, User } from './types';
import { db } from './services/db';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const sessionUser = db.getCurrentUser();
    if (sessionUser) {
      setUser(sessionUser);
    }
  }, []);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    setCurrentView('DASHBOARD');
  };

  const handleLogout = () => {
    db.logout();
    setUser(null);
  };

  const renderView = () => {
    switch (currentView) {
      case 'DASHBOARD':
        return <Dashboard />;
      case 'BILLING':
        return <BillingPOS />;
      case 'INVENTORY':
        return <Inventory />;
      case 'CUSTOMERS':
        return <Customers />;
      case 'REPORTS':
        return <Reports />;
      case 'SETTINGS':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  if (!user) {
    return <Login onLoginSuccess={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar is fixed width, hidden on mobile in future iterations, but for now we focus on content accessibility */}
      <Sidebar 
        currentView={currentView} 
        onChangeView={setCurrentView} 
        currentUser={user}
        onLogout={handleLogout}
      />
      
      {/* Main Content Area */}
      <main className="flex-1 ml-64 h-screen overflow-y-auto overflow-x-hidden p-2 md:p-4">
        {renderView()}
      </main>
    </div>
  );
};

export default App;