import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  CreditCard,
  Smartphone,
  CheckCircle2,
  ArrowRight,
  QrCode,
  Zap,
  Info,
  ShieldCheck,
  Bike as BikeIcon,
  Calendar,
  Clock,
  Gift,
  Tag,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export const Route = createFileRoute("/payment/$bookingId")({
  head: () => ({ meta: [{ title: "Secure Payment — CampusRide" }] }),
  component: PaymentPage,
});

function PaymentPage() {
  const { bookingId } = Route.useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [transactionId, setTransactionId] = useState("");

  useEffect(() => {
    if (!token) {
      navigate({ to: "/login" });
      return;
    }

    fetch(`${import.meta.env.VITE_API_URL}/api/bookings/${bookingId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setBooking(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [bookingId, token, navigate]);

  async function handlePayment() {
    if (!transactionId || transactionId.length < 8) {
      toast.error("Please enter a valid Transaction ID");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/bookings/${bookingId}/payment`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ transactionId, method: "UPI" }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Payment submitted for verification!");
        navigate({ to: "/confirmation/$bookingId", params: { bookingId } });
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error("Failed to process payment");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium animate-pulse">Initializing secure gateway...</p>
      </div>
    );
  }
  if (!booking) return <div className="p-20 text-center">Booking not found</div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="grid lg:grid-cols-3 gap-10">
        {/* Left: Summary & Details */}
        <div className="lg:col-span-2 space-y-8">
          <div className="p-8 rounded-[2.5rem] bg-gradient-card border border-border/60 shadow-elegant">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <BikeIcon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold">{booking.bike.name}</h2>
                <p className="text-muted-foreground text-sm">
                  {booking.bike.brand} {booking.bike.model}
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 pb-8 border-b border-border/40">
              <div className="flex gap-4 items-start">
                <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">
                    Pickup Date
                  </p>
                  <p className="font-bold">{new Date(booking.startDate).toLocaleDateString()}</p>
                  <p className="text-xs text-muted-foreground">{booking.pickupTime}</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">
                    Return Date
                  </p>
                  <p className="font-bold">{new Date(booking.endDate).toLocaleDateString()}</p>
                  <p className="text-xs text-muted-foreground">{booking.returnTime}</p>
                </div>
              </div>
            </div>

            <div className="pt-8 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-bold flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary" /> Booking Summary
                </h3>
                <Badge
                  variant="outline"
                  className="text-[10px] font-bold text-primary border-primary/20"
                >
                  PAYMENT PENDING
                </Badge>
              </div>

              {/* Coupon Section */}
              <div className="p-4 rounded-2xl bg-muted/30 border border-border/40 space-y-3">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="coupon"
                    className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2"
                  >
                    <Gift className="h-3 w-3 text-primary" /> Have a Coupon?
                  </Label>
                </div>
                <div className="flex gap-2">
                  <Input
                    id="coupon"
                    placeholder="Enter code (e.g. RIDER100)"
                    className="h-10 rounded-xl bg-background border-border/40 text-sm font-bold uppercase tracking-widest"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    className="rounded-xl font-bold hover:bg-primary hover:text-white transition-all"
                    onClick={() => toast.success("Coupon applied! ₹100 deducted.")}
                  >
                    Apply
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Rental Charge</span>
                  <span className="font-semibold">₹{booking.pricing.basePrice}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Security Deposit (Refundable)</span>
                  <span className="font-semibold">₹{booking.pricing.securityDeposit}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">GST & Platform Fee</span>
                  <span className="font-semibold">
                    ₹{booking.pricing.gst + booking.pricing.platformFee}
                  </span>
                </div>
                <div className="flex justify-between text-xl font-black pt-4 border-t border-border/40">
                  <span className="text-gradient-brand">Total Payable</span>
                  <span>₹{booking.pricing.totalAmount}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-primary/5 border border-primary/20 flex items-center gap-4">
            <ShieldCheck className="h-10 w-10 text-primary shrink-0" />
            <div>
              <p className="text-sm font-bold">100% Secure Transaction</p>
              <p className="text-xs text-muted-foreground">
                Your payment data is protected with 256-bit encryption.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Payment Portal */}
        <div className="space-y-6">
          <div className="p-8 rounded-[2.5rem] bg-gradient-card border border-primary/40 shadow-glow space-y-8">
            <div className="text-center">
              <Badge className="bg-primary/10 text-primary border-primary/20 mb-4 px-4 py-1">
                UPI / QR Payment
              </Badge>
              <h3 className="text-2xl font-bold mb-6">Scan to Pay</h3>

              <div className="relative mx-auto h-48 w-48 p-4 bg-white rounded-3xl shadow-xl flex items-center justify-center">
                <QrCode className="h-full w-full text-black" />
                <div className="absolute inset-0 flex items-center justify-center opacity-10">
                  <Zap className="h-20 w-20 text-primary fill-primary" />
                </div>
              </div>

              <div className="mt-6 p-4 rounded-2xl bg-muted/50 border border-border/40">
                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">UPI ID</p>
                <p className="font-mono text-sm font-bold">campusride.pay@okaxis</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="txId">Enter Transaction ID</Label>
                <Input
                  id="txId"
                  placeholder="12-digit Ref No."
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="h-12 rounded-xl text-center font-bold tracking-widest uppercase"
                />
              </div>

              <Button
                onClick={handlePayment}
                disabled={submitting}
                className="w-full h-14 rounded-2xl bg-gradient-premium-gold font-extrabold shadow-glow hover:opacity-90 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {submitting ? "Verifying..." : "Confirm Payment"}{" "}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <div className="flex justify-center gap-4 opacity-40">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo.png"
                className="h-4 grayscale invert dark:invert-0"
                alt="UPI"
              />
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/b/b5/Google_Pay_%28GPay%29_Logo.svg"
                className="h-4 grayscale invert dark:invert-0"
                alt="GPay"
              />
            </div>
          </div>

          {/* Support Section */}
          <div className="grid grid-cols-2 gap-4">
            <a
              href="https://wa.me/919876543210"
              target="_blank"
              rel="noreferrer"
              className="flex flex-col items-center justify-center p-4 rounded-3xl bg-card border border-border/60 shadow-sm hover:border-green-500/50 hover:bg-green-500/5 transition-all group"
            >
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Smartphone className="h-5 w-5 text-green-500" />
              </div>
              <span className="text-sm font-bold">WhatsApp Support</span>
              <span className="text-[10px] text-muted-foreground mt-0.5">24/7 Live Agent</span>
            </a>
            <a
              href="#"
              className="flex flex-col items-center justify-center p-4 rounded-3xl bg-card border border-border/60 shadow-sm hover:border-primary/50 hover:bg-primary/5 transition-all group"
            >
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Info className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm font-bold">Help Centre</span>
              <span className="text-[10px] text-muted-foreground mt-0.5">FAQs & Guides</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
