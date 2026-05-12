import { Link } from "@tanstack/react-router";
import { Star, MapPin, Gauge, Fuel } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface Bike {
  _id: string;
  name: string;
  brand: string;
  model: string;
  category: string;
  imageUrl: string;
  pricePerHour: number;
  pricePerDay: number;
  rating: number;
  available: boolean;
  fuelType?: string;
  mileage?: number;
}

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

export function BikeCard({ bike }: { bike: Bike }) {
  return (
    <Link
      to="/bikes/$bikeId"
      params={{ bikeId: bike._id }}
      className="group relative overflow-hidden rounded-2xl bg-gradient-card border border-border/60 hover:border-primary/50 transition-all duration-500 hover:shadow-glow hover:-translate-y-1"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={resolveImage(bike.imageUrl)}
          alt={bike.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge
            variant="secondary"
            className="capitalize backdrop-blur bg-background/50 border-white/10"
          >
            {bike.category}
          </Badge>
          {bike.available ? (
            <Badge className="bg-gradient-brand text-primary-foreground border-0">Available</Badge>
          ) : (
            <Badge variant="destructive">Booked</Badge>
          )}
        </div>
        <div className="absolute bottom-3 right-3 glass rounded-full px-2.5 py-1 text-xs flex items-center gap-1">
          <Star className="h-3 w-3 fill-primary text-primary" /> {bike.rating}
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold tracking-tight truncate max-w-[140px]">{bike.name}</h3>
            <p className="text-xs text-muted-foreground">
              {bike.brand} {bike.model}
            </p>
          </div>
          <div className="text-right">
            <div className="text-base font-bold text-gradient-brand">
              ₹{Number(bike.pricePerDay).toLocaleString("en-IN")}
            </div>
            <div className="text-[10px] text-muted-foreground -mt-0.5">/day</div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <Fuel className="h-3 w-3 text-primary/70" /> {bike.fuelType || "Petrol"}
          </div>
          <div className="flex items-center gap-1.5">
            <Gauge className="h-3 w-3 text-primary/70" /> {bike.mileage || 40} kmpl
          </div>
        </div>
      </div>
    </Link>
  );
}
