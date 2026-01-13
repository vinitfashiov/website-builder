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
  const requests = await db
    .collection('edit_requests')
    .find({}, { projection: { _id: 0 } })
    .sort({ created_at: -1 })
    .toArray();

  if (requests.length === 0) {
    return NextResponse.json([]);
  }

  const userIds = [...new Set(requests.map((req) => req.user_id))];
  const orderIds = [...new Set(requests.map((req) => req.order_id))];

  const [users, orders] = await Promise.all([
    db
      .collection('users')
      .find({ id: { $in: userIds } }, { projection: { _id: 0, id: 1, name: 1 } })
      .toArray(),
    db
      .collection('orders')
      .find({ id: { $in: orderIds } }, { projection: { _id: 0, id: 1, website_name: 1 } })
      .toArray()
  ]);

  const userMap = new Map(users.map((item) => [item.id, item]));
  const orderMap = new Map(orders.map((item) => [item.id, item]));

  const enriched = requests.map((req) => ({
    ...req,
    user_name: userMap.get(req.user_id)?.name ?? 'Unknown',
    website_name: orderMap.get(req.order_id)?.website_name ?? 'Unknown'
  }));

  return NextResponse.json(enriched);
}

