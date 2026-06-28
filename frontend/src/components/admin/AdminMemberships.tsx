import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
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
  Crown,
  RefreshCw,
  Check,
  X,
  Loader2,
  User,
  Mail,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { formatISTDateTime } from "@/lib/dateUtils";

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  pending:  { label: "Pending",  bg: "bg-amber-500/10",   text: "text-amber-500",   border: "border-amber-500/20"  },
  approved: { label: "Approved", bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/20" },
  rejected: { label: "Rejected", bg: "bg-rose-500/10",    text: "text-rose-500",    border: "border-rose-500/20"   },
};

export function AdminMemberships() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("membership_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      
      const requests = data || [];
      const userIds = [...new Set(requests.map((r: any) => r.user_id).filter(Boolean))];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('*').in('id', userIds);
        if (profiles) {
          const profileMap = Object.fromEntries(profiles.map(p => [p.id, p]));
          requests.forEach((r: any) => {
            if (r.user_id && profileMap[r.user_id]) {
              r.profiles = profileMap[r.user_id];
            }
          });
        }
      }
      
      setRequests(requests);
    } catch (err: any) {
      toast.error(err.message || "Failed to load membership requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApprove = async (req: any) => {
    setActionLoading("approve-" + req.id);
    try {
      // Update request status
      const { error: reqErr } = await supabase
        .from("membership_requests")
        .update({ status: "approved", updated_at: new Date().toISOString() })
        .eq("id", req.id);
      if (reqErr) throw reqErr;

      // Update user's is_premium flag
      const { error: profErr } = await supabase
        .from("profiles")
        .update({ is_premium: true })
        .eq("id", req.user_id);
      if (profErr) throw profErr;

      toast.success(`✅ Approved! ${req.profiles?.full_name || req.profiles?.email} is now Premium.`);
      setRequests(prev =>
        prev.map(r => r.id === req.id ? { ...r, status: "approved" } : r)
      );
    } catch (err: any) {
      toast.error(err.message || "Approval failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (req: any) => {
    setActionLoading("reject-" + req.id);
    try {
      const { error } = await supabase
        .from("membership_requests")
        .update({ status: "rejected", updated_at: new Date().toISOString() })
        .eq("id", req.id);
      if (error) throw error;
      toast.success("Request rejected.");
      setRequests(prev =>
        prev.map(r => r.id === req.id ? { ...r, status: "rejected" } : r)
      );
    } catch (err: any) {
      toast.error(err.message || "Rejection failed");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-8 bg-background text-foreground">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Crown className="h-7 w-7 text-amber-500" />
            Membership Requests
            <Badge variant="outline" className="h-6 bg-amber-500/5 text-amber-500 border-amber-500/20 font-black px-2 rounded-lg">
              {requests.filter(r => r.status === "pending").length} PENDING
            </Badge>
          </h2>
          <p className="text-muted-foreground font-medium text-sm">
            Review UTR submissions and approve or reject Premium upgrades.
          </p>
        </div>
        <Button
          variant="outline"
          size="lg"
          onClick={fetchRequests}
          className="rounded-2xl border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground shadow-sm gap-2"
        >
          <RefreshCw className={cn("h-4 w-4 text-primary", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-[2.5rem] border border-border bg-card shadow-elegant overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30 border-b border-border/60">
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Customer</TableHead>
                <TableHead className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">UTR / Transaction ID</TableHead>
                <TableHead className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Amount</TableHead>
                <TableHead className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Submitted</TableHead>
                <TableHead className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Status</TableHead>
                <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i} className="animate-pulse border-border/40">
                    <TableCell colSpan={6} className="h-20 bg-muted/10" />
                  </TableRow>
                ))
              ) : requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-24 text-center">
                    <div className="h-20 w-20 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4 border border-border">
                      <Crown className="h-8 w-8 text-muted-foreground/20" />
                    </div>
                    <p className="text-xl font-black text-muted-foreground/30">NO MEMBERSHIP REQUESTS</p>
                    <p className="text-xs font-bold text-muted-foreground/40 uppercase tracking-widest mt-1">
                      Users who pay via UPI will appear here
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((req) => {
                  const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
                  const isProcessing = actionLoading === `approve-${req.id}` || actionLoading === `reject-${req.id}`;
                  return (
                    <TableRow key={req.id} className="group hover:bg-muted/10 transition-colors border-border/40">
                      <TableCell className="px-8 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 font-black border border-amber-500/20">
                            <User className="h-4 w-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-sm text-foreground">
                              {req.profiles?.full_name || req.profiles?.email?.split("@")[0] || "Unknown"}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                              <Mail className="h-2.5 w-2.5" />
                              {req.profiles?.email}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-3.5 w-3.5 text-primary/60 shrink-0" />
                          <span className="font-mono font-black text-sm text-foreground tracking-widest">
                            {req.utr_number}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <span className="font-black text-sm text-foreground">
                          ₹{Number(req.amount).toLocaleString("en-IN")}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <span className="text-xs font-bold text-muted-foreground">
                          {formatISTDateTime(req.created_at)}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-center">
                        <Badge
                          className={cn(
                            "px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border",
                            cfg.bg, cfg.text, cfg.border
                          )}
                        >
                          {cfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-8 py-4 text-right">
                        {req.status === "pending" ? (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={isProcessing}
                              onClick={() => handleApprove(req)}
                              className="h-9 px-4 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white border border-emerald-500/20 font-black text-[10px] uppercase tracking-widest gap-1.5 transition-all"
                            >
                              {actionLoading === `approve-${req.id}` ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Check className="h-3.5 w-3.5" />
                              )}
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={isProcessing}
                              onClick={() => handleReject(req)}
                              className="h-9 px-4 rounded-xl bg-rose-500/10 text-rose-600 hover:bg-rose-500 hover:text-white border border-rose-500/20 font-black text-[10px] uppercase tracking-widest gap-1.5 transition-all"
                            >
                              {actionLoading === `reject-${req.id}` ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <X className="h-3.5 w-3.5" />
                              )}
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            {req.status === "approved" ? "✓ Activated" : "✗ Declined"}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
