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

  const [totalOrders, booked, inProgress, completed, pendingEdits, openTickets, revenueOrders] = await Promise.all([
    db.collection('orders').countDocuments({}),
    db.collection('orders').countDocuments({ status: 'booked' }),
    db.collection('orders').countDocuments({ status: 'in-progress' }),
    db.collection('orders').countDocuments({ status: 'completed' }),
    db.collection('edit_requests').countDocuments({ status: 'pending' }),
    db.collection('support_tickets').countDocuments({ status: 'open' }),
    db.collection('orders').find({}, { projection: { _id: 0, advance_paid: 1 } }).toArray()
  ]);

  const totalRevenue = revenueOrders.reduce((sum, order) => sum + (order.advance_paid ?? 0), 0);

  return NextResponse.json({
    total_orders: totalOrders,
    booked,
    in_progress: inProgress,
    completed,
    pending_edits: pendingEdits,
    open_tickets: openTickets,
    total_revenue: totalRevenue
  });
}

