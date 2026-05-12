import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  CheckCircle2,
  Download,
  ArrowRight,
  MapPin,
  Clock,
  Calendar,
  Bike as BikeIcon,
  MessageSquare,
  HelpCircle,
  ReceiptText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";

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
    fetch(`${import.meta.env.VITE_API_URL}/api/bookings/${bookingId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setBooking(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [bookingId, token]);

  if (loading) return <div className="p-20 text-center">Finalizing booking...</div>;
  if (!booking) return <div className="p-20 text-center">Booking record not found</div>;

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
          {booking.bike.name}.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Booking Details Card */}
        <div className="p-8 rounded-[2.5rem] bg-gradient-card border border-border/60 shadow-elegant space-y-6">
          <div className="flex justify-between items-center border-b border-border/40 pb-4">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Booking ID
            </span>
            <span className="font-mono text-sm font-bold text-primary">
              #{booking._id.slice(-8).toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-glow">
              <BikeIcon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold">{booking.bike.name}</h3>
              <p className="text-xs text-muted-foreground">
                {booking.bike.brand} {booking.bike.model}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Pickup</p>
              <div className="flex items-center gap-1.5 text-sm font-semibold">
                <Calendar className="h-3 w-3 text-primary" />{" "}
                {new Date(booking.startDate).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" /> {booking.pickupTime}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Location</p>
              <div className="flex items-center gap-1.5 text-sm font-semibold">
                <MapPin className="h-3 w-3 text-primary" />{" "}
                {booking.bike.pickupLocation || "Campus Hub"}
              </div>
              <p className="text-[10px] text-muted-foreground">Main Entrance Gate</p>
            </div>
          </div>
        </div>

        {/* Ride Instructions Card */}
        <div className="p-8 rounded-[2.5rem] bg-gradient-brand text-primary-foreground shadow-elegant relative overflow-hidden">
          <ReceiptText className="absolute -right-6 -top-6 h-32 w-32 opacity-10" />
          <h3 className="text-xl font-bold mb-6">Quick Instructions</h3>
          <ul className="space-y-4 text-sm">
            <li className="flex gap-3">
              <span className="h-6 w-6 rounded-lg bg-white/20 flex items-center justify-center text-[10px] font-bold shrink-0">
                01
              </span>
              Reach the pickup hub 15 minutes before your scheduled time.
            </li>
            <li className="flex gap-3">
              <span className="h-6 w-6 rounded-lg bg-white/20 flex items-center justify-center text-[10px] font-bold shrink-0">
                02
              </span>
              Keep your original Driving Licence handy for physical verification.
            </li>
            <li className="flex gap-3">
              <span className="h-6 w-6 rounded-lg bg-white/20 flex items-center justify-center text-[10px] font-bold shrink-0">
                03
              </span>
              Perform a quick 360° check of the bike before starting the trip.
            </li>
          </ul>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        <Button
          asChild
          size="lg"
          className="rounded-2xl bg-gradient-brand text-primary-foreground shadow-glow px-10"
        >
          <Link to="/dashboard">
            Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button
          onClick={() => generateReceipt(booking)}
          variant="outline"
          size="lg"
          className="rounded-2xl px-10 border-border/60 hover:bg-muted"
        >
          <Download className="mr-2 h-4 w-4" /> Download Receipt
        </Button>
      </div>

      <div className="mt-16 flex justify-center gap-10 grayscale opacity-40">
        <div className="flex items-center gap-2 text-sm font-bold">
          <MessageSquare className="h-4 w-4" /> WhatsApp Support
        </div>
        <div className="flex items-center gap-2 text-sm font-bold">
          <HelpCircle className="h-4 w-4" /> Help Center
        </div>
      </div>
    </div>
  );
}
