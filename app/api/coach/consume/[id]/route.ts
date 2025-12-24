// /app/api/coach/consume/[id]/route.ts  (POST) mark suggestion used
import { supabase as sb } from '../../../../supabaseClient';

// This is a placeholder for a Next.js environment.
export async function POST(_req: any, { params }: { params: { id: string } }){
  console.log('MOCK API: Consuming suggestion', params.id);
  const { data, error } = await sb.from('ai_action_suggestions')
    .update({ consumed_at: new Date().toISOString() })
    .eq('id', Number(params.id)).select('*').single();
    
  if (error) return { status: 400, body: JSON.stringify({ error: error.message }) };
  return { status: 200, body: JSON.stringify(data) };
}