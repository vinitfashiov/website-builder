import { NextResponse } from 'next/server';
import { getRazorpayClient } from '@/lib/razorpay';

export const runtime = 'nodejs';

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const amount = Number(body?.amount ?? 900);

  if (!Number.isInteger(amount) || amount <= 0) {
    return NextResponse.json({ detail: 'Amount must be a positive integer' }, { status: 400 });
  }

  try {
    const razorpay = getRazorpayClient();
    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      payment_capture: 1
    });

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (error) {
    return NextResponse.json({ detail: error?.message ?? 'Failed to create Razorpay order' }, { status: 500 });
  }
}

