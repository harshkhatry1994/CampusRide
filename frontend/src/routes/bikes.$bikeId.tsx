import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Star,
  MapPin,
  Zap,
  Calendar,
  ShieldCheck,
  Gauge,
  Fuel,
  Info,
  Bike as BikeIcon,
  Headphones,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export const Route = createFileRoute("/bikes/$bikeId")({
  head: () => ({ meta: [{ title: "Motorcycle Details — CampusRide" }] }),
  component: BikeDetails,
});

const localImages = import.meta.glob("/src/assets/bike-*.jpg", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

function resolveImage(url: string) {
  if (url?.startsWith("/src/assets/")) return localImages[url] ?? url;
  if (url?.startsWith("/uploads/")) return `${import.meta.env.VITE_API_URL}${url}`;
  return url;
}

function BikeDetails() {
  const { bikeId } = Route.useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [bike, setBike] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/bikes/${bikeId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setBike(data.data);
        } else {
          setBike(null);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [bikeId]);

  if (loading)
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 flex flex-col gap-8 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded-md" />
        <div className="grid lg:grid-cols-2 gap-10">
          <div className="aspect-[4/3] rounded-3xl bg-muted" />
          <div className="space-y-4">
            <div className="h-10 w-2/3 bg-muted rounded-md" />
            <div className="h-48 w-full bg-muted rounded-md" />
          </div>
        </div>
      </div>
    );

  if (!bike)
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <div className="inline-grid h-20 w-20 place-items-center rounded-full bg-muted mb-6">
          <BikeIcon className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-3xl font-bold mb-4">Bike not found</h2>
        <p className="text-muted-foreground mb-8">
          The motorcycle you are looking for is no longer in our roster.
        </p>
        <div className="flex justify-center gap-4">
          <Button asChild variant="outline">
            <Link to="/bikes">Back to inventory</Link>
          </Button>
          <Button asChild>
            <Link to="/">Go Home</Link>
          </Button>
        </div>
      </div>
    );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Link
        to="/bikes"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary mb-6 transition-colors group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Back to
        motorcycles
      </Link>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Large Image Gallery Container */}
        <div className="space-y-6">
          <div className="relative rounded-[2.5rem] overflow-hidden bg-gradient-card border border-border/60 shadow-elegant group">
            <img
              src={resolveImage(bike.imageUrl)}
              alt={bike.name}
              className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-1000"
            />
            <div className="absolute top-6 left-6 flex gap-2">
              <Badge className="bg-gradient-brand text-primary-foreground border-0 shadow-glow px-4 py-1">
                Featured Ride
              </Badge>
              <Badge
                variant="outline"
                className="backdrop-blur bg-background/50 border-white/10 capitalize px-4"
              >
                {bike.category}
              </Badge>
            </div>
            {/* Gallery Navigation Mockup */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 p-2 glass rounded-full">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-2 w-2 rounded-full ${i === 1 ? "bg-primary shadow-glow" : "bg-white/20"}`}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <SpecCard
              icon={<Gauge className="h-4 w-4" />}
              label="Mileage"
              value={`${bike.mileage} kmpl`}
            />
            <SpecCard icon={<Fuel className="h-4 w-4" />} label="Fuel" value={bike.fuelType} />
            <SpecCard
              icon={<Zap className="h-4 w-4" />}
              label="Engine"
              value={`${bike.engineCC}cc`}
            />
            <SpecCard
              icon={<Star className="h-4 w-4 text-primary fill-primary" />}
              label="Rating"
              value={bike.rating}
            />
          </div>
        </div>

        {/* Detailed Info Column */}
        <div className="space-y-8">
          <div>
            <div className="flex items-center gap-3 text-primary font-bold uppercase tracking-widest text-[10px] mb-2">
              <Sparkles className="h-3 w-3" /> Premium Fleet
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">{bike.name}</h1>
            <div className="flex items-center gap-4 text-muted-foreground font-semibold">
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-lg text-sm">
                {bike.brand} {bike.model}
              </span>
              <span className="flex items-center gap-1.5 text-sm">
                <MapPin className="h-4 w-4 text-primary" /> {bike.pickupLocation || "Campus Hub"}
              </span>
            </div>
          </div>

          <p className="text-lg text-muted-foreground leading-relaxed">
            {bike.description ||
              "Experience the ultimate freedom on campus with this premium motorcycle. Perfect for commuting, city rides, and weekend getaways. Engineered for performance and student lifestyle."}
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-gradient-card border border-border/40 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <ShieldCheck />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">
                  Security Deposit
                </p>
                <p className="font-bold">₹{bike.securityDeposit || 1000} (Refundable)</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-gradient-card border border-border/40 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Info />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Helmet Info</p>
                <p className="font-bold">
                  {bike.helmetIncluded ? "Included in Plan" : "Available on Request"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-gradient-card border border-border/60 p-8 shadow-elegant space-y-8">
            <div className="flex items-center justify-between border-b border-border/40 pb-6">
              <div>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">
                  Rental Plan
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-gradient-brand">
                    ₹{Number(bike.pricePerDay).toLocaleString("en-IN")}
                  </span>
                  <span className="text-muted-foreground font-medium">/day</span>
                </div>
              </div>
              <Badge
                className={
                  bike.available ? "bg-green-500/10 text-green-500 border-green-500/20" : ""
                }
                variant={bike.available ? "outline" : "destructive"}
              >
                <div
                  className={`h-1.5 w-1.5 rounded-full mr-2 ${bike.available ? "bg-green-500 animate-pulse" : "bg-destructive"}`}
                />
                {bike.available ? "Available Now" : "Currently Booked"}
              </Badge>
            </div>

            <Button
              asChild
              disabled={!bike.available}
              size="lg"
              className="w-full h-16 rounded-2xl bg-gradient-brand text-primary-foreground text-lg font-bold shadow-glow hover:opacity-90 transform hover:scale-[1.01] transition-all"
            >
              <Link to="/booking/$bikeId" params={{ bikeId: bike._id }}>
                <Zap className="h-5 w-5 mr-2" /> Book This Ride Now
              </Link>
            </Button>

            <p className="text-center text-[10px] text-muted-foreground italic">
              * Instant confirmation. Identity verification required in the next step.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SpecCard({ icon, label, value }: any) {
  return (
    <div className="p-4 rounded-2xl bg-gradient-card border border-border/40 text-center group hover:border-primary/40 transition-colors">
      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary mx-auto mb-3 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">
        {label}
      </div>
      <div className="font-bold text-sm">{value}</div>
    </div>
  );
}
