
// services/reportService.ts
import { fetchAuditLogs } from './auditService';

export async function getRoutingReport(
    since?: string,
    bank?: string,
    minAmount?: number,
    strictBank?: string // New parameter
) {
    console.log("MOCK: getRoutingReport with filters", { since, bank, minAmount, strictBank });
    
    const logs = await fetchAuditLogs({ action: 'routing.apply' });

    let filteredLogs = logs;
    if (since) {
        filteredLogs = filteredLogs.filter(log => new Date(log.created_at) >= new Date(since));
    }

    const counts: Record<string, number> = { memo_override: 0, memo_tag: 0, user_default: 0, default_to_wallet: 0 };
    const unrouted: any[] = [];

    let i = 0; // for mock data simulation
    for (const r of filteredLogs) {
        const reason = r.meta?.route?.reason || '';
        if (reason.startsWith('memo_override')) counts.memo_override++;
        else if (reason.startsWith('memo_tag')) counts.memo_tag++;
        else if (reason.startsWith('user_default')) counts.user_default++;
        else if (reason.startsWith('default_to_wallet')) counts.default_to_wallet++;

        if (reason.startsWith('default_to_wallet')) {
            const narration = r.meta?.route?.narration || '';
            const amt = (r.meta?.amount_kobo || 0) / 100;
            
            // SIMULATE sender_bank being present in the meta for some logs.
            const senderBank = (i++ % 3 === 0) ? 'Wema Bank' : (i % 3 === 1 ? 'GTBank' : 'First Bank');

            const bankOk = !bank || String(narration).toLowerCase().includes(bank.toLowerCase());
            const strictOk = !strictBank || senderBank.toLowerCase() === strictBank.toLowerCase();
            const amtOk = !minAmount || amt >= minAmount;

            if (bankOk && strictOk && amtOk) {
                unrouted.push({
                    when: r.created_at,
                    user: r.target,
                    amount_kobo: r.meta?.amount_kobo,
                    narration: narration,
                    sender_bank: senderBank, // Include sender bank in the result
                });
            }
        }
    }

    return { counts, unrouted: unrouted.slice(0, 100) }; // Cap at 100 for UI performance
}
