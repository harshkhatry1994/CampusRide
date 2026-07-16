import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.5 14.6 2.5 12 2.5 6.8 2.5 2.6 6.7 2.6 12s4.2 9.5 9.4 9.5c5.4 0 9-3.8 9-9.2 0-.6-.06-1.1-.15-1.6H12z"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
    </svg>
  );
}

export function SocialButtons() {
  const [loading, setLoading] = useState<"google" | "apple" | null>(null);

  async function handleGoogle() {
    setLoading("google");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin + "/auth/callback",
          queryParams: { access_type: "offline", prompt: "consent" },
        },
      });
      if (error) {
        toast.error(error.message || "Couldn't sign in with Google");
        setLoading(null);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
      setLoading(null);
    }
  }

  function handleApple() {
    toast.info("Apple sign-in is not available yet. Please use Google or email.");
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <Button type="button" variant="outline" className="h-11 bg-white/[0.03] border-white/10 hover:bg-white/[0.06]" onClick={handleGoogle} disabled={loading !== null}>
        {loading === "google" ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
        <span className="ml-2 font-medium">Google</span>
      </Button>
      <Button type="button" variant="outline" className="h-11 bg-white/[0.03] border-white/10 hover:bg-white/[0.06] opacity-50 cursor-not-allowed" onClick={handleApple} disabled={loading !== null}>
        <AppleIcon />
        <span className="ml-2 font-medium">Apple</span>
      </Button>
    </div>
  );
}
