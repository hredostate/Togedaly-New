
import React, { useEffect, useMemo, useState } from 'react';
import type { Page } from '../App';
import type { MessageTemplate } from '../types';
import { getMessageTemplates, upsertMessageTemplate, deleteMessageTemplate } from '../services/analyticsService';
import { useToasts } from '../components/ToastHost';

const Editor: React.FC<{ row: Partial<MessageTemplate>, onClose: () => void, onSaved: () => void }> = ({ row, onClose, onSaved }) => {
    const [form, setForm] = useState({ ...row });
    const [saving, setSaving] = useState(false);
    const { add: addToast } = useToasts();
    
    const save = async () => {
        setSaving(true);
        try {
            await upsertMessageTemplate(form as MessageTemplate);
            onSaved();
            addToast({ title: 'Success', desc: 'Template saved.', emoji: '✅' });
        } catch(e: any) {
            addToast({ title: 'Error', desc: e.message || 'Could not save template.', emoji: '😥'});
        } finally {
            setSaving(false);
        }
    };
    
    return (
      <div className="rounded-2xl p-4 border bg-white mt-4">
        <div className="font-semibold mb-2">{row?.id ? 'Edit Template' : 'New Template'}</div>
        <div className="grid md:grid-cols-2 gap-3">
          <label className="text-sm">Name<input className="w-full border rounded-xl px-3 py-2 mt-1" value={form.name || ''} onChange={e=> setForm({...form, name:e.target.value})} /></label>
          <label className="text-sm">Code<input className="w-full border rounded-xl px-3 py-2 mt-1" value={form.code || ''} onChange={e=> setForm({...form, code:e.target.value})} /></label>
          <label className="text-sm">Channel<select className="w-full border rounded-xl px-3 py-2 mt-1 bg-white" value={form.channel} onChange={e=> setForm({...form, channel:e.target.value as any})}><option>sms</option><option>whatsapp</option><option>email</option></select></label>
          <label className="text-sm">Tone<select className="w-full border rounded-xl px-3 py-2 mt-1 bg-white" value={form.tone} onChange={e=> setForm({...form, tone:e.target.value as any})}><option>naija</option><option>formal</option><option>strict</option></select></label>
        </div>
        <label className="text-sm block mt-3">Body<textarea className="w-full border rounded-xl px-3 py-2 mt-1" rows={6} value={form.body || ''} onChange={e=> setForm({...form, body:e.target.value})} /></label>
        <div className="flex gap-2 mt-3">
          <button onClick={save} disabled={saving} className="px-3 py-2 rounded-xl bg-brand text-white disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
          <button onClick={onClose} className="px-3 py-2 rounded-xl border">Cancel</button>
        </div>
      </div>
    );
};

const DeleteBtn: React.FC<{ id: string, onDone: () => void }> = ({ id, onDone }) => {
    const { add: addToast } = useToasts();
    const del = async () => {
        if(!confirm('Delete template? This cannot be undone.')) return;
        try {
            await deleteMessageTemplate(id);
            onDone();
            addToast({ title: 'Deleted', desc: 'Template has been removed.', emoji: '🗑️'});
        } catch (e: any) {
             addToast({ title: 'Error', desc: e.message || 'Could not delete template.', emoji: '😥'});
        }
    };
    return <button onClick={del} className="px-2 py-1 rounded-lg border text-xs text-rose-600 hover:bg-rose-50">Delete</button>;
};

const TemplateManager: React.FC<{ setPage: (page: Page) => void }> = ({ setPage }) => {
  const [rows, setRows] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<Partial<MessageTemplate> | null>(null);

  const load = async () => { setLoading(true); getMessageTemplates().then(setRows).finally(() => setLoading(false)); };
  useEffect(() => { load() }, []);

  const filtered = useMemo(() => rows.filter((x:any) => !q || x.name?.toLowerCase().includes(q.toLowerCase()) || x.code?.toLowerCase().includes(q.toLowerCase())), [rows, q]);

  return (
    <div className="space-y-4">
      <button onClick={() => setPage('admin')} className="text-sm text-gray-600 hover:text-brand transition">← Back to Admin</button>
      <div className="rounded-2xl p-4 border bg-white flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Template Manager</h2>
          <p className="text-sm text-gray-500">Manage templates for automated communications.</p>
        </div>
        <button onClick={()=> setEditing({ scope:'global', channel:'sms', code:'', tone:'naija', name:'', body:'' })} className="px-4 py-2 rounded-xl bg-brand text-white font-semibold">New Template</button>
      </div>

      <input 
        value={q} 
        onChange={e=> setQ(e.target.value)} 
        placeholder="Search templates by name or code..." 
        className="w-full border rounded-xl px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-brand focus:border-transparent" 
        style={{ backgroundColor: '#ffffff', color: '#111827' }}
      />

      {editing && <Editor row={editing} onClose={()=> setEditing(null)} onSaved={()=> { setEditing(null); load() }} />}

      <div className="rounded-2xl overflow-auto border bg-white">
        <table className="min-w-full text-sm">
          <thead><tr className="bg-slate-50 text-left border-b"><th className="p-3">Name</th><th className="p-3">Code</th><th className="p-3">Channel</th><th className="p-3">Tone</th><th className="p-3">Updated</th><th className="p-3">Actions</th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="p-6 text-center">Loading templates...</td></tr>}
            {!loading && filtered.map((r) => (
              <tr key={r.id} className="border-b">
                <td className="p-3 font-medium">{r.name}</td><td className="p-3 font-mono text-xs">{r.code}</td><td className="p-3 uppercase">{r.channel}</td>
                <td className="p-3 capitalize">{r.tone}</td><td className="p-3">{new Date(r.updated_at).toLocaleString()}</td>
                <td className="p-3 flex gap-2"><button onClick={()=> setEditing(r)} className="px-2 py-1 rounded-lg border text-xs">Edit</button><DeleteBtn id={r.id} onDone={load} /></td>
              </tr>
            ))}
            {!loading && filtered.length===0 && <tr><td colSpan={6} className="p-6 text-center text-gray-500">No templates found.</td></tr>}
          </tbody>
        </table>
      </div>

       <div className="rounded-2xl p-4 border bg-white">
        <div className="font-semibold mb-1">Available Variables</div>
        <div className="text-sm text-gray-600 font-mono flex flex-wrap gap-x-4">
            <span>{`{{name}}`}</span>
            <span>{`{{title}}`}</span>
            <span>{`{{due}}`}</span>
            <span>{`{{late_count}}`}</span>
        </div>
      </div>
    </div>
  );
}

export default TemplateManager;