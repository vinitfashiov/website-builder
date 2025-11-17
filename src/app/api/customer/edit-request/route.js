import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getDb } from '@/lib/db/client';
import { getUserFromRequest } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(request) {
  const user = await getUserFromRequest(request);

  if (!user) {
    return NextResponse.json({ detail: 'Could not validate credentials' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ detail: 'Invalid JSON body' }, { status: 400 });
  }

  const { request_text } = body;

  if (!request_text || typeof request_text !== 'string' || !request_text.trim()) {
    return NextResponse.json({ detail: 'Request text is required' }, { status: 400 });
  }

  const db = await getDb();
  const order = await db.collection('orders').findOne({ user_id: user.id }, { projection: { _id: 0 } });

  if (!order) {
    return NextResponse.json({ detail: 'No order found' }, { status: 404 });
  }

  const now = new Date().toISOString();
  const editRequest = {
    id: randomUUID(),
    user_id: user.id,
    order_id: order.id,
    request_text: request_text.trim(),
    status: 'pending',
    created_at: now
  };

  await db.collection('edit_requests').insertOne(editRequest);

  return NextResponse.json(editRequest);
}

