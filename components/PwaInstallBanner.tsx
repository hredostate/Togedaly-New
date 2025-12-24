
import React from 'react';
import { usePwaInstall } from '../hooks/usePwaInstall';

const PwaInstallBanner: React.FC = () => {
  const { shouldShowBanner, triggerInstall, dismiss } = usePwaInstall();

  if (!shouldShowBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 p-4 bg-white border border-slate-200 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in-up">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 bg-brand text-white rounded-xl grid place-items-center font-bold text-lg shadow-sm">T</div>
        <div>
          <h3 className="font-semibold text-gray-900">Install App</h3>
          <p className="text-xs text-gray-500">Install Togedaly for a better experience.</p>
        </div>
      </div>
      <div className="flex gap-2 w-full sm:w-auto">
        <button 
          onClick={dismiss} 
          className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-gray-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
        >
          Later
        </button>
        <button 
          onClick={triggerInstall} 
          className="flex-1 sm:flex-none px-4 py-2 text-sm font-bold text-white bg-brand hover:bg-brand-700 rounded-xl shadow-md transition-colors"
        >
          Install
        </button>
      </div>
    </div>
  );
};

export default PwaInstallBanner;
