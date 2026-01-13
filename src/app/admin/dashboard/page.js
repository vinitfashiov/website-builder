"use client";

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { api } from '@/lib/http';

const STAT_CARDS = [
  { key: 'total_orders', label: 'Total Orders', color: 'bg-blue-500' },
  { key: 'booked', label: 'Booked', color: 'bg-yellow-500' },
  { key: 'in_progress', label: 'In Progress', color: 'bg-orange-500' },
  { key: 'completed', label: 'Completed', color: 'bg-green-500' },
  { key: 'pending_edits', label: 'Pending Edits', color: 'bg-purple-500' },
  { key: 'open_tickets', label: 'Open Tickets', color: 'bg-red-500' }
];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/admin/stats');
        setStats(res.data);
      } catch (error) {
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-gray-600" data-testid="admin-dashboard-loading">
        Loading dashboard...
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-gray-600" data-testid="admin-dashboard-error">
        Unable to load dashboard information.
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8" data-testid="admin-dashboard-page">
      <h1 className="text-3xl font-bold mb-6">Dashboard Overview</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {STAT_CARDS.map((stat) => (
          <Card key={stat.key} className="p-6 card-hover" data-testid={`stat-card-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">{stat.label}</p>
                <p className="text-3xl font-bold mt-2">{stats[stat.key]}</p>
              </div>
              <div className={`${stat.color} w-12 h-12 rounded-full`} />
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Revenue</h2>
        <p className="text-3xl font-bold text-green-600" data-testid="total-revenue">
          ₹{stats.total_revenue?.toLocaleString() ?? 0}
        </p>
        <p className="text-sm text-gray-600 mt-2">Total advance payments collected</p>
      </Card>
    </div>
  );
}

