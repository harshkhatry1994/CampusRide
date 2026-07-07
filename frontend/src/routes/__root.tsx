import { Outlet, createRootRoute } from "@tanstack/react-router";
import "../styles.css";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { useRouterState } from "@tanstack/react-router";
import { CustomerLayout } from "@/layouts/CustomerLayout";

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

// Routes that use their own full-screen layout
const PORTAL_ROUTES = ["/admin", "/complete-profile"];

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
          <CustomerLayout>
            <Outlet />
            <Toaster richColors position="top-right" duration={2000} />
          </CustomerLayout>
        )}
      </AuthProvider>
    </ThemeProvider>
  );
}
