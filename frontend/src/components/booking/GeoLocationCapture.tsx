import { useState, useEffect, useCallback } from "react";
import { MapPin, Loader2, ShieldCheck, AlertTriangle, RefreshCw, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  address: string;
  capturedAt: string;
  timezone: string;
  userAgent: string;
}

interface GeoLocationCaptureProps {
  onLocation: (data: LocationData | null) => void;
  className?: string;
}

export function GeoLocationCapture({ onLocation, className }: GeoLocationCaptureProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [error, setError] = useState("");

  const fetchAddress = async (lat: number, lon: number): Promise<string> => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();
      return data.display_name || `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
    } catch {
      return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
    }
  };

  const captureLocation = useCallback(async () => {
    setStatus("loading");
    setError("");

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setStatus("error");
      onLocation(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const address = await fetchAddress(latitude, longitude);
        const data: LocationData = {
          latitude,
          longitude,
          accuracy,
          address,
          capturedAt: new Date().toISOString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          userAgent: navigator.userAgent,
        };
        setLocationData(data);
        setStatus("success");
        onLocation(data);
      },
      (err) => {
        const messages: Record<number, string> = {
          1: "Location permission denied. Please allow access in your browser settings.",
          2: "Location unavailable. Please ensure GPS is enabled.",
          3: "Location request timed out. Please try again.",
        };
        setError(messages[err.code] || "Failed to get location.");
        setStatus("error");
        onLocation(null);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, [onLocation]);

  useEffect(() => {
    captureLocation();
  }, [captureLocation]);

  return (
    <div className={cn("rounded-3xl border border-border/60 overflow-hidden", className)}>
      {status === "loading" && (
        <div className="p-8 flex flex-col items-center justify-center gap-4 bg-muted/10">
          <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Loader2 className="h-7 w-7 text-primary animate-spin" />
          </div>
          <div className="text-center">
            <p className="font-bold text-sm">Acquiring GPS Signal</p>
            <p className="text-xs text-muted-foreground mt-1">
              Please allow location access when prompted
            </p>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="p-6 flex flex-col items-center gap-4 bg-destructive/5">
          <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <div className="text-center">
            <p className="font-bold text-sm text-destructive">Location Error</p>
            <p className="text-xs text-muted-foreground mt-1">{error}</p>
          </div>
          <Button variant="outline" size="sm" onClick={captureLocation} className="rounded-xl gap-2">
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </Button>
        </div>
      )}

      {status === "success" && locationData && (
        <div className="space-y-0">
          {/* Map Preview */}
          <div className="relative h-48 bg-muted overflow-hidden">
            <iframe
              title="Location Map"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${locationData.longitude - 0.005},${locationData.latitude - 0.005},${locationData.longitude + 0.005},${locationData.latitude + 0.005}&layer=mapnik&marker=${locationData.latitude},${locationData.longitude}`}
              className="w-full h-full border-0"
              loading="lazy"
            />
            <div className="absolute top-3 left-3 px-3 py-1.5 rounded-xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg">
              <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              Live Location
            </div>
          </div>

          {/* Location Details */}
          <div className="p-5 space-y-4 bg-emerald-500/5 border-t border-emerald-500/20">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                <Navigation className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">
                  Verified Location
                </p>
                <p className="text-xs font-medium text-foreground leading-relaxed line-clamp-2">
                  {locationData.address}
                </p>
              </div>
              <div className="shrink-0">
                <ShieldCheck className="h-5 w-5 text-emerald-500" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-2xl bg-background border border-border/40 text-center">
                <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground mb-1">Latitude</p>
                <p className="text-xs font-mono font-bold">{locationData.latitude.toFixed(5)}</p>
              </div>
              <div className="p-3 rounded-2xl bg-background border border-border/40 text-center">
                <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground mb-1">Longitude</p>
                <p className="text-xs font-mono font-bold">{locationData.longitude.toFixed(5)}</p>
              </div>
              <div className="p-3 rounded-2xl bg-background border border-border/40 text-center">
                <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground mb-1">Accuracy</p>
                <p className="text-xs font-mono font-bold">±{Math.round(locationData.accuracy)}m</p>
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground flex items-center gap-2">
              <MapPin className="h-3 w-3 text-primary" />
              Captured at {new Date(locationData.capturedAt).toLocaleTimeString()} · {locationData.timezone}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
