import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Bike as BikeIcon,
  Calendar,
  Clock,
  MapPin,
  ChevronRight,
  User as UserIcon,
  TrendingUp,
  BarChart3,
  AlertCircle,
  IndianRupee,
  Zap,
  Gift,
  Trophy,
  Award,
  Crown,
  ArrowRight,
  Download,
  MessageCircle,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Sparkles,
  Eye,
  Star,
  FileText,
  Printer,
  Loader2,
  UserCircle,
  Settings,
  Bell,
  PenLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { generateReceipt } from "@/lib/receipt";
import { cn } from "@/lib/utils";
import { ProfileView } from "@/components/dashboard/ProfileView";
import { SettingsView } from "@/components/dashboard/SettingsView";
import { NotificationsView } from "@/components/dashboard/NotificationsView";
import { ReviewModal } from "@/components/reviews/ReviewModal";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { RatingStars } from "@/components/reviews/RatingStars";

export const Route = createFileRoute("/dashboard")({
  validateSearch: (search: Record<string, unknown>): { tab?: string } => {
    return {
      tab: (search.tab as string) || undefined,
    };
  },
  head: () => ({ meta: [{ title: "My Dashboard — CampusRide" }] }),
  component: Dashboard,
});

const API_URL = import.meta.env.VITE_API_URL;

function Dashboard() {
  const { user, token, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const activeTab = search.tab || "my-rides";

  const handleTabChange = (val: string) => {
    navigate({ to: "/dashboard", search: { tab: val }, replace: true });
  };

  useEffect(() => {
    if (!token) {
      navigate({ to: "/login" });
      return;
    }

    // Admin users go to dedicated admin panel
    if (isAdmin) {
      navigate({ to: "/admin" });
      return;
    }

    if (!user) {
      return;
    }

    const userId = user.id;

    async function loadBookings() {
      const { data, error } = await supabase
        .from("rentals")
        .select("*, bikes(*), ride_reviews(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        toast.error("Failed to load your rides");
      } else if (data) {
        setBookings(data || []);
      }
      setLoading(false);
    }
    loadBookings();

    // Realtime subscription: auto-refresh when admin updates rental status
    const channel = supabase
      .channel("dashboard-rentals")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rentals",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          loadBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [token, isAdmin, navigate, user]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-muted-foreground font-medium">Loading your dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 bg-background text-foreground transition-colors duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-5">
          <div className="h-20 w-20 rounded-3xl bg-gradient-brand shadow-glow flex items-center justify-center flex-shrink-0">
            <UserIcon className="h-10 w-10 text-primary-foreground" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl font-bold tracking-tight">Hello, {user?.name}</h1>
              <Badge variant="secondary" className="uppercase tracking-widest text-[10px] bg-primary/10 text-primary border-primary/20">
                {user?.role}
              </Badge>
            </div>
            <p className="text-muted-foreground font-medium">
              Manage your rides and account settings.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="lg" className="rounded-2xl" onClick={() => logout()}>
            Logout
          </Button>
          <Button
            className="bg-gradient-brand text-primary-foreground shadow-glow rounded-2xl px-8"
            asChild
          >
            <Link to="/bikes">Find a Bike</Link>
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="inline-flex w-auto bg-muted/50 border border-border/40 p-1 mb-8">
          <TabsTrigger value="my-rides" className="gap-2 px-6">
            <BikeIcon className="h-4 w-4" /> My Bookings
          </TabsTrigger>
          <TabsTrigger value="rewards" className="gap-2 px-6">
            <Trophy className="h-4 w-4" /> Rewards
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-2 px-6">
            <BarChart3 className="h-4 w-4" /> Activity
          </TabsTrigger>
          <TabsTrigger value="profile" className="gap-2 px-6">
            <UserCircle className="h-4 w-4" /> Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2 px-6">
            <Bell className="h-4 w-4" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="reviews" className="gap-2 px-6">
            <Star className="h-4 w-4" /> My Reviews
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2 px-6">
            <Settings className="h-4 w-4" /> Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-rides" className="mt-0 focus-visible:outline-none">
          <div className="grid gap-6">
            <Tabs defaultValue="upcoming" className="w-full">
              <TabsList className="inline-flex w-auto bg-muted/50 border border-border/40 p-1 mb-6">
                <TabsTrigger value="upcoming" className="px-6 font-bold">Upcoming</TabsTrigger>
                <TabsTrigger value="completed" className="px-6 font-bold">Completed</TabsTrigger>
                <TabsTrigger value="cancelled" className="px-6 font-bold">Cancelled</TabsTrigger>
              </TabsList>
              
              {["upcoming", "completed", "cancelled"].map((tab) => {
                const filteredBookings = bookings.filter(b => {
                  const s = (b.status || '').toLowerCase().trim();
                  if (tab === "upcoming") return ['pending', 'confirmed', 'draft', 'payment_pending'].includes(s);
                  if (tab === "completed") return s === 'completed';
                  return s === 'cancelled' || s === 'rejected';
                });

                return (
                  <TabsContent key={tab} value={tab} className="mt-0 focus-visible:outline-none">
                    {filteredBookings.length === 0 ? (
                      <div className="text-center py-20 bg-card border border-dashed border-border/60 rounded-[2rem]">
                        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                        <h3 className="text-lg font-bold mb-2">No {tab} rides</h3>
                        <p className="text-muted-foreground mb-6">You don't have any {tab} bookings.</p>
                        {tab === "upcoming" && (
                          <Button variant="outline" className="rounded-xl" asChild>
                            <Link to="/bikes">Book a ride</Link>
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                        {filteredBookings.map((b) => (
                          <RideCard key={b.id} booking={b} onBookingUpdate={(updated: any) => {
                            setBookings(prev => prev.map(bk => bk.id === updated.id ? updated : bk));
                          }} />
                        ))}
                      </div>
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>
          </div>
        </TabsContent>

        <TabsContent value="rewards" className="mt-0 focus-visible:outline-none">
          <RewardsTab bookings={bookings} />
        </TabsContent>

        <TabsContent value="stats" className="mt-0 focus-visible:outline-none">
          <ActivityTab bookings={bookings} />
        </TabsContent>

        <TabsContent value="profile" className="mt-0 focus-visible:outline-none">
          <ProfileView />
        </TabsContent>

        <TabsContent value="notifications" className="mt-0 focus-visible:outline-none">
          <NotificationsView />
        </TabsContent>

        <TabsContent value="reviews" className="mt-0 focus-visible:outline-none">
          <MyReviewsTab />
        </TabsContent>

        <TabsContent value="settings" className="mt-0 focus-visible:outline-none">
          <SettingsView />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MyReviewsTab() {
  const { token } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    async function load() {
      if (!token) return;
      const { reviewService } = await import("@/services/reviewService");
      const res = await reviewService.getMyReviews(token);
      if (res.success) setReviews(res.data || []);
      setLoading(false);
    }
    load();
  }, [token]);

  const handleEditSuccess = (updated: any) => {
    setReviews((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  };

  if (loading)
    return (
      <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading your reviews...
      </div>
    );

  if (reviews.length === 0)
    return (
      <div className="text-center py-20 bg-card border border-dashed border-border/60 rounded-[2rem]">
        <div className="flex justify-center gap-0.5 mb-4">
          {[1,2,3,4,5].map(s => <Star key={s} className="h-7 w-7 text-muted-foreground/20" />)}
        </div>
        <h3 className="text-lg font-bold mb-2">No reviews yet</h3>
        <p className="text-muted-foreground text-sm">
          Complete a ride and rate it to see your reviews here.
        </p>
      </div>
    );

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-black">My Reviews</h2>
      <div className="grid gap-5 md:grid-cols-2">
        {reviews.map((r) => (
          <div key={r.id} className="space-y-3">
            {/* Bike header */}
            {r.bikes && (
              <div className="flex items-center gap-3 px-1">
                <div className="h-10 w-12 rounded-xl bg-muted/40 border border-border/40 overflow-hidden shrink-0">
                  {r.bikes.image_url ? (
                    <img src={r.bikes.image_url} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BikeIcon className="h-4 w-4 text-muted-foreground/40" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm truncate">{r.bikes.bike_name || r.bikes.brand}</p>
                  <p className="text-xs text-muted-foreground">{r.bikes.brand} {r.bikes.model}</p>
                </div>
              </div>
            )}
            <ReviewCard review={r} />
            <div className="flex justify-end">
              <button
                onClick={() => { setEditTarget(r); setEditOpen(true); }}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
              >
                <PenLine className="h-3 w-3" /> Edit Review
              </button>
            </div>
          </div>
        ))}
      </div>

      {editTarget && (
        <ReviewModal
          isOpen={editOpen}
          onClose={() => setEditOpen(false)}
          rentalId={editTarget.rental_id}
          existingReview={editTarget}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}

function RideCard({ booking, onBookingUpdate }: { booking: any; onBookingUpdate: (updated: any) => void }) {
  const [showDetails, setShowDetails] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [localReview, setLocalReview] = useState<any | null>(
    Array.isArray(booking.ride_reviews) ? booking.ride_reviews[0] : (booking.ride_reviews || null)
  );

  const bike = booking.bikes || booking.bike;
  const statusLower = (booking.status || '').toLowerCase().trim();
  const hasReview = !!localReview;

  const statusColors: any = {
    draft: "bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]",
    pending: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.1)]",
    confirmed: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]",
    rejected: "bg-rose-500/10 text-rose-500 border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]",
    completed: "bg-blue-500/10 text-blue-500 border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]",
    cancelled: "bg-muted/50 text-muted-foreground border-border/40",
  };

  const handleReviewSuccess = (reviewData: any) => {
    // Optimistic update — no page refresh needed
    setLocalReview(reviewData);
    onBookingUpdate({
      ...booking,
      ride_reviews: [reviewData],
    });
  };

  return (
    <>
      <div className="group p-5 rounded-3xl bg-card border border-border/60 shadow-elegant hover:border-primary/40 transition-all hover:-translate-y-1">
        <div className="flex justify-between items-start mb-4">
          <Badge
            className={cn(
              "capitalize px-3 py-0.5 rounded-full border",
              statusColors[statusLower] || "bg-muted text-muted-foreground border-border/40"
            )}
          >
            {booking.status}
          </Badge>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            ID: {booking.id?.split('-')[0]}
          </span>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="h-16 w-20 rounded-2xl bg-muted/30 border border-border/40 overflow-hidden shrink-0">
            {bike?.image_url ? (
              <img
                src={bike.image_url.startsWith("http") ? bike.image_url : `${API_URL}${bike.image_url}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BikeIcon className="h-8 w-8 text-muted-foreground/30" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold leading-tight truncate">{bike?.bike_name || bike?.brand}</h3>
            <p className="text-xs text-muted-foreground truncate">
              {bike?.brand} {bike?.model}
            </p>
            {/* Show star rating inline if already reviewed */}
            {hasReview && (
              <div className="flex items-center gap-0.5 mt-1">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} className={cn("h-3 w-3", s <= localReview.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")} />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            {new Date(booking.start_date).toLocaleDateString()} -{" "}
            {new Date(booking.end_date).toLocaleDateString()}
          </div>
          <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground">
            <Clock className="h-3.5 w-3.5 text-primary" />
            {new Date(booking.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (Pickup)
          </div>
        </div>

        <div className="pt-4 border-t border-border/40 flex items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            {['draft', 'payment_pending', 'incomplete'].includes(statusLower) ? (
              <Link to="/booking/$bikeId" params={{ bikeId: bike?.id || 'unknown' }} search={{ bookingId: booking.id }}>
                <Button
                  size="sm"
                  variant="default"
                  className="h-8 px-3 text-[10px] font-black uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg shadow-glow"
                >
                  <ArrowRight className="h-3.5 w-3.5 mr-1" /> Resume Application
                </Button>
              </Link>
            ) : statusLower === 'pending' ? (
              <Badge variant="outline" className="h-8 px-3 text-[10px] font-black uppercase tracking-widest bg-indigo-500/10 text-indigo-500 border-indigo-500/20">
                <Clock className="h-3 w-3 mr-1.5" /> Waiting for Admin
              </Badge>
            ) : (
              <>
                <Link to="/receipt/$bookingId" params={{ bookingId: booking.id }}>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-3 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/10 rounded-lg"
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" /> View
                  </Button>
                </Link>

                {/* Rate Ride / Edit Review button — only for completed status */}
                {statusLower === 'completed' && (
                  hasReview ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-3 text-[10px] font-black uppercase tracking-widest text-amber-500 hover:bg-amber-500/10 rounded-lg gap-1"
                      onClick={() => setReviewOpen(true)}
                    >
                      <div className="flex items-center mr-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={cn("h-3 w-3", s <= localReview.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")} />
                        ))}
                      </div>
                      Edit Review
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-3 text-[10px] font-black uppercase tracking-widest text-amber-500 hover:bg-amber-500/10 rounded-lg gap-1"
                      onClick={() => setReviewOpen(true)}
                    >
                      <Star className="h-3.5 w-3.5" /> Rate Ride
                    </Button>
                  )
                )}

                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-muted rounded-lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(`/receipt/${booking.id}`, "_blank");
                  }}
                >
                  <Download className="h-3.5 w-3.5 mr-1" /> PDF
                </Button>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest leading-none">
                Total
              </p>
              <p className="text-base font-black">
                ₹{Number(booking.total_price).toLocaleString()}
              </p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setShowDetails(true)}
              className="h-9 w-9 rounded-xl hover:bg-primary hover:text-primary-foreground transition-all"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      <ReviewModal
        isOpen={reviewOpen}
        onClose={() => setReviewOpen(false)}
        rentalId={booking.id}
        existingReview={localReview}
        onSuccess={handleReviewSuccess}
      />

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:rounded-[2.5rem] p-0 border-none bg-background shadow-2xl">
          <div className="bg-gradient-brand h-32 relative overflow-hidden">
            <Sparkles className="absolute right-[-20px] top-[-20px] h-40 w-40 opacity-20 text-white" />
            <div className="absolute bottom-6 left-8">
              <h2 className="text-3xl font-black text-white">Ride Details</h2>
              <p className="text-white/80 font-medium">Booking ID: {booking.id?.split('-')[0]}</p>
            </div>
          </div>

          <div className="p-8 space-y-8">
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" /> Ride Journey
                </h3>
                <Badge
                  className={cn(
                    "rounded-full px-4 py-1 animate-pulse border",
                    statusColors[statusLower],
                  )}
                >
                  {booking.status}
                </Badge>
              </div>

              <div className="relative pt-4 pb-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {[
                    {
                      label: "Booked",
                      icon: CheckCircle2,
                      milestone: "booked",
                      color: "bg-emerald-500",
                    },
                    { label: "Pickup", icon: MapPin, milestone: "picked_up", color: "bg-blue-500" },
                    {
                      label: "Riding",
                      icon: BikeIcon,
                      milestone: "on_ride",
                      color: "bg-indigo-500",
                    },
                    {
                      label: "Near End",
                      icon: Clock,
                      milestone: "near_completion",
                      color: "bg-amber-500",
                    },
                    {
                      label: "Finished",
                      icon: Trophy,
                      milestone: "completed",
                      color: "bg-purple-500",
                    },
                  ].map((step, i) => {
                    const milestones = [
                      "booked",
                      "picked_up",
                      "on_ride",
                      "near_completion",
                      "completed",
                    ];
                    const currentIndex = milestones.indexOf(booking.currentMilestone || "booked");
                    const isActive = i <= currentIndex;
                    const isCurrent = i === currentIndex;

                    return (
                      <div
                        key={i}
                        className={cn(
                          "relative group p-4 rounded-3xl border transition-all duration-500 flex flex-col items-center gap-3",
                          isActive
                            ? "bg-card border-border/60 shadow-elegant scale-100"
                            : "bg-muted/30 border-transparent opacity-40 scale-95",
                        )}
                      >
                        {isCurrent && (
                          <div className="absolute -top-2 px-3 py-0.5 rounded-full bg-primary text-[8px] font-black text-white uppercase tracking-widest animate-bounce">
                            Current
                          </div>
                        )}
                        <div
                          className={cn(
                            "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-700",
                            isActive
                              ? `${step.color} text-white shadow-lg`
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          <step.icon className="h-6 w-6" />
                        </div>
                        <div className="text-center">
                          <p
                            className={cn(
                              "text-[10px] font-black uppercase tracking-widest",
                              isActive ? "text-foreground" : "text-muted-foreground",
                            )}
                          >
                            {step.label}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">
                  Vehicle Details
                </h4>
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 border border-border/40">
                  <div className="h-12 w-16 rounded-xl bg-muted/50 border border-border/40 overflow-hidden shrink-0">
                    {bike?.image_url && (
                      <img
                        src={bike.image_url.startsWith("http") ? bike.image_url : `${API_URL}${bike.image_url}`}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div>
                    <p className="font-bold">{bike?.bike_name || bike?.brand}</p>
                    <p className="text-xs text-muted-foreground">
                      {bike?.brand} {bike?.model}
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">
                  Pickup Location
                </h4>
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 border border-border/40">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold">{bike?.pickupLocation || "Main Gate"}</p>
                    <p className="text-xs text-muted-foreground tracking-tight">
                      Campus Hub, Sector 12
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-muted/20 border border-border/40 space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-border/40">
                <h4 className="font-bold text-lg">Invoice Summary</h4>
                <Badge className={cn("border", statusColors[statusLower])}>{booking.status}</Badge>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-lg font-black pt-4 border-t border-border/40">
                  <span>Grand Total</span>
                  <span className="text-primary">₹{booking.total_price}</span>
                </div>
              </div>
            </div>

            {/* Step 3: Review section inside detail dialog */}
            {statusLower === 'completed' && (
              <div className="p-5 rounded-3xl bg-muted/20 border border-border/40 space-y-3">
                <h4 className="font-bold text-sm uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-400" /> Your Review
                </h4>
                {localReview ? (
                  <div className="space-y-3">
                    <RatingStars rating={localReview.rating} size="sm" />
                    <p className="text-sm text-foreground leading-relaxed">{localReview.review}</p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {localReview.ride_experience && (
                        <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 font-semibold border border-blue-500/20">
                          🏍️ {localReview.ride_experience}
                        </span>
                      )}
                      {localReview.bike_condition && (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 font-semibold border border-emerald-500/20">
                          {localReview.bike_condition}
                        </span>
                      )}
                      {localReview.would_recommend !== undefined && (
                        <span className={`px-2.5 py-1 rounded-full font-semibold border text-xs ${localReview.would_recommend ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
                          {localReview.would_recommend ? '👍 Recommends' : '👎 Not Recommended'}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setReviewOpen(true)}
                      className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      <PenLine className="h-3 w-3" /> Edit Review
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setReviewOpen(true)}
                    className="flex items-center gap-2 text-sm font-bold text-amber-500 hover:text-amber-400 transition-colors"
                  >
                    <Star className="h-4 w-4" /> ⭐ Leave a Review
                  </button>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 p-8 pt-0">
              <Link to="/receipt/$bookingId" params={{ bookingId: booking.id }} className="flex-1">
                <Button className="w-full h-14 rounded-2xl gap-2 font-bold bg-foreground text-background hover:bg-foreground/90">
                  <Eye className="h-5 w-5" /> View Receipt
                </Button>
              </Link>
              <Button
                onClick={() => window.open(`/receipt/${booking.id}?download=true`, "_blank")}
                className="flex-1 h-14 rounded-2xl gap-2 font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow"
              >
                <Download className="h-5 w-5" /> Download PDF
              </Button>
              <Button
                variant="outline"
                className="h-14 w-14 rounded-2xl p-0 border-border/40"
                onClick={() => window.open(`/receipt/${booking.id}?print=true`, "_blank")}
              >
                <Printer className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                className="h-14 w-14 rounded-2xl p-0 border-border/40"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: "CampusRide Receipt",
                      url: window.location.origin + `/receipt/${booking.id}`,
                    });
                  } else {
                    navigator.clipboard.writeText(
                      window.location.origin + `/receipt/${booking.id}`,
                    );
                    toast.success("Link copied!");
                  }
                }}
              >
                <Zap className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-8 pt-0">
              <Button
                onClick={() => toast.info("Connecting to live support...")}
                className="w-full h-14 rounded-2xl gap-2 font-bold bg-gradient-brand text-primary-foreground shadow-glow"
              >
                <MessageCircle className="h-5 w-5" /> Contact Support
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ActivityTab({ bookings }: any) {
  const { user } = useAuth();
  
  const activeAndCompletedBookings = bookings.filter((b: any) => {
    const s = b.status?.toLowerCase() || '';
    return ['completed', 'pending', 'payment_pending', 'draft', 'incomplete', 'confirmed', 'accepted', 'upcoming', 'scheduled', 'reserved', 'booked', 'in_progress'].includes(s);
  });
  const completedBookings = bookings.filter((b: any) => {
    const s = b.status?.toLowerCase() || '';
    return s === 'completed';
  });
  
  const totalSpent = completedBookings.reduce((sum: any, b: any) => sum + Number(b.total_price || 0), 0);
  const loyaltyPoints = user?.loyalty_points || 0; // Use actual profile value as requested

  // Generate last 7 days for the chart
  const last7Days = Array.from({length: 7}).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });
  
  const counts = last7Days.map(date => {
    const dateStr = date.toISOString().split('T')[0];
    return bookings.filter((b: any) => b.created_at?.startsWith(dateStr)).length; // count ALL bookings created on that day
  });
  
  const maxCount = Math.max(...counts, 1);
  const yAxisTicks = Array.from({ length: 3 }).map((_, i) => Math.round(maxCount * (2 - i) / 2));
  // Ensure unique ticks if maxCount is 1
  const uniqueTicks = Array.from(new Set(yAxisTicks)).sort((a, b) => b - a);

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <StatCard
        icon={<TrendingUp className="h-5 w-5" />}
        title="Total Rides"
        value={activeAndCompletedBookings.length}
        desc="Active + Completed"
      />
      <StatCard
        icon={<IndianRupee className="h-5 w-5" />}
        title="Money Spent"
        value={`₹${totalSpent.toLocaleString()}`}
        desc="Completed payments"
      />
      <StatCard
        icon={<Zap className="h-5 w-5" />}
        title="Loyalty Points"
        value={loyaltyPoints}
        desc="Actual profile points"
      />

      <div className="md:col-span-3 p-8 rounded-[2.5rem] bg-card border border-border/60 shadow-elegant relative overflow-hidden">
        <h3 className="text-xl font-bold mb-6 text-foreground">Booking Frequency</h3>
        <div className="flex h-64 w-full">
          {/* Y-Axis */}
          <div className="flex flex-col justify-between items-end pr-4 text-xs font-medium text-muted-foreground border-r border-border/40">
            {uniqueTicks.map((tick, i) => (
              <span key={i} className="leading-none">{tick}</span>
            ))}
          </div>
          
          {/* Chart Area */}
          <div className="flex-1 flex items-end justify-between gap-2 px-4 relative">
            {/* Horizontal Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none px-4">
              {uniqueTicks.map((_, i) => (
                <div key={i} className="w-full h-px bg-border/40" />
              ))}
            </div>
            
            {counts.map((c, i) => {
              const heightPercent = (c / Math.max(maxCount, 1)) * 100;
              const dayName = last7Days[i].toLocaleDateString('en-US', { weekday: 'short' });
              return (
                <div key={i} className="flex-1 flex flex-col justify-end items-center group relative h-full pt-6">
                  {c > 0 && (
                    <div className="absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity bg-foreground text-background text-[10px] font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap z-10">
                      {c} {c === 1 ? 'booking' : 'bookings'}
                    </div>
                  )}
                  <div
                    className="w-full max-w-[40px] bg-amber-500/80 hover:bg-amber-500 transition-all rounded-t-sm z-0"
                    style={{ height: `${heightPercent}%`, minHeight: c > 0 ? '4px' : '0' }}
                  />
                  <div className="text-[10px] text-foreground font-bold mt-2 text-center uppercase tracking-tighter w-full border-t border-border/40 pt-2">
                    {dayName}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function RewardsTab({ bookings }: any) {
  const { user } = useAuth();
  const isPremium = user?.is_premium === true;

  // Smart Logic: Only count completed rides for loyalty
  const completedRides = bookings.filter((b: any) => {
    const s = (b.status || '').toLowerCase().trim();
    return s === "completed";
  }).length;

  // Smart Multiplier: Premium members get 2x progression
  const effectiveRides = isPremium ? completedRides * 2 : completedRides;

  const nextMilestone =
    effectiveRides < 3 ? 3 : effectiveRides < 5 ? 5 : effectiveRides < 10 ? 10 : 20;
  const progress = Math.min((effectiveRides / nextMilestone) * 100, 100);
  const remaining = Math.max(nextMilestone - effectiveRides, 0);

  return (
    <div className="space-y-8">
      {/* Milestone Header */}
      <div className="p-8 sm:p-10 rounded-[3rem] bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-background border border-indigo-500/20 shadow-glow relative overflow-hidden">
        <Sparkles className="absolute right-[-20px] top-[-20px] h-48 w-48 opacity-10 text-indigo-500" />
        <div className="grid md:grid-cols-2 gap-10 items-center relative z-10">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Badge className="bg-indigo-500/10 text-indigo-500 border-indigo-500/20 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                Loyalty Rewards
              </Badge>
              {isPremium && (
                <Badge className="bg-gradient-premium-gold text-white border-none px-3 py-1 rounded-full text-[10px] font-black animate-pulse">
                  2X MULTIPLIER ACTIVE
                </Badge>
              )}
            </div>
            <h2 className="text-4xl font-black tracking-tight leading-none">
              {remaining === 0 ? (
                "All Milestones Reached! 🎉"
              ) : (
                <>
                  Complete{" "}
                  <span className="text-indigo-500">
                    {Math.ceil(isPremium ? remaining / 2 : remaining)}
                  </span>{" "}
                  more {remaining === 1 ? "ride" : "rides"} to unlock reward
                </>
              )}
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-bold">
                <span className="text-muted-foreground">Milestone Progress</span>
                <span className="text-indigo-500">
                  {effectiveRides} / {nextMilestone} Points
                </span>
              </div>
              <Progress value={progress} className="h-3 rounded-full bg-indigo-500/10" />
              <p className="text-[10px] text-muted-foreground font-semibold">
                {completedRides} Completed Rides {isPremium && "× 2 (Premium Bonus)"}
              </p>
            </div>
            <p className="text-sm text-muted-foreground font-medium italic">
              {isPremium
                ? "Exclusive Boss Benefit: You're earning rewards twice as fast! 🚀"
                : "You're one step away from VIP status 👑. Keep riding to unlock bigger discounts!"}
            </p>
          </div>
          <div className="hidden md:flex justify-center">
            <div className="h-48 w-48 rounded-full bg-indigo-500/10 border-4 border-indigo-500/20 flex items-center justify-center animate-pulse shadow-[0_0_50px_rgba(99,102,241,0.2)]">
              <Trophy className="h-24 w-24 text-indigo-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Coupons Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <RewardCard
          title="₹100 OFF"
          desc="Reached 3 Points"
          code="RIDER100"
          unlocked={effectiveRides >= 3}
          icon={<Gift className="h-6 w-6" />}
        />
        <RewardCard
          title="15% Discount"
          desc="Reached 5 Points"
          code="LEGEND15"
          unlocked={effectiveRides >= 5}
          icon={<Award className="h-6 w-6" />}
        />
        <RewardCard
          title="VIP Reward"
          desc="Reached 10 Points"
          code="CAMPUSVIP"
          unlocked={effectiveRides >= 10}
          icon={<Crown className="h-6 w-6" />}
        />
      </div>

      {/* Premium Teaser */}
      <div className="p-8 rounded-[2.5rem] bg-gradient-premium-gold text-white shadow-glow flex flex-col sm:flex-row items-center justify-between gap-6 overflow-hidden relative">
        <Sparkles className="absolute right-[-20px] top-[-20px] h-32 w-32 opacity-20" />
        <div className="space-y-2 text-center sm:text-left relative z-10">
          <h3 className="text-2xl font-black">Want to unlock rewards 2x faster?</h3>
          <p className="text-sm font-medium opacity-90">
            Premium members reach milestones with 50% fewer bookings.
          </p>
        </div>
        <Button
          size="lg"
          className="bg-white text-amber-600 font-extrabold px-10 rounded-2xl hover:scale-105 transition-transform shadow-xl relative z-10"
          asChild
        >
          <Link to="/premium">
            Upgrade Now <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function RewardCard({ title, desc, code, unlocked, icon }: any) {
  const copy = () => {
    if (!unlocked) return;
    navigator.clipboard.writeText(code);
    toast.success("Coupon code copied!");
  };

  return (
    <div
      className={cn(
        "p-6 rounded-[2rem] border transition-all duration-500 relative overflow-hidden group",
        unlocked
          ? "bg-card border-indigo-500/30 shadow-elegant hover:border-indigo-500/60"
          : "bg-muted/40 border-border/60 grayscale opacity-70",
      )}
    >
      <div className="flex items-center gap-4 mb-4">
        <div
          className={cn(
            "h-12 w-12 rounded-2xl flex items-center justify-center transition-colors duration-500",
            unlocked ? "bg-indigo-500 text-white shadow-glow" : "bg-muted text-muted-foreground",
          )}
        >
          {icon}
        </div>
        <div>
          <h4 className="font-bold text-lg">{title}</h4>
          <p className="text-xs text-muted-foreground font-medium tracking-tight">{desc}</p>
        </div>
      </div>

      {unlocked ? (
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-muted/50 border border-dashed border-indigo-500/40 flex items-center justify-between group/code">
            <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 tracking-widest">{code}</span>
            <Button
              onClick={copy}
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-[10px] font-bold uppercase hover:bg-indigo-500 hover:text-white rounded-lg"
            >
              Copy
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground font-medium text-center">
            Expires in 15 days • Valid on all bikes
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-muted/20 border border-dashed border-border/60 flex items-center justify-center">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Locked
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground font-medium text-center">
            Complete required rides to unlock
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, title, value, desc }: any) {
  return (
    <div className="p-6 rounded-3xl bg-card border border-border/60 shadow-elegant relative overflow-hidden group">
      <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
        {icon}
      </div>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-primary/10 text-primary">{icon}</div>
        <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
          {title}
        </span>
      </div>
      <div className="text-3xl font-black mb-1">{value}</div>
      <div className="text-xs text-muted-foreground font-medium">{desc}</div>
    </div>
  );
}
