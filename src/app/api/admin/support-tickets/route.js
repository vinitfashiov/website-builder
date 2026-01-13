import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { getUserFromRequest } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(request) {
  const user = await getUserFromRequest(request);

  if (!user) {
    return NextResponse.json({ detail: 'Could not validate credentials' }, { status: 401 });
  }

  if (user.role !== 'admin') {
    return NextResponse.json({ detail: 'Admin access required' }, { status: 403 });
  }

  const db = await getDb();
  const tickets = await db
    .collection('support_tickets')
    .find({}, { projection: { _id: 0 } })
    .sort({ created_at: -1 })
    .toArray();

  return NextResponse.json(tickets);
}

