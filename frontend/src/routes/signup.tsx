import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Eye, EyeOff, ArrowRight, ShieldCheck, Zap, Loader2,
  ChevronRight, Mail, ArrowLeft
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { BrandLogo } from "@/components/BrandLogo";
import { supabase } from "@/lib/supabase";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Create Account — CampusRide" }] }),
  component: SignupPage,
});

type SignupMode = "main" | "otp";

function SignupPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [mode, setMode] = useState<SignupMode>("main");
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [show, setShow] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

  async function handleGoogle() {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      });
      
      if (error) {
        toast.error(error.message || "Google Signup failed");
        setGoogleLoading(false);
        return;
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Google Signup failed");
      setGoogleLoading(false);
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name }
        }
      });

      if (error) {
        toast.error(error.message || "Signup failed");
        setLoading(false);
        return;
      }

      toast.success("Account created! Please verify your email.");
      setMode("otp");
      
    } catch (err) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    if (otpCode.length !== 6) {
      toast.error("Please enter the complete 6-digit OTP");
      return;
    }
    setOtpLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: "signup",
      });
      if (error) {
        toast.error(error.message || "Invalid OTP");
      } else {
        toast.success("Account verified successfully!");
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      toast.error("Verification failed. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 selection:bg-primary/20">
      <div className="fixed inset-0 overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-[440px]"
      >
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="inline-block mb-6"
          >
            <BrandLogo size="xl" />
          </motion.div>
          <h1 className="text-3xl font-black tracking-tight">Create account</h1>
          <p className="text-muted-foreground font-medium mt-2">
            Join the CampusRide community today
          </p>
        </div>

        <div className="bg-card rounded-[2.5rem] p-10 shadow-elegant border border-border/40 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:bg-primary/10 transition-colors" />

          <AnimatePresence mode="wait">
            {mode === "main" && (
              <motion.div
                key="main"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Button
                  onClick={handleGoogle}
                  variant="outline"
                  disabled={googleLoading || loading}
                  className="w-full h-14 rounded-2xl border-border hover:bg-muted/50 transition-all font-bold gap-3 relative overflow-hidden group"
                >
                  {googleLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  ) : (
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  )}
                  Continue with Google
                </Button>

                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border/40" />
                  </div>
                  <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    <span className="bg-card px-4">Or direct signup</span>
                  </div>
                </div>

                <form onSubmit={handleSignup} className="space-y-5 relative z-10">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      className="h-12 rounded-xl border-border bg-muted/20 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all px-4"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                      Email address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@university.edu"
                      className="h-12 rounded-xl border-border bg-muted/20 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all px-4"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                      Security Phrase
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={show ? "text" : "password"}
                        className="h-12 rounded-xl border-border bg-muted/20 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all pl-4 pr-12"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShow(!show)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                      Confirm Security Phrase
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirm ? "text" : "password"}
                        className="h-12 rounded-xl border-border bg-muted/20 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all pl-4 pr-12"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || googleLoading}
                    className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold transition-all shadow-glow hover:opacity-90 gap-2 mt-4"
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Continue <ChevronRight className="h-4 w-4" /></>}
                  </Button>
                </form>

                <div className="mt-8 text-center">
                  <p className="text-sm text-muted-foreground font-medium">
                    Already a member?{" "}
                    <Link to="/login" className="text-primary font-bold hover:underline transition-colors">
                      Sign in <ArrowRight className="inline h-3 w-3 ml-0.5" />
                    </Link>
                  </p>
                </div>
              </motion.div>
            )}

            {mode === "otp" && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                    <Mail className="h-8 w-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-black">Verify Email</h2>
                  <p className="text-sm text-muted-foreground">
                    We sent a 6-digit code to {email}
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="flex justify-center">
                    <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
                      <InputOTPGroup>
                        <InputOTPSlot index={0} className="h-14 w-12 text-lg font-bold rounded-xl border-border" />
                        <InputOTPSlot index={1} className="h-14 w-12 text-lg font-bold rounded-xl border-border" />
                        <InputOTPSlot index={2} className="h-14 w-12 text-lg font-bold rounded-xl border-border" />
                      </InputOTPGroup>
                      <InputOTPSeparator />
                      <InputOTPGroup>
                        <InputOTPSlot index={3} className="h-14 w-12 text-lg font-bold rounded-xl border-border" />
                        <InputOTPSlot index={4} className="h-14 w-12 text-lg font-bold rounded-xl border-border" />
                        <InputOTPSlot index={5} className="h-14 w-12 text-lg font-bold rounded-xl border-border" />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <Button
                    onClick={handleVerifyOtp}
                    disabled={otpLoading || otpCode.length !== 6}
                    className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold shadow-glow hover:opacity-90 transition-all gap-2"
                  >
                    {otpLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Verify & Complete <ArrowRight className="h-4 w-4" /></>}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-10 flex items-center justify-center gap-6 opacity-60">
          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Secure Platform
          </div>
          <div className="w-1 h-1 rounded-full bg-border" />
          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
            <Zap className="h-3.5 w-3.5 text-primary" /> Fast Response
          </div>
        </div>
      </motion.div>
    </div>
  );
}
