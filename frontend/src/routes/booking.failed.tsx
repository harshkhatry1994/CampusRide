import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertCircle, Home, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/booking/failed")({
  head: () => ({ meta: [{ title: "Booking Failed — CampusRide" }] }),
  component: FailedPage,
});

function FailedPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <div className="inline-grid h-24 w-24 place-items-center rounded-full bg-destructive/10 text-destructive border border-destructive/20 mb-8">
        <AlertCircle className="h-12 w-12" />
      </div>
      <h1 className="text-4xl font-extrabold tracking-tight mb-4">Payment Failed</h1>
      <p className="text-xl text-muted-foreground mb-10">
        Something went wrong with your transaction. Don't worry, your money is safe.
      </p>

      <div className="p-8 rounded-3xl bg-gradient-card border border-border/60 shadow-elegant mb-10 text-left">
        <h3 className="font-bold mb-4">Common issues:</h3>
        <ul className="space-y-3 text-sm text-muted-foreground">
          <li>• Incorrect UPI Transaction ID entered</li>
          <li>• Documents were too blurry to read</li>
          <li>• Network timeout during upload</li>
        </ul>
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        <Button asChild size="lg" variant="default" className="rounded-2xl px-10">
          <Link to="/bikes">Try Again</Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="rounded-2xl px-10">
          <Link to="/contact">
            <PhoneCall className="mr-2 h-4 w-4" /> Contact Support
          </Link>
        </Button>
      </div>
    </div>
  );
}
