import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
  Search,
  RefreshCw,
  Eye,
  CheckCircle2,
  Loader2,
  Calendar,
  User,
  Phone,
  Mail,
  FileText,
  Image as ImgIcon,
  ExternalLink,
  ShieldCheck,
  Trash2,
  LayoutGrid,
  Download,
  Maximize2,
  FileSearch,
  Check,
  X,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { formatISTDate, formatISTDateTime } from "@/lib/dateUtils";

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  pending: { label: "Pending", bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/20" },
  confirmed: { label: "Confirmed", bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500/20" },
  completed: { label: "Completed", bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/20" },
  cancelled: { label: "Cancelled", bg: "bg-rose-500/10", text: "text-rose-500", border: "border-rose-500/20" },
  rejected: { label: "Rejected", bg: "bg-rose-500/10", text: "text-rose-500", border: "border-rose-500/20" },
};

const PAYMENT_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  pending: { label: "Unpaid", bg: "bg-slate-500/10", text: "text-slate-500", border: "border-slate-500/20" },
  paid: { label: "Settled", bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/20" },
  failed: { label: "Failed", bg: "bg-rose-500/10", text: "text-rose-500", border: "border-rose-500/20" },
};

export function AdminBookings({ onCountChange }: { onCountChange?: () => void }) {
  console.log("RENTAL REQUESTS COMPONENT LOADED");
  const { token } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selected, setSelected] = useState<any>(null);
  const [previewDoc, setPreviewDoc] = useState<{ url: string; label: string } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const RENTAL_SELECT = "*, bikes(*)";

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("rentals")
        .select(RENTAL_SELECT)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      const rentals = data || [];
      console.log("================================");
      console.log("Rentals fetched:", rentals);
      console.log("Count:", rentals.length);
      console.log("Statuses:", rentals.map(r => r.status));
      console.log("Filtered Status:", filterStatus);
      console.log("================================");
      const userIds = [...new Set(rentals.map(r => r.user_id).filter(Boolean))];
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('*').in('id', userIds);
        if (profiles) {
          const profileMap = Object.fromEntries(profiles.map(p => [p.id, p]));
          rentals.forEach(r => {
            if (r.user_id && profileMap[r.user_id]) {
              r.profiles = profileMap[r.user_id];
            }
          });
        }
      }
      
      setBookings(rentals);
    } catch (error) {
      toast.error("Network error fetching bookings");
    } finally {
      setLoading(false);
    }
  }, []);

useEffect(() => {
  fetchBookings();
}, [fetchBookings]);

const doAction = async (id: string, action: string, body: any = {}) => {
  setActionLoading(action + id);
  try {
    if (action === "delete") {
      const { error } = await supabase.from('rentals').delete().eq('id', id);
      if (error) throw error;
      toast.success("Booking deleted successfully");
      setBookings(prev => prev.filter(b => b.id !== id));
      if (selected?.id === id) setSelected(null);
    } else {
      const { data, error } = await supabase
        .from('rentals')
        .update(body)
        .eq('id', id)
        .select(RENTAL_SELECT);
        
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Update failed or no row returned");
      
      const updatedRow = data[0];
      
      if (updatedRow.user_id) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', updatedRow.user_id).single();
        if (profile) updatedRow.profiles = profile;
      }
      
      toast.success("Status updated successfully");
      if (selected && selected.id === id) {
        setSelected(updatedRow);
      }
    }
    await fetchBookings();
    if (onCountChange) onCountChange();
  } catch (err: any) {
    console.error("Booking action failed:", err);
    toast.error(err.message || "Connection failed");
  } finally {
    setActionLoading(null);
  }
};


const filtered = Array.isArray(bookings) ? bookings.filter((b) => {
  const customerName = (b.profiles?.full_name || b.profiles?.email || "").toLowerCase();
  const bikeName = (b.bikes?.bike_name || `${b.bikes?.brand || ""} ${b.bikes?.model || ""}`.trim() || "").toLowerCase();
  const bookingId = (b.id || "").toLowerCase();
  const q = search.toLowerCase();
  const matchesSearch = !q || bookingId.includes(q) || customerName.includes(q) || bikeName.includes(q);
  const matchesStatus = filterStatus === "all" || b.status?.toLowerCase() === filterStatus;
  return matchesSearch && matchesStatus;
}) : [];

console.log("Filtered Count:", filtered.length);
console.log(filtered);

return (
  <div className="space-y-8 bg-background text-foreground transition-colors duration-300">
    {/* Header Area */}
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-4 sm:p-0">
      <div className="space-y-1">
        <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
          Rental Records
          <Badge variant="outline" className="h-6 bg-primary/5 text-primary border-primary/20 font-black px-2 rounded-lg">
            {bookings.length} TOTAL
          </Badge>
        </h2>
        <p className="text-muted-foreground font-medium text-sm">Manage campus fleet deployments and rider verification.</p>
      </div>
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="lg"
          onClick={fetchBookings}
          className="rounded-2xl border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground shadow-sm gap-2"
        >
          <RefreshCw className={cn("h-4 w-4 text-primary", loading && "animate-spin")} />
          Sync Data
        </Button>
        <Button
          size="lg"
          className="bg-gradient-brand text-primary-foreground shadow-glow rounded-2xl px-8 font-bold gap-2"
          onClick={() => toast.info("Exporting to CSV...")}
        >
          <LayoutGrid className="h-4 w-4" /> Export Report
        </Button>
      </div>
    </div>

    {/* Control Bar */}
    <div className="flex flex-col lg:flex-row gap-4 p-4 sm:p-0">
      <div className="relative flex-1 group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <Input
          placeholder="Search by ID, Customer, or Asset..."
          className="pl-12 h-14 bg-card border-border rounded-[1.25rem] text-foreground placeholder:text-muted-foreground focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="flex gap-4">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px] h-14 bg-card border-border rounded-[1.25rem] font-bold text-xs uppercase tracking-widest text-muted-foreground px-6 shadow-sm">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border rounded-xl shadow-2xl">
            <SelectItem value="all" className="text-xs font-black uppercase tracking-widest">All Status</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key} className={cn("text-xs font-black uppercase tracking-widest", config.text)}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>

    {/* Main Table */}
    <div className="rounded-[2.5rem] border border-border bg-card shadow-elegant overflow-hidden transition-all duration-500">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/30 border-b border-border/60">
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Booking ID</TableHead>
              <TableHead className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Customer</TableHead>
              <TableHead className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Asset & Duration</TableHead>
              <TableHead className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Valuation</TableHead>
              <TableHead className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Lifecycle</TableHead>
              <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="animate-pulse border-border/40">
                  <TableCell colSpan={6} className="h-20 bg-muted/10" />
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-24 text-center">
                  <div className="h-20 w-20 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4 border border-border">
                    <Search className="h-8 w-8 text-muted-foreground/20" />
                  </div>
                  <p className="text-xl font-black text-muted-foreground/30">NO MATCHING RECORDS</p>
                  <p className="text-xs font-bold text-muted-foreground/40 uppercase tracking-widest mt-1">Try adjusting your filters</p>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((b) => (
                <TableRow key={b.id} className="group hover:bg-muted/10 transition-colors border-border/40">
                  <TableCell className="px-8 py-4">
                    <div className="flex flex-col">
                      <span className="font-black text-sm text-primary tracking-tight">#{b.id.substring(0, 8)}</span>
                      <span className="text-[10px] text-muted-foreground font-bold mt-0.5">{formatISTDateTime(b.created_at)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black border border-primary/20 shadow-inner">
                        {(b.profiles?.full_name || b.profiles?.email || "?")[0].toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-foreground">{b.profiles?.full_name || b.profiles?.email?.split('@')[0] || 'Unknown User'}</span>
                        <span className="text-[10px] text-muted-foreground font-medium">{b.profiles?.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-black text-xs text-foreground uppercase tracking-wide">{b.bikes?.bike_name || b.bikes?.brand}</span>
                      <span className="text-[10px] text-muted-foreground font-bold mt-1">
                        {formatISTDate(b.start_date)} — {formatISTDate(b.end_date)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-black text-sm text-foreground">₹{b.total_price?.toLocaleString()}</span>
                      <Badge className={cn("w-fit mt-1 text-[8px] font-black uppercase px-2 py-0.5 rounded-md border", PAYMENT_CONFIG["paid"].bg, PAYMENT_CONFIG["paid"].text, PAYMENT_CONFIG["paid"].border)}>
                        {PAYMENT_CONFIG["paid"].label}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <Select
                      value={b.status?.toLowerCase()}
                      onValueChange={(val) => doAction(b.id, "update", { status: val })}
                      disabled={!!actionLoading}
                    >
                      <SelectTrigger className={cn("h-10 w-full min-w-[140px] rounded-xl font-black text-[10px] uppercase tracking-widest border-2 transition-all shadow-sm", STATUS_CONFIG[b.status?.toLowerCase()]?.bg || "bg-muted", STATUS_CONFIG[b.status?.toLowerCase()]?.text || "text-muted-foreground", STATUS_CONFIG[b.status?.toLowerCase()]?.border || "border-border")}>
                        <div className="flex items-center gap-2">
                          {actionLoading === `update${b.id}` ? <Loader2 className="h-3 w-3 animate-spin" /> : <div className="h-1.5 w-1.5 rounded-full bg-current" />}
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border rounded-xl shadow-2xl">
                        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                          <SelectItem key={key} value={key} className={cn("text-[10px] font-black uppercase tracking-widest focus:bg-primary focus:text-primary-foreground", config.text)}>
                            {config.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="px-8 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelected(b)}
                        className="h-10 w-10 rounded-xl hover:bg-primary hover:text-primary-foreground text-primary bg-primary/5 border border-primary/10 transition-all shadow-sm"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={!!actionLoading}
                        onClick={() => {
                          if (window.confirm("Are you sure you want to delete this booking?")) {
                            doAction(b.id, "delete");
                          }
                        }}
                        className="h-10 w-10 rounded-xl hover:bg-destructive hover:text-destructive-foreground text-destructive bg-destructive/5 border border-destructive/10 transition-all shadow-sm"
                      >
                        {actionLoading === "delete" + b.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>

    {/* Booking Detail Modal */}
    <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
      <DialogContent className="max-w-4xl w-[95vw] sm:w-full h-[92vh] flex flex-col p-0 overflow-hidden rounded-[2.5rem] border-border shadow-2xl bg-card text-foreground">
        {selected && (
          <>
            {/* Modal Header - Fixed */}
            <div className="bg-muted/30 p-8 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-3xl font-black text-foreground tracking-tight">Booking Info</h3>
                  <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 font-black text-sm px-3 rounded-lg">
                    #{selected.id?.substring(0, 8)}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                  Verification & Asset Deployment Overview
                </p>
              </div>
              <div className="flex gap-4 shrink-0">
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Status</span>
                  <Badge className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm", STATUS_CONFIG[selected.status?.toLowerCase()]?.bg || "bg-muted", STATUS_CONFIG[selected.status?.toLowerCase()]?.text || "text-muted-foreground", STATUS_CONFIG[selected.status?.toLowerCase()]?.border || "border-border")}>
                    {STATUS_CONFIG[selected.status?.toLowerCase()]?.label || selected.status}
                  </Badge>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Payment</span>
                  <Badge className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm", PAYMENT_CONFIG["paid"].bg, PAYMENT_CONFIG["paid"].text, PAYMENT_CONFIG["paid"].border)}>
                    {PAYMENT_CONFIG["paid"].label}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-10 custom-scrollbar">
              <div className="grid md:grid-cols-2 gap-10">
                {/* Left Column: Rider + Documents */}
                <div className="space-y-8">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 px-2">
                      <User className="h-3 w-3 text-primary" /> Customer Profile
                    </h4>
                    <div className="p-6 rounded-[2rem] bg-muted/20 border border-border shadow-sm flex items-start gap-5 group hover:border-primary/30 transition-all">
                      <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-2xl border border-primary/20 shadow-inner group-hover:scale-105 transition-transform shrink-0">
                        {(selected.profiles?.full_name || selected.profiles?.email || "?")[0].toUpperCase()}
                      </div>
                      <div className="space-y-1 flex-1 min-w-0">
                        <p className="font-black text-xl text-foreground truncate">{selected.profiles?.full_name || selected.profiles?.email?.split('@')[0] || 'Unknown User'}</p>
                        <div className="space-y-1.5 pt-2">
                          <p className="text-xs font-bold text-muted-foreground flex items-center gap-2.5">
                            <Phone className="h-3.5 w-3.5 text-primary/60" /> {selected.profiles?.phone || selected.phone || "N/A"}
                          </p>
                          <p className="text-xs font-bold text-muted-foreground flex items-center gap-2.5">
                            <Mail className="h-3.5 w-3.5 text-primary/60" /> {selected.profiles?.email}
                          </p>
                          <p className="text-[10px] font-bold text-muted-foreground/60 leading-relaxed pt-2 border-t border-border/40 mt-2 line-clamp-2">
                            {selected.address || "Address Not Provided"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Verification Documents Area */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <FileText className="h-3 w-3 text-primary" /> Rider Documents
                      </h4>
                      <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest bg-emerald-500/5 text-emerald-600 border-emerald-500/10">Secure Verification</Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { label: "Driving License", url: selected.drivingLicense || selected.licenceUrl || selected.licenseUrl || selected.driving_license_url },
                        { label: "ID Proof", url: selected.profiles?.id_proof_url || selected.idProof || selected.aadhaarUrl || selected.idProofUrl || selected.id_proof_url },
                        { label: "Rider Selfie", url: selected.selfieImage || selected.selfieUrl || selected.additionalDocUrl || selected.selfie_url },
                        { label: "Payment Proof", url: selected.payment_proof_url || selected.paymentProof || selected.paymentProofUrl },
                      ].map((doc) => {
                        const hasUrl = !!doc.url && doc.url !== "null";
                        const fullUrl = hasUrl ? doc.url : null;

                        return (
                          <div key={doc.label} className="space-y-2 group min-h-[140px] flex flex-col">
                            <div className="flex items-center justify-between px-1 shrink-0">
                              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{doc.label}</span>
                              {hasUrl && (
                                <button
                                  onClick={() => fullUrl && window.open(fullUrl, '_blank')}
                                  className="text-muted-foreground hover:text-primary transition-colors p-1"
                                  title="Open in new tab"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </button>
                              )}
                            </div>

                            <div className="flex-1 min-h-[100px]">
                              {hasUrl ? (
                                <div
                                  className="relative h-full w-full rounded-2xl overflow-hidden border border-border bg-card shadow-sm cursor-pointer hover:border-primary hover:shadow-glow transition-all group/box"
                                  onClick={() => fullUrl && setPreviewDoc({ url: fullUrl, label: doc.label })}
                                >
                                  {fullUrl.toLowerCase().endsWith('.pdf') ? (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-muted/40 text-muted-foreground">
                                      <FileSearch className="h-10 w-10 mb-2 opacity-20" />
                                      <span className="text-[10px] font-black uppercase tracking-widest text-center">PDF DOCUMENT</span>
                                    </div>
                                  ) : (
                                    <img src={fullUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover/box:scale-110" alt={doc.label} />
                                  )}
                                  <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover/box:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                    <div className="h-10 w-10 rounded-full bg-background/90 text-primary flex items-center justify-center shadow-2xl scale-75 group-hover/box:scale-100 transition-transform duration-300">
                                      <Maximize2 className="h-5 w-5" />
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="h-full w-full rounded-2xl border-2 border-dashed border-border/40 bg-muted/20 flex flex-col items-center justify-center gap-2 opacity-60">
                                  <ImgIcon className="h-6 w-6 text-muted-foreground/20" />
                                  <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest text-center">Missing Document</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  


                </div>

                {/* Right Column: Asset + Financials */}
                <div className="space-y-8">
                  {/* Bike Card */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 px-2">
                      <LayoutGrid className="h-3 w-3 text-primary" /> Rented Asset
                    </h4>
                    <div className="p-6 rounded-[2.5rem] bg-card border border-border shadow-elegant relative overflow-hidden group hover:border-primary/20 transition-all">
                      <div className="flex items-center gap-6 relative z-10">
                        <div className="h-24 w-32 rounded-2xl overflow-hidden border border-border bg-muted/30 shadow-inner group-hover:scale-105 transition-transform shrink-0">
                          <img
                            src={selected.bikes?.image_url || "/placeholder-bike.jpg"}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="space-y-1 min-w-0">
                          <Badge className="bg-primary/10 text-primary border-primary/20 text-[8px] font-black uppercase px-2 mb-2">
                            {selected.bikes?.category}
                          </Badge>
                          <p className="text-xl font-black text-foreground leading-none truncate">{selected.bikes?.bike_name || `${selected.bikes?.brand} ${selected.bikes?.model || ""}`}</p>
                          <p className="text-xs font-bold text-muted-foreground mt-1">₹{selected.bikes?.daily_rate}/day Base Rate</p>
                        </div>
                      </div>
                      <div className="mt-6 grid grid-cols-2 gap-3 relative z-10">
                        <div className="p-3 rounded-xl bg-muted/30 border border-border/40 flex flex-col gap-1">
                          <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Pickup</span>
                          <span className="text-[10px] font-black text-foreground flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-primary" />
                            {formatISTDate(selected.start_date)}
                          </span>
                        </div>
                        <div className="p-3 rounded-xl bg-muted/30 border border-border/40 flex flex-col gap-1">
                          <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Return</span>
                          <span className="text-[10px] font-black text-foreground flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-primary" />
                            {formatISTDate(selected.end_date)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Financial Summary */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 px-2">
                      <CreditCard className="h-3 w-3 text-primary" /> Financial Audit
                    </h4>
                    <div className="p-8 rounded-[2.5rem] bg-gradient-brand text-primary-foreground shadow-glow relative overflow-hidden">
                      <ShieldCheck className="absolute -right-4 -bottom-4 h-32 w-32 opacity-10" />
                      <div className="space-y-3 relative z-10">
                        <div className="flex justify-between items-center text-xs opacity-80 font-bold border-b border-white/10 pb-2">
                          <span>Base Rental Fee</span>
                          <span>₹{selected.total_price?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs opacity-80 font-bold border-b border-white/10 pb-2">
                          <span>Security Deposit</span>
                          <span>₹{selected.bikes?.security_deposit?.toLocaleString() || "1000"}</span>
                        </div>
                        <div className="flex justify-between items-center pt-4">
                          <span className="text-sm font-black uppercase tracking-widest">Gross Total</span>
                          <span className="text-3xl font-black">₹{selected.total_price?.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions - Fixed */}
            <div className="p-8 border-t border-border shrink-0 bg-muted/10">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    className="rounded-xl border-border h-12 px-6 font-black text-[10px] uppercase tracking-widest hover:bg-muted text-muted-foreground transition-all"
                    onClick={() => setSelected(null)}
                  >
                    Dismiss Detail
                  </Button>
                  <Button
                    variant="ghost"
                    className="rounded-xl text-destructive h-12 w-12 p-0 hover:bg-destructive/10 transition-all border border-transparent hover:border-destructive/20"
                    onClick={() => {
                      if (window.confirm("Permanently purge this record?")) {
                        doAction(selected.id, "delete");
                        setSelected(null);
                      }
                    }}
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    className="rounded-xl border-border h-12 px-8 font-black text-[10px] uppercase tracking-widest text-amber-500 hover:bg-amber-500/10 hover:border-amber-500/30 transition-all gap-2"
                    onClick={() => {
                      doAction(selected.id, "update", { status: "cancelled" });
                      setSelected(null);
                    }}
                    disabled={!!actionLoading}
                  >
                    <X className="h-4 w-4" /> Cancel Booking
                  </Button>
                  {selected.status?.toLowerCase() === 'confirmed' ? (
                    <Button
                      className="rounded-xl bg-blue-500 text-white shadow-[0_10px_20px_-10px_rgba(59,130,246,0.5)] h-12 px-10 font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all gap-2"
                      onClick={() => {
                        doAction(selected.id, "update", { status: "completed" });
                        setSelected(null);
                      }}
                      disabled={!!actionLoading}
                    >
                      <Check className="h-5 w-5" /> Complete Ride
                    </Button>
                  ) : (
                    <Button
                      className="rounded-xl bg-emerald-500 text-white shadow-[0_10px_20px_-10px_rgba(16,185,129,0.5)] h-12 px-10 font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all gap-2"
                      onClick={() => {
                        doAction(selected.id, "update", { status: "confirmed" });
                        setSelected(null);
                      }}
                      disabled={!!actionLoading}
                    >
                      <Check className="h-5 w-5" /> Approve Booking
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>

    {/* Modern Document Preview Modal */}
    <Dialog open={!!previewDoc} onOpenChange={(open) => !open && setPreviewDoc(null)}>
      <DialogContent className="max-w-5xl h-[90vh] p-0 overflow-hidden bg-background/95 backdrop-blur-xl border-border/60 shadow-2xl rounded-[2.5rem]">
        {previewDoc && (
          <div className="flex flex-col h-full relative">
            <div className="p-6 border-b border-border/40 flex items-center justify-between bg-card/50">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <FileSearch className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg leading-none">{previewDoc.label}</h3>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">High-Res System Preview</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="rounded-xl border-border hover:bg-muted font-black text-[10px] uppercase tracking-widest gap-2"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = previewDoc.url;
                    link.download = `CampusRide_${previewDoc.label.replace(/\s+/g, '_')}`;
                    link.click();
                  }}
                >
                  <Download className="h-4 w-4 text-primary" /> Download
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-xl hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500"
                  onClick={() => setPreviewDoc(null)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="flex-1 bg-black/5 flex items-center justify-center p-4 sm:p-10 overflow-hidden">
              <div className="w-full h-full rounded-2xl overflow-hidden border border-border shadow-2xl bg-card">
                {previewDoc.url.toLowerCase().endsWith('.pdf') ? (
                  <iframe
                    src={`${previewDoc.url}#toolbar=0`}
                    className="w-full h-full border-none"
                    title={previewDoc.label}
                  />
                ) : (
                  <div className="w-full h-full relative overflow-auto custom-scrollbar flex items-center justify-center bg-black/40">
                    <img
                      src={previewDoc.url}
                      className="max-w-full max-h-full object-contain shadow-2xl"
                      alt={previewDoc.label}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full bg-background/80 backdrop-blur-md border border-border shadow-2xl flex items-center gap-6 opacity-0 hover:opacity-100 transition-opacity">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">End-to-End Encrypted Access</p>
              <div className="h-4 w-px bg-border" />
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  </div>
);
}
