import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { verifyPassword, createAccessToken, sanitizeUser } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(request) {
  const body = await request.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ detail: 'Invalid JSON body' }, { status: 400 });
  }

  const { phone, password } = body;

  if (!phone || !password) {
    return NextResponse.json({ detail: 'Phone and password are required' }, { status: 400 });
  }

  const db = await getDb();
  const user = await db.collection('users').findOne({ phone }, { projection: { _id: 0 } });

  if (!user) {
    return NextResponse.json({ detail: 'Invalid credentials' }, { status: 401 });
  }

  const passwordValid = await verifyPassword(password, user.password_hash);

  if (!passwordValid) {
    return NextResponse.json({ detail: 'Invalid credentials' }, { status: 401 });
  }

  const accessToken = createAccessToken({ sub: user.id });
  const userData = sanitizeUser(user);

  return NextResponse.json({
    access_token: accessToken,
    token_type: 'bearer',
    user: userData
  });
}

