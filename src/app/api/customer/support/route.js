import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getDb } from '@/lib/db/client';
import { getUserFromRequest } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(request) {
  const user = await getUserFromRequest(request);

  if (!user) {
    return NextResponse.json({ detail: 'Could not validate credentials' }, { status: 401 });
  }

  const db = await getDb();
  const tickets = await db
    .collection('support_tickets')
    .find({ user_id: user.id }, { projection: { _id: 0 } })
    .sort({ created_at: -1 })
    .toArray();

  return NextResponse.json(tickets);
}

export async function POST(request) {
  const user = await getUserFromRequest(request);

  if (!user) {
    return NextResponse.json({ detail: 'Could not validate credentials' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ detail: 'Invalid JSON body' }, { status: 400 });
  }

  const { message } = body;

  if (!message || typeof message !== 'string' || !message.trim()) {
    return NextResponse.json({ detail: 'Message is required' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const ticket = {
    id: randomUUID(),
    user_id: user.id,
    name: user.name,
    message: message.trim(),
    status: 'open',
    created_at: now
  };

  const db = await getDb();
  await db.collection('support_tickets').insertOne(ticket);

  return NextResponse.json(ticket);
}

