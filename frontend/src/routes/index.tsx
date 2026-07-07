import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Zap, Shield, Sparkles, Clock, Bike as BikeIcon, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { BikeCard, type Bike } from "@/components/bikes/BikeCard";
import { useAuth } from "@/context/AuthContext";
import heroBike from "@/assets/hero-bike.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CampusRide 🚲 — Rent premium motorcycles" },
      {
        name: "description",
        content:
          "Browse, book and ride. CampusRide is the fastest way to rent a KTM, TVS Apache, Royal Enfield and more.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const [featured, setFeatured] = useState<Bike[]>([]);
  const { token, isAdmin } = useAuth();

  useEffect(() => {
    async function loadBikes() {
      const { data, error } = await supabase.from('bikes').select('*').limit(3);
      if (!error && data) {
        setFeatured(data as Bike[]);
      }
    }
    loadBikes();
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/3 left-1/4 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute bottom-10 right-1/4 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-20 lg:py-28 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 glass rounded-full px-3 py-1 text-xs">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-muted-foreground">
                New: KTM &amp; Royal Enfield now on roster
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
              Ride your <span className="text-gradient-brand">city</span>
              <br />
              the smarter way.
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg">
              Hourly and daily motorcycle rentals — KTM, TVS Apache, Royal Enfield and more. Unlock
              your ride in under 30 seconds.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="bg-gradient-brand text-primary-foreground hover:opacity-90 shadow-glow"
              >
                <Link to="/bikes">
                  Browse bikes <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                {token ? (
                  <Link to={isAdmin ? "/admin" : "/dashboard"}>
                    {isAdmin ? "Admin Dashboard" : "Dashboard"} <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                ) : (
                  <Link to="/signup">Create account</Link>
                )}
              </Button>
            </div>
            <div className="flex gap-8 pt-6">
              {[
                ["1.2k+", "Active riders"],
                ["6", "Campus hubs"],
                ["4.9", "Avg rating"],
              ].map(([n, l]) => (
                <div key={l}>
                  <div className="text-2xl font-bold text-gradient-brand">{n}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{l}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative animate-float">
            <div className="absolute inset-0 bg-gradient-brand opacity-30 blur-3xl rounded-full" />
            <img
              src={heroBike}
              alt="Premium sport motorcycle with neon lighting"
              width={1600}
              height={1024}
              className="relative rounded-3xl shadow-elegant"
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Built for student life</h2>
          <p className="mt-3 text-muted-foreground">Everything you need. Nothing you don't.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              icon: Zap,
              title: "Instant booking",
              desc: "Reserve a motorcycle in seconds — no calls, no paperwork.",
            },
            {
              icon: Shield,
              title: "Secure & verified",
              desc: "Encrypted payments and verified rider profiles.",
            },
            {
              icon: Clock,
              title: "Pay by the hour",
              desc: "Flexible pricing from ₹99/hr or save with daily plans.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-2xl bg-gradient-card border border-border/60 p-6 hover:border-primary/40 transition-all hover:-translate-y-1"
            >
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-brand shadow-glow mb-4">
                <f.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <h3 className="font-semibold text-lg">{f.title}</h3>
              <p className="text-sm text-muted-foreground mt-1.5">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured bikes */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Featured rides</h2>
            <p className="text-muted-foreground mt-1.5">Hand-picked motorcycles ready to roll.</p>
          </div>
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link to="/bikes">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((b) => (
            <BikeCard key={b.id} bike={b} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 py-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-brand p-10 sm:p-14 text-center shadow-elegant">
          <BikeIcon className="absolute -right-8 -bottom-8 h-48 w-48 text-primary-foreground/10" />
          <Star className="absolute top-6 left-6 h-6 w-6 text-primary-foreground/40" />
          <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground">Ready to ride?</h2>
          <p className="mt-3 text-primary-foreground/90 max-w-xl mx-auto">
            Join thousands of riders already using CampusRide. Sign up free in 30 seconds.
          </p>
          {token ? (
            <Button asChild size="lg" variant="secondary" className="mt-6">
              <Link to={isAdmin ? "/admin" : "/dashboard"}>
                {isAdmin ? "Go to Admin Dashboard" : "Go to my Dashboard"} <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button asChild size="lg" variant="secondary" className="mt-6">
              <Link to="/signup">Get started — it's free</Link>
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}
