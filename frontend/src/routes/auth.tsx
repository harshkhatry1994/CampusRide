import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { SignupForm } from "@/components/auth/signup-form";
import { PhoneForm } from "@/components/auth/phone-form";
import { SocialButtons } from "@/components/auth/social-buttons";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "@tanstack/react-router";
import { getRedirectPath } from "@/lib/roles";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in · CampusRide" },
      { name: "description", content: "Sign in or create your CampusRide account. Ride Smart. Ride Together." },
      { property: "og:title", content: "Sign in · CampusRide" },
      { property: "og:description", content: "Verified student ride-sharing. Ride Smart. Ride Together." },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup";

function AuthPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [method, setMethod] = useState<"email" | "phone">("email");
  const navigate = useNavigate();

  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, full_name, phone, college")
        .eq("id", user.id)
        .single();

      const profileComplete = !!(
        profile?.full_name &&
        profile?.phone &&
        profile?.college
      );

      const redirect = getRedirectPath(profile?.role, profileComplete);

      navigate({ to: redirect });
    }

    checkSession();
  }, [navigate]);

  return (
    <AuthShell
      title={mode === "signin" ? "Welcome back" : "Join CampusRide"}
      subtitle={
        mode === "signin"
          ? "Ride Smart. Ride Together."
          : "Verified students only. Get started in under a minute."
      }
      footer={
        mode === "signin" ? (
          <span className="text-muted-foreground">
            New to CampusRide?{" "}
            <button
              onClick={() => setMode("signup")}
              className="font-medium text-primary hover:text-primary-glow"
            >
              Create an account
            </button>
          </span>
        ) : (
          <span className="text-muted-foreground">
            Already have an account?{" "}
            <button
              onClick={() => setMode("signin")}
              className="font-medium text-primary hover:text-primary-glow"
            >
              Sign in
            </button>
          </span>
        )
      }
    >
      <SocialButtons />

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-xs uppercase tracking-wider text-muted-foreground">or</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      {mode === "signin" ? (
        <LoginForm />
      ) : (
        <SignupForm onSuccess={() => { /* handled inline */ }} />
      )}

      {mode === "signin" && (
        <p className="mt-5 text-center text-xs text-muted-foreground">
          <Link to="/forgot-password" className="hover:text-foreground">Resend verification email →</Link>
        </p>
      )}
    </AuthShell>
  );
}
