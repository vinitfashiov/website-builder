"use client";

import { useEffect, useState } from 'react';
import { CheckCircle2, Clock, ExternalLink, Globe, Lock, Shield, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { api } from '@/lib/http';

export default function WebsiteDetailsPage() {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBuildingPopup, setShowBuildingPopup] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await api.get('/customer/order');
        setOrder(res.data);
      } catch (error) {
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading your website details...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-4 sm:p-8">
        <Card className="p-8 text-center text-gray-600">No order found. Please complete your booking to view details.</Card>
      </div>
    );
  }

  const isCompleted = order.status === 'completed';

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto" data-testid="website-details-page">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Website Details</h1>
        <p className="text-gray-600 text-sm sm:text-base">Manage and track your website project</p>
      </div>

      <div
        className={`mb-6 p-4 rounded-lg border-l-4 ${
          order.status === 'completed'
            ? 'bg-green-50 border-green-500'
            : order.status === 'in-progress'
            ? 'bg-yellow-50 border-yellow-500'
            : 'bg-blue-50 border-blue-500'
        }`}
      >
        <div className="flex items-center gap-3">
          {order.status === 'completed' ? <CheckCircle2 className="w-6 h-6 text-green-600" /> : <Clock className="w-6 h-6 text-blue-600 animate-pulse" />}
          <div>
            <p className="font-semibold text-sm sm:text-base">
              {order.status === 'completed'
                ? 'Your website is ready!'
                : order.status === 'in-progress'
                ? 'Your website is being built'
                : 'Your website order has been received'}
            </p>
            <p className="text-xs sm:text-sm text-gray-600">
              {order.status === 'completed'
                ? 'Access your website and admin panel below'
                : 'Our team is working on it. You\u0027ll be notified once ready.'}
            </p>
          </div>
        </div>
      </div>

      <Card className="mb-6 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 sm:p-6">
          <h2 className="text-white text-lg sm:text-xl font-bold mb-1">{order.website_name}</h2>
          <p className="text-blue-100 text-sm">{order.category}</p>
        </div>
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Plan Selected</p>
              <p className="font-semibold text-base sm:text-lg" data-testid="website-plan">
                {order.plan}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Plan Price</p>
              <p className="font-semibold text-base sm:text-lg text-green-600" data-testid="website-price">
                ₹{order.plan_price?.toLocaleString()}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Advance Paid</p>
              <p className="font-semibold text-base sm:text-lg text-green-600" data-testid="advance-paid">
                ₹{order.advance_paid}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Current Status</p>
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                  order.status === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : order.status === 'in-progress'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
                data-testid="website-status"
              >
                {order.status.replace('-', ' ').toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {isCompleted && (order.website_url || order.admin_panel_url) ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
          {order.website_url && (
            <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Globe className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2 text-sm sm:text-base">Live Website</h3>
                  <a href={order.website_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs sm:text-sm break-all" data-testid="website-url-link">
                    {order.website_url}
                  </a>
                  <Button className="mt-3 w-full bg-blue-600 hover:bg-blue-700" size="sm" onClick={() => window.open(order.website_url, '_blank')}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Visit Website
                  </Button>
                </div>
              </div>
            </Card>
          )}

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
                  <Button className="mt-3 w-full bg-purple-600 hover:bg-purple-700" size="sm" onClick={() => window.open(order.admin_panel_url, '_blank')}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open Admin Panel
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      ) : (
        <div className="mb-6">
          <Button onClick={() => setShowBuildingPopup(true)} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700" data-testid="btn-view-site">
            <ExternalLink className="w-4 h-4 mr-2" />
            View Website
          </Button>
        </div>
      )}

      <Dialog open={showBuildingPopup} onOpenChange={setShowBuildingPopup}>
        <DialogContent className="sm:max-w-md" data-testid="view-site-dialog">
          <DialogHeader>
            <DialogTitle className="text-center">Website Under Construction</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-6">
            <div className="relative w-32 h-32 mb-6">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 border-8 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-5xl">🏗️</div>
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-center">We\u0027re Building Your Website</h3>
            <p className="text-gray-600 text-center text-sm mb-4">Our team is working hard to create your perfect website.</p>
            <p className="text-gray-500 text-sm text-center">
              Estimated completion: <span className="font-semibold">1 hour</span>
            </p>
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

