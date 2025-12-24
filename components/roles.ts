// app/components/roles.ts
export function roleClass(role?: string){
  const r = (role||'member').toLowerCase()
  if(r==='owner') return 'bg-amber-100 text-amber-900'
  if(r==='admin') return 'bg-blue-100 text-blue-900'
  if(r==='treasurer') return 'bg-emerald-100 text-emerald-900'
  return 'bg-slate-100 text-slate-800'
}
