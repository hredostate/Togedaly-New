import React from 'react';
import type { Page } from '../App';
import FinanceRecon from '../components/admin/finance/Recon';

const Recon: React.FC<{ setPage: (page: Page, context?: any) => void }> = ({ setPage }) => {
  return (
    <div className="space-y-4">
        <button onClick={() => setPage('admin')} className="text-sm text-gray-600 hover:text-brand transition">← Back to Admin</button>
        <FinanceRecon />
    </div>
  );
};

export default Recon;
