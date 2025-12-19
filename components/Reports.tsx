import React from 'react';
import { FileText } from 'lucide-react';

const Reports: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-slate-400 animate-fade-in">
      <FileText size={64} className="mb-4 opacity-50" />
      <h2 className="text-2xl font-bold text-slate-600">Reports Module</h2>
      <p>Sales and Tax reports will appear here.</p>
    </div>
  );
};

export default Reports;