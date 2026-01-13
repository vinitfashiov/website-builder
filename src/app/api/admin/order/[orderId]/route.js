import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { getUserFromRequest } from '@/lib/auth';

export const runtime = 'nodejs';

export async function PUT(request, { params }) {
  const user = await getUserFromRequest(request);

  if (!user) {
    return NextResponse.json({ detail: 'Could not validate credentials' }, { status: 401 });
  }

  if (user.role !== 'admin') {
    return NextResponse.json({ detail: 'Admin access required' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ detail: 'Invalid JSON body' }, { status: 400 });
  }

  const allowedFields = [
    'website_name',
    'category',
    'status',
    'website_url',
    'admin_panel_url',
    'admin_username',
    'admin_password'
  ];

  const updateData = {};
  for (const field of allowedFields) {
    if (field in body && body[field] !== undefined && body[field] !== null) {
      updateData[field] = body[field];
    }
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ detail: 'No fields provided for update' }, { status: 400 });
  }

  const db = await getDb();
  const orderId = params.orderId;

  const order = await db.collection('orders').findOne({ id: orderId }, { projection: { _id: 0 } });

  if (!order) {
    return NextResponse.json({ detail: 'Order not found' }, { status: 404 });
  }

  updateData.updated_at = new Date().toISOString();

  await db.collection('orders').updateOne({ id: orderId }, { $set: updateData });

  const updatedOrder = await db.collection('orders').findOne({ id: orderId }, { projection: { _id: 0 } });

  return NextResponse.json(updatedOrder);
}

