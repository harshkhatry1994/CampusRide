import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  CheckCircle2,
  Crown,
  Zap,
  Shield,
  ArrowRight,
  Sparkles,
  Star,
  UserCheck,
  CalendarDays,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/premium")({
  head: () => ({ meta: [{ title: "CampusRide Premium" }] }),
  component: PremiumLandingPage,
});

function PremiumLandingPage() {
  const { user, isAdmin } = useAuth();
  const [membership, setMembership] = useState<any>(null);

  useEffect(() => {
    if (user?.is_premium && user?.id) {
      const fetchMembership = async () => {
        const { data } = await supabase
          .from("membership_requests")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "approved")
          .order("updated_at", { ascending: false })
          .limit(1)
          .single();
        if (data) {
          setMembership(data);
        }
      };
      fetchMembership();
    }
  }, [user]);

  const getMembershipDetails = () => {
    if (!membership) return null;
    const startDate = new Date(membership.updated_at || membership.created_at);
    const expiryDate = new Date(startDate);
    expiryDate.setFullYear(startDate.getFullYear() + 1);
    
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return { 
      startDate: startDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }), 
      expiryDate: expiryDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }), 
      remainingDays: Math.max(0, diffDays) 
    };
  };

  const details = getMembershipDetails();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden transition-colors duration-300">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-background z-0 pointer-events-none" />
      <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px] z-0 pointer-events-none" />

      <div className="mx-auto max-w-6xl px-4 py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Copy */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 font-bold text-sm">
              <Crown className="h-4 w-4" /> CampusRide Premium
            </div>
            <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">
              Ride like a{" "}
              <span className="text-transparent bg-clip-text bg-gradient-premium-gold">VIP.</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-lg">
              Unlock priority bookings, massive discounts, and zero security deposits. Upgrade your
              ride experience today.
            </p>

            <div className="space-y-4 pt-4">
              {[
                {
                  icon: Zap,
                  title: "Priority Bike Booking",
                  desc: "Skip the queue. Get first access to our newest fleet.",
                },
                {
                  icon: Star,
                  title: "Exclusive Rewards",
                  desc: "Unlock milestones 2x faster than normal users.",
                },
                {
                  icon: Shield,
                  title: "Zero Security Deposit",
                  desc: "Never pay a security deposit again.",
                },
              ].map((feature, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-muted/50 flex items-center justify-center shrink-0 border border-border/40 transition-colors">
                    <feature.icon className="h-6 w-6 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-foreground">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Pricing Card / Admin Status */}
          <div className="relative">
            {isAdmin ? (
              <div className="relative p-8 sm:p-10 rounded-[2.5rem] bg-card border border-border/60 shadow-2xl flex flex-col items-center text-center overflow-hidden min-h-[500px] justify-center transition-colors">
                <div className="absolute top-0 right-0 p-4">
                  <Badge className="bg-amber-500 text-black font-black px-4 py-1 rounded-full text-xs">
                    BOSS MODE
                  </Badge>
                </div>
                <div className="h-24 w-24 rounded-full bg-gradient-premium-gold p-1 mb-6 shadow-glow">
                  <div className="h-full w-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                    {user?.avatar ? (
                      <img src={user.avatar} className="h-full w-full object-cover" />
                    ) : (
                      <UserCheck className="h-10 w-10 text-amber-500" />
                    )}
                  </div>
                </div>
                <h2 className="text-3xl font-black text-foreground mb-2">Hello, {user?.name}!</h2>
                <p className="text-amber-500 font-bold uppercase tracking-[0.2em] text-xs mb-6">
                  Administrator Access
                </p>
                <div className="space-y-4 max-w-xs mx-auto">
                  <div className="p-4 rounded-2xl bg-muted/30 border border-border/40">
                    <p className="text-sm text-muted-foreground italic">
                      "As the boss, you have full access to all premium features and admin controls
                      without needing a membership."
                    </p>
                  </div>
                  <Link to="/admin">
                    <Button className="w-full h-14 rounded-2xl bg-foreground text-background hover:bg-foreground/90 font-bold text-lg shadow-elegant">
                      Go to Admin Panel
                    </Button>
                  </Link>
                </div>
              </div>
            ) : user?.is_premium ? (
              <>
                <div className="absolute -inset-1 bg-gradient-premium-gold rounded-[3rem] blur-xl opacity-30 animate-pulse" />
                <div className="relative p-8 sm:p-10 rounded-[2.5rem] bg-card border border-amber-500/20 shadow-elegant flex flex-col h-full overflow-hidden transition-colors">
                  <Sparkles className="absolute -top-6 -right-6 h-32 w-32 text-amber-500/10" />

                  <div className="text-center space-y-4 mb-8">
                    <div className="h-20 w-20 mx-auto rounded-full bg-gradient-premium-gold p-1 shadow-glow mb-4">
                      <div className="h-full w-full rounded-full bg-background flex items-center justify-center">
                        <Crown className="h-10 w-10 text-amber-500" />
                      </div>
                    </div>
                    <Badge className="bg-amber-500 text-black font-black px-4 py-1 rounded-full text-xs">
                      PREMIUM ACTIVE
                    </Badge>
                    <h2 className="text-3xl font-black text-foreground">Welcome back, VIP!</h2>
                    <p className="text-sm text-muted-foreground font-medium">
                      Your exclusive benefits are currently active.
                    </p>
                  </div>

                  {details ? (
                    <div className="space-y-6 mb-10 flex-1">
                      <div className="p-5 rounded-2xl bg-muted/30 border border-border/40 space-y-4">
                        <div className="flex items-center gap-3">
                          <CalendarDays className="h-5 w-5 text-amber-500" />
                          <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Valid Until</p>
                            <p className="font-bold text-foreground">{details.expiryDate}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Clock className="h-5 w-5 text-amber-500" />
                          <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Remaining Days</p>
                            <p className="font-bold text-foreground">{details.remainingDays} Days</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6 mb-10 flex-1 flex items-center justify-center">
                      <p className="text-muted-foreground font-medium text-center">Loading membership details...</p>
                    </div>
                  )}

                  <Link to="/bikes">
                    <Button className="w-full h-14 rounded-2xl bg-foreground text-background hover:bg-foreground/90 transition-all font-extrabold text-lg shadow-elegant">
                      Book a Ride Now
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div className="absolute -inset-1 bg-gradient-premium-gold rounded-[3rem] blur-xl opacity-30 animate-pulse" />
                <div className="relative p-8 sm:p-10 rounded-[2.5rem] bg-card border border-amber-500/20 shadow-elegant flex flex-col h-full overflow-hidden transition-colors">
                  <Sparkles className="absolute -top-6 -right-6 h-32 w-32 text-amber-500/10" />

                  <div className="text-center space-y-4 mb-8">
                    <Crown className="h-12 w-12 text-amber-500 mx-auto drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
                    <h2 className="text-2xl font-bold text-foreground">Annual Membership</h2>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-4xl sm:text-5xl font-black text-foreground">₹999</span>
                      <span className="text-muted-foreground font-medium">/ year</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Cancel anytime. Billed annually.
                    </p>
                  </div>

                  <div className="space-y-4 mb-10 flex-1">
                    <div className="font-bold text-sm text-foreground uppercase tracking-wider mb-2">
                      Everything you get:
                    </div>
                    {[
                      "No Security Deposit on standard bikes",
                      "10% Flat Discount on every ride",
                      "Priority WhatsApp Support",
                      "Free Helmet Delivery",
                      "Early access to Premium Superbikes",
                      "VIP Profile Badge",
                    ].map((benefit, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="h-5 w-5 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                        </div>
                        <span className="text-sm font-medium text-foreground">{benefit}</span>
                      </div>
                    ))}
                  </div>

                  <Link to="/premium-payment">
                    <Button className="w-full h-14 rounded-2xl bg-gradient-premium-gold text-white hover:opacity-90 transition-all font-extrabold text-lg shadow-[0_10px_30px_rgba(245,158,11,0.3)] hover:scale-[1.02] active:scale-[0.98] group">
                      Get Premium Now{" "}
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
