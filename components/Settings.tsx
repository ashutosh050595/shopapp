import React, { useState, useRef, useEffect } from 'react';
import { db } from '../services/db';
import { ShopSettings } from '../types';
import { Download, Upload, Save, AlertTriangle, MessageSquare, Mail } from 'lucide-react';

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<ShopSettings>(db.getSettings());
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: keyof ShopSettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    setIsSaving(true);
    db.saveSettings(settings);
    setTimeout(() => setIsSaving(false), 800);
  };

  const handleBackup = () => {
      const data = db.createBackup();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `shopflow_backup_${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
  };

  const handleRestoreClick = () => {
      if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          const content = event.target?.result as string;
          if (content) {
              if (confirm("WARNING: Restoring will overwrite all current data. Continue?")) {
                  const success = db.restoreBackup(content);
                  if (success) {
                      alert("Restore successful! Reloading...");
                      window.location.reload();
                  } else {
                      alert("Failed to restore backup. Invalid file format.");
                  }
              }
          }
      };
      reader.readAsText(file);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6 animate-fade-in pb-20">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-slate-800">Store Settings</h2>
        <button 
          onClick={handleSave}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-white transition-all ${
            isSaving ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          <Save size={20} />
          {isSaving ? 'Saved!' : 'Save Changes'}
        </button>
      </div>
      
      <div className="space-y-6">
        
        {/* General Settings */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-700 border-b pb-2 mb-4">General Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Shop Name</label>
                  <input 
                    type="text" 
                    value={settings.shopName} 
                    onChange={e => handleChange('shopName', e.target.value)}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
              </div>
              <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Phone</label>
                  <input 
                    type="text" 
                    value={settings.phone} 
                    onChange={e => handleChange('phone', e.target.value)}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
              </div>
              <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-600 mb-1">Address</label>
                  <input 
                    type="text" 
                    value={settings.address} 
                    onChange={e => handleChange('address', e.target.value)}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
              </div>
              <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">GSTIN</label>
                  <input 
                    type="text" 
                    value={settings.gstin} 
                    onChange={e => handleChange('gstin', e.target.value)}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
              </div>
              <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-600 mb-1">Footer Message (Print)</label>
                  <input 
                    type="text" 
                    value={settings.footerMessage} 
                    onChange={e => handleChange('footerMessage', e.target.value)}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
              </div>
            </div>
        </div>

        {/* Communication Settings */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-700 border-b pb-2 mb-4 flex items-center gap-2">
              <MessageSquare size={20} className="text-green-500" />
              Communication Templates
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Use placeholders: <code className="bg-slate-100 px-1 rounded">{'{customer}'}</code>, <code className="bg-slate-100 px-1 rounded">{'{id}'}</code>, <code className="bg-slate-100 px-1 rounded">{'{total}'}</code>, <code className="bg-slate-100 px-1 rounded">{'{date}'}</code>, <code className="bg-slate-100 px-1 rounded">{'{shopName}'}</code>
            </p>
            
            <div className="space-y-4">
              <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1 flex items-center gap-2">
                    <MessageSquare size={16} /> WhatsApp Message Template
                  </label>
                  <textarea 
                    rows={2}
                    value={settings.whatsappTemplate} 
                    onChange={e => handleChange('whatsappTemplate', e.target.value)}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                   <label className="block text-sm font-medium text-slate-600 mb-1 flex items-center gap-2">
                      <Mail size={16} /> Email Subject
                   </label>
                   <input 
                    type="text" 
                    value={settings.emailSubject} 
                    onChange={e => handleChange('emailSubject', e.target.value)}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
                <div className="md:col-span-2">
                   <label className="block text-sm font-medium text-slate-600 mb-1">Email Body</label>
                   <textarea 
                    rows={4}
                    value={settings.emailBody} 
                    onChange={e => handleChange('emailBody', e.target.value)}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
              </div>
            </div>
        </div>

        {/* Data Management */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-700 border-b pb-2 mb-4">Data Management</h3>
            <div className="flex gap-4">
                <button 
                    onClick={handleBackup}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Download size={18} /> Backup Data
                </button>
                <button 
                    onClick={handleRestoreClick}
                    className="flex items-center gap-2 bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors"
                >
                    <Upload size={18} /> Restore Data
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept=".json" 
                    className="hidden" 
                />
            </div>
            <p className="text-sm text-slate-500 mt-2">Download a backup JSON file or restore from a previously saved file.</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;