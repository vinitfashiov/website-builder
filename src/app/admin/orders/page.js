"use client";

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { api } from '@/lib/http';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/orders');
      setOrders(res.data);
    } catch (error) {
      toast.error('Failed to load orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (order) => {
    setSelectedOrder(order);
    setEditData({
      website_name: order.website_name ?? '',
      category: order.category ?? '',
      status: order.status ?? 'booked',
      website_url: order.website_url ?? '',
      admin_panel_url: order.admin_panel_url ?? '',
      admin_username: order.admin_username ?? '',
      admin_password: order.admin_password ?? ''
    });
    setEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedOrder) return;

    setSaving(true);
    try {
      await api.put(`/admin/order/${selectedOrder.id}`, editData);
      toast.success('Order updated successfully!');
      setEditDialogOpen(false);
      fetchOrders();
    } catch (error) {
      toast.error(error?.response?.data?.detail ?? 'Failed to update order');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-gray-600" data-testid="admin-orders-loading">
        Loading orders...
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8" data-testid="admin-orders-page">
      <h1 className="text-3xl font-bold mb-6">All Orders</h1>

      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full" data-testid="orders-table">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Phone</th>
                <th className="p-3 text-left">Website</th>
                <th className="p-3 text-left">Category</th>
                <th className="p-3 text-left">Plan Price</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t" data-testid="order-row">
                  <td className="p-3">{order.name}</td>
                  <td className="p-3">{order.phone}</td>
                  <td className="p-3">{order.website_name}</td>
                  <td className="p-3">{order.category}</td>
                  <td className="p-3">₹{order.plan_price?.toLocaleString()}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        order.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : order.status === 'in-progress'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <Button onClick={() => openEditDialog(order)} size="sm" data-testid={`btn-edit-order-${order.id}`}>
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="edit-order-dialog">
          <DialogHeader>
            <DialogTitle>Edit Order</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Website Name</Label>
              <Input
                data-testid="input-edit-website-name"
                value={editData.website_name}
                onChange={(e) => setEditData({ ...editData, website_name: e.target.value })}
              />
            </div>
            <div>
              <Label>Category</Label>
              <Input
                data-testid="input-edit-category"
                value={editData.category}
                onChange={(e) => setEditData({ ...editData, category: e.target.value })}
              />
            </div>
            <div>
              <Label>Status</Label>
              <select
                data-testid="select-edit-status"
                value={editData.status}
                onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="booked">Booked</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <Label>Website URL</Label>
              <Input
                data-testid="input-edit-website-url"
                value={editData.website_url}
                onChange={(e) => setEditData({ ...editData, website_url: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
            <div>
              <Label>Admin Panel URL</Label>
              <Input
                data-testid="input-edit-admin-url"
                value={editData.admin_panel_url}
                onChange={(e) => setEditData({ ...editData, admin_panel_url: e.target.value })}
                placeholder="https://admin.example.com"
              />
            </div>
            <div>
              <Label>Admin Username</Label>
              <Input
                data-testid="input-edit-admin-username"
                value={editData.admin_username}
                onChange={(e) => setEditData({ ...editData, admin_username: e.target.value })}
                placeholder="admin"
              />
            </div>
            <div>
              <Label>Admin Password</Label>
              <Input
                data-testid="input-edit-admin-password"
                value={editData.admin_password}
                onChange={(e) => setEditData({ ...editData, admin_password: e.target.value })}
                placeholder="password"
                type="password"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} data-testid="btn-cancel-edit">
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={saving} data-testid="btn-save-order">
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

