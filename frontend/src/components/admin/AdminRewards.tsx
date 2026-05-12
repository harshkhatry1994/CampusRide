import { useState } from "react";
import {
  Gift,
  Plus,
  Tag,
  Search,
  Filter,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Sparkles,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MOCK_COUPONS: any[] = [];

export function AdminRewards() {
  const [coupons, setCoupons] = useState(MOCK_COUPONS);
  const [isAdding, setIsAdding] = useState(false);

  const deleteCoupon = (id: string) => {
    setCoupons((prev) => prev.filter((c) => c.id !== id));
    toast.success("Coupon deleted successfully");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 bg-background text-foreground transition-colors duration-300">
      <div>
        <h2 className="text-3xl font-black tracking-tight">Rewards & Loyalty</h2>
        <p className="text-muted-foreground font-medium">Manage incentives and system-wide discounts.</p>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { icon: TrendingUp, label: "Total Usage", value: "0", sub: "Starting today", color: "text-primary", bg: "bg-primary/10" },
          { icon: Gift, label: "Active Coupons", value: "12", sub: "Across categories", color: "text-indigo-500", bg: "bg-indigo-500/10" },
          { icon: Sparkles, label: "Premium Lift", value: "0%", sub: "Tracking activity", color: "text-amber-500", bg: "bg-amber-500/10" },
          { icon: Tag, label: "Revenue Impact", value: "₹0", sub: "Discounts given", color: "text-rose-500", bg: "bg-rose-500/10" },
        ].map((item, i) => (
          <div key={i} className="p-8 rounded-[2rem] bg-card border border-border shadow-elegant relative overflow-hidden group hover:border-primary/30 transition-all">
            <div className={cn("absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-5 group-hover:opacity-10 transition-opacity", item.bg)} />
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className={cn("p-2.5 rounded-xl border border-border/40", item.bg, item.color)}>
                <item.icon className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                {item.label}
              </span>
            </div>
            <div className="text-4xl font-black relative z-10">{item.value}</div>
            <p className={cn("text-[10px] font-black uppercase tracking-widest mt-2 relative z-10", item.color)}>{item.sub}</p>
          </div>
        ))}
      </div>

      {/* Rewards Controls */}
      <div className="bg-card border border-border shadow-elegant rounded-[2.5rem] overflow-hidden">
        <div className="p-8 border-b border-border bg-muted/20 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search active coupons..."
              className="pl-12 h-14 rounded-2xl bg-card border-border focus:ring-primary/20 text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <Button variant="outline" className="h-14 px-8 rounded-2xl border-border bg-card text-muted-foreground font-black text-[10px] uppercase tracking-widest gap-2">
              <Filter className="h-4 w-4 text-primary" /> Filter
            </Button>
            <Button
              className="bg-primary text-primary-foreground h-14 px-10 rounded-2xl shadow-glow font-black text-[10px] uppercase tracking-widest gap-2"
              onClick={() => toast.info("Coupon creator coming soon!")}
            >
              <Plus className="h-5 w-5" /> Create Coupon
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-muted/30 border-b border-border">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Coupon Detail</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Type</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Value</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Usage</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Expiry</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-24 text-center">
                    <Tag className="h-16 w-16 text-muted-foreground/10 mx-auto mb-4" />
                    <p className="text-xl font-black text-muted-foreground/30">NO ACTIVE COUPONS</p>
                    <p className="text-xs font-bold text-muted-foreground/40 uppercase tracking-widest mt-1">Start by creating a new incentive</p>
                  </td>
                </tr>
              ) : (
                coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/10 transition-colors group">
                    <td className="px-8 py-5">
                      <p className="font-mono font-black text-primary tracking-[0.2em]">{c.code}</p>
                      <p className="text-[10px] text-muted-foreground font-black uppercase mt-1">General Campaign</p>
                    </td>
                    <td className="px-8 py-5 text-xs font-black uppercase text-muted-foreground">{c.type}</td>
                    <td className="px-8 py-5 text-sm font-black text-foreground">
                      {c.type === "Fixed" ? `₹${c.value}` : `${c.value}%`}
                    </td>
                    <td className="px-8 py-5 text-xs font-bold text-muted-foreground">{c.usage} REDEMPTIONS</td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                        <Clock className="h-4 w-4 text-primary" /> {c.expiry}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <Badge className={cn(
                        "text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border",
                        c.status === "active" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-destructive/10 text-destructive border-destructive/20"
                      )}>
                        {c.status}
                      </Badge>
                    </td>
                    <td className="px-8 py-5 text-right space-x-2">
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-primary/10 text-primary border border-transparent hover:border-primary/20 transition-all">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button onClick={() => deleteCoupon(c.id)} variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-destructive/10 text-destructive border border-transparent hover:border-destructive/20 transition-all">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Loyalty Milestones Admin */}
      <div className="grid md:grid-cols-2 gap-8 pb-12">
        <div className="p-10 rounded-[2.5rem] bg-card border border-border shadow-elegant space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl" />
          <h3 className="text-2xl font-black flex items-center gap-3 text-indigo-500 relative z-10">
            <Trophy className="h-6 w-6" /> Loyalty Milestones
          </h3>
          <div className="space-y-4 relative z-10">
            {[
              { rides: 3, reward: "₹100 Voucher", status: "Active" },
              { rides: 5, reward: "15% Fleet Disc", status: "Active" },
              { rides: 10, reward: "VIP Gold Access", status: "Paused" },
            ].map((m, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-6 rounded-[1.5rem] bg-muted/20 border border-border shadow-sm group hover:border-indigo-500/30 transition-all"
              >
                <div>
                  <p className="font-black text-foreground">{m.reward}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                    Req: {m.rides} COMPLETED TRIPS
                  </p>
                </div>
                <Badge className={cn(
                  "text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg",
                  m.status === "Active" ? "bg-indigo-600 text-white" : "bg-muted text-muted-foreground border border-border"
                )}>{m.status}</Badge>
              </div>
            ))}
          </div>
          <Button variant="outline" className="w-full h-14 rounded-2xl border-dashed border-2 hover:border-indigo-500/50 hover:bg-indigo-500/5 font-black text-[10px] uppercase tracking-widest text-indigo-500 transition-all">
            + Expand Milestone Tier
          </Button>
        </div>

        <div className="p-10 rounded-[2.5rem] bg-primary text-primary-foreground shadow-glow flex flex-col justify-between relative overflow-hidden group">
          <Sparkles className="absolute right-[-20px] top-[-20px] h-64 w-64 opacity-10 group-hover:rotate-12 transition-transform duration-1000" />
          <div className="relative z-10">
            <h3 className="text-3xl font-black mb-4 leading-tight">Adaptive Loyalty Engine</h3>
            <p className="text-primary-foreground/80 text-base font-bold leading-relaxed max-w-sm">
              Our algorithm tracks rider velocity and automatically triggers rewards.
              <span className="block mt-4 text-white underline decoration-white/20 underline-offset-4">
                Premium members unlock tiers 2x faster than standard riders.
              </span>
            </p>
          </div>
          <div className="mt-12 flex gap-4 relative z-10">
            <div className="flex-1 bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Engine Health</p>
              <p className="text-3xl font-black">98.2%</p>
            </div>
            <div className="flex-1 bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Growth Vector</p>
              <p className="text-3xl font-black">+14%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
