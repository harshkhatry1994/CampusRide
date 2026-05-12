import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ArrowRight, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/booking/success")({
  head: () => ({ meta: [{ title: "Booking Confirmed! — CampusRide" }] }),
  component: SuccessPage,
});

function SuccessPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <div className="inline-grid h-24 w-24 place-items-center rounded-full bg-green-500/10 text-green-500 border border-green-500/20 mb-8 animate-in zoom-in-50 duration-500">
        <CheckCircle2 className="h-12 w-12" />
      </div>
      <h1 className="text-4xl font-extrabold tracking-tight mb-4">Ride Confirmed!</h1>
      <p className="text-xl text-muted-foreground mb-10 max-w-lg mx-auto">
        Your booking has been received. Our team will verify your documents and payment shortly.
      </p>

      <div className="p-8 rounded-3xl bg-gradient-card border border-border/60 shadow-elegant mb-10 text-left space-y-6">
        <div className="flex justify-between items-center border-b border-border/40 pb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Booking Status
          </span>
          <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 px-4">
            Verification Pending
          </Badge>
        </div>
        <div className="space-y-4">
          <h3 className="font-bold">Next Steps:</h3>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-3">
              <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                1
              </span>{" "}
              Document verification by Admin (15-30 mins)
            </li>
            <li className="flex gap-3">
              <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                2
              </span>{" "}
              Receive pickup hub location on WhatsApp/Email
            </li>
            <li className="flex gap-3">
              <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                3
              </span>{" "}
              Reach hub and unlock your ride!
            </li>
          </ul>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        <Button asChild size="lg" className="rounded-2xl bg-gradient-brand shadow-glow px-10">
          <Link to="/dashboard">
            Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button variant="outline" size="lg" className="rounded-2xl px-10">
          <Download className="mr-2 h-4 w-4" /> Download Receipt
        </Button>
      </div>
    </div>
  );
}
