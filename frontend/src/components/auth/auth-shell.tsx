import type { ReactNode } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { Link } from "@tanstack/react-router";

interface AuthShellProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  footer?: ReactNode;
}

export function AuthShell({ children, title, subtitle, footer }: AuthShellProps) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden gradient-hero">
      {/* Floating orbs */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/30 blur-3xl animate-float" />
        <div className="absolute top-1/2 -right-40 h-[500px] w-[500px] rounded-full bg-primary-glow/20 blur-3xl animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-lime/10 blur-3xl animate-float" style={{ animationDelay: "4s" }} />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="flex items-center justify-between px-6 py-6 md:px-10">
          <Link to="/" className="transition-opacity hover:opacity-80">
            <BrandLogo size="md" />
          </Link>
          <Link
            to="/"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Back to home
          </Link>
        </header>

        <main className="flex flex-1 items-center justify-center px-4 py-8 md:py-12">
          <div className="w-full max-w-md animate-fade-in-up">
            <div className="glass-card shadow-elegant rounded-3xl p-8 md:p-10">
              <div className="mb-8 text-center">
                <div className="mb-6 flex justify-center md:hidden">
                  <BrandLogo size="lg" />
                </div>
                <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
                  {title}
                </h1>
                {subtitle && (
                  <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
                )}
              </div>
              {children}
            </div>
            {footer && <div className="mt-6 text-center text-sm">{footer}</div>}
            <p className="mt-8 text-center text-xs text-muted-foreground/70">
              Ride Smart. Ride Together. · CampusRide © {new Date().getFullYear()}
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
