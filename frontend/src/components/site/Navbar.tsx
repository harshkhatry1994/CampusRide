import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Bike, Sparkles, User as UserIcon, LogOut, Crown, LayoutDashboard, Settings, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { BackButton } from "./BackButton";
import { useAuth } from "@/context/AuthContext";
import { TelegramButton } from "../dashboard/TelegramButton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const links = [
  { to: "/", label: "Home" },
  { to: "/bikes", label: "Motorcycles" },
  { to: "/about", label: "About" },
] as const;

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, token, logout, isAdmin } = useAuth();
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
              {isAdmin ? (
                <div className="hidden lg:flex relative overflow-hidden group border border-amber-500/30 bg-amber-500/10 text-amber-500 px-3 py-1.5 rounded-full items-center gap-1.5 mr-2">
                  <Crown className="h-4 w-4 animate-pulse text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                  <span className="font-black tracking-[0.2em] uppercase text-[10px] drop-shadow-md">
                    Boss
                  </span>
                </div>
              ) : (
                <>
                  <TelegramButton />
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className={`hidden sm:flex relative overflow-hidden group border transition-all duration-300 mr-2 ${
                      user?.is_premium
                        ? "border-amber-400/80 bg-amber-500/20 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.5)]"
                        : "border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 hover:shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                    }`}
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

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10 border border-border shadow-sm transition-transform hover:scale-105">
                      <AvatarImage src={user?.avatar_url || ""} alt={user?.name || "User"} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {user?.name?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 mt-2 rounded-[1rem] border-border shadow-xl p-2 bg-card/95 backdrop-blur-md" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal px-2 py-1.5">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-black leading-none text-foreground">{user?.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border/50 my-2" />
                  <DropdownMenuItem asChild className="rounded-xl focus:bg-primary/10 focus:text-primary cursor-pointer px-3 py-2.5 transition-colors">
                    <Link to={isAdmin ? "/admin" : "/dashboard"} search={isAdmin ? undefined : { tab: 'my-rides' }} className="flex items-center w-full">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>{isAdmin ? "Admin Panel" : "My Bookings"}</span>
                    </Link>
                  </DropdownMenuItem>
                  {!isAdmin && (
                    <>
                      <DropdownMenuItem asChild className="rounded-xl focus:bg-primary/10 focus:text-primary cursor-pointer px-3 py-2.5 transition-colors">
                        <Link to="/dashboard" search={{ tab: 'profile' }} className="flex items-center w-full">
                          <UserIcon className="mr-2 h-4 w-4" />
                          <span>My Profile</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-xl focus:bg-primary/10 focus:text-primary cursor-pointer px-3 py-2.5 transition-colors">
                        <Link to="/dashboard" search={{ tab: 'notifications' }} className="flex items-center w-full">
                          <Bell className="mr-2 h-4 w-4" />
                          <span>Notifications</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-xl focus:bg-muted cursor-pointer px-3 py-2.5 transition-colors">
                        <Link to="/dashboard" search={{ tab: 'settings' }} className="flex items-center w-full text-muted-foreground hover:text-foreground">
                          <Settings className="mr-2 h-4 w-4" />
                          <span>Account Settings</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator className="bg-border/50 my-2" />
                  <DropdownMenuItem onClick={handleLogout} className="rounded-xl focus:bg-destructive/10 focus:text-destructive text-destructive cursor-pointer px-3 py-2.5 transition-colors">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

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
