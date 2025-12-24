
import React, { useState, useEffect, useMemo } from 'react';
import type { Page } from '../../App';
import { interpretCommand } from '../../services/geminiService';

interface CommandPaletteProps {
  setPage: (page: Page, context?: any) => void;
  isOpen: boolean;
  onClose: () => void;
}

interface CommandItem {
  id: string;
  label: string;
  icon: string;
  action: () => void;
  category: 'Navigation' | 'Action' | 'AI Suggested';
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ setPage, isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [aiResult, setAiResult] = useState<CommandItem | null>(null);
  const [isThinking, setIsThinking] = useState(false);

  const commands: CommandItem[] = useMemo(() => [
    { id: 'home', label: 'Dashboard', icon: '🏠', category: 'Navigation', action: () => setPage('dashboard') },
    { id: 'wallet', label: 'Wallet & Cards', icon: '💳', category: 'Navigation', action: () => setPage('wallet') },
    { id: 'explore', label: 'Explore Pools', icon: '🔍', category: 'Navigation', action: () => setPage('explore') },
    { id: 'standing', label: 'My Standing', icon: '📊', category: 'Navigation', action: () => setPage('standing') },
    { id: 'settings', label: 'Settings', icon: '⚙️', category: 'Navigation', action: () => setPage('notifications') },
    { id: 'support', label: 'Help & Support', icon: '❓', category: 'Navigation', action: () => setPage('support' as any) }, // Assuming support page mapping
    { id: 'kyc', label: 'Verify Identity (KYC)', icon: '🆔', category: 'Action', action: () => setPage('kyc') },
    { id: 'refinance', label: 'Request Loan', icon: '💸', category: 'Action', action: () => setPage('loanRequest') },
  ], [setPage]);

  // Handle AI Search Debounce
  useEffect(() => {
      const timer = setTimeout(async () => {
          if (query.length > 3 && filteredCommands.length === 0) {
              setIsThinking(true);
              const interpretation = await interpretCommand(query);
              setIsThinking(false);
              
              if (interpretation.action === 'navigate' && interpretation.page) {
                  setAiResult({
                      id: 'ai-suggestion',
                      label: `Go to ${interpretation.page} ${interpretation.context ? '(Filtered)' : ''}`,
                      icon: '✨',
                      category: 'AI Suggested',
                      action: () => setPage(interpretation.page as Page, interpretation.context)
                  });
                  setSelectedIndex(0);
              } else {
                  setAiResult(null);
              }
          } else {
              setAiResult(null);
          }
      }, 600);
      return () => clearTimeout(timer);
  }, [query]);

  const filteredCommands = useMemo(() => {
    if (!query) return commands;
    const lower = query.toLowerCase();
    return commands.filter(c => c.label.toLowerCase().includes(lower));
  }, [query, commands]);

  const displayedCommands = useMemo(() => {
      return aiResult ? [aiResult, ...filteredCommands] : filteredCommands;
  }, [aiResult, filteredCommands]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard handling
  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % displayedCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + displayedCommands.length) % displayedCommands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (displayedCommands[selectedIndex]) {
            displayedCommands[selectedIndex].action();
            onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, displayedCommands, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[20vh] bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-fade-in-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center border-b px-4 py-3 gap-3">
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input 
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Where to? (e.g. Wallet, Loan, 'I want to invest')"
            className="flex-1 text-lg bg-transparent outline-none text-gray-800 placeholder-gray-400"
          />
          {isThinking && <div className="text-xs text-brand animate-pulse">Thinking...</div>}
          <div className="text-xs font-mono text-gray-400 border rounded px-1.5 py-0.5">ESC</div>
        </div>
        
        <div className="max-h-[300px] overflow-y-auto p-2">
          {displayedCommands.length === 0 && !isThinking ? (
            <div className="p-8 text-center text-gray-500 text-sm">No results found. Try typing a sentence for AI.</div>
          ) : (
            <div className="space-y-1">
              {displayedCommands.map((cmd, idx) => (
                <button
                  key={cmd.id}
                  onClick={() => { cmd.action(); onClose(); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                    idx === selectedIndex ? 'bg-brand-50 text-brand-900' : 'text-gray-700 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg grid place-items-center text-lg ${idx === selectedIndex ? 'bg-white shadow-sm' : 'bg-slate-100'} ${cmd.category === 'AI Suggested' ? 'text-brand-600 bg-brand-100' : ''}`}>
                    {cmd.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{cmd.label}</div>
                    <div className="text-[10px] opacity-60 uppercase tracking-wider font-semibold">{cmd.category}</div>
                  </div>
                  {idx === selectedIndex && (
                    <svg className="w-4 h-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="bg-slate-50 px-4 py-2 border-t text-[10px] text-gray-500 flex justify-between">
            <span>Select with ↑↓ and Enter</span>
            <span>Togedaly AI</span>
        </div>
      </div>
    </div>
  );
};
