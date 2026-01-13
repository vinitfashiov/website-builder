import { createHmac } from 'crypto';
import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getDb } from '@/lib/db/client';
import { createAccessToken, hashPassword, sanitizeUser } from '@/lib/auth';

export const runtime = 'nodejs';

const RAZORPAY_SECRET = process.env.RAZORPAY_KEY_SECRET;

export async function POST(request) {
  const body = await request.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ detail: 'Invalid JSON body' }, { status: 400 });
  }

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    order_data: orderData
  } = body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderData) {
    return NextResponse.json({ detail: 'Payment verification data is incomplete' }, { status: 400 });
  }

  if (!RAZORPAY_SECRET) {
    return NextResponse.json({ detail: 'Razorpay credentials are not configured' }, { status: 500 });
  }

  const generatedSignature = createHmac('sha256', RAZORPAY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (generatedSignature !== razorpay_signature) {
    return NextResponse.json({ detail: 'Invalid payment signature' }, { status: 400 });
  }

  const db = await getDb();

  let user = await db.collection('users').findOne({ phone: orderData.phone }, { projection: { _id: 0 } });

  if (!user) {
    const now = new Date().toISOString();
    user = {
      id: randomUUID(),
      name: orderData.name,
      phone: orderData.phone,
      password_hash: await hashPassword(orderData.password),
      role: 'customer',
      created_at: now
    };

    await db.collection('users').insertOne(user);
  }

  const now = new Date().toISOString();

  const order = {
    id: randomUUID(),
    user_id: user.id,
    name: orderData.name,
    phone: orderData.phone,
    website_name: orderData.website_name,
    category: orderData.category,
    plan: orderData.plan,
    plan_price: orderData.plan_price,
    advance_paid: 9,
    total_paid: 9,
    status: 'booked',
    razorpay_payment_id,
    razorpay_order_id,
    razorpay_signature,
    website_url: null,
    admin_panel_url: null,
    admin_username: null,
    admin_password: null,
    created_at: now,
    updated_at: now
  };

  await db.collection('orders').insertOne(order);

  const accessToken = createAccessToken({ sub: user.id });

  return NextResponse.json({
    access_token: accessToken,
    token_type: 'bearer',
    user: sanitizeUser(user)
  });
}

