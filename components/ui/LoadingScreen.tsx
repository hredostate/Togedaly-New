import React from 'react';

interface LoadingScreenProps {
  fullScreen?: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ fullScreen = false }) => {
  const content = (
    <div className="flex flex-col items-center justify-center p-8 space-y-6">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 border-[3px] border-brand-100 rounded-full"></div>
        <div className="absolute inset-0 border-[3px] border-brand-600 rounded-full border-t-transparent animate-spin"></div>
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className="text-xs font-bold tracking-widest text-brand-600">TOGEDALY</span>
        <span className="text-[10px] text-gray-400 uppercase tracking-wide animate-pulse">Loading...</span>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return <div className="w-full h-64 flex items-center justify-center">{content}</div>;
};