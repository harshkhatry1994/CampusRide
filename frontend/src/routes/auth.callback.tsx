import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";
import { isAdminRole, getRedirectPath } from "@/lib/roles";

export const Route = createFileRoute("/auth/callback")({
  // Don't validate/strip search params — let Supabase SDK read them from the URL
  head: () => ({ meta: [{ title: "Signing in — CampusRide" }] }),
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;

    console.log("[AuthCallback] Page loaded, URL:", window.location.href);

    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const searchParams = new URLSearchParams(window.location.search);

    const error = hashParams.get("error") || searchParams.get("error");
    const errorDesc = hashParams.get("error_description") || searchParams.get("error_description");

    if (error) {
      console.error("[AuthCallback] OAuth error from URL:", error, errorDesc);
      setErrorMsg(errorDesc || error || "Authentication failed");
      setStatus("error");
      toast.error(errorDesc || "Authentication failed");
      setTimeout(() => navigate({ to: "/login" }), 3000);
      return;
    }

    const handleSuccessfulSession = async (session: any) => {
      if (handled.current) return;
      handled.current = true;
      console.log("[AuthCallback] Session established for:", session.user.email);

      try {
        const authUser = session.user;
        const name = authUser.user_metadata?.full_name || authUser.email?.split("@")[0] || "User";
        const avatarUrl = authUser.user_metadata?.avatar_url || null;

        // Sync to public.profiles table
        const { data: existingProfile } = await supabase.from("profiles").select("id").eq("id", authUser.id).maybeSingle();
        if (!existingProfile) {
          console.log("[AuthCallback] Upserting user in 'profiles' table...");
          await supabase.from("profiles").insert({ id: authUser.id, full_name: name, email: authUser.email, avatar_url: avatarUrl });
        } else {
          await supabase.from("profiles").update({ full_name: name, avatar_url: avatarUrl }).eq("id", authUser.id);
        }

        setStatus("success");
        toast.success("Welcome to CampusRide! 🚀");
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .single();

        if (error) {
          console.error("[AuthCallback] Critical Database Error loading profile:", error);
          throw error;
        }

        const computedIsAdmin = isAdminRole(profile?.role);
        const profileComplete = !!(profile?.full_name && profile?.phone && profile?.department);
        const redirectDest = getRedirectPath(profile?.role, profileComplete);

        console.log("[AuthCallback] Email:", authUser.email);
        console.log("[AuthCallback] Role from database:", profile?.role);
        console.log("[AuthCallback] Computed isAdmin:", computedIsAdmin);
        console.log("[AuthCallback] Redirect destination:", redirectDest);

        setTimeout(() => {
          navigate({ to: redirectDest });
        }, 200);
      } catch (err: any) {
        console.error("[AuthCallback] Unexpected error during sync:", err);
        setErrorMsg(err.message || "Unexpected error during profile sync");
        setStatus("error");
        setTimeout(() => navigate({ to: "/login" }), 3000);
      }
    };

    // Check if session is already established
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        handleSuccessfulSession(session);
      } else {
        console.warn("[AuthCallback] No session or code found, redirecting to login");
        setErrorMsg("Session could not be established. Please try again.");
        setStatus("error");
        setTimeout(() => navigate({ to: "/login" }), 3000);
      }
    });

  }, [navigate]);

  if (status === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <ShieldCheck className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-black text-foreground">Auth Failed</h1>
          <p className="text-muted-foreground text-sm">{errorMsg}</p>
          <p className="text-xs text-muted-foreground">Redirecting you back to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <div className="text-center space-y-6">
        <div className="relative">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto animate-pulse">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-foreground">Signing you in...</h1>
          <p className="text-muted-foreground text-sm">Setting up your CampusRide account</p>
        </div>
      </div>
    </div>
  );
}
