

import React, { useState } from 'react';
import { importStatement } from '../../../../services/reconService';
import { useToasts } from '../../../ToastHost';

interface ImportStatementModalProps {
    runId: number;
    onClose: () => void;
    onSuccess: () => void;
}

const ImportStatementModal: React.FC<ImportStatementModalProps> = ({ runId, onClose, onSuccess }) => {
    const [source, setSource] = useState<'psp' | 'bank'>('psp');
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const { add: addToast } = useToasts();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleImport = async () => {
        if (!file) return;
        setUploading(true);
        
        try {
            // Read file content for CSV parsing
            const reader = new FileReader();
            reader.onload = async (e) => {
                const text = e.target?.result as string;
                try {
                    const count = await importStatement(runId, source, text);
                    addToast({ title: 'Import Successful', desc: `Parsed ${count} items from ${source.toUpperCase()} statement.`, emoji: '📄' });
                    onSuccess();
                } catch (err: any) {
                    addToast({ title: 'Processing Failed', desc: err.message, emoji: '😥' });
                } finally {
                    setUploading(false);
                }
            };
            reader.onerror = () => {
                addToast({ title: 'Read Error', desc: 'Could not read file.', emoji: '😥' });
                setUploading(false);
            };
            reader.readAsText(file);
            
        } catch (e: any) {
            addToast({ title: 'Import Failed', desc: e.message, emoji: '😥' });
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-semibold">Import Statement</h3>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setSource('psp')}
                            className={`flex-1 py-2 px-3 rounded-xl border text-sm font-medium transition ${source === 'psp' ? 'bg-brand-50 border-brand text-brand-700' : 'bg-white hover:bg-slate-50'}`}
                        >
                            PSP (Paystack)
                        </button>
                        <button 
                            onClick={() => setSource('bank')}
                            className={`flex-1 py-2 px-3 rounded-xl border text-sm font-medium transition ${source === 'bank' ? 'bg-brand-50 border-brand text-brand-700' : 'bg-white hover:bg-slate-50'}`}
                        >
                            Bank Statement
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CSV File</label>
                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center">
                        <input type="file" id="csv-file" className="hidden" onChange={handleFileChange} accept=".csv,.txt" />
                        <label htmlFor="csv-file" className="cursor-pointer text-sm text-gray-600 hover:text-brand block h-full">
                            {file ? (
                                <div className="font-medium text-emerald-600 break-all">{file.name}</div>
                            ) : (
                                <>
                                    <div className="text-2xl mb-2">📂</div>
                                    <div>Click to upload CSV</div>
                                </>
                            )}
                        </label>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2">Required Columns: Date, Reference, Amount</p>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                    <button onClick={onClose} disabled={uploading} className="px-4 py-2 text-sm rounded-xl border">Cancel</button>
                    <button onClick={handleImport} disabled={uploading || !file} className="px-4 py-2 text-sm rounded-xl bg-brand text-white disabled:opacity-50">
                        {uploading ? 'Parsing...' : 'Upload & Parse'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImportStatementModal;
