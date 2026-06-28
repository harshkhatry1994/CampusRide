import { useState, useCallback, useEffect } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Package, Users, TrendingUp, FileText,
  BarChart3, Settings, Bell, LogOut, Menu, X, ChevronRight,
  Shield, Bike, Star, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

// ── Lazy-load pages
import Dashboard from '@/pages/admin/Dashboard';
import Inventory from '@/pages/admin/Inventory';
import Customers from '@/pages/admin/Customers';
import Sales from '@/pages/admin/Sales';
import Invoices from '@/pages/admin/Invoices';
import Reports from '@/pages/admin/Reports';

// ── Route setup
export const Route = createFileRoute('/admin-portal')({
  head: () => ({ meta: [{ title: 'CampusRide Admin Portal — Dealership ERP' }] }),
  component: AdminPortal,
});

type Section = 'dashboard' | 'inventory' | 'customers' | 'sales' | 'invoices' | 'reports' | 'settings';

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { id: 'dashboard' as Section, label: 'Dashboard', icon: LayoutDashboard, color: 'text-indigo-400' },
    ],
  },
  {
    label: 'Management',
    items: [
      { id: 'inventory' as Section, label: 'Inventory', icon: Package, color: 'text-amber-400' },
      { id: 'customers' as Section, label: 'Customers', icon: Users, color: 'text-cyan-400' },
      { id: 'sales' as Section, label: 'Sales', icon: TrendingUp, color: 'text-emerald-400' },
    ],
  },
  {
    label: 'Documents',
    items: [
      { id: 'invoices' as Section, label: 'Invoices', icon: FileText, color: 'text-violet-400' },
    ],
  },
  {
    label: 'Insights',
    items: [
      { id: 'reports' as Section, label: 'Reports', icon: BarChart3, color: 'text-pink-400' },
    ],
  },
];

// ── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({
  section, onNav, notifCount, user, onLogout,
}: {
  section: Section;
  onNav: (s: Section) => void;
  notifCount: number;
  user: any;
  onLogout: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 flex-shrink-0">
            <Bike className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-black text-white text-sm leading-tight">CampusRide</p>
            <p className="text-[10px] text-white/40 uppercase tracking-widest">Admin Portal</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-5 overflow-y-auto">
        {NAV_GROUPS.map(group => (
          <div key={group.label}>
            <p className="text-[9px] font-bold text-white/25 uppercase tracking-[0.15em] px-3 mb-1.5">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map(item => {
                const isActive = section === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNav(item.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative',
                      isActive
                        ? 'bg-white/10 text-white'
                        : 'text-white/40 hover:text-white/80 hover:bg-white/5'
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="nav-pill"
                        className="absolute inset-0 rounded-xl bg-white/10"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
                      />
                    )}
                    <item.icon className={cn('h-4 w-4 flex-shrink-0 relative z-10', isActive ? item.color : 'group-hover:text-white/60')} />
                    <span className="relative z-10">{item.label}</span>
                    {isActive && <ChevronRight className="h-3.5 w-3.5 ml-auto relative z-10 text-white/40" />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-white/10 space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-indigo-500/30 flex items-center justify-center flex-shrink-0">
            {user?.avatar_url
              ? <img src={user.avatar_url} alt="" className="h-9 w-9 rounded-xl object-cover" />
              : <Shield className="h-4 w-4 text-indigo-400" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{user?.name || 'Admin'}</p>
            <p className="text-[10px] text-white/35 truncate">{user?.role || 'portal'}</p>
          </div>
        </div>
        <button onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-white/40 hover:text-white hover:bg-white/5 transition-all">
          <LogOut className="h-3.5 w-3.5" /> Sign Out
        </button>
      </div>
    </div>
  );
}

// ── Main Portal ───────────────────────────────────────────────────────────────
function AdminPortal() {
  const { user, token, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const [section, setSection] = useState<Section>('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifCount] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      if (!token) { navigate({ to: '/login' }); return; }
      if (user?.role !== 'super_admin') {
        toast.error('Access denied. Super Admin role required.');
        navigate({ to: '/' });
      }
    }
  }, [token, user, isLoading]);

  const handleLogout = () => { logout(); navigate({ to: '/' }); };
  const handleNav = (s: Section) => { setSection(s); setMobileOpen(false); };

  if (isLoading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
          <Bike className="h-6 w-6 text-indigo-400 animate-pulse" />
        </div>
        <p className="text-white/40 text-sm">Loading Admin Portal...</p>
      </div>
    </div>
  );

  if (!token) return null;

  const sectionTitles: Record<Section, string> = {
    dashboard: 'Dashboard', inventory: 'Bike Inventory', customers: 'Customers',
    sales: 'Sales', invoices: 'Invoices', reports: 'Reports', settings: 'Settings',
  };

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 flex-shrink-0 border-r border-white/10 bg-black/30">
        <Sidebar section={section} onNav={handleNav} notifCount={notifCount} user={user} onLogout={handleLogout} />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-40 h-14 flex items-center justify-between px-4 sm:px-6 border-b border-white/10 bg-gray-950/80 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            {/* Mobile menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button className="lg:hidden p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition-colors">
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-60 p-0 border-r border-white/10 bg-gray-950">
                <Sidebar section={section} onNav={handleNav} notifCount={notifCount} user={user} onLogout={handleLogout} />
              </SheetContent>
            </Sheet>
            <div>
              <h1 className="text-sm font-bold text-white leading-tight">{sectionTitles[section]}</h1>
              <p className="text-[10px] text-white/30 hidden sm:block">CampusRide Dealership ERP</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-semibold text-white/50 uppercase tracking-wide">{user?.name}</span>
              <Badge variant="secondary" className="text-[9px] uppercase tracking-widest px-1.5 py-0 bg-indigo-500/20 text-indigo-400 border-indigo-500/30">
                {user?.role}
              </Badge>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={section}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {section === 'dashboard' && <Dashboard />}
              {section === 'inventory' && <Inventory />}
              {section === 'customers' && <Customers />}
              {section === 'sales' && <Sales />}
              {section === 'invoices' && <Invoices />}
              {section === 'reports' && <Reports />}
              {section === 'settings' && (
                <div className="flex items-center justify-center h-64 text-white/30 text-sm">
                  Settings coming soon
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
