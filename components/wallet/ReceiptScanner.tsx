
import React, { useState } from 'react';
import { scanReceipt, ScannedReceipt } from '../../services/ocrService';
import { useToasts } from '../ToastHost';

const ReceiptScanner: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [scanning, setScanning] = useState(false);
    const [result, setResult] = useState<ScannedReceipt | null>(null);
    const { add: addToast } = useToasts();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const f = e.target.files[0];
            setFile(f);
            setResult(null);
            
            // Create preview
            const reader = new FileReader();
            reader.onload = (ev) => setPreview(ev.target?.result as string);
            reader.readAsDataURL(f);
        }
    };

    const handleScan = async () => {
        if (!file) return;
        setScanning(true);
        try {
            const data = await scanReceipt(file);
            setResult(data);
            addToast({ title: "Scan Complete", desc: "Receipt details extracted.", emoji: "🤖" });
        } catch (e: any) {
            addToast({ title: "Scan Failed", desc: "Could not analyze image.", emoji: "⚠️" });
        } finally {
            setScanning(false);
        }
    };

    const handleLog = () => {
        // Mock logging action
        addToast({ title: "Transaction Logged", desc: "The transfer has been recorded for reconciliation.", emoji: "✅" });
        setFile(null);
        setPreview(null);
        setResult(null);
    };

    return (
        <div className="rounded-2xl border bg-white overflow-hidden shadow-sm">
            <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <span>🧾</span> Receipt Scanner
                </h3>
                <span className="text-xs bg-brand-100 text-brand-700 px-2 py-1 rounded-full font-medium">AI Powered</span>
            </div>
            
            <div className="p-4">
                {!file ? (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <svg className="w-8 h-8 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                            <p className="text-xs text-gray-500 font-medium">Click to upload or snap receipt</p>
                        </div>
                        <input type="file" className="hidden" accept="image/*" capture="environment" onChange={handleFileChange} />
                    </label>
                ) : (
                    <div className="flex gap-4">
                        <div className="w-24 h-24 flex-shrink-0 bg-slate-100 rounded-lg overflow-hidden border">
                            {preview && <img src={preview} alt="Receipt" className="w-full h-full object-cover" />}
                        </div>
                        <div className="flex-1 flex flex-col justify-center gap-2">
                            <div className="text-sm font-medium truncate">{file.name}</div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={handleScan} 
                                    disabled={scanning || !!result} 
                                    className="px-3 py-1.5 bg-slate-900 text-white text-xs rounded-lg font-semibold disabled:opacity-50"
                                >
                                    {scanning ? 'Scanning...' : result ? 'Scanned' : 'Scan with AI'}
                                </button>
                                <button 
                                    onClick={() => { setFile(null); setResult(null); }} 
                                    className="px-3 py-1.5 border text-gray-600 text-xs rounded-lg hover:bg-slate-50"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {result && (
                    <div className="mt-4 pt-4 border-t space-y-3 animate-fade-in-up">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <label className="text-xs text-gray-500 block">Amount</label>
                                <input className="w-full border rounded p-1.5 font-semibold" defaultValue={result.amount} />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 block">Date</label>
                                <input className="w-full border rounded p-1.5" defaultValue={result.date} />
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs text-gray-500 block">Sender</label>
                                <input className="w-full border rounded p-1.5" defaultValue={result.sender} />
                            </div>
                        </div>
                        <button onClick={handleLog} className="w-full py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition">
                            Verify & Log Transfer
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReceiptScanner;
