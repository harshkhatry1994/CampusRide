import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard,
  Bike as BikeIcon,
  ReceiptText,
  Users,
  LogOut,
  Menu,
  X,
  Shield,
  ChevronRight,
  Bell,
  Gift,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/context/AuthContext";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminBikes } from "@/components/admin/AdminBikes";
import { AdminBookings } from "@/components/admin/AdminBookings";
import { AdminUsers } from "@/components/admin/AdminUsers";
import { AdminRewards } from "@/components/admin/AdminRewards";
import { AdminApprovals } from "@/components/admin/AdminApprovals";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Panel — CampusRide" }] }),
  component: AdminPage,
});

type Section = "dashboard" | "bikes" | "bookings" | "users" | "rewards" | "approvals";

const NAV_ITEMS: { id: Section; label: string; icon: React.ReactNode; badge?: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { id: "approvals", label: "Approvals", icon: <CheckCircle2 className="h-4 w-4" /> },
  { id: "bikes", label: "Bike Inventory", icon: <BikeIcon className="h-4 w-4" /> },
  { id: "bookings", label: "User Bookings", icon: <ReceiptText className="h-4 w-4" /> },
  { id: "users", label: "Customers", icon: <Users className="h-4 w-4" /> },
  { id: "rewards", label: "Coupons & Rewards", icon: <Gift className="h-4 w-4" /> },
];

function AdminPage() {
  const { user, token, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const [section, setSection] = useState<Section>("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const fetchPendingCount = useCallback(async () => {
    if (!token) return;
    try {
      const [mRes, bRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/membership/admin/requests`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${import.meta.env.VITE_API_URL}/api/admin/bookings?status=pending`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      const mData = await mRes.json();
      const bData = await bRes.json();
      const count =
        (mData.data?.length || 0) +
        (bData.data?.filter((b: any) => b.status === "pending").length || 0);
      setPendingCount(count);
    } catch (err) {
      console.error("Count sync failed", err);
    }
  }, [token]);

  useEffect(() => {
    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 30000); // Sync every 30s
    return () => clearInterval(interval);
  }, [fetchPendingCount]);

  const navItems = NAV_ITEMS.map((item) => {
    if (item.id === "approvals") {
      return { ...item, badge: pendingCount > 0 ? pendingCount.toString() : undefined };
    }
    return item;
  });

  useEffect(() => {
    if (!isLoading) {
      if (!token) {
        navigate({ to: "/login" });
        return;
      }
      if (user?.role !== "admin") {
        toast.error("Access denied. Admins only.");
        navigate({ to: "/dashboard" });
      }
    }
  }, [token, user, isLoading]);

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">Verifying access...</p>
        </div>
      </div>
    );

  if (!token || user?.role !== "admin") return null;

  const handleLogout = () => {
    logout();
    navigate({ to: "/" });
  };

  const SidebarContent = ({ onNav }: { onNav?: () => void }) => (
    <div className="flex flex-col h-full bg-card dark:bg-transparent transition-colors">
      {/* Logo */}
      <div className="p-6 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-brand shadow-glow flex items-center justify-center flex-shrink-0">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-foreground text-sm leading-tight">CampusRide</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
              Admin Console
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setSection(item.id);
              onNav?.();
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group
              ${
                section === item.id
                  ? "bg-primary text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
          >
            <span
              className={
                section === item.id ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
              }
            >
              {item.icon}
            </span>
            <span className="flex-1 text-left">{item.label}</span>
            {section === item.id && <ChevronRight className="h-3.5 w-3.5 opacity-60" />}
            {item.badge && (
              <Badge className={cn(
                "text-[10px] px-1.5 py-0",
                section === item.id ? "bg-white/20 text-white" : "bg-primary/10 text-primary border-primary/20"
              )}>
                {item.badge}
              </Badge>
            )}
          </button>
        ))}
      </nav>

      {/* Admin User Footer */}
      <div className="p-4 border-t border-border/40">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-foreground text-xs font-semibold truncate">{user?.name}</p>
            <p className="text-muted-foreground text-[10px] truncate">{user?.email}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 text-xs"
          onClick={handleLogout}
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Desktop Sidebar */}
      <aside
        className="hidden lg:flex flex-col w-64 flex-shrink-0 border-r border-border/40 bg-card dark:admin-sidebar"
      >
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 h-16 flex items-center justify-between px-4 sm:px-6 border-b border-border/40 bg-background/95 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            {/* Mobile Menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-64 p-0 border-r border-border/40 bg-card dark:admin-sidebar"
              >
                <SidebarContent onNav={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>

            <div>
              <h1 className="font-bold text-base leading-none">
                {NAV_ITEMS.find((n) => n.id === section)?.label}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
                CampusRide Admin Console
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/60 bg-muted/20">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {user?.name}
              </span>
              <Badge
                variant="secondary"
                className="text-[10px] uppercase tracking-widest px-1.5 py-0"
              >
                admin
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 hidden sm:flex"
              onClick={handleLogout}
            >
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          {section === "dashboard" && <AdminDashboard />}
          {section === "bikes" && <AdminBikes />}
          {section === "bookings" && <AdminBookings onCountChange={fetchPendingCount} />}
          {section === "users" && <AdminUsers />}
          {section === "rewards" && <AdminRewards />}
          {section === "approvals" && <AdminApprovals onCountChange={fetchPendingCount} />}
        </main>
      </div>
    </div>
  );
}
