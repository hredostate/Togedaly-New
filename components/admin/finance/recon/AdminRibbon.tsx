
'use client'
import React from 'react'
import { useToasts } from '../../../ToastHost'
import { dispatchNotifications } from '../../../../services/notificationService'

export default function AdminRibbon(){
  const [busy, setBusy] = React.useState(false)
  const [channels, setChannels] = React.useState<any>({ toast:true, sms:true, email:false })
  const { add: addToast } = useToasts();

  async function dispatchNow(){
    setBusy(true)
    try {
        // dispatchNotifications takes no arguments in the mock definition
        const result = await dispatchNotifications();
        addToast({ title: 'Dispatch Triggered', desc: `Processed ${result.processed} queued notifications.`, emoji: '🚀' });
    } catch(e: any) {
        addToast({ title: 'Dispatch Failed', desc: e.message || 'An error occurred', emoji: '😥' });
    } finally {
        setBusy(false)
    }
  }

  return (
    <div className="rounded-2xl p-3 bg-white border shadow-sm flex items-center gap-3">
      <div className="font-semibold text-sm">Fan‑out</div>
      <label className="text-sm flex items-center gap-1"><input type="checkbox" checked={channels.toast} onChange={e=> setChannels({...channels, toast:e.currentTarget.checked})}/> Toast</label>
      <label className="text-sm flex items-center gap-1"><input type="checkbox" checked={channels.sms} onChange={e=> setChannels({...channels, sms:e.currentTarget.checked})}/> SMS</label>
      <label className="text-sm flex items-center gap-1"><input type="checkbox" checked={channels.email} onChange={e=> setChannels({...channels, email:e.currentTarget.checked})}/> Email</label>
      <button onClick={dispatchNow} disabled={busy} className="px-3 py-2 rounded-xl bg-slate-900 text-white text-sm disabled:opacity-50 ml-auto">
        {busy ? 'Dispatching...' : 'Dispatch Queued'}
      </button>
    </div>
  )
}
