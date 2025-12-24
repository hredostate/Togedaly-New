import { NextRequest, NextResponse } from 'next/server';
import { getKycProfile } from '../../../../services/kycService';

// This is a placeholder for a Next.js API route.
export async function GET(req: NextRequest){
  // In a real app, you would get the user ID from the session, not a query param.
  const userId = new URL(req.url).searchParams.get('u');
  if (!userId) {
    return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
  }

  try {
    const data = await getKycProfile(userId);
    return NextResponse.json(data ?? { status: 'unverified' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
