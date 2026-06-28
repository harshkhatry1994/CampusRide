import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ShieldCheck,
  FileText,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  FileWarning,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/policy/$bookingId")({
  component: PolicyAgreementPage,
});

function PolicyAgreementPage() {
  const { bookingId } = Route.useParams();
  const navigate = useNavigate();

  const [agreed, setAgreed] = useState(false);

  const handleProceed = () => {
    if (!agreed) {
      toast.error("Please accept the policies before continuing to payment.");
      return;
    }
    navigate({ to: "/payment/$bookingId", params: { bookingId }, replace: true });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-muted/20 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gradient-brand shadow-glow mb-4">
            <ShieldCheck className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Review CampusRide Policies
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Please carefully review and acknowledge our rental terms before proceeding to your final
            payment.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="h-2 w-16 bg-primary rounded-full" />
          <div className="h-2 w-16 bg-primary rounded-full animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
          <div className="h-2 w-16 bg-muted rounded-full" />
        </div>

        {/* Single Policy Card */}
        <div className="bg-card border border-border/60 shadow-elegant rounded-2xl overflow-hidden">
          <div className="bg-muted/30 px-6 py-4 border-b border-border/40">
            <h2 className="text-xl font-bold flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary" /> CampusRide Policies & Terms
            </h2>
          </div>

          <div className="p-6 space-y-8 text-sm text-muted-foreground leading-relaxed">
            {/* Refund Policy */}
            <div>
              <h3 className="text-base font-bold text-foreground mb-2 flex items-center gap-2">
                <Wallet className="h-4 w-4 text-primary" /> Refund Policy
              </h3>
              <p>
                At <strong className="text-foreground">CampusRide</strong>, we process all refunds
                back to your original payment method within{" "}
                <strong className="text-foreground">3-5 business days</strong>.
              </p>
              <ul className="space-y-1 list-disc pl-5 mt-2">
                <li>
                  <strong className="text-foreground">Security Deposits:</strong> Fully refunded
                  within 24 hours of successful vehicle drop-off, provided no damages are found.
                </li>
                <li>
                  <strong className="text-foreground">Damage Deductions:</strong> If the bike is
                  returned with damages not present at pickup, repair costs will be deducted from
                  your deposit.
                </li>
                <li>
                  <strong className="text-foreground">Traffic Fines:</strong> Any challans or fines
                  incurred during your rental period will be deducted from your deposit or billed
                  separately.
                </li>
                <li>
                  <strong className="text-foreground">Fuel Policy:</strong> Vehicles must be
                  returned with the same fuel level as provided. A refueling penalty will be applied
                  otherwise.
                </li>
              </ul>
            </div>

            {/* Cancellation Policy */}
            <div className="border-t border-border/40 pt-6">
              <h3 className="text-base font-bold text-foreground mb-2 flex items-center gap-2">
                <FileWarning className="h-4 w-4 text-rose-500" /> Cancellation Policy
              </h3>
              <p>
                We understand plans change. Our cancellation rules are designed to be fair to both
                our riders and our fleet managers.
              </p>
              <ul className="space-y-1 list-disc pl-5 mt-2">
                <li>
                  <strong className="text-foreground">Free Cancellation:</strong> Cancel 24 hours
                  before your pickup time for a 100% full refund.
                </li>
                <li>
                  <strong className="text-foreground">Late Cancellation:</strong> Cancellations made
                  within 24 hours of pickup will incur a{" "}
                  <strong className="text-rose-500">50% penalty</strong> on the rental amount.
                </li>
                <li>
                  <strong className="text-foreground">No-Show:</strong> Failure to pick up the
                  vehicle within 2 hours of the scheduled time without notice will be treated as a
                  no-show, resulting in a 100% penalty.
                </li>
              </ul>
            </div>

            {/* Rental Terms */}
            <div className="border-t border-border/40 pt-6">
              <h3 className="text-base font-bold text-foreground mb-2 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-blue-500" /> Rental Terms & Conditions
              </h3>
              <p>
                By renting from CampusRide, you accept full responsibility for the vehicle during
                the rental period.
              </p>
              <ul className="space-y-1 list-disc pl-5 mt-2">
                <li>
                  You must carry a valid original Driving Licence at all times. Learner's licences
                  are strictly prohibited.
                </li>
                <li>
                  The vehicle is solely for personal use and cannot be used for commercial
                  deliveries, racing, or illegal activities.
                </li>
                <li>
                  CampusRide holds the right to cancel the booking at the pickup location if
                  verification documents fail or the rider is deemed unfit to ride (e.g., under the
                  influence).
                </li>
              </ul>
            </div>

            {/* Single Agreement Checkbox */}
            <div className="mt-8 p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-3">
              <Checkbox
                id="master-agree"
                checked={agreed}
                onCheckedChange={(c) => setAgreed(c as boolean)}
                className="mt-1 border-primary data-[state=checked]:bg-primary h-5 w-5"
              />
              <label
                htmlFor="master-agree"
                className="font-semibold text-foreground cursor-pointer select-none text-base"
              >
                I have read and agree to all the above policies (Refund, Cancellation, and Rental
                Terms)
              </label>
            </div>
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="sticky bottom-6 z-40 bg-card/80 backdrop-blur-xl border border-border/60 p-4 rounded-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] flex flex-col sm:flex-row items-center justify-between gap-4 mt-12">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">
              {agreed ? (
                <span className="text-green-500 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" /> Policies accepted
                </span>
              ) : (
                "Accept policies to proceed"
              )}
            </span>
          </div>
          <Button
            size="lg"
            onClick={handleProceed}
            className={cn(
              "w-full sm:w-auto font-bold transition-all duration-300 gap-2 shadow-lg",
              agreed
                ? "bg-gradient-brand text-white hover:scale-105 shadow-glow"
                : "bg-muted text-muted-foreground cursor-not-allowed opacity-50",
            )}
          >
            Proceed to Payment <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
