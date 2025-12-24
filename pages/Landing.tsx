
import React from 'react';

interface LandingProps {
    setPage: (page: 'dashboard' | 'explore' | 'owambe' | 'wallet', context?: any) => void;
}

const Landing: React.FC<LandingProps> = ({ setPage }) => {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900 text-white shadow-2xl overflow-hidden animate-fade-in relative group">
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/20 rounded-full blur-3xl -mr-16 -mt-16 animate-pulse-slow"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl -ml-10 -mb-10"></div>

        <div className="relative z-10 grid lg:grid-cols-2 gap-8 items-center p-8 lg:p-12">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-brand-300 text-xs font-bold uppercase tracking-wider animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                🇳🇬 Built for the Culture
            </div>
            <h1 className="text-4xl lg:text-5xl font-black leading-tight animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              Wealth & Vibes.<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-purple-400">Odogwu Level.</span>
            </h1>
            <p className="text-slate-300 text-lg animate-fade-in-up max-w-md" style={{ animationDelay: '0.3s' }}>
              From digital spraying at Owambes to secure Waybill escrow. Manage your Ajo, hedge against inflation, and transact safely.
            </p>
            <div className="pt-2 animate-fade-in-up flex flex-wrap gap-4" style={{ animationDelay: '0.4s' }}>
              <button 
                onClick={() => setPage('dashboard')} 
                className="px-8 py-4 rounded-2xl bg-brand-600 text-white font-bold shadow-lg shadow-brand-600/30 transition-all duration-300 hover:bg-brand-500 hover:scale-105 active:scale-95"
              >
                Launch App 🚀
              </button>
              <button 
                onClick={() => setPage('owambe')} 
                className="px-8 py-4 rounded-2xl bg-slate-800 text-white font-bold border border-slate-700 shadow-lg hover:bg-slate-700 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                <span>🎉</span> Try Owambe
              </button>
            </div>
          </div>
          
          {/* Stats Card */}
          <div className="hidden lg:block relative animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <div className="absolute inset-0 bg-brand-500/10 blur-xl rounded-full"></div>
            <div className="relative rounded-2xl bg-slate-800/80 backdrop-blur border border-slate-700 p-6 shadow-xl">
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-700">
                        <div className="text-slate-400 text-xs uppercase font-bold">Total Sprayed</div>
                        <div className="text-2xl font-mono text-emerald-400 font-bold mt-1">₦45M+</div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-700">
                        <div className="text-slate-400 text-xs uppercase font-bold">Waybill Escrow</div>
                        <div className="text-2xl font-mono text-amber-400 font-bold mt-1">1,204</div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-700">
                        <div className="text-slate-400 text-xs uppercase font-bold">Ajo Payouts</div>
                        <div className="text-2xl font-mono text-purple-400 font-bold mt-1">₦128M</div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-700">
                        <div className="text-slate-400 text-xs uppercase font-bold">USDC Shield</div>
                        <div className="text-2xl font-mono text-blue-400 font-bold mt-1">$50k+</div>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Owambe Card */}
        <button onClick={() => setPage('owambe')} className="text-left p-6 rounded-3xl bg-gradient-to-br from-purple-50 to-white border border-purple-100 hover:border-purple-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="text-6xl">🎉</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                💸
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Owambe Mode</h3>
            <p className="text-sm text-gray-600 leading-relaxed">Digital spraying for parties. Flash money on screen, keep the cash safe.</p>
            <div className="mt-4 text-sm font-bold text-purple-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Start Spraying <span>→</span>
            </div>
        </button>

        {/* Waybill Card */}
        <button onClick={() => setPage('explore', { filter: 'waybill' })} className="text-left p-6 rounded-3xl bg-gradient-to-br from-amber-50 to-white border border-amber-100 hover:border-amber-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="text-6xl">🚚</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                📦
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Waybill Escrow</h3>
            <p className="text-sm text-gray-600 leading-relaxed">Don't get scammed. Lock funds until your waybill delivery is confirmed.</p>
            <div className="mt-4 text-sm font-bold text-amber-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Secure Delivery <span>→</span>
            </div>
        </button>

        {/* Ajo Card */}
        <button onClick={() => setPage('explore', { filter: 'ajo' })} className="text-left p-6 rounded-3xl bg-white border border-slate-200 hover:border-brand-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                🔄
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Join Ajo Pool</h3>
            <p className="text-sm text-gray-600 leading-relaxed">Classic rotating savings. Contribute daily/weekly, collect in bulk.</p>
            <div className="mt-4 text-sm font-bold text-brand-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Start Saving <span>→</span>
            </div>
        </button>

        {/* Invest Card */}
        <button onClick={() => setPage('explore', { filter: 'invest' })} className="text-left p-6 rounded-3xl bg-white border border-slate-200 hover:border-brand-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                📈
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Inflation Shield</h3>
            <p className="text-sm text-gray-600 leading-relaxed">Save in Naira, hold in USDC. Protect your capital from devaluation.</p>
            <div className="mt-4 text-sm font-bold text-brand-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Invest Now <span>→</span>
            </div>
        </button>

        {/* Group Buy Card */}
        <button onClick={() => setPage('explore', { filter: 'group_buy' })} className="text-left p-6 rounded-3xl bg-white border border-slate-200 hover:border-brand-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                🛍️
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Group Buys</h3>
            <p className="text-sm text-gray-600 leading-relaxed">Share a cow, bag of rice, or fuel. Bulk prices for everyone.</p>
            <div className="mt-4 text-sm font-bold text-brand-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Join Deal <span>→</span>
            </div>
        </button>

         {/* Offline Card */}
         <button onClick={() => setPage('wallet')} className="text-left p-6 rounded-3xl bg-slate-900 text-white hover:bg-slate-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-20">
                <span className="text-6xl">📶</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform duration-300 backdrop-blur-sm">
                #
            </div>
            <h3 className="text-lg font-bold mb-2">Offline Mode</h3>
            <p className="text-sm text-slate-300 leading-relaxed">No data? Use our USSD codes to pay and manage your account.</p>
            <div className="mt-4 text-sm font-bold text-white flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Get Codes <span>→</span>
            </div>
        </button>
      </div>
    </div>
  );
};

export default Landing;
