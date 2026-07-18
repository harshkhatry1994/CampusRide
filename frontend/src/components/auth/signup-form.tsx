import { useState } from "react";
import { z } from "zod";
import { Loader2, Eye, EyeOff, Mail, Lock, User, Phone, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { PasswordStrength, scorePassword } from "./password-strength";

const schema = z
  .object({
    fullName: z.string().trim().min(2, "Enter your full name").max(80),
    email: z.string().trim().email("Enter a valid email").max(255),
    mobile: z.string().trim().min(7, "Enter a valid mobile number").max(20).regex(/^\+?[0-9\s-]+$/, "Digits only"),
    password: z.string().min(8, "At least 8 characters").max(72),
    confirm: z.string(),
    terms: z.literal(true, { errorMap: () => ({ message: "Required" }) }),
    privacy: z.literal(true, { errorMap: () => ({ message: "Required" }) }),
    marketing: z.boolean().optional(),
  })
  .refine((d) => d.password === d.confirm, {
    path: ["confirm"],
    message: "Passwords don't match",
  })
  .refine((d) => scorePassword(d.password) >= 2, {
    path: ["password"],
    message: "Choose a stronger password",
  });

export function SignupForm({ onSuccess }: { onSuccess: (email: string) => void }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);

  const isCollegeEmail = /\.(edu|ac\.[a-z]{2,3})$/i.test(email);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ fullName, email, mobile, password, confirm, terms, privacy, marketing });
    if (!parsed.success) {
      const fe: Record<string, string> = {};
      parsed.error.issues.forEach((i) => { fe[i.path[0] as string] = i.message; });
      setErrors(fe);
      return;
    }
    setErrors({});
    setLoading(true);
    const redirectTo = `${window.location.origin}/dashboard`;
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: redirectTo,
        data: {
          full_name: parsed.data.fullName,
          college_email: parsed.data.email,
          mobile_number: parsed.data.mobile,
          marketing_opt_in: !!parsed.data.marketing,
        },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setDone(true);
    toast.success("Check your inbox to verify your email");
    onSuccess(parsed.data.email);
  }

  if (done) {
    return (
      <div className="animate-fade-in-up text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
          <CheckCircle2 className="h-8 w-8 text-success" />
        </div>
        <h3 className="font-display text-xl font-semibold">Verify your email</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          We sent a verification link to <span className="font-medium text-foreground">{email}</span>.
          Click it to activate your CampusRide account.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="su-name">Full name</Label>
        <div className="relative">
          <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="su-name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Alex Morgan" className="h-11 pl-10 bg-white/[0.03] border-white/10" />
        </div>
        {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="su-email">College email</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="su-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@college.edu" className="h-11 pl-10 bg-white/[0.03] border-white/10" />
          {email && isCollegeEmail && (
            <CheckCircle2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-success" />
          )}
        </div>
        {email && !isCollegeEmail && <p className="text-xs text-muted-foreground">Tip: use your university address to unlock verification perks</p>}
        {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="su-mobile">Mobile number</Label>
        <div className="relative">
          <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="su-mobile" type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="+1 555 123 4567" className="h-11 pl-10 bg-white/[0.03] border-white/10" />
        </div>
        {errors.mobile && <p className="text-xs text-destructive">{errors.mobile}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="su-pw">Password</Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="su-pw" type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a strong password" className="h-11 pl-10 pr-10 bg-white/[0.03] border-white/10" />
          <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label={showPw ? "Hide password" : "Show password"}>
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <PasswordStrength password={password} />
        {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="su-confirm">Confirm password</Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="su-confirm" type={showPw ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Re-enter password" className="h-11 pl-10 bg-white/[0.03] border-white/10" />
        </div>
        {errors.confirm && <p className="text-xs text-destructive">{errors.confirm}</p>}
      </div>

      <div className="space-y-2.5 pt-1">
        <label className="flex cursor-pointer items-start gap-2.5 text-xs text-muted-foreground">
          <Checkbox checked={terms} onCheckedChange={(v) => setTerms(!!v)} className="mt-0.5" />
          <span>I agree to the <a className="text-primary hover:text-primary-glow underline underline-offset-2" href="#">Terms of Service</a></span>
        </label>
        {errors.terms && <p className="text-xs text-destructive">{errors.terms}</p>}
        <label className="flex cursor-pointer items-start gap-2.5 text-xs text-muted-foreground">
          <Checkbox checked={privacy} onCheckedChange={(v) => setPrivacy(!!v)} className="mt-0.5" />
          <span>I agree to the <a className="text-primary hover:text-primary-glow underline underline-offset-2" href="#">Privacy Policy</a></span>
        </label>
        {errors.privacy && <p className="text-xs text-destructive">{errors.privacy}</p>}
        <label className="flex cursor-pointer items-start gap-2.5 text-xs text-muted-foreground">
          <Checkbox checked={marketing} onCheckedChange={(v) => setMarketing(!!v)} className="mt-0.5" />
          <span>Send me campus ride tips and updates (optional)</span>
        </label>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="h-11 w-full gradient-primary text-primary-foreground font-semibold shadow-elegant hover:shadow-glow transition-all"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
      </Button>
    </form>
  );
}
