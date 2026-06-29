import { Outlet, createRootRoute } from "@tanstack/react-router";
import "../styles.css";
import { Toaster } from "@/components/ui/sonner";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { ChatBot } from "@/components/site/ChatBot";
import { AuthProvider } from "@/context/AuthContext";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-7xl font-bold text-gradient-brand">404</h1>
        <p className="mt-3 text-muted-foreground">This page took a wrong turn.</p>
        <a
          href="/"
          className="mt-6 inline-block rounded-md bg-gradient-brand px-4 py-2 text-sm font-medium text-primary-foreground shadow-glow"
        >
          Back home
        </a>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

import { ThemeProvider } from "@/context/ThemeContext";
import { useRouterState } from "@tanstack/react-router";

// Routes that use their own full-screen layout (no Navbar/Footer)
const PORTAL_ROUTES = ["/admin-portal", "/admin"];

function RootComponent() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isPortal = PORTAL_ROUTES.some((r) => pathname.startsWith(r));

  return (
    <ThemeProvider>
      <AuthProvider>
        {isPortal ? (
          <>
            <Outlet />
            <Toaster richColors position="top-right" duration={2000} />
          </>
        ) : (
          <div className="flex min-h-screen flex-col bg-background text-foreground transition-colors duration-300">
            <Navbar />
            <main className="flex-1">
              <Outlet />
            </main>
            <Footer />
            <ChatBot />
            <Toaster richColors position="top-right" duration={2000} />
          </div>
        )}
      </AuthProvider>
    </ThemeProvider>
  );
}
