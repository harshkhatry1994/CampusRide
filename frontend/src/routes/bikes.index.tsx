import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BikeCard, type Bike } from "@/components/bikes/BikeCard";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/bikes/")({
  head: () => ({
    meta: [
      { title: "Browse motorcycles — CampusRide" },
      {
        name: "description",
        content: "Search, filter and book from our full catalog of premium motorcycles.",
      },
    ],
  }),
  component: BikesPage,
});

const CATEGORIES = ["all", "Cruiser", "Sports", "Street", "Adventure", "Scooter"] as const;

function BikesPage() {
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("all");

  useEffect(() => {
    async function fetchBikes() {
      const { data, error } = await supabase.from('bikes').select('*');
      console.log("BIKES FROM DB:", data);
      if (error) {
        console.error("Failed to fetch bikes:", error);
        setBikes([]);
      } else if (data) {
        const mapped = data.map((b: any) => ({
          ...b,
          title: b.bike_name,
          name: b.bike_name,
          category: b.category || "Cruiser",
          image: b.image_url || "/src/assets/bike-1.jpg",
          image_url: b.image_url || "/src/assets/bike-1.jpg",
          model: b.model || "Standard",
          daily_rate: b.daily_rate || 500,
          status: b.status || "available",
          registrationNumber: b.registration_number,
        }));
        setBikes(mapped);
      }
      setLoading(false);
    }
    fetchBikes();
  }, []);

  const filtered = useMemo(() => {
    const filteredBikes = bikes.filter((b) => {
      // Removed filters requiring missing fields (category and model)
      const searchStr = `${b.bike_name || ''} ${b.brand || ''}`.toLowerCase();
      if (q && !searchStr.includes(q.toLowerCase())) return false;
      return true;
    });
    console.log("FILTERED BIKES:", filteredBikes);
    return filteredBikes;
  }, [bikes, q]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">All motorcycles</h1>
        <p className="text-muted-foreground font-medium">
          Browse our premium fleet of bikes tailored for campus life.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-10">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, brand or model…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-10 h-11 rounded-xl bg-background/50 border-border/60"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <Button
              key={cat}
              size="sm"
              variant={category === cat ? "default" : "outline"}
              onClick={() => setCategory(cat)}
              className={`h-11 px-5 rounded-xl capitalize transition-all ${
                category === cat
                  ? "bg-gradient-brand text-primary-foreground border-0 shadow-glow"
                  : "border-border/60 hover:bg-primary/5"
              }`}
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[4/3] rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 bg-gradient-card border border-dashed border-border/60 rounded-3xl">
          <p className="text-muted-foreground mb-4">No bikes match your current search criteria.</p>
          <Button
            variant="link"
            onClick={() => {
              setQ("");
              setCategory("all");
            }}
            className="text-primary font-bold"
          >
            Clear all filters
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((b) => (
            <BikeCard key={b.id} bike={b} />
          ))}
        </div>
      )}
    </div>
  );
}
