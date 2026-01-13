"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Menu, X, Home, Edit, Headphones, CreditCard, LogOut } from 'lucide-react';
import { useAuth } from '../providers';

const NAV_ITEMS = [
  { id: 'website', label: 'Website Details', icon: Home, href: '/dashboard/website' },
  { id: 'edits', label: 'Edit Requests', icon: Edit, href: '/dashboard/edits' },
  { id: 'support', label: 'Support', icon: Headphones, href: '/dashboard/support' },
  { id: 'payments', label: 'Payments', icon: CreditCard, href: '/dashboard/payments' }
];

function Sidebar({ activeHref, onNavigate, onLogout, variant }) {
  return (
    <div
      className={`sidebar-gradient text-white h-screen ${
        variant === 'mobile' ? 'fixed inset-0 z-50' : 'w-64 hidden md:flex'
      } flex-col`}
    >
      {variant === 'mobile' && (
        <div className="flex justify-end p-4">
          <Button variant="ghost" size="icon" onClick={() => onNavigate(null)} data-testid="btn-close-sidebar">
            <X className="w-6 h-6 text-white" />
          </Button>
        </div>
      )}
      <div className="p-6">
        <h2 className="text-2xl font-bold" data-testid="sidebar-title">
          My Dashboard
        </h2>
      </div>
      <nav className="flex-1 px-4 space-y-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeHref === item.href || (item.href === '/dashboard/website' && activeHref === '/dashboard');
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => onNavigate(item.href)}
              className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                isActive ? 'bg-white/20' : 'hover:bg-white/10'
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
        <Button
          onClick={onLogout}
          variant="ghost"
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 via-red-500 to-pink-500 text-white font-semibold shadow-md hover:from-rose-700 hover:to-red-600 hover:shadow-lg transition-all duration-200"
          data-testid="btn-logout"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
}

export default function DashboardShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { clearSession } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    clearSession();
    router.replace('/');
  };

  const handleNavigate = (href) => {
    if (href) {
      router.push(href);
    }
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50" data-testid="customer-dashboard">
      <Sidebar activeHref={pathname} onNavigate={handleNavigate} onLogout={handleLogout} variant="desktop" />

      {sidebarOpen && <Sidebar activeHref={pathname} onNavigate={handleNavigate} onLogout={handleLogout} variant="mobile" />}

      <div className="flex-1 overflow-y-auto">
        <div className="md:hidden bg-white shadow-sm p-4 flex justify-between items-center sticky top-0 z-10">
          <h2 className="text-lg font-bold">Dashboard</h2>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} data-testid="btn-open-sidebar">
            <Menu className="w-6 h-6" />
          </Button>
        </div>

        {children}
      </div>
    </div>
  );
}

