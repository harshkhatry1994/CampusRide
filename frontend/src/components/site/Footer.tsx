import { Link } from "@tanstack/react-router";
import { Bike, Github, Twitter, Instagram } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/60 mt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 grid gap-8 md:grid-cols-4">
        <div className="md:col-span-2">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-brand shadow-glow">
              <Bike className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">
              Campus<span className="text-gradient-brand">Ride</span> 🚲
            </span>
          </Link>
          <p className="mt-3 text-sm text-muted-foreground max-w-md">
            Premium motorcycle rentals — KTM, TVS Apache, Royal Enfield and more. Reserve in
            seconds, ride in minutes.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-3">Explore</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/bikes" className="hover:text-foreground">
                Browse motorcycles
              </Link>
            </li>
            <li>
              <Link to="/about" className="hover:text-foreground">
                About
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-foreground">
                Contact
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-3">Follow</h4>
          <div className="flex gap-3 text-muted-foreground">
            <a href="#" aria-label="Twitter" className="hover:text-foreground">
              <Twitter className="h-5 w-5" />
            </a>
            <a href="#" aria-label="Instagram" className="hover:text-foreground">
              <Instagram className="h-5 w-5" />
            </a>
            <a href="#" aria-label="GitHub" className="hover:text-foreground">
              <Github className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-border/60 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} CampusRide. All rights reserved.
      </div>
    </footer>
  );
}
