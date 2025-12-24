// app/components/useToast.tsx
'use client'
import * as React from 'react'

type Toast = { id: string, kind: 'success'|'error'|'info', msg: string }
function uuid(){ return Math.random().toString(36).slice(2)+Date.now().toString(36) }

const Ctx = React.createContext<{ push:(kind:Toast['kind'], msg:string)=>void }|null>(null)
// FIX: Refactor component to use React.FC and React.PropsWithChildren for robust children typing.
export const ToastProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [items, setItems] = React.useState<Toast[]>([])
  const push = (kind:Toast['kind'], msg:string)=>{
    const id = uuid(); setItems((xs)=> [...xs, { id, kind, msg }]); setTimeout(()=> setItems(xs=> xs.filter(x=> x.id!==id)), 2000)
  }
  return (
    <Ctx.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-4 right-4 space-y-2 z-50">
        {items.map(t=> (
          <div key={t.id} className={`px-3 py-2 rounded-xl shadow text-sm ${t.kind==='success'?'bg-emerald-600 text-white': t.kind==='error'?'bg-rose-600 text-white':'bg-slate-800 text-white'}`}>{t.msg}</div>
        ))}
      </div>
    </Ctx.Provider>
  )
}
export function useToast(){
  const ctx = React.useContext(Ctx); if(!ctx) throw new Error('useToast outside provider'); return ctx
}