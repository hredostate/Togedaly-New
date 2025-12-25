
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useToasts } from '../components/ToastHost';

const Auth: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  
  // Email State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Phone State
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);

  // Common State
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { add } = useToasts();

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        });
        if (error) throw error;
    } catch (error: any) {
        add({ title: 'Login Error', desc: error.message, emoji: '⚠️' });
        setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
        if (isSignUp) {
            // Sign Up Logic
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                    }
                }
            });
            if (error) throw error;
            add({ title: 'Success!', desc: 'Please check your email to verify your account.', emoji: '📧' });
        } else {
            // Sign In Logic
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            if (error) throw error;
            // App.tsx auth listener will handle redirect
        }
    } catch (error: any) {
        add({ title: 'Authentication Error', desc: error.message, emoji: '⚠️' });
    } finally {
        setLoading(false);
    }
  };

  const handlePhoneAuth = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);

      try {
          if (showOtpInput) {
              // Verify OTP via our API
              const response = await fetch('/api/auth/verify-otp', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      phone,
                      code: otp,
                      fullName: isSignUp ? fullName : undefined,
                      isSignUp
                  })
              });

              const result = await response.json();

              if (!response.ok) {
                  throw new Error(result.error || 'Verification failed');
              }

              add({ title: 'Success!', desc: 'Phone verified successfully. You can now sign in with your phone number.', emoji: '✅' });
              
              // Note: In a production app with proper backend, the API would create
              // a session token here. For now, users should use the regular Supabase 
              // phone auth or we'd need to implement custom session management.
              // This implementation focuses on the OTP verification via KudiSMS.
              
              // Reset form for re-login
              setShowOtpInput(false);
              setOtp('');
              
          } else {
              // Send OTP via our API
              const response = await fetch('/api/auth/send-otp', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ phone })
              });

              const result = await response.json();

              if (!response.ok) {
                  throw new Error(result.error || 'Failed to send code');
              }

              setShowOtpInput(true);
              add({ title: 'Code Sent', desc: 'Check your phone for the verification code.', emoji: '📱' });
          }
      } catch (error: any) {
          add({ title: 'Error', desc: error.message, emoji: '⚠️' });
          if (showOtpInput) {
              // Allow retry if verification failed, but keep input open
          } else {
              setShowOtpInput(false);
          }
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-2">
                {isSignUp ? 'Create Profile' : 'Welcome Back'}
            </h1>
            <p className="text-gray-500">
                {isSignUp ? 'Join the community to start growing your wealth.' : 'Sign in to manage your pools and investments.'}
            </p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-xl rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-400 to-purple-500"></div>
            
            {/* Google Button */}
            <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 border border-slate-200 rounded-2xl text-sm font-semibold text-gray-700 hover:bg-slate-50 hover:border-slate-300 transition-all mb-6 bg-white shadow-sm group"
            >
                <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>Continue with Google</span>
            </button>

            {/* Method Toggle */}
            <div className="flex mb-6 p-1 bg-slate-100 rounded-xl">
                <button 
                    onClick={() => { setAuthMethod('email'); setShowOtpInput(false); }}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${authMethod === 'email' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Email
                </button>
                <button 
                    onClick={() => { setAuthMethod('phone'); setShowOtpInput(false); }}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${authMethod === 'phone' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Phone
                </button>
            </div>

            <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                <div className="relative flex justify-center text-xs uppercase tracking-wider font-medium text-gray-400">
                    <span className="bg-white/80 px-4 backdrop-blur-xl">Or with {authMethod}</span>
                </div>
            </div>

            <form onSubmit={authMethod === 'email' ? handleEmailAuth : handlePhoneAuth} className="space-y-4">
                <div className="animate-fade-in space-y-4">
                    {isSignUp && !showOtpInput && (
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1 ml-1">Full Name</label>
                            <input 
                                type="text"
                                value={fullName} 
                                onChange={(e)=>setFullName(e.target.value)} 
                                placeholder="Adanna Okeke" 
                                required={isSignUp}
                                disabled={loading}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-3 text-gray-900 placeholder-gray-400 focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10 focus:outline-none transition-all"
                            />
                        </div>
                    )}
                    
                    {authMethod === 'email' ? (
                        <>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1 ml-1">Email Address</label>
                                <input 
                                    type="email"
                                    value={email} 
                                    onChange={(e)=>setEmail(e.target.value)} 
                                    placeholder="you@example.com" 
                                    required
                                    disabled={loading}
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-3 text-gray-900 placeholder-gray-400 focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10 focus:outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1 ml-1">Password</label>
                                <div className="relative">
                                    <input 
                                        type={showPassword ? "text" : "password"}
                                        value={password} 
                                        onChange={(e)=>setPassword(e.target.value)} 
                                        placeholder="••••••••" 
                                        required
                                        minLength={6}
                                        disabled={loading}
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-3 pr-12 text-gray-900 placeholder-gray-400 focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10 focus:outline-none transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none p-1"
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                                <path fillRule="evenodd" d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745A10.526 10.526 0 0010 16c-3.9 0-7.375-2.26-9.114-5.5C2.053 7.355 4.17 4.717 6.94 3.283L3.28 2.22zM8.904 10l-1.59-1.59a.75.75 0 00-1.06 1.06l1.59 1.59a2.25 2.25 0 003.18 0l1.59-1.59a.75.75 0 00-1.06-1.06l-1.59 1.59a.75.75 0 01-1.06 0z" clipRule="evenodd" />
                                                <path d="M10 3.5c2.7 0 5.15 1.09 6.918 2.87l1.613-1.614a.75.75 0 011.06 1.06l-2.213 2.213c.07.315.111.64.12.971h.002a9.75 9.75 0 01-.318 3.028l2.692 2.692A10.47 10.47 0 0019.114 10.5C17.375 7.24 13.9 4.98 10 4.98c-.725 0-1.436.076-2.125.22L9.31 6.638c.223-.048.451-.083.69-.083z" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                                <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                                                <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            {!showOtpInput ? (
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1 ml-1">Phone Number</label>
                                    <input 
                                        type="tel"
                                        value={phone} 
                                        onChange={(e)=>setPhone(e.target.value)} 
                                        placeholder="+234 800 000 0000" 
                                        required
                                        disabled={loading}
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-3 text-gray-900 placeholder-gray-400 focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10 focus:outline-none transition-all"
                                    />
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1 ml-1">Verification Code</label>
                                    <input 
                                        type="text"
                                        value={otp} 
                                        onChange={(e)=>setOtp(e.target.value)} 
                                        placeholder="123456" 
                                        required
                                        disabled={loading}
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-3 text-center text-2xl tracking-widest text-gray-900 placeholder-gray-300 focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10 focus:outline-none transition-all font-mono"
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setShowOtpInput(false)}
                                        className="mt-2 text-xs text-brand font-medium hover:underline w-full text-center"
                                    >
                                        Wrong number? Go back
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <button 
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 rounded-2xl bg-brand text-white font-bold shadow-lg shadow-brand/25 hover:bg-brand-700 hover:shadow-brand/40 hover:-translate-y-0.5 transition-all active:scale-[0.98] disabled:opacity-70 disabled:hover:translate-y-0 mt-6"
                >
                    {loading ? (
                        <div className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>Processing...</span>
                        </div>
                    ) : (
                        <span>
                            {authMethod === 'phone' 
                                ? (showOtpInput ? 'Verify & Sign In' : 'Send Code') 
                                : (isSignUp ? 'Create Account' : 'Sign In')}
                        </span>
                    )}
                </button>
            </form>
            
            <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">
                    {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                    <button 
                        onClick={() => { setIsSignUp(!isSignUp); setShowOtpInput(false); }}
                        className="font-semibold text-brand hover:text-brand-700 hover:underline transition-colors"
                    >
                        {isSignUp ? 'Sign In' : 'Sign Up'}
                    </button>
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
