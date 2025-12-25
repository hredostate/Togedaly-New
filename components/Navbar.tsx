
import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import type { Page } from '../App';
import { getUnreadCount } from '../services/notificationService';
import { StreakCounter } from './gamify/StreakCounter';

interface NavbarProps {
    setPage: (page: Page) => void;
    isAuthenticated: boolean;
    isAdmin: boolean;
    onLogout: () => void;
    onInboxToggle: () => void;
    userId?: string;
}

const Navbar: React.FC<NavbarProps> = ({ setPage, isAuthenticated, isAdmin, onLogout, onInboxToggle, userId }) => {
  // Use SWR to poll for unread count every 10 seconds if authenticated
  const { data: unreadCount } = useSWR(
    isAuthenticated ? 'unread-count' : null,
    getUnreadCount,
    { refreshInterval: 10000 }
  );

  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Check initial status
    setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-brand-100">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <button onClick={() => setPage('landing')} className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-brand rounded-lg" aria-label="Go to homepage">
          <div className="h-8 w-8 rounded-xl bg-brand text-white grid place-items-center font-bold shadow-sm">T</div>
          <div className="font-semibold">Togedaly</div>
        </button>
        
        <nav className="flex items-center gap-2 text-sm">
          {!isOnline && (
            <span className="mr-2 flex items-center gap-1 px-2 py-1 rounded bg-amber-100 text-amber-800 text-xs font-medium">
              <span>⚠️</span> Offline
            </span>
          )}
          
          {/* Desktop Nav Links - Hidden on mobile */}
          <div className="hidden md:flex items-center gap-1">
            <button onClick={() => setPage('explore')} className="px-3 py-2 rounded-xl hover:bg-brand-50 transition-colors focus:ring-2 focus:ring-brand focus:outline-none">Explore</button>
            
            {isAuthenticated && (
              <>
                <button onClick={() => setPage('wallet')} className="px-3 py-2 rounded-xl hover:bg-brand-50 transition-colors focus:ring-2 focus:ring-brand focus:outline-none">Wallet</button>
                <button onClick={() => setPage('standing')} className="px-3 py-2 rounded-xl hover:bg-brand-50 transition-colors focus:ring-2 focus:ring-brand focus:outline-none">My Standing</button>
                <button onClick={() => setPage('security')} className="px-3 py-2 rounded-xl hover:bg-brand-50 transition-colors focus:ring-2 focus:ring-brand focus:outline-none">Security</button>
                <button onClick={() => setPage('notifications')} className="px-3 py-2 rounded-xl hover:bg-brand-50 transition-colors focus:ring-2 focus:ring-brand focus:outline-none">Settings</button>
              </>
            )}
          </div>

          {isAuthenticated ? (
            <div className="flex items-center gap-2 ml-1">
              {/* Daily Streak - Visible on both mobile and desktop */}
              <StreakCounter userId={userId || 'mock-user-id'} />

              <button onClick={onInboxToggle} className="relative p-2 rounded-full hover:bg-brand-50 transition-colors focus:ring-2 focus:ring-brand focus:outline-none" aria-label="Toggle Inbox">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                {unreadCount && unreadCount > 0 ? <span className="absolute top-1 right-1 block h-4 w-4 rounded-full bg-red-500 text-white text-[10px] leading-4 text-center">{unreadCount}</span> : null}
              </button>

              {isAdmin && (
                 <div className="hidden md:flex items-center gap-1">
                  <button onClick={() => setPage('suppliers')} className="px-3 py-2 rounded-xl hover:bg-brand-50 transition-colors">Suppliers</button>
                  <button onClick={() => setPage('groupbuys')} className="px-3 py-2 rounded-xl hover:bg-brand-50 transition-colors">GroupBuys</button>
                  <button onClick={() => setPage('settlements')} className="px-3 py-2 rounded-xl hover:bg-brand-50 transition-colors">Settlements</button>
                  <button onClick={() => setPage('reconciliation')} className="px-3 py-2 rounded-xl hover:bg-brand-50 transition-colors">Recon</button>
                  <button onClick={() => setPage('rotationPayouts')} className="px-3 py-2 rounded-xl hover:bg-brand-50 transition-colors">Payouts</button>
                  <button onClick={() => setPage('admin')} className="px-3 py-2 rounded-xl bg-amber-500 text-white hover:bg-amber-600 transition-colors font-semibold">Admin</button>
                </div>
              )}
              <div className="hidden md:block">
                <button onClick={() => setPage('dashboard')} className="px-3 py-2 rounded-xl bg-brand text-white hover:bg-brand-700 transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-brand">Dashboard</button>
              </div>
              <button onClick={onLogout} className="px-3 py-2 rounded-xl hover:bg-slate-200 transition-colors text-sm font-medium focus:ring-2 focus:ring-slate-300">Sign Out</button>
            </div>
          ) : (
             <button onClick={() => setPage('auth')} className="px-3 py-2 rounded-xl bg-brand text-white hover:bg-brand-700 transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-brand">Sign In</button>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
