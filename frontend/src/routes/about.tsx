import { createFileRoute } from "@tanstack/react-router";
import { Zap, Shield, Heart, Leaf } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About CampusRide — Premium motorcycle rentals" },
      {
        name: "description",
        content:
          "We make premium motorcycle rentals effortless, affordable and ready when you are.",
      },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-16">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Premium rides, on demand.</h1>
        <p className="mt-4 text-muted-foreground text-lg">
          CampusRide started with a simple idea: renting a great motorcycle should be as easy as
          ordering food. Today we power thousands of rides every week across India.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 mt-12">
        {[
          { icon: Zap, title: "Built fast", desc: "Reserve and unlock in under 30 seconds." },
          { icon: Shield, title: "Built safe", desc: "Verified riders and 24/7 ride support." },
          { icon: Heart, title: "Built for you", desc: "Honest pricing, no hidden fees." },
          {
            icon: Leaf,
            title: "Built well-kept",
            desc: "Every motorcycle serviced before each ride.",
          },
        ].map((f) => (
          <div key={f.title} className="rounded-2xl bg-gradient-card border border-border/60 p-6">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-brand shadow-glow mb-3">
              <f.icon className="h-5 w-5 text-primary-foreground" />
            </div>
            <h3 className="font-semibold">{f.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
