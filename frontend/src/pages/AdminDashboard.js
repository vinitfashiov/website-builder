import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Menu, X, LayoutDashboard, ShoppingBag, Edit, Headphones, LogOut } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function Sidebar({ active, setActive, onLogout, isMobile, onClose }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'orders', label: 'All Orders', icon: ShoppingBag },
    { id: 'edits', label: 'Edit Requests', icon: Edit },
    { id: 'support', label: 'Support Tickets', icon: Headphones },
  ];

  return (
    <div className={`sidebar-gradient text-white h-screen ${isMobile ? 'fixed inset-0 z-50' : 'w-64'} flex flex-col`}>
      {isMobile && (
        <div className="flex justify-end p-4">
          <Button variant="ghost" size="icon" onClick={onClose} data-testid="btn-close-sidebar-admin">
            <X className="w-6 h-6 text-white" />
          </Button>
        </div>
      )}
      <div className="p-6">
        <h2 className="text-2xl font-bold" data-testid="admin-sidebar-title">Admin Panel</h2>
      </div>
      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map(item => {
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              to={`/admin/${item.id}`}
              onClick={() => {
                setActive(item.id);
                if (isMobile) onClose();
              }}
              className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                active === item.id ? 'bg-white/20' : 'hover:bg-white/10'
              }`}
              data-testid={`admin-nav-${item.id}`}
            >
              <Icon className="w-5 h-5 mr-3" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4">
        <Button onClick={onLogout} variant="ghost" className="w-full text-white hover:bg-white/10" data-testid="btn-admin-logout">
          <LogOut className="w-5 h-5 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
}

function DashboardStats({ stats }) {
  const statCards = [
    { label: 'Total Orders', value: stats.total_orders, color: 'bg-blue-500' },
    { label: 'Booked', value: stats.booked, color: 'bg-yellow-500' },
    { label: 'In Progress', value: stats.in_progress, color: 'bg-orange-500' },
    { label: 'Completed', value: stats.completed, color: 'bg-green-500' },
    { label: 'Pending Edits', value: stats.pending_edits, color: 'bg-purple-500' },
    { label: 'Open Tickets', value: stats.open_tickets, color: 'bg-red-500' },
  ];

  return (
    <div className="p-4 sm:p-8" data-testid="admin-dashboard-page">
      <h1 className="text-3xl font-bold mb-6">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map(stat => (
          <Card key={stat.label} className="p-6 card-hover" data-testid={`stat-card-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">{stat.label}</p>
                <p className="text-3xl font-bold mt-2">{stat.value}</p>
              </div>
              <div className={`${stat.color} w-12 h-12 rounded-full`}></div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Revenue</h2>
        <p className="text-3xl font-bold text-green-600" data-testid="total-revenue">₹{stats.total_revenue?.toLocaleString() || 0}</p>
        <p className="text-sm text-gray-600 mt-2">Total advance payments collected</p>
      </Card>
    </div>
  );
}

function AllOrders({ orders, onRefresh }) {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editDialog, setEditDialog] = useState(false);
  const [editData, setEditData] = useState({});
  const [loading, setLoading] = useState(false);

  const handleEdit = (order) => {
    setSelectedOrder(order);
    setEditData({
      website_name: order.website_name,
      category: order.category,
      status: order.status,
      website_url: order.website_url || '',
      admin_panel_url: order.admin_panel_url || '',
      admin_username: order.admin_username || '',
      admin_password: order.admin_password || ''
    });
    setEditDialog(true);
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/admin/order/${selectedOrder.id}`, editData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Order updated successfully!');
      setEditDialog(false);
      onRefresh();
    } catch (error) {
      toast.error('Failed to update order');
    } finally {
      setLoading(false);
    }
  };

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
                <th className="p-3 text-left">Plan</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id} className="border-t" data-testid="order-row">
                  <td className="p-3">{order.name}</td>
                  <td className="p-3">{order.phone}</td>
                  <td className="p-3">{order.website_name}</td>
                  <td className="p-3">{order.category}</td>
                  <td className="p-3">₹{order.plan_price.toLocaleString()}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-sm ${
                      order.status === 'completed' ? 'bg-green-100 text-green-800' :
                      order.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <Button onClick={() => handleEdit(order)} size="sm" data-testid={`btn-edit-order-${order.id}`}>
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={editDialog} onOpenChange={setEditDialog}>
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
            <Button variant="outline" onClick={() => setEditDialog(false)} data-testid="btn-cancel-edit">
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={loading} data-testid="btn-save-order">
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EditRequestsAdmin({ requests }) {
  return (
    <div className="p-4 sm:p-8" data-testid="admin-edit-requests-page">
      <h1 className="text-3xl font-bold mb-6">Edit Requests</h1>
      
      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">User</th>
                <th className="p-3 text-left">Website</th>
                <th className="p-3 text-left">Request</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(req => (
                <tr key={req.id} className="border-t" data-testid="edit-request-admin-row">
                  <td className="p-3">{req.user_name}</td>
                  <td className="p-3">{req.website_name}</td>
                  <td className="p-3 max-w-md truncate">{req.request_text}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-sm ${
                      req.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="p-3">{new Date(req.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function SupportTicketsAdmin({ tickets }) {
  return (
    <div className="p-4 sm:p-8" data-testid="admin-support-page">
      <h1 className="text-3xl font-bold mb-6">Support Tickets</h1>
      
      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Message</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map(ticket => (
                <tr key={ticket.id} className="border-t" data-testid="support-ticket-admin-row">
                  <td className="p-3">{ticket.name}</td>
                  <td className="p-3 max-w-md truncate">{ticket.message}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-sm ${
                      ticket.status === 'open' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {ticket.status}
                    </span>
                  </td>
                  <td className="p-3">{new Date(ticket.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export default function AdminDashboard({ user, setUser }) {
  const [active, setActive] = useState('dashboard');
  const [stats, setStats] = useState({});
  const [orders, setOrders] = useState([]);
  const [editRequests, setEditRequests] = useState([]);
  const [supportTickets, setSupportTickets] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    try {
      const [statsRes, ordersRes, editsRes, ticketsRes] = await Promise.all([
        axios.get(`${API}/admin/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/admin/orders`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/admin/edit-requests`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/admin/support-tickets`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setStats(statsRes.data);
      setOrders(ordersRes.data);
      setEditRequests(editsRes.data);
      setSupportTickets(ticketsRes.data);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  return (
    <div className="flex h-screen overflow-hidden" data-testid="admin-dashboard">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar active={active} setActive={setActive} onLogout={handleLogout} isMobile={false} onClose={() => {}} />
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <Sidebar active={active} setActive={setActive} onLogout={handleLogout} isMobile={true} onClose={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {/* Mobile Header */}
        <div className="md:hidden bg-white shadow-sm p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">Admin Panel</h2>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} data-testid="btn-open-sidebar-admin">
            <Menu className="w-6 h-6" />
          </Button>
        </div>

        <Routes>
          <Route index element={<DashboardStats stats={stats} />} />
          <Route path="dashboard" element={<DashboardStats stats={stats} />} />
          <Route path="orders" element={<AllOrders orders={orders} onRefresh={fetchData} />} />
          <Route path="edits" element={<EditRequestsAdmin requests={editRequests} />} />
          <Route path="support" element={<SupportTicketsAdmin tickets={supportTickets} />} />
        </Routes>
      </div>
    </div>
  );
}
