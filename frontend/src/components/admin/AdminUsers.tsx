import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Search,
  Loader2,
  User,
  ShieldCheck,
  Mail,
  Eye,
  Calendar,
  Phone,
  Zap,
  LogIn,
  ExternalLink,
  Shield,
  ShieldAlert,
  UserX,
  UserCheck,
  Trash2,
  RefreshCw,
  Users,
  Filter,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const API_URL = import.meta.env.VITE_API_URL;

export function AdminUsers() {
  const { token } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userBookings, setUserBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = search.trim() ? `?search=${encodeURIComponent(search)}` : "";
      const res = await fetch(`${API_URL}/api/admin/users${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setUsers(data.data);
      else toast.error(data.message || "Failed to load users");
    } catch {
      toast.error("Connection error");
    } finally {
      setLoading(false);
    }
  }, [token, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const openProfile = async (user: any) => {
    setSelectedUser(user);
    setLoadingBookings(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setUserBookings(data.data.filter((b: any) => (b.user?._id || b.user) === user._id));
      }
    } catch (err) {
      console.error("Failed to load user bookings", err);
    } finally {
      setLoadingBookings(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    setActionLoading(id);
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Rider ${!currentStatus ? "activated" : "suspended"}`);
        fetchUsers();
        if (selectedUser?._id === id)
          setSelectedUser({ ...selectedUser, isActive: !currentStatus });
      } else {
        toast.error(data.message || "Action failed");
      }
    } catch {
      toast.error("Connection error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this user? This action cannot be undone.")) return;
    setActionLoading(id);
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success("User removed from system");
        fetchUsers();
        if (selectedUser?._id === id) setSelectedUser(null);
      } else {
        toast.error(data.message || "Failed to delete user");
      }
    } catch {
      toast.error("Connection error");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="bg-background text-foreground p-4 sm:p-8 space-y-8 transition-colors duration-300">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-2">
          <h2 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            Network <span className="text-primary">Riders</span>
          </h2>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-2">
            <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-2 py-0.5 rounded-md border border-primary/20">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              {users.length} IDENTITIES FOUND
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          <Button
            variant="outline"
            onClick={() => {
              toast.promise(fetchUsers(), {
                loading: "Syncing identities...",
                success: "Database updated",
                error: "Sync failed",
              });
            }}
            disabled={loading}
            className="rounded-2xl border-border bg-card text-muted-foreground font-bold text-xs gap-2 h-12 px-6 hover:bg-muted hover:text-foreground transition-all shadow-sm"
          >
            <RefreshCw className={cn("h-4 w-4 text-primary", loading && "animate-spin")} />
            FORCE SYNC
          </Button>
        </div>
      </div>

      {/* Search Bar Section */}
      <div className="relative max-w-2xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search by rider name, email, phone or identity hash..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-12 h-14 bg-card border-border rounded-[1.25rem] text-foreground placeholder:text-muted-foreground focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
        />
      </div>

      {/* Main Table Container */}
      <div className="bg-card border border-border rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30 border-b border-border">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-6 h-14">Rider Profile</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-6 h-14">Auth & Trust</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-6 h-14">Joined Date</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-6 h-14">Account Type</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-6 h-14">Network Status</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-6 h-14 text-right">Control</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="animate-pulse border-b border-border/40">
                    <TableCell colSpan={6} className="h-20 bg-muted/10" />
                  </TableRow>
                ))
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-[400px] text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center">
                        <Filter className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xl font-black text-muted-foreground">No riders found</p>
                        <p className="text-sm text-muted-foreground">Try adjusting your search criteria</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => (
                  <TableRow 
                    key={u._id} 
                    className="border-b border-border/40 hover:bg-muted/10 transition-colors group cursor-pointer"
                    onClick={() => openProfile(u)}
                  >
                    <TableCell className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-muted border border-border flex items-center justify-center overflow-hidden shadow-inner">
                          {u.avatar ? (
                            <img src={u.avatar} className="w-full h-full object-cover" alt="" />
                          ) : (
                            <User className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-black text-sm text-foreground group-hover:text-primary transition-colors">{u.name}</p>
                          <p className="text-[10px] font-bold text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-5">
                      {u.googleId ? (
                        <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 rounded-lg font-black text-[9px] uppercase tracking-widest gap-1.5 px-2">
                          <LogIn className="h-3 w-3" /> Google Verified
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-blue-600 dark:text-blue-400 border-blue-500/20 bg-blue-500/10 rounded-lg font-black text-[9px] uppercase tracking-widest px-2">
                          Email Secured
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="px-6 py-5">
                      <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                        <Calendar className="h-3 w-3 text-primary" />
                        {new Date(u.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-5">
                      <Badge className={cn(
                        "rounded-lg font-black text-[9px] uppercase tracking-widest px-2",
                        u.role === "admin" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      )}>
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className={cn("h-2 w-2 rounded-full", u.isActive ? "bg-emerald-500" : "bg-rose-500")} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          {u.isActive ? "Active" : "Suspended"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => { e.stopPropagation(); openProfile(u); }}
                          className="h-10 w-10 rounded-xl hover:bg-primary hover:text-primary-foreground text-primary bg-primary/5 border border-primary/10 transition-all shadow-sm"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "h-10 w-10 rounded-xl transition-all shadow-sm border",
                            u.isActive 
                              ? "text-destructive bg-destructive/5 border-destructive/10 hover:bg-destructive hover:text-destructive-foreground" 
                              : "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/5 border-emerald-100 dark:border-emerald-500/10 hover:bg-emerald-600 hover:text-white"
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleStatus(u._id, u.isActive);
                          }}
                          disabled={actionLoading === u._id}
                        >
                          {actionLoading === u._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : u.isActive ? (
                            <ShieldAlert className="h-4 w-4" />
                          ) : (
                            <ShieldCheck className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={actionLoading === u._id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(u._id);
                          }}
                          className="h-10 w-10 rounded-xl hover:bg-destructive hover:text-destructive-foreground text-destructive bg-destructive/5 border border-destructive/10 transition-all shadow-sm"
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Profile Detail Modal - THEME AWARE */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] border-border shadow-2xl p-0 overflow-hidden bg-card text-foreground">
          {selectedUser && (
            <div className="flex flex-col">
              {/* Cover & Profile Header */}
              <div className="h-40 bg-muted/30 relative border-b border-border">
                <div className="absolute -bottom-12 left-10">
                  <div className="h-28 w-28 rounded-[2rem] bg-card p-2 shadow-2xl">
                    <div className="h-full w-full rounded-[1.5rem] bg-muted flex items-center justify-center overflow-hidden border border-border shadow-inner">
                      {selectedUser.avatar ? (
                        <img src={selectedUser.avatar} className="w-full h-full object-cover" />
                      ) : (
                        <User className="h-12 w-12 text-muted-foreground/30" />
                      )}
                    </div>
                  </div>
                </div>
                <div className="absolute top-8 right-10 flex gap-3">
                  <Badge className={cn(
                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border",
                    selectedUser.isActive ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-destructive/10 text-destructive border-destructive/20"
                  )}>
                    {selectedUser.isActive ? "Network Active" : "Access Denied"}
                  </Badge>
                  {selectedUser.googleId && (
                    <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">
                      Google SSO Verified
                    </Badge>
                  )}
                </div>
              </div>

              <div className="pt-20 p-10 space-y-10">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
                  <div className="space-y-1">
                    <h3 className="text-4xl font-black text-foreground tracking-tight flex items-center gap-4">
                      {selectedUser.name}
                      {selectedUser.role === "admin" && <Shield className="h-6 w-6 text-primary" />}
                    </h3>
                    <div className="flex flex-wrap gap-x-8 gap-y-3 mt-4">
                      <p className="text-muted-foreground font-bold text-sm flex items-center gap-2.5">
                        <Mail className="h-4 w-4 text-primary" /> {selectedUser.email}
                      </p>
                      {selectedUser.phone && (
                        <p className="text-muted-foreground font-bold text-sm flex items-center gap-2.5">
                          <Phone className="h-4 w-4 text-primary" /> {selectedUser.phone}
                        </p>
                      )}
                      <p className="text-muted-foreground font-bold text-sm flex items-center gap-2.5">
                        <Calendar className="h-4 w-4 text-primary" /> Member since {new Date(selectedUser.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => toggleStatus(selectedUser._id, selectedUser.isActive)}
                      disabled={actionLoading === selectedUser._id}
                      className={cn(
                        "h-14 px-8 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl",
                        selectedUser.isActive 
                          ? "bg-muted text-destructive hover:bg-muted/80 border border-border" 
                          : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/20"
                      )}
                    >
                      {actionLoading === selectedUser._id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : selectedUser.isActive ? (
                        <UserX className="h-4 w-4 mr-2" />
                      ) : (
                        <UserCheck className="h-4 w-4 mr-2" />
                      )}
                      {selectedUser.isActive ? "Suspend Access" : "Grant Access"}
                    </Button>
                  </div>
                </div>

                {/* Activity History Section */}
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground flex items-center gap-3 border-b border-border pb-4">
                    <Zap className="h-4 w-4 text-primary" /> Rider Transaction Log
                  </h4>
                  {loadingBookings ? (
                    <div className="py-20 text-center">
                      <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary/30" />
                    </div>
                  ) : userBookings.length === 0 ? (
                    <div className="py-16 text-center rounded-[2.5rem] border-2 border-dashed border-border bg-muted/20">
                      <p className="text-muted-foreground font-bold text-base">No ride transactions recorded for this profile.</p>
                    </div>
                  ) : (
                    <div className="grid gap-6 sm:grid-cols-2">
                      {userBookings.map((b) => (
                        <div key={b._id} className="p-8 rounded-[2.5rem] bg-card border border-border shadow-sm group hover:border-primary/30 transition-all">
                          <div className="flex justify-between items-start mb-6">
                            <span className="font-mono text-xs font-black text-primary">#{b.bookingId}</span>
                            <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-border bg-muted text-muted-foreground">
                              {b.status}
                            </Badge>
                          </div>
                          <p className="text-lg font-black text-foreground">{b.bike?.brand} {b.bike?.model}</p>
                          <p className="text-[11px] font-bold text-muted-foreground uppercase mt-2">
                            {new Date(b.startDate).toLocaleDateString()} — {new Date(b.endDate).toLocaleDateString()}
                          </p>
                          <div className="mt-6 flex items-center justify-between pt-6 border-t border-border">
                            <span className="text-base font-black text-primary">₹{b.pricing?.totalAmount?.toLocaleString()}</span>
                            <Button variant="ghost" size="sm" className="h-9 rounded-xl text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all">
                              View Details <ExternalLink className="h-3 w-3 ml-2" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
