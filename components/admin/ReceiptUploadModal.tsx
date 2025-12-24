'use client';
import React, { useState } from 'react';
import { useToasts } from '../ToastHost';
import { uploadReceipt } from '../../services/disbursementService';

interface ReceiptUploadModalProps {
    payoutId: number;
    payoutType: 'cycle' | 'settlement';
    onClose: () => void;
    onSuccess: () => void;
}

const ReceiptUploadModal: React.FC<ReceiptUploadModalProps> = ({ payoutId, payoutType, onClose, onSuccess }) => {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const { add: addToast } = useToasts();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async () => {
        if (!file) {
            addToast({ title: 'No file selected', desc: 'Please select a file to upload.', emoji: '📂' });
            return;
        }

        setIsUploading(true);
        try {
            // In a real app, you'd get a signed URL and upload to Supabase Storage.
            // const { data: signedUrlData, error: urlError } = await supabase.storage.from('payout-receipts').createSignedUploadUrl(...);
            // const { error: uploadError } = await supabase.storage.from('payout-receipts').uploadToSignedUrl(...);
            
            // Mocking the upload process
            console.log(`MOCK: Uploading ${file.name} to storage...`);
            await new Promise(res => setTimeout(res, 1200));
            const filePath = `receipts/${payoutType}-${payoutId}-${file.name}`;
            
            // Mock a public URL for the uploaded file
            const supabaseUrl = "https://your-project-id.supabase.co"; // from supabaseClient.ts
            const mockUrl = `${supabaseUrl}/storage/v1/object/public/payout-receipts/${filePath}`;

            await uploadReceipt(payoutId, payoutType, { filePath, url: mockUrl });
            
            addToast({ title: 'Receipt Uploaded', desc: 'The receipt has been attached to the payout.', emoji: '✅' });
            onSuccess();
        } catch (e: any) {
            addToast({ title: 'Upload Failed', desc: e.message, emoji: '😥' });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center" onClick={onClose}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-semibold">Upload Receipt for Payout #{payoutId}</h3>
                
                <div>
                    <label htmlFor="receipt-file" className="block text-sm font-medium text-gray-700">Receipt File</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            <div className="flex text-sm text-gray-600">
                                <label htmlFor="receipt-file-input" className="relative cursor-pointer bg-white rounded-md font-medium text-brand hover:text-brand-700 focus-within:outline-none">
                                    <span>Upload a file</span>
                                    <input id="receipt-file-input" name="receipt-file-input" type="file" className="sr-only" onChange={handleFileChange} />
                                </label>
                                <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-gray-500">{file ? file.name : 'PDF, PNG, JPG up to 10MB'}</p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                    <button onClick={onClose} disabled={isUploading} className="px-4 py-2 text-sm rounded-xl border">Cancel</button>
                    <button onClick={handleSubmit} disabled={isUploading || !file} className="px-4 py-2 text-sm rounded-xl bg-brand text-white disabled:opacity-50">
                        {isUploading ? 'Uploading...' : 'Submit Receipt'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReceiptUploadModal;