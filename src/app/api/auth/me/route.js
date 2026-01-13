import { NextResponse } from 'next/server';
import { getUserFromRequest, sanitizeUser } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(request) {
  const user = await getUserFromRequest(request);

  if (!user) {
    return NextResponse.json({ detail: 'Could not validate credentials' }, { status: 401 });
  }

  return NextResponse.json(sanitizeUser(user));
}

