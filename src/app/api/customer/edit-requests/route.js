import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { getUserFromRequest } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(request) {
  const user = await getUserFromRequest(request);

  if (!user) {
    return NextResponse.json({ detail: 'Could not validate credentials' }, { status: 401 });
  }

  const db = await getDb();
  const requests = await db
    .collection('edit_requests')
    .find({ user_id: user.id }, { projection: { _id: 0 } })
    .sort({ created_at: -1 })
    .toArray();

  return NextResponse.json(requests);
}

