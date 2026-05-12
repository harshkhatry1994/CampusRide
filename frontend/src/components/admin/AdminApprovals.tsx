import { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Crown,
  Bike as BikeIcon,
  User,
  Search,
  Filter,
  AlertCircle,
  IndianRupee,
  Tag,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

export function AdminApprovals({ onCountChange }: { onCountChange?: (count: number) => void }) {
  const { token } = useAuth();
  const [memberships, setMemberships] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [mRes, bRes] = await Promise.all([
        fetch(`${API_URL}/api/membership/admin/requests`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/admin/bookings?status=pending`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const mData = await mRes.json();
      const bData = await bRes.json();

      const mRequests = mData.success ? mData.data : [];
      const bRequests = bData.success ? bData.data.filter((b: any) => b.status === "pending") : [];

      setMemberships(mRequests);
      setBookings(bRequests);

      if (onCountChange) {
        onCountChange(mRequests.length + bRequests.length);
      }
    } catch (err) {
      toast.error("Failed to sync with server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const approveMembership = async (id: string) => {
    setActionLoading("m-approve-" + id);
    try {
      const res = await fetch(`${API_URL}/api/membership/admin/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: "approved" }),
      });
      const data = await res.json();
      if (data.success) {
        const updated = memberships.filter((m) => m._id !== id);
        setMemberships(updated);
        toast.success("Membership Approved!");
        if (onCountChange) onCountChange(updated.length + bookings.length);
      }
    } catch {
      toast.error("Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  const rejectMembership = async (id: string) => {
    const note = window.prompt("Reason for rejection?");
    if (note === null) return;

    setActionLoading("m-reject-" + id);
    try {
      const res = await fetch(`${API_URL}/api/membership/admin/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: "rejected", reviewNote: note }),
      });
      const data = await res.json();
      if (data.success) {
        const updated = memberships.filter((m) => m._id !== id);
        setMemberships(updated);
        toast.error("Membership Rejected.");
        if (onCountChange) onCountChange(updated.length + bookings.length);
      }
    } catch {
      toast.error("Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  const doBookingAction = async (id: string, action: "approve" | "reject") => {
    setActionLoading("b-" + action + "-" + id);
    try {
      const res = await fetch(`${API_URL}/api/admin/bookings/${id}/${action}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        const updated = bookings.filter((b) => b._id !== id);
        setBookings(updated);
        toast.success(`Booking ${action}d successfully`);
        if (onCountChange) onCountChange(memberships.length + updated.length);
      } else {
        toast.error(data.message || "Action failed");
      }
    } catch {
      toast.error("Connection error");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 bg-background text-foreground transition-colors duration-300">
      <div>
        <h2 className="text-3xl font-black tracking-tight">Pending Approvals</h2>
        <p className="text-muted-foreground font-medium">Verify and confirm customer requests.</p>
      </div>

      <Tabs defaultValue="memberships" className="w-full">
        <TabsList className="inline-flex w-auto bg-card border border-border p-1 mb-8 rounded-2xl shadow-sm">
          <TabsTrigger value="memberships" className="gap-2 px-8 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
            <Crown className="h-4 w-4" /> Membership Requests
          </TabsTrigger>
          <TabsTrigger value="bookings" className="gap-2 px-8 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
            <BikeIcon className="h-4 w-4" /> Booking Verifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="memberships" className="mt-0 focus-visible:outline-none">
          <div className="rounded-[2.5rem] border border-border bg-card shadow-elegant overflow-hidden">
            <div className="p-8 border-b border-border bg-amber-500/5 flex flex-col sm:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 border border-amber-500/20">
                  <Crown className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black leading-none">Membership Queue</h3>
                  <p className="text-[10px] font-black text-amber-600/60 uppercase tracking-widest mt-1">Verification Stream</p>
                </div>
              </div>
              <Badge className="bg-amber-500 text-white border-amber-400 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                {memberships.length} PENDING ACTION
              </Badge>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-[10px] uppercase font-black tracking-widest text-muted-foreground px-8 h-14">
                      Customer Profile
                    </TableHead>
                    <TableHead className="text-[10px] uppercase font-black tracking-widest text-muted-foreground h-14">
                      Ref Hash
                    </TableHead>
                    <TableHead className="text-[10px] uppercase font-black tracking-widest text-muted-foreground h-14">
                      Amount
                    </TableHead>
                    <TableHead className="text-[10px] uppercase font-black tracking-widest text-muted-foreground h-14">
                      Received
                    </TableHead>
                    <TableHead className="text-[10px] uppercase font-black tracking-widest text-muted-foreground text-right px-8 h-14">
                      Decision Control
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i} className="animate-pulse border-border/40">
                        <TableCell colSpan={5} className="h-20 bg-muted/10" />
                      </TableRow>
                    ))
                  ) : memberships.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-24 text-center">
                        <ShieldCheck className="h-16 w-16 text-muted-foreground/10 mx-auto mb-4" />
                        <p className="text-xl font-black text-muted-foreground/30">CLEAR HORIZON</p>
                        <p className="text-xs font-bold text-muted-foreground/40 uppercase tracking-widest mt-1">
                          No pending membership requests
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    memberships.map((m) => (
                      <TableRow
                        key={m._id}
                        className="hover:bg-muted/10 transition-colors border-border/40"
                      >
                        <TableCell className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-muted border border-border flex items-center justify-center text-primary font-black overflow-hidden shadow-inner">
                              {m.user?.avatar ? (
                                <img src={m.user.avatar} className="h-full w-full object-cover" />
                              ) : (
                                <User className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                            <div>
                              <p className="font-black text-sm text-foreground">{m.user?.name}</p>
                              <p className="text-[10px] font-bold text-muted-foreground">{m.user?.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-[10px] font-black text-amber-600 bg-amber-500/5 px-2 py-1 rounded-lg border border-amber-500/10 tracking-tighter">
                            {m.transactionId}
                          </code>
                        </TableCell>
                        <TableCell className="font-black text-sm text-foreground">₹{m.amount}</TableCell>
                        <TableCell className="text-xs font-bold text-muted-foreground">
                          {new Date(m.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right px-8 space-x-2">
                          <Button
                            variant="ghost"
                            onClick={() => rejectMembership(m._id)}
                            disabled={!!actionLoading}
                            className="text-destructive hover:bg-destructive/10 h-10 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest"
                          >
                            {actionLoading === "m-reject-" + m._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Reject"
                            )}
                          </Button>
                          <Button
                            onClick={() => approveMembership(m._id)}
                            disabled={!!actionLoading}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow h-10 px-8 rounded-xl font-black text-[10px] uppercase tracking-widest"
                          >
                            {actionLoading === "m-approve-" + m._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Approve & Activate"
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="bookings" className="mt-0 focus-visible:outline-none">
          <div className="rounded-[2.5rem] border border-border bg-card shadow-elegant overflow-hidden">
            <div className="p-8 border-b border-border bg-primary/5 flex flex-col sm:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                  <BikeIcon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black leading-none">Booking Stream</h3>
                  <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest mt-1">Vehicle Handover Verification</p>
                </div>
              </div>
              <Badge className="bg-primary text-white border-primary/40 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                {bookings.length} PENDING CHECKS
              </Badge>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-[10px] uppercase font-black tracking-widest text-muted-foreground px-8 h-14">
                      Rider Profile
                    </TableHead>
                    <TableHead className="text-[10px] uppercase font-black tracking-widest text-muted-foreground h-14">
                      Asset
                    </TableHead>
                    <TableHead className="text-[10px] uppercase font-black tracking-widest text-muted-foreground h-14">
                      Valuation
                    </TableHead>
                    <TableHead className="text-[10px] uppercase font-black tracking-widest text-muted-foreground h-14">
                      Compliance
                    </TableHead>
                    <TableHead className="text-[10px] uppercase font-black tracking-widest text-muted-foreground text-right px-8 h-14">
                      Action Control
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i} className="animate-pulse border-border/40">
                        <TableCell colSpan={5} className="h-20 bg-muted/10" />
                      </TableRow>
                    ))
                  ) : bookings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-24 text-center">
                        <CheckCircle2 className="h-16 w-16 text-muted-foreground/10 mx-auto mb-4" />
                        <p className="text-xl font-black text-muted-foreground/30">SYSTEM SYNCED</p>
                        <p className="text-xs font-bold text-muted-foreground/40 uppercase tracking-widest mt-1">
                          No pending booking verifications
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    bookings.map((b) => (
                      <TableRow
                        key={b._id}
                        className="hover:bg-muted/10 transition-colors border-border/40"
                      >
                        <TableCell className="px-8 py-5">
                          <p className="font-black text-sm text-foreground">{b.riderDetails?.name || b.user?.name}</p>
                          <p className="text-[10px] font-bold text-muted-foreground">REF: {b.bookingId}</p>
                        </TableCell>
                        <TableCell className="font-black text-sm text-foreground">{b.bike?.name}</TableCell>
                        <TableCell className="font-black text-sm text-primary">₹{b.pricing?.totalAmount?.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge
                            className="text-[9px] font-black uppercase tracking-widest text-emerald-600 border-emerald-500/20 bg-emerald-500/5 px-2 py-0.5 rounded-lg"
                          >
                            DOCS VERIFIED
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right px-8 space-x-2">
                          <Button
                            variant="ghost"
                            onClick={() => doBookingAction(b._id, "reject")}
                            disabled={!!actionLoading}
                            className="text-destructive hover:bg-destructive/10 h-10 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest"
                          >
                            {actionLoading === "b-reject-" + b._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Reject"
                            )}
                          </Button>
                          <Button
                            onClick={() => doBookingAction(b._id, "approve")}
                            disabled={!!actionLoading}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow h-10 px-8 rounded-xl font-black text-[10px] uppercase tracking-widest"
                          >
                            {actionLoading === "b-approve-" + b._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Confirm Ride"
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
