import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertCircle, RefreshCw, Home, PhoneCall, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/payment-failed")({
  head: () => ({ meta: [{ title: "Payment Failed — CampusRide" }] }),
  component: PaymentFailedPage,
});

function PaymentFailedPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <div className="inline-grid h-24 w-24 place-items-center rounded-full bg-destructive/10 text-destructive border border-destructive/20 mb-8 animate-in shake-in">
        <AlertCircle className="h-12 w-12" />
      </div>
      <h1 className="text-4xl font-extrabold tracking-tight mb-4">Transaction Failed</h1>
      <p className="text-xl text-muted-foreground mb-10">
        We couldn't process your payment. Don't worry, no funds have been debited from your account.
      </p>

      <div className="p-8 rounded-3xl bg-gradient-card border border-border/60 shadow-elegant mb-10 text-left space-y-6">
        <h3 className="font-bold flex items-center gap-2 text-destructive">
          <AlertCircle className="h-4 w-4" /> Why did this happen?
        </h3>
        <ul className="space-y-3 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-destructive" />
            Incorrect UPI Transaction ID or Reference Number.
          </li>
          <li className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-destructive" />
            Payment timed out on your banking app.
          </li>
          <li className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-destructive" />
            Unstable internet connection during verification.
          </li>
        </ul>
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        <Button
          asChild
          size="lg"
          className="rounded-2xl px-10 h-14 bg-destructive hover:bg-destructive/90 text-white font-bold shadow-lg"
        >
          <Link to="/bikes">
            <RefreshCw className="mr-2 h-4 w-4" /> Try Again
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          size="lg"
          className="rounded-2xl px-10 h-14 border-border/60"
        >
          <Link to="/contact">
            <PhoneCall className="mr-2 h-4 w-4" /> Call Support
          </Link>
        </Button>
      </div>

      <div className="mt-12 flex items-center justify-center gap-2 text-muted-foreground">
        <MessageCircle className="h-4 w-4" />
        <span className="text-sm">Chat with us for instant payment help</span>
      </div>
    </div>
  );
}
