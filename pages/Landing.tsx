
import React from 'react';

interface LandingProps {
    setPage: (page: 'dashboard' | 'explore' | 'owambe' | 'wallet', context?: any) => void;
}

const Landing: React.FC<LandingProps> = ({ setPage }) => {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="rounded-3xl border border-emerald-800 bg-gradient-to-br from-emerald-950 to-slate-900 text-white shadow-2xl overflow-hidden animate-fade-in relative group">
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl -mr-16 -mt-16 animate-pulse-slow"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-600/20 rounded-full blur-3xl -ml-10 -mb-10"></div>

        <div className="relative z-10 grid lg:grid-cols-2 gap-8 items-center p-8 lg:p-12">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-emerald-700 text-emerald-300 text-xs font-bold uppercase tracking-wider animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                🇳🇬 Community Finance Heritage
            </div>
            <h1 className="text-4xl lg:text-5xl font-black leading-tight animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              Access Money.<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-400">Zero Interest.</span>
            </h1>
            <p className="text-slate-300 text-lg animate-fade-in-up max-w-md" style={{ animationDelay: '0.3s' }}>
              Join trusted Ajo savings circles. Access lump sums without borrowing. Refinance expensive loans with community support. All without banks.
            </p>
            <div className="pt-2 animate-fade-in-up flex flex-wrap gap-4" style={{ animationDelay: '0.4s' }}>
              <button 
                onClick={() => setPage('explore', { filter: 'ajo' })} 
                className="px-8 py-4 rounded-2xl bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-600/30 transition-all duration-300 hover:bg-emerald-500 hover:scale-105 active:scale-95"
              >
                Start Saving 💰
              </button>
              <button 
                onClick={() => setPage('explore')} 
                className="px-8 py-4 rounded-2xl bg-slate-800 text-white font-bold border border-emerald-700 shadow-lg hover:bg-slate-700 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                Explore Pools 🔍
              </button>
            </div>
          </div>
          
          {/* Stats Card */}
          <div className="hidden lg:block relative animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <div className="absolute inset-0 bg-emerald-500/10 blur-xl rounded-full"></div>
            <div className="relative rounded-2xl bg-slate-800/80 backdrop-blur border border-emerald-700 p-6 shadow-xl">
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-900/50 border border-emerald-700">
                        <div className="text-slate-400 text-xs uppercase font-bold">Total Member Savings</div>
                        <div className="text-2xl font-mono text-emerald-400 font-bold mt-1">₦128M</div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-900/50 border border-emerald-700">
                        <div className="text-slate-400 text-xs uppercase font-bold">Loans Refinanced</div>
                        <div className="text-2xl font-mono text-green-400 font-bold mt-1">₦42M</div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-900/50 border border-emerald-700">
                        <div className="text-slate-400 text-xs uppercase font-bold">Group Buys</div>
                        <div className="text-2xl font-mono text-amber-400 font-bold mt-1">1,580</div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-900/50 border border-emerald-700">
                        <div className="text-slate-400 text-xs uppercase font-bold">USDC Protected</div>
                        <div className="text-2xl font-mono text-blue-400 font-bold mt-1">$50k+</div>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Features - Large Cards */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Ajo Savings Circles - Primary Card */}
        <button onClick={() => setPage('explore', { filter: 'ajo' })} className="text-left p-8 rounded-3xl bg-gradient-to-br from-emerald-50 to-white border-2 border-emerald-200 hover:border-emerald-400 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
            <div className="absolute top-4 right-4">
                <span className="px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider">ZERO INTEREST</span>
            </div>
            <div className="absolute bottom-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <span className="text-8xl">🔄</span>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform duration-300 shadow-md">
                🔄
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Ajo Savings Circles</h3>
            <p className="text-base text-gray-700 leading-relaxed mb-4">Traditional rotating savings reimagined for modern Nigeria. Access large sums without borrowing.</p>
            <ul className="space-y-2 mb-4">
                <li className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-emerald-600 mt-0.5">✓</span>
                    <span>Access large sums without borrowing</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-emerald-600 mt-0.5">✓</span>
                    <span>Daily, weekly, or monthly cycles</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-emerald-600 mt-0.5">✓</span>
                    <span>Verified members with trust scores</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-emerald-600 mt-0.5">✓</span>
                    <span>Guaranteed payouts</span>
                </li>
            </ul>
            <div className="mt-4 text-base font-bold text-emerald-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Join a Circle <span>→</span>
            </div>
        </button>

        {/* Refinance With Community - Primary Card */}
        <button onClick={() => setPage('explore', { filter: 'loan' })} className="text-left p-8 rounded-3xl bg-gradient-to-br from-green-50 to-white border-2 border-green-200 hover:border-green-400 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
            <div className="absolute top-4 right-4">
                <span className="px-3 py-1 rounded-full bg-green-600 text-white text-xs font-bold uppercase tracking-wider">LOW FEES</span>
            </div>
            <div className="absolute bottom-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <span className="text-8xl">🤝</span>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-green-100 text-green-600 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform duration-300 shadow-md">
                🤝
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Refinance With Community</h3>
            <p className="text-base text-gray-700 leading-relaxed mb-4">Escape predatory loans. Use your Ajo contributions as collateral for fair-rate community lending.</p>
            <ul className="space-y-2 mb-4">
                <li className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>Borrow against pool contributions</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>Flat fee, not compound interest</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>Build credit through repayment</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>Fast approval from your circle</span>
                </li>
            </ul>
            <div className="mt-4 text-base font-bold text-green-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Get Started <span>→</span>
            </div>
        </button>
      </div>

      {/* Secondary Features - Medium Cards */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {/* Inflation Shield Card */}
        <button onClick={() => setPage('explore', { filter: 'invest' })} className="text-left p-6 rounded-3xl bg-white border border-slate-200 hover:border-emerald-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                🛡️
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Inflation Shield</h3>
            <p className="text-sm text-gray-600 leading-relaxed">Protect your naira savings by converting to USDC stablecoins. Shield your wealth from devaluation.</p>
            <div className="mt-4 text-sm font-bold text-emerald-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Protect Now <span>→</span>
            </div>
        </button>

        {/* Group Buys Card */}
        <button onClick={() => setPage('explore', { filter: 'group_buy' })} className="text-left p-6 rounded-3xl bg-white border border-slate-200 hover:border-emerald-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                🛍️
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Group Buys</h3>
            <p className="text-sm text-gray-600 leading-relaxed">Pool money for wholesale pricing. Share a cow, bags of rice, or bulk fuel purchases.</p>
            <div className="mt-4 text-sm font-bold text-emerald-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Join Deal <span>→</span>
            </div>
        </button>
      </div>

      {/* Utility Features - Small Cards */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {/* Owambe Card - Moved to utility */}
        <button onClick={() => setPage('owambe')} className="text-left p-5 rounded-2xl bg-gradient-to-br from-purple-50 to-white border border-purple-100 hover:border-purple-300 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center text-xl mb-3 group-hover:scale-110 transition-transform duration-300">
                🎉
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">Owambe Mode</h3>
            <p className="text-xs text-gray-600 leading-relaxed">Digital spraying for parties</p>
        </button>

        {/* Waybill Escrow Card */}
        <button onClick={() => setPage('explore', { filter: 'waybill' })} className="text-left p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-200 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center text-xl mb-3 group-hover:scale-110 transition-transform duration-300">
                📦
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">Secure Escrow</h3>
            <p className="text-xs text-gray-600 leading-relaxed">Waybill delivery protection</p>
        </button>

        {/* Offline Mode Card */}
        <button onClick={() => setPage('wallet')} className="text-left p-5 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl mb-3 group-hover:scale-110 transition-transform duration-300">
                📶
            </div>
            <h3 className="text-base font-bold mb-1">Works Offline</h3>
            <p className="text-xs text-slate-300 leading-relaxed">USSD codes for no data</p>
        </button>
      </div>

      {/* Trust & Security Section */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-50 to-white border border-slate-200 p-8 shadow-lg">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Built on Trust & Security</h2>
          <p className="text-gray-600">Community finance backed by technology you can trust</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl mb-3 mx-auto shadow-sm">
              🔒
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Bank-Grade Security</h3>
            <p className="text-sm text-gray-600">PIN verification and encrypted transactions protect every payment</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl mb-3 mx-auto shadow-sm">
              ⭐
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Trust Scores</h3>
            <p className="text-sm text-gray-600">Member reliability ratings show who keeps their commitments</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl mb-3 mx-auto shadow-sm">
              ✅
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Guaranteed Payouts</h3>
            <p className="text-sm text-gray-600">Collateral and group accountability ensure you get paid on time</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
