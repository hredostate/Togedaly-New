import React from 'react';
import type { LegalDocType } from '../types';

interface FooterProps {
  setPage: (doc: LegalDocType) => void;
  setStatusPage: () => void;
}

const Footer: React.FC<FooterProps> = ({ setPage, setStatusPage }) => {
  return (
    <footer className="w-full mt-10 border-t border-brand-100 bg-white/50">
      <div className="max-w-6xl mx-auto px-4 py-4 text-center">
        <div className="text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1 justify-center">
          <button onClick={() => setPage('terms')} className="hover:text-brand">Terms of Service</button>
          <button onClick={() => setPage('privacy')} className="hover:text-brand">Privacy Policy</button>
          <button onClick={() => setPage('refund')} className="hover:text-brand">Refund Policy</button>
          <button onClick={() => setPage('support')} className="hover:text-brand">Support</button>
          <button onClick={() => setPage('compliance')} className="hover:text-brand">Compliance</button>
          <button onClick={setStatusPage} className="hover:text-brand">Status</button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          © {new Date().getFullYear()} Togedaly Technologies Ltd. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;