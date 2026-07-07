import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  CheckCircle2, Download, ArrowRight, MapPin, Clock, Calendar,
  Bike as BikeIcon, MessageSquare, HelpCircle, ReceiptText, Camera, Navigation,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/confirmation/$bookingId")({
  head: () => ({ meta: [{ title: "Booking Confirmed — CampusRide" }] }),
  component: ConfirmationPage,
});

import { generateReceipt } from "@/lib/receipt";

function ConfirmationPage() {
  const { bookingId } = Route.useParams();
  const { token } = useAuth();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBooking() {
      const { data, error } = await supabase.from('rentals').select('*').eq('id', bookingId).maybeSingle();
      if (!error && data) {
        setBooking(data);
      }
      setLoading(false);
    }
    loadBooking();
  }, [bookingId, token]);

  if (loading) return <div className="p-20 text-center">Finalizing booking...</div>;
  if (!booking) return <div className="p-20 text-center">Booking record not found</div>;

  const loc = booking.locationVerification;

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 animate-in zoom-in-95 duration-700">
      <div className="text-center mb-12">
        <div className="inline-grid h-20 w-20 place-items-center rounded-full bg-green-500/10 text-green-500 border border-green-500/20 mb-8 animate-in bounce-in">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <Badge className="bg-green-500/10 text-green-500 border-green-500/20 mb-4 px-6 py-1 text-sm font-bold">
          Booking Confirmed
        </Badge>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 text-gradient-brand">
          Ride in style!
        </h1>
        <p className="text-xl text-muted-foreground max-w-lg mx-auto">
          Your reservation is successfully processed. Prepare for an epic journey on your{" "}
          {booking.bikes?.bike_name || booking.bikes?.brand}.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        {/* Booking Details Card */}
        <div className="p-8 rounded-[2.5rem] bg-gradient-card border border-border/60 shadow-elegant space-y-6">
          <div className="flex justify-between items-center border-b border-border/40 pb-4">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Booking ID</span>
            <span className="font-mono text-sm font-bold text-primary">#{booking.id.split('-')[0].toUpperCase()}</span>
          </div>
          <div className="flex items-start gap-4">
            <div className="h-16 w-20 rounded-2xl bg-muted/30 border border-border/40 overflow-hidden shrink-0">
              {booking.bikes?.image_url ? (
                <img
                  src={booking.bikes.image_url.startsWith("http") ? booking.bikes.image_url : `${import.meta.env.VITE_API_URL}${booking.bikes.image_url}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                  <BikeIcon className="h-6 w-6" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-bold">{booking.bikes?.bike_name || booking.bikes?.brand}</h3>
              <p className="text-xs text-muted-foreground">{booking.bikes?.brand} {booking.bikes?.model}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Amount Paid</p>
              <p className="font-black text-lg">₹{booking.total_price}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Pickup</p>
              <div className="flex items-center gap-1.5 text-sm font-semibold">
                <Calendar className="h-3 w-3 text-primary" />{" "}
                {new Date(booking.start_date).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" /> {new Date(booking.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Location</p>
              <div className="flex items-center gap-1.5 text-sm font-semibold">
                <MapPin className="h-3 w-3 text-primary" />{" "}
                {booking.bikes?.pickup_location || "Campus Hub"}
              </div>
              <p className="text-[10px] text-muted-foreground">Main Entrance Gate</p>
            </div>
          </div>
        </div>

        {/* Quick Instructions Card */}
        <div className="p-8 rounded-[2.5rem] bg-gradient-brand text-primary-foreground shadow-elegant relative overflow-hidden">
          <ReceiptText className="absolute -right-6 -top-6 h-32 w-32 opacity-10" />
          <h3 className="text-xl font-bold mb-6">Quick Instructions</h3>
          <ul className="space-y-4 text-sm">
            {["Reach the pickup hub 15 minutes before your scheduled time.", "Keep your original Driving Licence handy for physical verification.", "Perform a quick 360° check of the bike before starting the trip."].map((txt, i) => (
              <li key={i} className="flex gap-3">
                <span className="h-6 w-6 rounded-lg bg-white/20 flex items-center justify-center text-[10px] font-bold shrink-0">
                  0{i + 1}
                </span>
                {txt}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Location Verification Card — only if GPS data exists */}
      {loc?.latitude && (
        <div className="mb-8 rounded-[2.5rem] border border-emerald-500/20 overflow-hidden shadow-elegant">
          <div className="p-5 bg-emerald-500/5 border-b border-emerald-500/20 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Navigation className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-black text-sm text-emerald-700 dark:text-emerald-400">Location Verification Complete</p>
              <p className="text-xs text-muted-foreground">Your GPS location was captured at time of payment</p>
            </div>
            <Badge className="ml-auto bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Verified</Badge>
          </div>

          {/* Map */}
          <div className="h-52 bg-muted relative">
            <iframe
              title="Verified Location"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${loc.longitude - 0.005},${loc.latitude - 0.005},${loc.longitude + 0.005},${loc.latitude + 0.005}&layer=mapnik&marker=${loc.latitude},${loc.longitude}`}
              className="w-full h-full border-0"
              loading="lazy"
            />
          </div>

          <div className="p-6 grid sm:grid-cols-2 gap-6 bg-card">
            {loc.photoUrl && (
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Camera className="h-3 w-3 text-primary" /> Verification Selfie
                </p>
                <div className="aspect-video rounded-2xl overflow-hidden border border-border/40">
                  <img
                    src={`${import.meta.env.VITE_API_URL}${loc.photoUrl}`}
                    alt="Geo Selfie"
                    className="w-full h-full object-cover -scale-x-100"
                  />
                </div>
              </div>
            )}
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Full Address</p>
                <p className="text-sm font-medium leading-relaxed">{loc.address}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Latitude", loc.latitude?.toFixed(5)],
                  ["Longitude", loc.longitude?.toFixed(5)],
                  ["Accuracy", `±${Math.round(loc.accuracy || 0)}m`],
                  ["Captured At", loc.capturedAt ? new Date(loc.capturedAt).toLocaleTimeString() : "—"],
                ].map(([k, v]) => (
                  <div key={k} className="p-3 rounded-2xl bg-muted/30 border border-border/40">
                    <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground mb-1">{k}</p>
                    <p className="text-xs font-mono font-bold">{v}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-4">
        <Button asChild size="lg" className="rounded-2xl bg-gradient-brand text-primary-foreground shadow-glow px-10">
          <Link to="/dashboard">Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" /></Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="rounded-2xl px-10 border-border/60">
          <Link to="/receipt/$bookingId" params={{ bookingId: booking.id }} search={{ download: true }}>
            <Download className="mr-2 h-4 w-4" /> Download Receipt
          </Link>
        </Button>
      </div>

      <div className="mt-16 flex justify-center gap-10 grayscale opacity-40">
        <div className="flex items-center gap-2 text-sm font-bold"><MessageSquare className="h-4 w-4" /> WhatsApp Support</div>
        <div className="flex items-center gap-2 text-sm font-bold"><HelpCircle className="h-4 w-4" /> Help Center</div>
      </div>
    </div>
  );
}
