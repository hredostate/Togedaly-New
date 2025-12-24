
import React, { useState } from 'react';
import { useToasts } from '../../ToastHost';
import { uploadProofOfDelivery } from '../../../services/supplierService';

interface ProofOfDeliveryModalProps {
    groupBuyId: number;
    onClose: () => void;
    onSuccess: () => void;
}

const ProofOfDeliveryModal: React.FC<ProofOfDeliveryModalProps> = ({ groupBuyId, onClose, onSuccess }) => {
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
            addToast({ title: 'No file', desc: 'Please select a file.', emoji: '📂' });
            return;
        }
        setIsUploading(true);
        try {
            // Mock file upload process
            console.log(`MOCK: Uploading POD for GroupBuy #${groupBuyId}...`);
            await new Promise(res => setTimeout(res, 1200));
            
            const mockUrl = `https://example.com/pod/groupbuy-${groupBuyId}-${file.name}`;
            await uploadProofOfDelivery(groupBuyId, mockUrl);
            
            addToast({ title: 'POD Uploaded', desc: 'Proof of Delivery has been saved.', emoji: '✅' });
            onSuccess();
        } catch (e: any) {
            addToast({ title: 'Error', desc: e.message, emoji: '😥' });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-semibold">Upload Proof of Delivery</h3>
                
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center">
                    <input type="file" id="pod-file" className="hidden" onChange={handleFileChange} accept="image/*,.pdf" />
                    <label htmlFor="pod-file" className="cursor-pointer text-sm text-gray-600 hover:text-brand">
                        {file ? (
                            <div className="font-medium text-emerald-600">{file.name}</div>
                        ) : (
                            <>
                                <div className="text-2xl mb-2">📸</div>
                                <div>Click to upload photo or document</div>
                            </>
                        )}
                    </label>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <button onClick={onClose} disabled={isUploading} className="px-4 py-2 text-sm rounded-xl border">Cancel</button>
                    <button onClick={handleSubmit} disabled={isUploading || !file} className="px-4 py-2 text-sm rounded-xl bg-brand text-white disabled:opacity-50">
                        {isUploading ? 'Uploading...' : 'Submit POD'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProofOfDeliveryModal;
