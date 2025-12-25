

import type { ReconRun, ReconItem } from '../types';

let runsDb: ReconRun[] = [];
let itemsDb: ReconItem[] = [];

// CSV Parser logic
export function parseCSV(csvText: string): any[] {
  const lines = csvText.split('\n').filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  
  return lines.slice(1).map(line => {
    // Handle quoted fields logic would be here for robust CSV
    const values = line.split(','); 
    return headers.reduce((obj, header, index) => {
      obj[header] = values[index]?.trim();
      return obj;
    }, {} as any);
  });
}

export async function getReconRuns(orgId: number): Promise<ReconRun[]> {
    await new Promise(res => setTimeout(res, 400));
    return [...runsDb].filter(r => r.org_id === orgId).sort((a,b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
}

export async function getReconItems(): Promise<ReconItem[]> {
    console.log("getReconItems (all)");
    await new Promise(res => setTimeout(res, 400));
    return [...itemsDb];
}

export async function getReconItemsForRun(runId: number): Promise<ReconItem[]> {
    await new Promise(res => setTimeout(res, 400));
    return itemsDb.filter(i => i.run_id === runId);
}

export async function startReconRun(orgId: number): Promise<ReconRun> {
    await new Promise(res => setTimeout(res, 800));
    const newRun: ReconRun = {
        id: Date.now(),
        org_id: orgId,
        status: 'pending',
        started_at: new Date().toISOString(),
        ended_at: '',
    };
    runsDb.unshift(newRun);
    return newRun;
}

export async function importStatement(runId: number, source: 'psp' | 'bank', fileContent: string): Promise<number> {
    console.log(`MOCK: Importing ${source} statement for run ${runId}`);
    await new Promise(res => setTimeout(res, 1000)); // Simulate processing

    // Use our new CSV parser
    // Expecting columns roughly like: Date,Reference,Amount,Description
    const parsed = parseCSV(fileContent);
    const newItems: ReconItem[] = [];

    // If file content is empty or mocked "filename" passed as content in previous mock
    if (parsed.length === 0 && !fileContent.includes(',')) {
        // Fallback to generating mock items if no real CSV data provided
        const count = 5;
        for(let i=0; i<count; i++) {
            newItems.push({
                id: Date.now() + i,
                run_id: runId,
                source,
                external_ref: `${source.toUpperCase()}-REF-${Math.floor(Math.random() * 10000)}`,
                amount: Math.floor(Math.random() * 100000) * 100, 
                currency: 'NGN',
                status: 'pending',
                meta: { filename: 'mock_generated.csv' }
            });
        }
    } else {
        // Map parsed CSV rows to ReconItems
        parsed.forEach((row, i) => {
            const amount = parseFloat(row['Amount'] || '0') * 100; // Assume CSV amount is major units
            const ref = row['Reference'] || row['Ref'] || `ROW-${i}`;
            
            if (amount !== 0) {
                newItems.push({
                    id: Date.now() + i,
                    run_id: runId,
                    source,
                    external_ref: ref,
                    amount,
                    currency: row['Currency'] || 'NGN',
                    status: 'pending',
                    meta: { original: row }
                });
            }
        });
    }

    itemsDb.push(...newItems);
    return newItems.length;
}

export interface MatchSuggestion {
    id: string;
    items: ReconItem[];
    confidence: number;
    reason: string;
}

export async function getAutoMatchSuggestions(runId: number): Promise<MatchSuggestion[]> {
    await new Promise(res => setTimeout(res, 1000));
    const items = itemsDb.filter(i => i.run_id === runId && i.status === 'pending');
    
    const suggestions: MatchSuggestion[] = [];
    
    // Mock logic: Find items with matching absolute amounts
    const ledgerMatch = items.find(i => i.source === 'ledger' && i.amount === -5000000);
    const pspMatch = items.find(i => (i.source === 'psp' || i.source === 'bank') && i.amount === 5000000);

    if (ledgerMatch && pspMatch) {
        suggestions.push({
            id: `sugg-${Date.now()}`,
            items: [ledgerMatch, pspMatch],
            confidence: 0.95,
            reason: 'Exact amount and similar ref pattern'
        });
    }

    if (items.length > 2) {
        suggestions.push({
            id: `sugg-fuzzy-${Date.now()}`,
            items: [items[0], items[1]],
            confidence: 0.60,
            reason: 'Same amount, different date (potential timing diff)'
        });
    }

    return suggestions;
}

export async function confirmMatch(itemIds: number[]): Promise<void> {
    await new Promise(res => setTimeout(res, 500));
    itemsDb.forEach(i => {
        if (itemIds.includes(i.id)) {
            i.status = 'matched';
        }
    });
}

export async function updateItemStatus(itemId: number, status: 'matched' | 'mismatched' | 'resolved'): Promise<void> {
    await new Promise(res => setTimeout(res, 300));
    const item = itemsDb.find(i => i.id === itemId);
    if (item) {
        item.status = status;
    }
}

export async function matchReconItem(itemId: number): Promise<void> {
    return updateItemStatus(itemId, 'matched');
}

export async function resolveReconItem(itemId: number): Promise<void> {
    return updateItemStatus(itemId, 'resolved');
}

export async function createLedgerTxn(details: { amount: number, ref: string, walletId: string }): Promise<void> {
    console.log('MOCK: createLedgerTxn', details);
    await new Promise(res => setTimeout(res, 600));
}
