import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Crown,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Sparkles,
  CheckCircle2,
  QrCode,
  Zap,
  Gift,
  Tag,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/premium-payment")({
  head: () => ({ meta: [{ title: "Premium Checkout" }] }),
  component: PremiumPaymentPage,
});

function PremiumPaymentPage() {
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [transactionId, setTransactionId] = useState("");

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      toast.error("Please login to purchase Premium");
      navigate({ to: "/login", search: { redirect: "/premium" } as any });
      return;
    }
    setLoading(false);
  }, [token, navigate]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
        <p className="text-muted-foreground font-medium animate-pulse">
          Opening premium portal...
        </p>
      </div>
    );
  }

  const handlePayment = async () => {
    if (!transactionId || transactionId.length < 6) {
      toast.error("Please enter a valid Transaction ID (min 6 characters)");
      return;
    }
    if (!user) {
      toast.error("Please login to continue");
      return;
    }
    setSubmitting(true);

    try {
      const { error } = await supabase.from('membership_requests').insert({
        user_id: user.id,
        utr_number: transactionId,
        amount: 999,
        status: 'pending',
      });

      if (error) throw error;

      setSuccess(true);
      toast.success("Payment details submitted for verification!");
    } catch (err: any) {
      console.error('Membership request error:', err);
      toast.error(err.message || "Failed to submit request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gradient-card border border-amber-500/30 shadow-elegant rounded-[3rem] p-10 text-center relative overflow-hidden animate-in zoom-in duration-500">
          <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 to-transparent pointer-events-none" />
          <div className="h-24 w-24 mx-auto bg-amber-500/10 rounded-full flex items-center justify-center mb-6">
            <Zap className="h-12 w-12 text-amber-500 animate-pulse" />
          </div>
          <h1 className="text-3xl font-extrabold text-foreground mb-2">Payment Submitted! ⏳</h1>
          <p className="text-lg text-muted-foreground font-medium mb-8">
            Your request is currently under review.
          </p>

          <div className="space-y-4 text-sm text-left bg-muted/30 p-6 rounded-2xl border border-border/40 mb-8">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-amber-500" />
              <span className="font-semibold text-foreground">Transaction ID: {transactionId}</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-amber-500" />
              <span className="font-semibold text-foreground">Verification status: PENDING</span>
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-amber-500" />
              <span className="font-semibold text-foreground text-xs leading-tight">
                Admin will verify your payment and activate benefits within 24 hours.
              </span>
            </div>
          </div>

          <Link to="/dashboard">
            <Button className="w-full h-14 rounded-2xl bg-gradient-brand text-white font-bold text-lg shadow-xl hover:scale-105 transition-transform">
              Back to Dashboard <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <p className="mt-6 text-xs text-muted-foreground">
            You will receive an email once your membership is activated.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-extrabold">Complete Your Upgrade</h1>
        <p className="text-muted-foreground mt-2 font-medium">
          Secure checkout for CampusRide Premium
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-10 max-w-5xl mx-auto">
        {/* Left: Summary */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-8 rounded-[2.5rem] bg-gradient-card border border-amber-500/20 shadow-elegant relative overflow-hidden">
            <Sparkles className="absolute -top-4 -right-4 h-24 w-24 text-amber-500/10" />
            <div className="flex items-center gap-4 mb-6">
              <div className="h-14 w-14 rounded-2xl bg-gradient-premium-gold flex items-center justify-center shadow-glow">
                <Crown className="h-7 w-7 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-xl text-foreground">Premium Plan</h3>
                <p className="text-sm text-muted-foreground">12 Months Access</p>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-border/40">
              <div className="flex justify-between text-sm text-muted-foreground font-medium">
                <span>Membership Fee</span>
                <span>₹846.61</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground font-medium">
                <span>GST (18%)</span>
                <span>₹152.39</span>
              </div>

              {/* Coupon Section */}
              <div className="pt-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Coupon Code"
                    className="h-10 rounded-xl bg-background border-border/40 text-xs font-bold uppercase tracking-widest"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl font-bold hover:bg-amber-500 hover:text-white border-amber-500/20"
                    onClick={() => toast.success("Coupon applied!")}
                  >
                    Apply
                  </Button>
                </div>
              </div>

              <div className="flex justify-between items-center text-xl font-black pt-4 border-t border-border/40 text-foreground">
                <span>Total Payable</span>
                <span className="text-amber-500">₹999.00</span>
              </div>
            </div>

            <div className="mt-8 p-4 rounded-2xl bg-green-500/5 border border-green-500/20 flex items-start gap-3">
              <ShieldCheck className="h-6 w-6 text-green-500 shrink-0" />
              <p className="text-xs font-semibold text-green-600 dark:text-green-400">
                Guaranteed safe & secure checkout. Payment data is never stored on our servers.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Payment Form */}
        <div className="lg:col-span-3">
          <div className="p-8 sm:p-10 rounded-[2.5rem] bg-card border border-border/60 shadow-elegant">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" /> Payment Method
            </h3>

            <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start mb-8 p-6 rounded-3xl bg-muted/30 border border-border/40">
              <div className="relative h-40 w-40 p-3 bg-white rounded-2xl shadow-md shrink-0">
                <QrCode className="h-full w-full text-black" />
                <div className="absolute inset-0 flex items-center justify-center opacity-10">
                  <Zap className="h-16 w-16 text-primary fill-primary" />
                </div>
              </div>
              <div className="space-y-3 text-center sm:text-left w-full">
                <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-2">
                  Scan & Pay
                </div>
                <h4 className="font-bold text-foreground">UPI ID: campusride.premium@okaxis</h4>
                <p className="text-xs text-muted-foreground">
                  Scan the QR code with any UPI app (GPay, PhonePe, Paytm) to pay exactly ₹999.
                </p>
                <div className="flex gap-2 justify-center sm:justify-start pt-2 opacity-50">
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
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="txId" className="font-bold">
                  Transaction ID (After Payment)
                </Label>
                <Input
                  id="txId"
                  placeholder="Enter 12-digit Ref No."
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="h-14 rounded-2xl text-center sm:text-left text-lg font-bold tracking-widest uppercase bg-background focus-visible:ring-amber-500/50 focus-visible:border-amber-500"
                />
              </div>

              <Button
                onClick={handlePayment}
                disabled={submitting}
                className="w-full h-14 rounded-2xl bg-gradient-premium-gold font-extrabold text-lg shadow-glow hover:opacity-90 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {submitting ? "Verifying Payment..." : "Confirm Upgrade"}{" "}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
