import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Menu, X, Home, Edit, Headphones, CreditCard, LogOut, ExternalLink, Globe, Lock, User, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function Sidebar({ active, setActive, onLogout, isMobile, onClose }) {
  const menuItems = [
    { id: 'website', label: 'Website Details', icon: Home },
    { id: 'edits', label: 'Edit Requests', icon: Edit },
    { id: 'support', label: 'Support', icon: Headphones },
    { id: 'payments', label: 'Payments', icon: CreditCard },
  ];

  return (
    <div className={`sidebar-gradient text-white ${isMobile ? 'fixed inset-0 z-50' : 'w-64 hidden md:block'} h-screen flex flex-col`}>
      {isMobile && (
        <div className="flex justify-end p-4">
          <Button variant="ghost" size="icon" onClick={onClose} data-testid="btn-close-sidebar">
            <X className="w-6 h-6 text-white" />
          </Button>
        </div>
      )}
      <div className="p-6">
        <h2 className="text-2xl font-bold" data-testid="sidebar-title">My Dashboard</h2>
      </div>
      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map(item => {
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              to={`/dashboard/${item.id}`}
              onClick={() => {
                setActive(item.id);
                if (isMobile) onClose();
              }}
              className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                active === item.id ? 'bg-white/20' : 'hover:bg-white/10'
              }`}
              data-testid={`nav-${item.id}`}
            >
              <Icon className="w-5 h-5 mr-3" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4">
        <Button onClick={onLogout} variant="ghost" className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 via-red-500 to-pink-500 text-white font-semibold shadow-md hover:from-rose-700 hover:to-red-600 hover:shadow-lg transition-all duration-200" data-testid="btn-logout">
          <LogOut className="w-5 h-5 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
}

function WebsiteDetails({ order, user }) {
  const [showBuildingPopup, setShowBuildingPopup] = useState(false);

  if (!order) {
    return (
      <div className="p-4 sm:p-8">
        <Card className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading your website details...</p>
        </Card>
      </div>
    );
  }

  const isCompleted = order.status === 'completed';

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto" data-testid="website-details-page">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Website Details</h1>
        <p className="text-gray-600 text-sm sm:text-base">Manage and track your website project</p>
      </div>

      {/* Status Banner */}
      <div className={`mb-6 p-4 rounded-lg border-l-4 ${
        order.status === 'completed' ? 'bg-green-50 border-green-500' :
        order.status === 'in-progress' ? 'bg-yellow-50 border-yellow-500' :
        'bg-blue-50 border-blue-500'
      }`}>
        <div className="flex items-center gap-3">
          {order.status === 'completed' ? (
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          ) : (
            <Clock className="w-6 h-6 text-blue-600 animate-pulse" />
          )}
          <div>
            <p className="font-semibold text-sm sm:text-base">
              {order.status === 'completed' ? 'Your website is ready!' :
               order.status === 'in-progress' ? 'Your website is being built' :
               'Your website order has been received'}
            </p>
            <p className="text-xs sm:text-sm text-gray-600">
              {order.status === 'completed' ? 'Access your website and admin panel below' :
               'Our team is working on it. You\'ll be notified once ready.'}
            </p>
          </div>
        </div>
      </div>

      {/* Project Info Card */}
      <Card className="mb-6 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 sm:p-6">
          <h2 className="text-white text-lg sm:text-xl font-bold mb-1">{order.website_name}</h2>
          <p className="text-blue-100 text-sm">{order.category}</p>
        </div>
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Plan Selected</p>
              <p className="font-semibold text-base sm:text-lg" data-testid="website-plan">{order.plan}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Plan Price</p>
              <p className="font-semibold text-base sm:text-lg text-green-600" data-testid="website-price">₹{order.plan_price.toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Advance Paid</p>
              <p className="font-semibold text-base sm:text-lg text-green-600" data-testid="advance-paid">₹{order.advance_paid}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Current Status</p>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                order.status === 'completed' ? 'bg-green-100 text-green-800' :
                order.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                'bg-blue-100 text-blue-800'
              }`} data-testid="website-status">
                {order.status.replace('-', ' ').toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Website Access - Show only if completed */}
      {isCompleted && (order.website_url || order.admin_panel_url) ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
          {/* Live Website Card */}
          {order.website_url && (
            <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Globe className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2 text-sm sm:text-base">Live Website</h3>
                  <a 
                    href={order.website_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-600 hover:underline text-xs sm:text-sm break-all"
                    data-testid="website-url-link"
                  >
                    {order.website_url}
                  </a>
                  <Button 
                    className="mt-3 w-full bg-blue-600 hover:bg-blue-700" 
                    size="sm"
                    onClick={() => window.open(order.website_url, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Visit Website
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Admin Panel Card */}
          {order.admin_panel_url && (
            <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Lock className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2 text-sm sm:text-base">Admin Panel</h3>
                  <a 
                    href={order.admin_panel_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-purple-600 hover:underline text-xs sm:text-sm break-all"
                    data-testid="admin-panel-link"
                  >
                    {order.admin_panel_url}
                  </a>
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg" data-testid="admin-credentials">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-3 h-3 text-gray-600" />
                      <p className="text-xs text-gray-600">Username:</p>
                    </div>
                    <p className="font-mono text-xs sm:text-sm font-semibold mb-2">{order.admin_username}</p>
                    <div className="flex items-center gap-2 mb-1">
                      <Lock className="w-3 h-3 text-gray-600" />
                      <p className="text-xs text-gray-600">Password:</p>
                    </div>
                    <p className="font-mono text-xs sm:text-sm font-semibold">{order.admin_password}</p>
                  </div>
                  <Button 
                    className="mt-3 w-full bg-purple-600 hover:bg-purple-700" 
                    size="sm"
                    onClick={() => window.open(order.admin_panel_url, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open Admin Panel
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      ) : (
        /* View Website Button - Show building popup if not completed */
        <div className="mb-6">
          <Button
            onClick={() => setShowBuildingPopup(true)}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
            data-testid="btn-view-site"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View Website
          </Button>
        </div>
      )}

      {/* Building Popup */}
      <Dialog open={showBuildingPopup} onOpenChange={setShowBuildingPopup}>
        <DialogContent className="sm:max-w-md" data-testid="view-site-dialog">
          <DialogHeader>
            <DialogTitle className="text-center">Website Under Construction</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-6">
            {/* Construction Animation */}
            <div className="relative w-32 h-32 mb-6">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 border-8 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-5xl">🏗️</div>
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-center">We're Building Your Website</h3>
            <p className="text-gray-600 text-center text-sm mb-4">Our team is working hard to create your perfect website.</p>
            <p className="text-gray-500 text-sm text-center">Estimated completion: <span className="font-semibold">1 hour</span></p>
            <div className="mt-6 w-full">
              <Button onClick={() => setShowBuildingPopup(false)} variant="outline" className="w-full">
                Got it, thanks!
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EditRequests({ order }) {
  const [requests, setRequests] = useState([]);
  const [newRequest, setNewRequest] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/customer/edit-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(res.data);
    } catch (error) {
      console.error('Failed to fetch edit requests:', error);
    }
  };

  const handleSubmit = async () => {
    if (!newRequest.trim()) {
      toast.error('Please enter your request');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/customer/edit-request`, 
        { request_text: newRequest },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Edit request submitted!');
      setNewRequest('');
      fetchRequests();
    } catch (error) {
      toast.error('Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto" data-testid="edit-requests-page">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Edit Requests</h1>
        <p className="text-gray-600 text-sm sm:text-base">Request changes to your website</p>
      </div>
      
      <Card className="p-4 sm:p-6 mb-6">
        <Label className="mb-2 block font-semibold">Request Changes</Label>
        <Textarea
          data-testid="textarea-edit-request"
          value={newRequest}
          onChange={(e) => setNewRequest(e.target.value)}
          placeholder="Describe the changes you'd like to make..."
          rows={4}
          className="mb-4"
        />
        <Button onClick={handleSubmit} disabled={loading} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700" data-testid="btn-submit-request">
          {loading ? 'Submitting...' : 'Submit Request'}
        </Button>
      </Card>

      <div className="space-y-4">
        <h2 className="text-lg sm:text-xl font-semibold">Your Requests</h2>
        {requests.length === 0 ? (
          <Card className="p-6 text-center text-gray-600">
            No edit requests yet
          </Card>
        ) : (
          requests.map(req => (
            <Card key={req.id} className="p-4" data-testid="edit-request-item">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                <span className={`text-xs px-2 py-1 rounded w-fit ${
                  req.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                }`}>
                  {req.status}
                </span>
                <span className="text-sm text-gray-500">{new Date(req.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-gray-700 text-sm sm:text-base">{req.request_text}</p>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function Support() {
  const [tickets, setTickets] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/customer/support`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTickets(res.data);
    } catch (error) {
      console.error('Failed to fetch support tickets:', error);
    }
  };

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error('Please enter your message');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/customer/support`,
        { message },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Support ticket created!');
      setMessage('');
      fetchTickets();
    } catch (error) {
      toast.error('Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto" data-testid="support-page">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Support</h1>
        <p className="text-gray-600 text-sm sm:text-base">Get help from our team</p>
      </div>
      
      <Card className="p-4 sm:p-6 mb-6">
        <Label className="mb-2 block font-semibold">Need Help?</Label>
        <Textarea
          data-testid="textarea-support-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Describe your issue..."
          rows={4}
          className="mb-4"
        />
        <Button onClick={handleSubmit} disabled={loading} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700" data-testid="btn-submit-support">
          {loading ? 'Submitting...' : 'Submit Ticket'}
        </Button>
      </Card>

      <div className="space-y-4">
        <h2 className="text-lg sm:text-xl font-semibold">Your Tickets</h2>
        {tickets.length === 0 ? (
          <Card className="p-6 text-center text-gray-600">
            No support tickets yet
          </Card>
        ) : (
          tickets.map(ticket => (
            <Card key={ticket.id} className="p-4" data-testid="support-ticket-item">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                <span className={`text-xs px-2 py-1 rounded w-fit ${
                  ticket.status === 'open' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {ticket.status}
                </span>
                <span className="text-sm text-gray-500">{new Date(ticket.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-gray-700 text-sm sm:text-base">{ticket.message}</p>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function Payments({ payments }) {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto" data-testid="payments-page">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Payment History</h1>
        <p className="text-gray-600 text-sm sm:text-base">View all your transactions</p>
      </div>
      
      <Card className="p-4 sm:p-6">
        {payments.length === 0 ? (
          <p className="text-center text-gray-600">No payments yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left text-xs sm:text-sm">Type</th>
                  <th className="p-3 text-left text-xs sm:text-sm">Amount</th>
                  <th className="p-3 text-left text-xs sm:text-sm">Date</th>
                  <th className="p-3 text-left text-xs sm:text-sm">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(payment => (
                  <tr key={payment.id} className="border-t" data-testid="payment-row">
                    <td className="p-3 text-sm">{payment.type}</td>
                    <td className="p-3 font-semibold text-green-600 text-sm">₹{payment.amount}</td>
                    <td className="p-3 text-sm">{new Date(payment.date).toLocaleDateString()}</td>
                    <td className="p-3">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function CustomerDashboard({ user, setUser }) {
  const [active, setActive] = useState('website');
  const [order, setOrder] = useState(null);
  const [payments, setPayments] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrder();
    fetchPayments();
  }, []);

  const fetchOrder = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/customer/order`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrder(res.data);
    } catch (error) {
      console.error('Failed to fetch order:', error);
    }
  };

  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/customer/payments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayments(res.data);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50" data-testid="customer-dashboard">
      {/* Desktop Sidebar */}
      <Sidebar active={active} setActive={setActive} onLogout={handleLogout} isMobile={false} onClose={() => {}} />

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <Sidebar active={active} setActive={setActive} onLogout={handleLogout} isMobile={true} onClose={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Mobile Header */}
        <div className="md:hidden bg-white shadow-sm p-4 flex justify-between items-center sticky top-0 z-10">
          <h2 className="text-lg font-bold">Dashboard</h2>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} data-testid="btn-open-sidebar">
            <Menu className="w-6 h-6" />
          </Button>
        </div>

        <Routes>
          <Route index element={<WebsiteDetails order={order} user={user} />} />
          <Route path="website" element={<WebsiteDetails order={order} user={user} />} />
          <Route path="edits" element={<EditRequests order={order} />} />
          <Route path="support" element={<Support />} />
          <Route path="payments" element={<Payments payments={payments} />} />
        </Routes>
      </div>
    </div>
  );
}
