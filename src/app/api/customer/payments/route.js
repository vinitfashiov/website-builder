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
  const order = await db.collection('orders').findOne({ user_id: user.id }, { projection: { _id: 0 } });

  if (!order) {
    return NextResponse.json([]);
  }

  const payments = [
    {
      id: order.id,
      amount: order.advance_paid,
      type: 'Advance Payment',
      payment_id: order.razorpay_payment_id ?? null,
      date: order.created_at,
      status: 'Success'
    }
  ];

  return NextResponse.json(payments);
}

