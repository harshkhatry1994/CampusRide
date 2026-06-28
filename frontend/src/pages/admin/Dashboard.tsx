import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { DashboardStats } from '@/lib/admin-types';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  Bike, Users, TrendingUp, IndianRupee, FileWarning,
  AlertTriangle, ShieldCheck, Package, Clock
} from 'lucide-react';
import { motion } from 'framer-motion';

// Helper to format currency in Indian style: ₹32,50,000
function formatIndianCurrency(num: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(num);
}

// ─── Stat Card ─────────────────────────────────────────────────────────────
function StatCard({
  icon: Icon, label, value, sub, color, delay = 0
}: {
  icon: React.ElementType; label: string; value: string | number;
  sub?: string; color: string; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 hover:border-white/20 hover:bg-white/8 transition-all duration-300 group"
    >
      <div className={`absolute -top-4 -right-4 h-20 w-20 rounded-full opacity-10 group-hover:opacity-20 transition-opacity ${color}`} />
      <div className={`inline-flex p-2.5 rounded-xl mb-3 ${color} bg-opacity-20`}>
        <Icon className={`h-5 w-5 text-white`} />
      </div>
      <p className="text-2xl font-black text-white mb-0.5">{value}</p>
      <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">{label}</p>
      {sub && <p className="text-[11px] text-white/40 mt-1">{sub}</p>}
    </motion.div>
  );
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];
const CUSTOM_TOOLTIP_STYLE = {
  backgroundColor: 'rgba(15,15,25,0.95)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  color: '#fff',
  fontSize: '12px',
};

// ─── Main Component ─────────────────────────────────────────────────────────
export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalBikes: 0, availableBikes: 0, soldBikes: 0, reservedBikes: 0,
    underMaintenanceBikes: 0, monthlyRevenue: 0, totalRevenue: 0,
    totalCustomers: 0, pendingDocuments: 0, insuranceExpiringSoon: 0,
    rcExpiringSoon: 0, totalSales: 0,
  });
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [brandData, setBrandData] = useState<any[]>([]);
  const [inventoryPie, setInventoryPie] = useState<any[]>([]);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    try {
      // 1. Total Bikes count query
      const { count: totalBikesCount } = await supabase
        .from('dealer_bikes')
        .select('*', { count: 'exact', head: true });

      // 2. Available Bikes count query
      const { count: availableCount } = await supabase
        .from('dealer_bikes')
        .select('*', { count: 'exact', head: true })
        .eq('stock_status', 'Available');

      // 3. Sold Bikes count query
      const { count: soldCount } = await supabase
        .from('dealer_bikes')
        .select('*', { count: 'exact', head: true })
        .eq('stock_status', 'Sold');

      // 4. Customers count query
      const { count: customersCount } = await supabase
        .from('dealer_customers')
        .select('*', { count: 'exact', head: true });

      // 5. Sales select query for revenue calculation
      const { data: salesList } = await supabase
        .from('dealer_sales')
        .select('sale_price');

      // Revenue Calculation
      const revenue = salesList?.reduce((sum, sale) => sum + Number(sale.sale_price || 0), 0) || 0;

      // ─── Supplementary Queries for Charts, Lists and Compliance Metrics ───
      const { data: bikes } = await supabase.from('dealer_bikes').select('stock_status, brand, created_at');
      const reservedBikes = bikes?.filter(b => b.stock_status === 'Reserved').length || 0;
      const underMaintenanceBikes = bikes?.filter(b => b.stock_status === 'Under Maintenance').length || 0;

      // Inventory status chart data
      setInventoryPie([
        { name: 'Available', value: availableCount || 0 },
        { name: 'Sold', value: soldCount || 0 },
        { name: 'Reserved', value: reservedBikes },
        { name: 'Maintenance', value: underMaintenanceBikes },
      ].filter(d => d.value > 0));

      // Brand breakdown
      const brandMap: Record<string, number> = {};
      bikes?.forEach(b => { brandMap[b.brand] = (brandMap[b.brand] || 0) + 1; });
      setBrandData(Object.entries(brandMap).map(([brand, count]) => ({ brand, count })).sort((a, b) => b.count - a.count).slice(0, 6));

      // Sales detail for recent lists and monthly revenue charts
      const { data: sales } = await supabase.from('dealer_sales').select('final_amount, sale_price, sale_date, dealer_customers(full_name), dealer_bikes(bike_name, brand)').order('sale_date', { ascending: false });
      const now = new Date();
      const monthlyRevenue = sales?.filter(s => {
        const d = new Date(s.sale_date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }).reduce((s, r) => s + (Number(r.sale_price || r.final_amount) || 0), 0) || 0;

      setRecentSales((sales || []).slice(0, 6));

      // Monthly revenue chart (last 6 months)
      const revByMonth: Record<string, number> = {};
      sales?.forEach(s => {
        const d = new Date(s.sale_date);
        const key = MONTHS[d.getMonth()];
        revByMonth[key] = (revByMonth[key] || 0) + (Number(s.sale_price || s.final_amount) || 0);
      });
      const last6 = [];
      for (let i = 5; i >= 0; i--) {
        const idx = (now.getMonth() - i + 12) % 12;
        const m = MONTHS[idx];
        last6.push({ month: m, revenue: revByMonth[m] || 0 });
      }
      setRevenueData(last6);

      // Compliance metrics
      const soon = new Date(); soon.setDate(soon.getDate() + 30);
      const { count: insuranceExpiringSoon } = await supabase
        .from('bike_documents').select('*', { count: 'exact', head: true })
        .eq('doc_type', 'insurance').lt('expiry_date', soon.toISOString().split('T')[0]).eq('status', 'active');
      const { count: rcExpiringSoon } = await supabase
        .from('bike_documents').select('*', { count: 'exact', head: true })
        .eq('doc_type', 'rc_book').lt('expiry_date', soon.toISOString().split('T')[0]).eq('status', 'active');
      const { count: pendingDocuments } = await supabase
        .from('bike_documents').select('*', { count: 'exact', head: true }).eq('status', 'pending');

      setStats({
        totalBikes: totalBikesCount || 0,
        availableBikes: availableCount || 0,
        soldBikes: soldCount || 0,
        reservedBikes,
        underMaintenanceBikes,
        monthlyRevenue,
        totalRevenue: revenue,
        totalCustomers: customersCount || 0,
        pendingDocuments: pendingDocuments || 0,
        insuranceExpiringSoon: insuranceExpiringSoon || 0,
        rcExpiringSoon: rcExpiringSoon || 0,
        totalSales: sales?.length || 0,
      });
    } catch (e) {
      console.error('Dashboard load error', e);
    } finally {
      setLoading(false);
    }
  }

  const primaryStats = [
    { icon: Bike,          label: 'Total Bikes',  value: stats.totalBikes,            color: 'bg-indigo-500',  sub: 'In dealership' },
    { icon: ShieldCheck,   label: 'Available',    value: stats.availableBikes,          color: 'bg-emerald-500', sub: 'Ready to sell' },
    { icon: TrendingUp,    label: 'Sold Bikes',   value: stats.soldBikes,               color: 'bg-blue-500',    sub: 'All time sales' },
    { icon: Users,         label: 'Customers',    value: stats.totalCustomers,          color: 'bg-cyan-500',    sub: 'Registered profiles' },
    { icon: IndianRupee,   label: 'Revenue',      value: formatIndianCurrency(stats.totalRevenue), color: 'bg-violet-500', sub: 'Gross sales value' },
  ];

  const operationalStats = [
    { icon: Clock,         label: 'Reserved',          value: stats.reservedBikes,           color: 'bg-amber-500',   sub: 'Pending final sale' },
    { icon: IndianRupee,   label: 'Monthly Revenue',   value: `₹${(stats.monthlyRevenue/1000).toFixed(1)}K`, color: 'bg-purple-500', sub: 'Current month' },
    { icon: FileWarning,   label: 'Pending Docs',      value: stats.pendingDocuments,        color: 'bg-orange-500',  sub: 'Needs admin upload' },
    { icon: AlertTriangle, label: 'Insurance Expiring',value: stats.insuranceExpiringSoon,   color: 'bg-red-500',     sub: 'Expiring in 30 days' },
    { icon: Package,       label: 'RC Expiring',       value: stats.rcExpiringSoon,          color: 'bg-rose-500',    sub: 'Expiring in 30 days' },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
        <p className="text-white/50 text-sm font-medium">Loading dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white">Dashboard Overview</h1>
        <p className="text-white/50 text-sm mt-1">Real-time dealership analytics</p>
      </div>

      {/* Primary Dealership Metrics */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest">Key Metrics</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {primaryStats.map((c, i) => (
            <StatCard key={c.label} {...c} delay={i * 0.04} />
          ))}
        </div>
      </div>

      {/* Operational Metrics */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest">Operations & Compliance</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {operationalStats.map((c, i) => (
            <StatCard key={c.label} {...c} delay={i * 0.04 + 0.2} />
          ))}
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue Area Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
          <h2 className="text-base font-bold text-white mb-1">Monthly Revenue</h2>
          <p className="text-xs text-white/40 mb-5">Last 6 months earnings</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
              <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} formatter={(v: any) => [`₹${Number(v).toLocaleString()}`, 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#revGrad)" dot={{ fill: '#6366f1', r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Inventory Pie */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
          <h2 className="text-base font-bold text-white mb-1">Inventory Status</h2>
          <p className="text-xs text-white/40 mb-5">Stock distribution</p>
          {inventoryPie.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={inventoryPie} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
                  {inventoryPie.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-white/30 text-sm">No bike data yet</div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Brands */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
          <h2 className="text-base font-bold text-white mb-1">Top Brands</h2>
          <p className="text-xs text-white/40 mb-5">Units in inventory</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={brandData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="brand" type="category" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
              <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} />
              <Bar dataKey="count" fill="#6366f1" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Sales */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
          <h2 className="text-base font-bold text-white mb-1">Recent Sales</h2>
          <p className="text-xs text-white/40 mb-5">Latest transactions</p>
          <div className="space-y-3">
            {recentSales.length === 0 ? (
              <div className="text-center py-8 text-white/30 text-sm">No sales yet</div>
            ) : recentSales.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/8 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white truncate max-w-[120px]">
                      {(s.dealer_bikes as any)?.bike_name || 'Bike'}
                    </p>
                    <p className="text-[10px] text-white/40">
                      {(s.dealer_customers as any)?.full_name || 'Customer'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-emerald-400">₹{Number(s.sale_price || s.final_amount).toLocaleString()}</p>
                  <p className="text-[10px] text-white/40">{new Date(s.sale_date).toLocaleDateString()}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts Row */}
      {(stats.insuranceExpiringSoon > 0 || stats.rcExpiringSoon > 0 || stats.pendingDocuments > 0) && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            <h3 className="text-sm font-bold text-amber-400">Action Required</h3>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            {stats.insuranceExpiringSoon > 0 && (
              <div className="p-3 rounded-xl bg-white/5 text-xs text-white/70">
                <span className="font-bold text-amber-400">{stats.insuranceExpiringSoon}</span> insurance{stats.insuranceExpiringSoon > 1 ? 's' : ''} expiring in 30 days
              </div>
            )}
            {stats.rcExpiringSoon > 0 && (
              <div className="p-3 rounded-xl bg-white/5 text-xs text-white/70">
                <span className="font-bold text-red-400">{stats.rcExpiringSoon}</span> RC{stats.rcExpiringSoon > 1 ? 's' : ''} expiring in 30 days
              </div>
            )}
            {stats.pendingDocuments > 0 && (
              <div className="p-3 rounded-xl bg-white/5 text-xs text-white/70">
                <span className="font-bold text-orange-400">{stats.pendingDocuments}</span> document{stats.pendingDocuments > 1 ? 's' : ''} pending upload
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
