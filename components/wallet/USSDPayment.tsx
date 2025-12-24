
import React, { useState } from 'react';
import { useToasts } from '../ToastHost';

const USSD_CODES: Record<string, string> = {
    '058': '*737*', // GTBank
    '011': '*894*', // First Bank
    '033': '*919*', // UBA
    '057': '*966*', // Zenith
    '044': '*329*', // Access
    '232': '*822*', // Sterling
    '035': '*945*', // Wema
};

const banks = [
    { name: 'GTBank', code: '058' },
    { name: 'First Bank', code: '011' },
    { name: 'UBA', code: '033' },
    { name: 'Zenith Bank', code: '057' },
    { name: 'Access Bank', code: '044' },
    { name: 'Sterling Bank', code: '232' },
    { name: 'Wema Bank', code: '035' },
];

export const USSDPayment: React.FC = () => {
    const [bank, setBank] = useState('');
    const [amount, setAmount] = useState('');
    const [code, setCode] = useState('');
    const { add: addToast } = useToasts();

    const generateCode = () => {
        if (!bank || !amount) return;
        const prefix = USSD_CODES[bank];
        // Mocking a destination account number for the platform wallet
        const destAccount = '1234567890'; 
        // Different banks have slightly different formats, usually *Code*Type*Amount*Account#
        // Simplified generic format for demo: *Code*2*Amount*Account# (2 is often transfer)
        const generated = `${prefix}2*${amount}*${destAccount}#`;
        setCode(generated);
    };

    const copyCode = () => {
        navigator.clipboard.writeText(code);
        addToast({ title: 'Copied', desc: 'USSD code copied to clipboard.', emoji: '📋' });
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">📶</span>
                <div>
                    <h3 className="font-bold text-gray-900">Offline Payment (USSD)</h3>
                    <p className="text-xs text-gray-500">No data? No problem. Transfer via your bank code.</p>
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Select Your Bank</label>
                    <select 
                        value={bank} 
                        onChange={e => { setBank(e.target.value); setCode(''); }} 
                        className="w-full border rounded-xl px-3 py-2 text-sm bg-white"
                    >
                        <option value="">Choose Bank...</option>
                        {banks.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Amount (₦)</label>
                    <input 
                        type="number" 
                        value={amount} 
                        onChange={e => { setAmount(e.target.value); setCode(''); }}
                        placeholder="e.g. 5000"
                        className="w-full border rounded-xl px-3 py-2 text-sm"
                    />
                </div>

                <button 
                    onClick={generateCode} 
                    disabled={!bank || !amount}
                    className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-sm disabled:opacity-50 hover:bg-slate-800 transition"
                >
                    Generate USSD Code
                </button>

                {code && (
                    <div className="mt-4 p-4 bg-slate-100 rounded-xl text-center animate-fade-in-up">
                        <div className="text-xs text-gray-500 mb-1">Dial this code to pay:</div>
                        <div className="font-mono text-xl font-bold text-slate-800 tracking-wider mb-3">
                            {code}
                        </div>
                        <div className="flex gap-2 justify-center">
                            <a href={`tel:${code.replace('#', '%23')}`} className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg font-medium hover:bg-emerald-700">
                                📞 Dial Now
                            </a>
                            <button onClick={copyCode} className="px-4 py-2 border bg-white text-sm rounded-lg font-medium hover:bg-slate-50">
                                Copy
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
