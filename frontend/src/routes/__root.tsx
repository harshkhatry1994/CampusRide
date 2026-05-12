import { Outlet, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import appCss from "../styles.css?url";
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
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "CampusRide 🚲 — Premium motorcycle rentals" },
      {
        name: "description",
        content:
          "Rent KTM, TVS Apache, Royal Enfield and more. CampusRide makes premium motorcycle rentals effortless.",
      },
      { property: "og:title", content: "CampusRide 🚲 — Premium motorcycle rentals" },
      { property: "og:description", content: "Rent premium motorcycles in seconds." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

import { ThemeProvider } from "@/context/ThemeContext";

function RootComponent() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="flex min-h-screen flex-col bg-background text-foreground transition-colors duration-300">
          <Navbar />
          <main className="flex-1">
            <Outlet />
          </main>
          <Footer />
          <ChatBot />
          <Toaster richColors position="top-right" duration={2000} />
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}
