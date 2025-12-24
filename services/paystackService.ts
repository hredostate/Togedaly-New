
import { useToasts } from '../components/ToastHost';
import { enqueueNotification } from './notificationService';
import { db } from '../lib/db';

export const initiatePayment = async (
    email: string, 
    amountNaira: number, 
    userId: string,
    addToast: ReturnType<typeof useToasts>['add'],
    splitCode?: string
): Promise<void> => {
    
    addToast({
        title: 'Processing...',
        desc: `Securely connecting to Paystack for ₦${amountNaira.toLocaleString()}.`,
        emoji: '💳'
    });

    try {
        // Simulate network delay
        await new Promise(res => setTimeout(res, 2000));
        
        // Success Logic
        // Credit the wallet in our local DB
        db.creditWallet(userId, amountNaira * 100);
        
        handlePaymentSuccess(amountNaira, addToast, userId);

    } catch (e: any) {
        addToast({ title: 'Payment Failed', desc: 'Could not complete transaction.', emoji: '🚫' });
    }
};

const handlePaymentSuccess = (amountNaira: number, addToast: any, userId: string) => {
    addToast({ title: 'Payment Verified!', desc: 'Your wallet has been credited.', emoji: '✅' });
    
    enqueueNotification('inapp', 'inapp_general', { 
        title: 'Wallet Top-Up Successful', 
        body: `You added **₦${amountNaira.toLocaleString()}** to your wallet.` 
    });
};
