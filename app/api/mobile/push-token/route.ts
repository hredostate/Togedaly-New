
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as sb } from '@/lib/supabaseClient';
import { getUserFromAuthHeader } from '@/lib/auth'; // however you map mobile -> user

export async function POST(req: NextRequest) {
  const body = await req.json();
  const token = body.token as string;
  const userId = await getUserFromAuthHeader(req); // implement token exchange / login

  if (!userId || !token) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { error } = await sb
    .from('mobile_push_tokens')
    .upsert({ user_id: userId, token, platform: 'expo' });

  if (error) {
    console.error(error);
    return new NextResponse('Failed', { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
