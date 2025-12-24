
import { NextResponse as TResp } from 'next/server'
import { createClient as TClient } from '@supabase/supabase-js'

export async function GET(req: Request, { params }: { params: { groupId: string } }) {
  const url = new URL(req.url)
  const userId = url.searchParams.get('userId') || undefined
  const days = Math.min(Number(url.searchParams.get('days') || '14'), 90)
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
  const sb = TClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  let base = sb.from('notify_outbox').select('user_id, channel, created_at').gte('created_at', since)
  if (userId) {
    base = base.eq('user_id', userId)
  } else {
    const { data: members } = await sb.from('v_ajo_group_members').select('user_id').eq('group_id', params.groupId)
    const ids = (members || []).map((m: any) => m.user_id)
    if (ids.length === 0) return TResp.json({ days, series: [], byChannel: {} })
    base = base.in('user_id', ids)
  }
  const { data } = await base.order('created_at', { ascending: true })

  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  const buckets: Record<string, number> = {}
  const byChannel: Record<string, number> = {}
  for (const r of (data || [])) {
    const day = fmt(new Date(r.created_at))
    buckets[day] = (buckets[day] || 0) + 1
    const ch = (r as any).channel || 'inapp'
    byChannel[ch] = (byChannel[ch] || 0) + 1
  }
  const series: Array<{ day: string; count: number }> = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    const key = fmt(d)
    series.push({ day: key, count: buckets[key] || 0 })
  }
  return TResp.json({ days, series, byChannel })
}
