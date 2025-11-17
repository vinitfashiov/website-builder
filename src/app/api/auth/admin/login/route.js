import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getDb } from '@/lib/db/client';
import { createAccessToken, hashPassword, sanitizeUser } from '@/lib/auth';

export const runtime = 'nodejs';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? 'Admin1234';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? '22211161';

export async function POST(request) {
  const body = await request.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ detail: 'Invalid JSON body' }, { status: 400 });
  }

  const { username, password } = body;

  if (!username || !password) {
    return NextResponse.json({ detail: 'Username and password are required' }, { status: 400 });
  }

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return NextResponse.json({ detail: 'Invalid admin credentials' }, { status: 401 });
  }

  const db = await getDb();
  let adminUser = await db.collection('users').findOne({ phone: 'admin' }, { projection: { _id: 0 } });

  if (!adminUser) {
    const now = new Date().toISOString();
    const newAdmin = {
      id: randomUUID(),
      name: 'Super Admin',
      phone: 'admin',
      password_hash: await hashPassword(ADMIN_PASSWORD),
      role: 'admin',
      created_at: now
    };

    await db.collection('users').insertOne(newAdmin);
    adminUser = newAdmin;
  }

  const accessToken = createAccessToken({ sub: adminUser.id });
  const adminData = sanitizeUser(adminUser);

  return NextResponse.json({
    access_token: accessToken,
    token_type: 'bearer',
    user: adminData
  });
}

