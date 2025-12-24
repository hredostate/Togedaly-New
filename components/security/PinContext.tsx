
import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { verifyTransactionPin } from '../../services/pinService';
import { isWebAuthnAvailable, verifyBiometric, registerBiometric } from '../../services/webAuthnService';

interface PinContextType {
  requestPin: (actionDescription: string) => Promise<boolean>;
}

const PinContext = createContext<PinContextType | null>(null);

export const usePin = () => {
  const ctx = useContext(PinContext);
  if (!ctx) throw new Error('usePin must be used within PinProvider');
  return ctx;
};

export const PinProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [action, setAction] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [canUseBio, setCanUseBio] = useState(false);
  
  const resolveRef = useRef<((value: boolean) => void) | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    isWebAuthnAvailable().then(setCanUseBio);
  }, []);

  const requestPin = useCallback((actionDescription: string) => {
    setIsOpen(true);
    setAction(actionDescription);
    setPin('');
    setError('');
    
    return new Promise<boolean>((resolve) => {
      if (resolveRef.current) {
        resolveRef.current(false);
      }
      resolveRef.current = resolve;
    });
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Auto-trigger biometric if registered and available? 
      // Often better to let user choose, or auto-trigger if they prefer.
      // We'll leave it as a button for clarity in this demo.
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleCancel = () => {
    setIsOpen(false);
    if (resolveRef.current) {
      resolveRef.current(false);
      resolveRef.current = null;
    }
  };

  const handleBiometric = async () => {
    setLoading(true);
    setError('');
    try {
        // If not registered, treat as registration flow for demo purposes if we assume implicit signup
        // But strictly, we should check if registered.
        const isRegistered = localStorage.getItem('biometric_registered');
        if (!isRegistered) {
            if (confirm("Setup FaceID/TouchID for faster approval?")) {
                await registerBiometric();
            } else {
                setLoading(false);
                return;
            }
        }
        
        await verifyBiometric('challenge-string');
        setIsOpen(false);
        if (resolveRef.current) {
            resolveRef.current(true);
            resolveRef.current = null;
        }
    } catch (e: any) {
        setError(e.message || 'Biometric failed');
    } finally {
        setLoading(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (pin.length !== 4) return;

    setLoading(true);
    setError('');
    
    try {
      const isValid = await verifyTransactionPin(pin);
      if (isValid) {
        setIsOpen(false);
        if (resolveRef.current) {
          resolveRef.current(true);
          resolveRef.current = null;
        }
      } else {
        setError('Incorrect PIN. Try "1234"');
        setPin('');
      }
    } catch (e) {
      setError('Verification failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setPin(val);
    if (error) setError('');
  };

  return (
    <PinContext.Provider value={{ requestPin }}>
      {children}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[320px] p-6 transform transition-all scale-100">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-brand-50 text-brand rounded-full flex items-center justify-center mx-auto mb-3 text-xl">
                🔒
              </div>
              <h3 className="text-lg font-bold text-gray-900">Enter PIN</h3>
              <p className="text-xs text-gray-500 mt-1">
                Please confirm your <span className="font-medium text-gray-700">{action}</span>
              </p>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="relative mb-6 group">
                <input 
                    ref={inputRef}
                    type="password" 
                    inputMode="numeric" 
                    maxLength={4} 
                    value={pin}
                    onChange={handleInputChange}
                    className="w-full text-center text-3xl font-mono tracking-[0.5em] border-b-2 border-slate-200 py-2 bg-transparent text-gray-800 focus:border-brand focus:outline-none transition-colors placeholder-slate-200"
                    placeholder="••••"
                />
              </div>
              
              {error && (
                <div className="text-center text-xs text-rose-600 font-medium mb-4 bg-rose-50 py-1 px-2 rounded-lg animate-pulse">
                  {error}
                </div>
              )}
              
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <button 
                    type="button" 
                    onClick={handleCancel} 
                    className="py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-gray-600 hover:bg-slate-50 transition-colors"
                    >
                    Cancel
                    </button>
                    <button 
                    type="submit" 
                    disabled={loading || pin.length !== 4} 
                    className="py-2.5 rounded-xl bg-brand text-white text-sm font-bold hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand/20"
                    >
                    {loading ? '...' : 'Confirm'}
                    </button>
                </div>
                
                {canUseBio && (
                    <button
                        type="button"
                        onClick={handleBiometric}
                        className="w-full py-2 rounded-xl text-brand text-xs font-semibold hover:bg-brand-50 transition flex items-center justify-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
                        </svg>
                        Use FaceID / TouchID
                    </button>
                )}
              </div>
            </form>
            <div className="mt-4 text-center">
                <p className="text-[10px] text-gray-400">Default mock PIN is <b>1234</b></p>
            </div>
          </div>
        </div>
      )}
    </PinContext.Provider>
  );
};
