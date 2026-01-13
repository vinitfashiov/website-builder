"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, ShoppingBag, Edit, Headphones, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../providers';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
  { id: 'orders', label: 'All Orders', icon: ShoppingBag, href: '/admin/orders' },
  { id: 'edits', label: 'Edit Requests', icon: Edit, href: '/admin/edits' },
  { id: 'support', label: 'Support Tickets', icon: Headphones, href: '/admin/support' }
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
          <Button variant="ghost" size="icon" onClick={() => onNavigate(null)} data-testid="btn-close-sidebar-admin">
            <X className="w-6 h-6 text-white" />
          </Button>
        </div>
      )}
      <div className="p-6">
        <h2 className="text-2xl font-bold" data-testid="admin-sidebar-title">
          Admin Panel
        </h2>
      </div>
      <nav className="flex-1 px-4 space-y-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeHref === item.href || (item.href === '/admin/dashboard' && activeHref === '/admin');
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => onNavigate(item.href)}
              className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                isActive ? 'bg-white/20' : 'hover:bg-white/10'
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

export default function AdminShell({ children }) {
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
    <div className="flex h-screen overflow-hidden bg-gray-50" data-testid="admin-dashboard">
      <Sidebar activeHref={pathname} onNavigate={handleNavigate} onLogout={handleLogout} variant="desktop" />

      {sidebarOpen && <Sidebar activeHref={pathname} onNavigate={handleNavigate} onLogout={handleLogout} variant="mobile" />}

      <div className="flex-1 overflow-y-auto">
        <div className="md:hidden bg-white shadow-sm p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">Admin Panel</h2>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} data-testid="btn-open-sidebar-admin">
            <Menu className="w-6 h-6" />
          </Button>
        </div>

        {children}
      </div>
    </div>
  );
}

