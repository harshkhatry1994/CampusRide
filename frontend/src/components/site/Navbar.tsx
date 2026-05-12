import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Bike, Sparkles, User as UserIcon, LogOut, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { BackButton } from "./BackButton";
import { useAuth } from "@/context/AuthContext";

const links = [
  { to: "/", label: "Home" },
  { to: "/bikes", label: "Motorcycles" },
  { to: "/about", label: "About" },
] as const;

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();
  const isLoggedIn = !!token;

  const handleLogout = () => {
    logout();
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-[100] w-full border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary shadow-glow transition-transform group-hover:scale-105">
            <Bike className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            Campus<span className="text-primary">Ride</span> 🚲
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: l.to === "/" }}
              className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              activeProps={{ className: "px-3 py-2 text-sm text-foreground font-medium" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {location.pathname !== "/" && <BackButton className="hidden sm:inline-flex" />}
          <ThemeToggle />

          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10 mr-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {user?.name} ({user?.role})
                </span>
              </div>

              <Button
                asChild
                variant="outline"
                size="sm"
                className="hidden sm:inline-flex shadow-sm"
              >
                <Link
                  to={user?.role === "admin" ? "/admin" : "/dashboard"}
                  className="flex items-center gap-2"
                >
                  <UserIcon className="h-3.5 w-3.5" />
                  {user?.role === "admin" ? "Admin Panel" : "Dashboard"}
                </Link>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-destructive"
              >
                <LogOut className="h-3.5 w-3.5 mr-1.5" />
                Sign out
              </Button>

              {user?.role === "admin" ? (
                <div className="relative overflow-hidden group border border-amber-500/30 bg-amber-500/10 text-amber-500 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  <Crown className="h-4 w-4 animate-pulse text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                  <span className="font-black tracking-[0.2em] uppercase text-[10px] drop-shadow-md">
                    Boss
                  </span>
                </div>
              ) : (
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="relative overflow-hidden group border border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 hover:shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all duration-300"
                >
                  <Link to="/premium" className="flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 animate-pulse text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                    <span className="relative z-10 font-bold tracking-widest uppercase text-[10px] drop-shadow-md">
                      Premium
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-200/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">Sign in</Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="relative overflow-hidden group border border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 hover:shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all duration-300"
              >
                <Link to="/premium" className="flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 animate-pulse text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                  <span className="relative z-10 font-bold tracking-widest uppercase text-[10px] drop-shadow-md">
                    Premium
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-200/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
