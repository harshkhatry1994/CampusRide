import { useState, useEffect } from "react";
import { z } from "zod";
import { Phone, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import { getRedirectPath } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const phoneSchema = z.string().trim().regex(/^\+?[0-9\s-]{7,20}$/, "Enter a valid phone number");

export function PhoneForm() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  async function sendOtp(e?: React.FormEvent) {
    e?.preventDefault();
    const parsed = phoneSchema.safeParse(phone);
    if (!parsed.success) { setError(parsed.error.issues[0].message); return; }
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ phone: parsed.data });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setStep("otp");
    setCountdown(45);
    toast.success("Verification code sent");
  }

  async function verifyOtp(code: string) {
    setLoading(true);
    const { data, error } = await supabase.auth.verifyOtp({ phone, token: code, type: "sms" });
    setLoading(false);
    if (error) { toast.error(error.message); setOtp(""); return; }
    toast.success("Verified!");
    // Role-based redirect
    try {
      const userId = data.user?.id;
      if (userId) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, full_name, phone")
          .eq("id", userId)
          .maybeSingle();
        const profileComplete = !!(profile?.full_name && profile?.phone);
        navigate({ to: getRedirectPath(profile?.role, profileComplete) });
        return;
      }
    } catch {
      // fallback
    }
    navigate({ to: "/dashboard" });
  }

  if (step === "otp") {
    return (
      <div className="space-y-5">
        <button
          type="button"
          onClick={() => { setStep("phone"); setOtp(""); }}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Change phone number
        </button>
        <div className="text-center">
          <div className="relative mx-auto mb-4 h-16 w-16">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse-ring" />
            <div className="absolute inset-0 flex items-center justify-center rounded-full gradient-primary">
              <Phone className="h-7 w-7 text-primary-foreground" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Enter the 6-digit code sent to<br />
            <span className="font-medium text-foreground">{phone}</span>
          </p>
        </div>
        <div className="flex justify-center">
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={(v) => {
              setOtp(v);
              if (v.length === 6) verifyOtp(v);
            }}
            autoFocus
          >
            <InputOTPGroup>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <InputOTPSlot key={i} index={i} className="h-12 w-11 text-lg" />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>
        {loading && (
          <div className="flex justify-center"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>
        )}
        <div className="text-center text-xs text-muted-foreground">
          {countdown > 0 ? (
            <>Resend code in <span className="font-medium text-foreground">{countdown}s</span></>
          ) : (
            <button
              type="button"
              onClick={() => sendOtp()}
              className="font-medium text-primary hover:text-primary-glow"
            >
              Resend code
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={sendOtp} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="phone">Mobile number</Label>
        <div className="relative">
          <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+1 555 123 4567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="h-11 pl-10 bg-white/[0.03] border-white/10"
          />
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <p className="text-xs text-muted-foreground">We'll text you a 6-digit verification code.</p>
      </div>
      <Button
        type="submit"
        disabled={loading}
        className="h-11 w-full gradient-primary text-primary-foreground font-semibold shadow-elegant hover:shadow-glow transition-all"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send verification code"}
      </Button>
    </form>
  );
}
