import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  IndianRupee,
  Users,
  Bike as BikeIcon,
  ReceiptText,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  BarChart3,
  ArrowUpRight,
  Crown,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  confirmed: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
  completed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  cancelled: "bg-muted/50 text-muted-foreground border-border/40",
};

export function AdminDashboard() {
  const { token } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [
          { data: bookingsData },
          { count: totalBikes },
          { count: availableBikes },
          { count: totalUsers },
          { data: recentBookingsData },
        ] = await Promise.all([
          supabase.from('rentals').select('status, total_price, created_at'),
          supabase.from('bikes').select('*', { count: 'exact', head: true }),
          supabase.from('bikes').select('*', { count: 'exact', head: true }).eq('status', 'available'),
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('rentals').select('*, bikes(*)').order('created_at', { ascending: false }).limit(10),
        ]);

        const bookings = bookingsData || [];
        const recentBookings = recentBookingsData || [];
        
        // Manual join for recentBookings profiles
        const userIds = [...new Set(recentBookings.map((r: any) => r.user_id).filter(Boolean))];
        if (userIds.length > 0) {
          const { data: profiles } = await supabase.from('profiles').select('*').in('id', userIds);
          if (profiles) {
            const profileMap = Object.fromEntries(profiles.map(p => [p.id, p]));
            recentBookings.forEach((r: any) => {
              if (r.user_id && profileMap[r.user_id]) {
                r.profiles = profileMap[r.user_id];
              }
            });
          }
        }
        
        let totalRevenue = 0;
        let monthlyRevenue = 0;
        let pendingBookings = 0;
        let confirmedBookings = 0;
        let completedBookings = 0;
        let rejectedBookings = 0;
        
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        bookings.forEach(b => {
          const statusLower = b.status?.toLowerCase();
          if (statusLower === 'completed' || statusLower === 'confirmed' || statusLower === 'approved' || statusLower === 'active') {
            totalRevenue += (Number(b.total_price) || 0);
            if (new Date(b.created_at) >= startOfMonth) {
              monthlyRevenue += (Number(b.total_price) || 0);
            }
          }
          if (statusLower === 'pending') pendingBookings++;
          else if (statusLower === 'confirmed' || statusLower === 'approved' || statusLower === 'active') confirmedBookings++;
          else if (statusLower === 'completed') completedBookings++;
          else if (statusLower === 'rejected' || statusLower === 'cancelled') rejectedBookings++;
        });

        setData({
          stats: {
            totalRevenue,
            monthlyRevenue,
            totalBikes: totalBikes || 0,
            availableBikes: availableBikes || 0,
            totalBookings: bookings.length,
            pendingBookings,
            confirmedBookings,
            completedBookings,
            rejectedBookings,
            totalUsers: totalUsers || 0,
          },
          recentBookings: recentBookings || []
        });
      } catch (err) {
        console.error(err);
        toast.error("Failed to load stats");
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading)
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-muted/40 animate-pulse" />
          ))}
        </div>
        <div className="h-64 rounded-2xl bg-muted/40 animate-pulse" />
      </div>
    );

  const { stats, recentBookings } = data || {};

  const kpis = [
    {
      icon: <IndianRupee className="h-5 w-5" />,
      label: "Total Revenue",
      value: `₹${(stats?.totalRevenue || 0).toLocaleString("en-IN")}`,
      sub: `₹${(stats?.monthlyRevenue || 0).toLocaleString("en-IN")} this month`,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      icon: <BikeIcon className="h-5 w-5" />,
      label: "Total Bikes",
      value: stats?.totalBikes || 0,
      sub: `${stats?.availableBikes || 0} available now`,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      icon: <ReceiptText className="h-5 w-5" />,
      label: "Total Bookings",
      value: stats?.totalBookings || 0,
      sub: `${stats?.pendingBookings || 0} awaiting approval`,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      icon: <Users className="h-5 w-5" />,
      label: "Total Customers",
      value: stats?.totalUsers || 0,
      sub: "Registered accounts",
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
    },
  ];

  const statusCards = [
    {
      label: "Pending",
      value: stats?.pendingBookings || 0,
      icon: <Clock className="h-4 w-4" />,
      color: "text-amber-500",
    },
    {
      label: "Confirmed",
      value: stats?.confirmedBookings || 0,
      icon: <TrendingUp className="h-4 w-4" />,
      color: "text-emerald-500",
    },
    {
      label: "Completed",
      value: stats?.completedBookings || 0,
      icon: <CheckCircle2 className="h-4 w-4" />,
      color: "text-blue-500",
    },
    {
      label: "Rejected",
      value: stats?.rejectedBookings || 0,
      icon: <XCircle className="h-4 w-4" />,
      color: "text-destructive",
    },
  ];

  return (
    <div className="space-y-8 bg-background text-foreground transition-colors duration-300">
      <div>
        <h2 className="text-3xl font-black tracking-tight">Dashboard Overview</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Welcome back! Here's what's happening today.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="relative p-6 rounded-[2rem] border border-border bg-card shadow-elegant overflow-hidden group hover:border-primary/30 hover:shadow-glow transition-all duration-300"
          >
            <div
              className={cn("absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-5 group-hover:opacity-10 transition-opacity", k.bg)}
            />
            <div className={cn("inline-flex p-3 rounded-2xl mb-4", k.bg, k.color)}>{k.icon}</div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">
              {k.label}
            </p>
            <p className="text-3xl font-black mb-1">{k.value}</p>
            <p className="text-xs text-muted-foreground font-medium">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Booking Status Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statusCards.map((s) => (
          <div
            key={s.label}
            className="p-5 rounded-2xl border border-border bg-card flex items-center gap-4 transition-all hover:bg-muted/30"
          >
            <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center bg-muted", s.color)}>{s.icon}</div>
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">{s.label}</p>
              <p className={cn("text-2xl font-black", s.color)}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Bookings Table */}
      <div className="rounded-[2.5rem] border border-border bg-card shadow-elegant overflow-hidden">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h3 className="font-black text-lg">Recent Bookings</h3>
          </div>
          <Badge variant="secondary" className="bg-muted text-muted-foreground px-3 py-1 rounded-full text-[10px] font-bold">
            LAST 10 ENTRIES
          </Badge>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground h-14 px-6">Customer</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground h-14 px-6">Bike</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground h-14 px-6">Date</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground h-14 px-6">Amount</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground h-14 px-6">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!recentBookings || recentBookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic">
                    No bookings recorded yet
                  </TableCell>
                </TableRow>
              ) : (
                recentBookings.map((b: any) => (
                  <TableRow
                    key={b.id}
                    className="border-border/40 hover:bg-muted/10 transition-all duration-200 cursor-default"
                  >
                    <TableCell className="px-6 py-4">
                      <div className="font-black text-sm">
                        {b.profiles?.full_name || b.profiles?.email?.split('@')[0] || 'User'}
                      </div>
                      <div className="text-[10px] font-bold text-muted-foreground">{b.profiles?.email}</div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="text-sm font-semibold">
                        {b.bikes?.bike_name || `${b.bikes?.brand || ''} ${b.bikes?.model || ''}`}
                      </div>
                      <div className="text-[10px] font-bold text-primary uppercase tracking-wider">{b.bikes?.category || 'Fleet'}</div>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-xs font-bold text-muted-foreground">
                      {new Date(b.created_at).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <span className="font-black text-sm">
                        ₹{b.total_price?.toLocaleString("en-IN")}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <Badge
                        className={cn("capitalize text-[9px] font-black uppercase tracking-widest border rounded-lg px-2 py-0.5", STATUS_COLORS[b.status?.toLowerCase()] || "")}
                      >
                        {b.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
