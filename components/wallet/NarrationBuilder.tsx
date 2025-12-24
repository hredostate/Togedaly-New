
// components/wallet/NarrationBuilder.tsx
'use client'
import * as React from 'react'
import { useToasts } from '../ToastHost';
import { getActiveUserPools as getActiveUserVentures } from '../../services/poolService';
import { roleClass } from '../roles'; // Import shared helper
import type { PoolType } from '../../types';

function upper(s: string) { return (s || '').trim().toUpperCase().replace(/\s+/g, '-') }

export default function NarrationBuilder() {
    const [kind, setKind] = React.useState<PoolType>('ajo');
    const [ref, setRef] = React.useState('LEKKI-COW-DEC');
    const [ventures, setVentures] = React.useState<any[]>([]);
    const tag = `${kind.toUpperCase()}:${upper(ref)}`;
    const [copied, setCopied] = React.useState(false);
    const { add: addToast } = useToasts();
    
    React.useEffect(() => {
        getActiveUserVentures()
            .then(setVentures)
            .catch(() => console.error("Could not load user pools for chips."));
    }, []);

    async function copy() {
        try {
            await navigator.clipboard.writeText(tag);
            setCopied(true);
            addToast({ title: 'Copied!', desc: 'Narration tag copied to clipboard.', emoji: '📋'});
            setTimeout(() => setCopied(false), 1500);
        } catch (err) {
            addToast({ title: 'Copy Failed', desc: 'Could not copy to clipboard.', emoji: '😥' });
        }
    }

    const chips = ventures.filter(v => v.type === kind).slice(0, 24);

    return (
        <div className="rounded-2xl border bg-slate-50 p-4 space-y-3">
            <div className="text-sm font-medium">Narration Builder</div>
            <div className="grid grid-cols-3 gap-2 text-sm">
                <select className="border rounded-xl px-3 py-2 bg-white" value={kind} onChange={e => setKind(e.target.value as any)}>
                    <option value="ajo">AJO</option>
                    <option value="group_buy">GROUP</option>
                    <option value="invest">INVEST</option>
                </select>
                <input className="border rounded-xl px-3 py-2 col-span-2" placeholder="Reference (e.g., Lekki Cow Dec)" value={ref} onChange={e => setRef(e.target.value)} />
            </div>

            {chips.length > 0 && (
                <div className="flex flex-wrap gap-2 text-xs pt-1">
                    {chips.map((c: any) => (
                        <button key={`${c.type}:${c.id}`} onClick={() => {
                            setKind(c.type);
                            const p = String(c.refSuggested || '');
                            setRef(p.split(':')[1] || '');
                        }} className="px-2 py-1 rounded-full bg-white border hover:bg-slate-100 flex items-center gap-2 transition">
                            <span>{c.label}</span>
                            <span className={`px-2 py-[2px] rounded-full text-[10px] uppercase font-semibold ${roleClass(c.role||'member')}`}>
                                {c.role||'member'}
                            </span>
                        </button>
                    ))}
                </div>
            )}

            <div className="flex items-center justify-between gap-2 text-sm">
                <div className="font-mono text-xs bg-white border rounded-xl px-3 py-2 overflow-x-auto">{tag}</div>
                <button onClick={copy} className="px-3 py-2 rounded-xl bg-slate-900 text-white min-w-[70px]">
                    {copied ? 'Copied' : 'Copy'}
                </button>
            </div>
            <div className="text-[11px] text-gray-600">Paste this exact tag in your bank app narration so Togedaly can auto‑route your deposit.</div>
        </div>
    );
}