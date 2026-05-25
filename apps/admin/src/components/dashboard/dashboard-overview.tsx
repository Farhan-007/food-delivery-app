'use client';

import { useState } from 'react';
import { trpc } from '@/utils/trpc';
import { 
  DollarSign, 
  ShoppingBag, 
  Users, 
  Bike, 
  Clock, 
  Loader2, 
  TrendingUp, 
  Calendar, 
  ArrowUpRight, 
  UtensilsCrossed 
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';

export function DashboardOverview({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  const [days, setDays] = useState(30);
  
  // Queries
  const { data: overview, isLoading: overviewLoading } = trpc.admin.overview.useQuery();
  const { data: chartData, isLoading: chartLoading } = trpc.admin.revenueChart.useQuery({ days });

  if (overviewLoading || chartLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
          <p className="text-slate-400 text-sm">Aggregating platform metrics...</p>
        </div>
      </div>
    );
  }

  // Format currency
  const formatUSD = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(val);
  };

  // Safe chart mapper
  const formattedChartData = chartData?.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    Revenue: item.revenue,
    Orders: item.orderCount,
  })) || [];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-100 md:text-4xl">
            Control <span className="text-orange-500">Terminal</span>
          </h1>
          <p className="text-slate-400 mt-1">Real-time telemetry and management controls for the FoodHub network.</p>
        </div>
        <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-800 rounded-xl p-1 shrink-0">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                days === d
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {d} Days
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {/* Revenue card */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden group hover:border-orange-500/30 transition-all shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/5 rounded-full blur-2xl pointer-events-none group-hover:bg-orange-600/10 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Gross Revenue</span>
            <div className="p-2.5 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-500">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-100 tracking-tight">
              {formatUSD(overview?.totalRevenue || 0)}
            </h3>
            <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold mt-1">
              <TrendingUp className="w-3.5 h-3.5" /> +12.4% <span className="text-slate-500 font-normal">v. last month</span>
            </div>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden group hover:border-orange-500/30 transition-all shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/5 rounded-full blur-2xl pointer-events-none group-hover:bg-orange-600/10 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Orders</span>
            <div className="p-2.5 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-500">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-100 tracking-tight">
              {overview?.totalOrders || 0}
            </h3>
            <div className="flex items-center gap-1 text-slate-500 text-xs mt-1">
              Active across all zones
            </div>
          </div>
        </div>

        {/* Total Users */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden group hover:border-orange-500/30 transition-all shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/5 rounded-full blur-2xl pointer-events-none group-hover:bg-orange-600/10 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Platform Users</span>
            <div className="p-2.5 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-500">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-100 tracking-tight">
              {overview?.totalUsers || 0}
            </h3>
            <div className="flex items-center gap-1 text-slate-500 text-xs mt-1">
              Customers, Vendors & Riders
            </div>
          </div>
        </div>

        {/* Active Riders */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden group hover:border-orange-500/30 transition-all shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/5 rounded-full blur-2xl pointer-events-none group-hover:bg-orange-600/10 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Riders</span>
            <div className="p-2.5 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-500">
              <Bike className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-100 tracking-tight">
              {overview?.activeRiders || 0}
            </h3>
            <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold mt-1 animate-pulse">
              ● Online & Ready
            </div>
          </div>
        </div>

        {/* Pending approvals */}
        <button
          onClick={() => setActiveTab('restaurants')}
          className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden group hover:border-amber-500/40 transition-all shadow-lg text-left cursor-pointer"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-600/5 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-600/10 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pending Stores</span>
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2">
              {overview?.pendingRestaurants || 0}
              {overview?.pendingRestaurants && overview.pendingRestaurants > 0 ? (
                <span className="inline-flex w-3 h-3 bg-amber-500 rounded-full animate-ping" />
              ) : null}
            </h3>
            <div className="flex items-center gap-1 text-amber-400 text-xs font-bold mt-1">
              Requires Review <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>
        </button>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Flow */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-100">Revenue Flow Trend</h2>
              <p className="text-xs text-slate-400 mt-0.5">Aggregate value of delivered orders over N days.</p>
            </div>
            <div className="p-2 bg-slate-950/60 rounded-xl border border-slate-800">
              <Calendar className="w-4 h-4 text-slate-400" />
            </div>
          </div>
          <div className="w-full">
            {formattedChartData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center border border-dashed border-slate-800 rounded-xl bg-slate-950/20">
                <span className="text-slate-500 text-sm">No transaction telemetry for this interval.</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={formattedChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.5} />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                    labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                    itemStyle={{ color: '#f97316' }}
                    formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Revenue']}
                  />
                  <Area type="monotone" dataKey="Revenue" stroke="#f97316" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Order Volumes */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-100">Order Volumes</h2>
              <p className="text-xs text-slate-400 mt-0.5">Quantity of transactions processed in current timeframe.</p>
            </div>
            <div className="p-2 bg-slate-950/60 rounded-xl border border-slate-800">
              <ShoppingBag className="w-4 h-4 text-slate-400" />
            </div>
          </div>
          <div className="w-full">
            {formattedChartData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center border border-dashed border-slate-800 rounded-xl bg-slate-950/20">
                <span className="text-slate-500 text-sm">No transaction telemetry for this interval.</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={formattedChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.5} />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                    labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                    itemStyle={{ color: '#38bdf8' }}
                  />
                  <Bar dataKey="Orders" fill="#38bdf8" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
