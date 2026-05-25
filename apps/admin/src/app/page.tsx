'use client';

import { useState } from 'react';
import { AdminGuard } from '@/components/admin-guard';
import { DashboardOverview } from '@/components/dashboard/dashboard-overview';
import { RestaurantManagement } from '@/components/dashboard/restaurant-management';
import { OrderManagement } from '@/components/dashboard/order-management';
import { UserManagement } from '@/components/dashboard/user-management';
import { ZoneEditor } from '@/components/dashboard/zone-editor';
import { CouponManagement } from '@/components/dashboard/coupon-management';
import { SettingsPanel } from '@/components/dashboard/settings-panel';
import { useSession, signOut } from '@repo/auth/client';
import { 
  LayoutDashboard, 
  Utensils, 
  ShoppingBag, 
  Users, 
  Map, 
  Ticket, 
  Settings, 
  LogOut, 
  Pizza, 
  Activity,
  Menu,
  X
} from 'lucide-react';

export default function AdminPage() {
  return (
    <AdminGuard>
      <DashboardShell />
    </AdminGuard>
  );
}

function DashboardShell() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'restaurants', label: 'Restaurants', icon: Utensils },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'users', label: 'Users & Riders', icon: Users },
    { id: 'zones', label: 'Delivery Zones', icon: Map },
    { id: 'coupons', label: 'Promo Coupons', icon: Ticket },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverview setActiveTab={setActiveTab} />;
      case 'restaurants':
        return <RestaurantManagement />;
      case 'orders':
        return <OrderManagement />;
      case 'users':
        return <UserManagement />;
      case 'zones':
        return <ZoneEditor />;
      case 'coupons':
        return <CouponManagement />;
      case 'settings':
        return <SettingsPanel />;
      default:
        return <DashboardOverview setActiveTab={setActiveTab} />;
    }
  };

  const handleSignOut = async () => {
    if (confirm('Are you sure you want to shut down the administrative session connection?')) {
      await signOut();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row relative">
      {/* Decorative background glow spots */}
      <div className="absolute top-1/3 left-0 w-80 h-80 bg-orange-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Sidebar - Desktop Layout */}
      <aside className="hidden md:flex md:w-64 bg-slate-900/35 backdrop-blur-xl border-r border-slate-900 flex-col shrink-0 relative z-20">
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-900/80 flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-tr from-orange-500 to-amber-500 rounded-xl shadow-lg shadow-orange-500/10">
            <Pizza className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-100 tracking-tight">
              FoodHub<span className="text-orange-500">Admin</span>
            </h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Control Panel</p>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 p-4 space-y-1.5 mt-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-orange-500/15 to-orange-500/5 text-orange-400 border border-orange-500/15 shadow-sm'
                    : 'text-slate-400 hover:bg-slate-900/40 hover:text-slate-200 border border-transparent'
                }`}
              >
                <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-orange-500' : 'text-slate-500'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Profile and Logout */}
        <div className="p-4 border-t border-slate-900/80 space-y-3 bg-slate-950/20">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-full bg-orange-600/10 border border-orange-500/20 flex items-center justify-center text-orange-500 font-bold">
              {session?.user?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black text-slate-200 truncate">{session?.user?.name || 'Administrator'}</p>
              <p className="text-[10px] text-slate-500 font-mono truncate">{session?.user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 bg-slate-900/45 hover:bg-red-950/25 border border-slate-850 hover:border-red-900/30 text-slate-400 hover:text-red-400 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Terminate Session
          </button>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <header className="md:hidden bg-slate-900/50 backdrop-blur-xl border-b border-slate-900/80 px-6 py-4 flex items-center justify-between relative z-30 shrink-0">
        <div className="flex items-center gap-2">
          <Pizza className="w-5 h-5 text-orange-500 animate-pulse" />
          <h2 className="text-sm font-black text-slate-100">
            FoodHub<span className="text-orange-500">Admin</span>
          </h2>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-400 hover:text-white"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[57px] bg-slate-950/95 backdrop-blur-2xl border-b border-slate-900 z-35 flex flex-col p-4 space-y-1 animate-slideDown">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-orange-500/10 text-orange-400 border border-orange-500/15'
                    : 'text-slate-400 border border-transparent'
                }`}
              >
                <Icon className="w-4.5 h-4.5 text-slate-500" />
                {item.label}
              </button>
            );
          })}
          <div className="border-t border-slate-900 pt-3.5 mt-2.5 flex items-center justify-between px-2">
            <span className="text-xs text-slate-500 font-mono">{session?.user?.email}</span>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-xs font-bold text-red-400 hover:text-red-300"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 relative z-10 overflow-y-auto max-h-screen">
        {/* Global Connection telemetry indicator top-right on desktop */}
        <div className="hidden lg:flex items-center gap-2 absolute top-10 right-10 z-10 bg-slate-950/60 border border-slate-900 rounded-full px-3 py-1.5">
          <span className="flex w-2 h-2 rounded-full bg-emerald-500 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          </span>
          <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-1.5">
            Node Connected <Activity className="w-3.5 h-3.5 text-orange-500" />
          </span>
        </div>

        <div className="max-w-6xl mx-auto w-full">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
