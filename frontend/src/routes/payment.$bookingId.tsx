import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import {
  CreditCard, ArrowRight, QrCode, Zap, Info, ShieldCheck, Bike as BikeIcon,
  Calendar, Clock, Loader2, Camera, CheckCircle2, RefreshCw, MapPin,
  AlertTriangle, Lock, Gift, Tag, Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { GeoLocationCapture, type LocationData } from "@/components/booking/GeoLocationCapture";
import { IdentityVerificationCard } from "@/components/booking/IdentityVerificationCard";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { formatISTDate, formatISTTime } from "@/lib/dateUtils";

export const Route = createFileRoute("/payment/$bookingId")({
  head: () => ({ meta: [{ title: "Secure Payment — CampusRide" }] }),
  component: PaymentPage,
});

function PaymentPage() {
  const { bookingId } = Route.useParams();
  const navigate = useNavigate();
  const { token, user, updateUser } = useAuth();

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [transactionId, setTransactionId] = useState("");

  // Permission state
  const [permGranted, setPermGranted] = useState(false);
  const [permChecking, setPermChecking] = useState(true);
  const [camDenied, setCamDenied] = useState(false);
  const [gpsDenied, setGpsDenied] = useState(false);
  const [camStream, setCamStream] = useState<MediaStream | null>(null);

  // GPS
  const [locationData, setLocationData] = useState<LocationData | null>(null);

  // Geo-selfie
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);

  // Identity verification
  const [identityStatus, setIdentityStatus] = useState(
    user?.identityVerification?.verificationStatus || "not_submitted"
  );

  useEffect(() => {
    if (!token) { navigate({ to: "/login" }); return; }
    async function loadBooking() {
      const { data, error } = await supabase.from('rentals').select('*, bikes(*)').eq('id', bookingId).maybeSingle();
      if (!error && data) {
        setBooking(data);
      }
      setLoading(false);
    }
    loadBooking();
  }, [bookingId, token, navigate]);

  // Request camera + GPS together
  useEffect(() => {
    async function requestPerms() {
      setPermChecking(true);
      let camOk = false;
      let gpsOk = false;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
        setCamStream(stream);
        camOk = true;
      } catch { setCamDenied(true); }

      await new Promise<void>((resolve) => {
        if (!navigator.geolocation) { setGpsDenied(true); resolve(); return; }
        navigator.geolocation.getCurrentPosition(
          () => { gpsOk = true; resolve(); },
          () => { setGpsDenied(true); resolve(); },
          { timeout: 8000 }
        );
      });

      setPermGranted(camOk && gpsOk);
      setPermChecking(false);
    }
    requestPerms();
    return () => { camStream?.getTracks().forEach((t) => t.stop()); };
  }, []);

  useEffect(() => {
    if (camStream && videoRef.current && !selfiePreview) {
      videoRef.current.srcObject = camStream;
      videoRef.current.play().catch(() => {});
    }
  }, [camStream, selfiePreview]);

  const captureSelfie = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current;
    const c = canvasRef.current;
    c.width = v.videoWidth; c.height = v.videoHeight;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(v, 0, 0);
    const uri = c.toDataURL("image/jpeg", 0.9);
    setSelfiePreview(uri);
    c.toBlob((blob) => {
      if (blob) setSelfieFile(new File([blob], "geo-selfie.jpg", { type: "image/jpeg" }));
    }, "image/jpeg", 0.9);
    camStream?.getTracks().forEach((t) => t.stop());
  };

  const retakeSelfie = async () => {
    setSelfiePreview(null); setSelfieFile(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      setCamStream(s);
    } catch { toast.error("Cannot access camera"); }
  };

  async function handlePayment() {
    if (!transactionId || transactionId.length < 8) {
      toast.error("Please enter a valid Transaction ID (min 8 chars)"); return;
    }
    if (!selfieFile) {
      toast.error("Please capture your verification selfie"); return;
    }
    if (!locationData) {
      toast.error("GPS location is required to proceed"); return;
    }
    if (identityStatus === "not_submitted") {
      toast.error("Please submit your identity verification first"); return;
    }

    setSubmitting(true);
    try {
      // 1. Upload Geo-Selfie
      const timestamp = Date.now();
      const selfieUpload = await supabase.storage.from('profile-photos').upload(`${user?.id}/geo_selfie_${timestamp}.jpg`, selfieFile);
      let geoSelfieUrl = null;
      if (!selfieUpload.error && selfieUpload.data) {
        const { data: urlData } = supabase.storage.from('profile-photos').getPublicUrl(selfieUpload.data.path);
        geoSelfieUrl = urlData.publicUrl;
      }

      // 2. Update Rental with transaction details (status stays 'pending' for admin approval)
      const { error: updateError } = await supabase.from('rentals').update({
        transaction_id: transactionId,
        ...(geoSelfieUrl ? { selfie_url: geoSelfieUrl } : {}),
      }).eq('id', bookingId);
      if (updateError) throw updateError;

      toast.success("Payment submitted for verification!");
      navigate({ to: "/confirmation/$bookingId", params: { bookingId }, replace: true });
    } catch (err: any) { 
      console.error(err);
      toast.error(err.message || "Failed to process payment"); 
    }
    finally { setSubmitting(false); }
  }

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-muted-foreground font-medium animate-pulse">Initializing secure gateway...</p>
    </div>
  );
  if (!booking) return <div className="p-20 text-center">Booking not found</div>;

  // ── Permission Wall ──
  if (permChecking) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 px-4">
      <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
        <Lock className="h-10 w-10 text-primary animate-pulse" />
      </div>
      <div className="text-center">
        <h2 className="text-2xl font-black">Requesting Permissions</h2>
        <p className="text-muted-foreground mt-2 max-w-sm">
          We need Camera &amp; Location access to verify your identity and location during payment.
        </p>
      </div>
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );

  if (!permGranted) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-8 px-4 py-16 max-w-md mx-auto text-center">
      <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center">
        <AlertTriangle className="h-10 w-10 text-destructive" />
      </div>
      <div>
        <h2 className="text-2xl font-black mb-3">Permissions Required</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          To complete your booking payment, CampusRide requires both <strong>Camera</strong> and <strong>GPS Location</strong> access for security and fraud prevention.
        </p>
      </div>
      <div className="w-full space-y-3">
        {camDenied && (
          <div className="p-4 rounded-2xl bg-destructive/5 border border-destructive/20 flex items-center gap-3 text-left">
            <Camera className="h-5 w-5 text-destructive shrink-0" />
            <div>
              <p className="text-sm font-bold text-destructive">Camera Denied</p>
              <p className="text-xs text-muted-foreground">Enable in browser settings → Site Permissions</p>
            </div>
          </div>
        )}
        {gpsDenied && (
          <div className="p-4 rounded-2xl bg-destructive/5 border border-destructive/20 flex items-center gap-3 text-left">
            <MapPin className="h-5 w-5 text-destructive shrink-0" />
            <div>
              <p className="text-sm font-bold text-destructive">Location Denied</p>
              <p className="text-xs text-muted-foreground">Enable in browser settings → Location Access</p>
            </div>
          </div>
        )}
      </div>
      <Button onClick={() => window.location.reload()} size="lg" className="rounded-2xl gap-2 px-10">
        <RefreshCw className="h-4 w-4" /> Grant Permissions &amp; Retry
      </Button>
    </div>
  );

  // ── Main Payment UI ──
  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="grid lg:grid-cols-3 gap-10">
        {/* Left col */}
        <div className="lg:col-span-2 space-y-8">
          {/* Booking Summary */}
          <div className="p-8 rounded-[2.5rem] bg-gradient-card border border-border/60 shadow-elegant">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <BikeIcon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold">{booking.bikes?.bike_name || booking.bikes?.brand}</h2>
                <p className="text-muted-foreground text-sm">{booking.bikes?.brand} {booking.bikes?.model}</p>
              </div>
              <Badge variant="outline" className="ml-auto text-[10px] font-bold text-primary border-primary/20">PAYMENT PENDING</Badge>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 text-sm pb-6 border-b border-border/40">
              <div className="flex gap-3 items-center">
                <Calendar className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-muted-foreground text-xs">Pickup</p>
                  <p className="font-bold">{formatISTDate(booking.start_date || booking.startDate)} · {formatISTTime(booking.start_date || booking.startDate)}</p>
                </div>
              </div>
              <div className="flex gap-3 items-center">
                <Clock className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-muted-foreground text-xs">Return</p>
                  <p className="font-bold">{formatISTDate(booking.end_date || booking.endDate)} · {formatISTTime(booking.end_date || booking.endDate)}</p>
                </div>
              </div>
            </div>
            <div className="pt-6 space-y-3 text-sm">
              {[
                ["Rental Charge", `₹${Math.round((booking.total_price || booking.pricing?.totalAmount || 0) / 1.18 - 1049)}`],
                ["Security Deposit", `₹1000`],
                ["GST & Platform Fee", `₹${Math.round(((booking.total_price || booking.pricing?.totalAmount || 0) / 1.18 - 1049) * 0.18) + 49}`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between"><span className="text-muted-foreground">{k}</span><span className="font-semibold">{v}</span></div>
              ))}
              <div className="flex justify-between text-xl font-black pt-3 border-t border-border/40">
                <span className="text-gradient-brand">Total Payable</span>
                <span>₹{booking.total_price || booking.pricing?.totalAmount}</span>
              </div>
            </div>
          </div>

          {/* Identity Verification */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">1</div>
              <h3 className="text-xl font-bold">Identity Verification</h3>
              {identityStatus === "verified" && <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Verified</Badge>}
              {identityStatus === "pending" && <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Pending Review</Badge>}
            </div>
            <IdentityVerificationCard
              userType={(user as any)?.userType || "student"}
              token={token!}
              apiUrl={import.meta.env.VITE_API_URL}
              currentStatus={identityStatus}
              onSuccess={(data) => {
                setIdentityStatus("pending");
                updateUser({ identityVerification: data });
              }}
            />
          </div>

          {/* GPS Location */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">2</div>
              <h3 className="text-xl font-bold">GPS Location Verification</h3>
              {locationData && <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Captured</Badge>}
            </div>
            <GeoLocationCapture onLocation={setLocationData} />
          </div>

          {/* Geo-Selfie */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">3</div>
              <h3 className="text-xl font-bold">Live Verification Selfie</h3>
              {selfiePreview && <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Captured</Badge>}
            </div>
            <div className="rounded-3xl overflow-hidden border border-border/60 bg-muted/10">
              <AnimatePresence mode="wait">
                {!selfiePreview ? (
                  <motion.div key="camera" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="relative aspect-video bg-black">
                      <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover -scale-x-100" />
                      <div className="absolute bottom-4 inset-x-0 flex justify-center">
                        <button type="button" onClick={captureSelfie}
                          className="h-16 w-16 rounded-full border-4 border-white bg-white/20 backdrop-blur hover:bg-white/40 transition-all hover:scale-110 flex items-center justify-center shadow-xl">
                          <div className="h-11 w-11 rounded-full bg-white flex items-center justify-center">
                            <Camera className="h-5 w-5 text-black" />
                          </div>
                        </button>
                      </div>
                      <div className="absolute top-3 left-3 px-3 py-1 rounded-xl bg-black/50 backdrop-blur text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" /> Live
                      </div>
                    </div>
                    <div className="p-4 text-center">
                      <p className="text-xs text-muted-foreground">Your selfie will be geo-tagged with your current location and timestamp</p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="relative aspect-video bg-black group">
                      <img src={selfiePreview} alt="Geo Selfie" className="h-full w-full object-cover -scale-x-100" />
                      <div className="absolute top-3 right-3 h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
                        <CheckCircle2 className="h-6 w-6 text-white" />
                      </div>
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button type="button" onClick={retakeSelfie} variant="secondary" className="rounded-full px-6 gap-2">
                          <RefreshCw className="h-4 w-4" /> Retake
                        </Button>
                      </div>
                      {locationData && (
                        <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-xl bg-black/70 backdrop-blur text-white text-[10px] font-mono flex items-center gap-2">
                          <MapPin className="h-3 w-3 text-emerald-400" />
                          {locationData.latitude.toFixed(4)}, {locationData.longitude.toFixed(4)}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <canvas ref={canvasRef} className="hidden" />
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-primary/5 border border-primary/20 flex items-center gap-4">
            <ShieldCheck className="h-10 w-10 text-primary shrink-0" />
            <div>
              <p className="text-sm font-bold">100% Secure Transaction</p>
              <p className="text-xs text-muted-foreground">Your data is protected with end-to-end encryption.</p>
            </div>
          </div>
        </div>

        {/* Right: Payment Panel */}
        <div className="space-y-6">
          <div className="p-8 rounded-[2.5rem] bg-gradient-card border border-primary/40 shadow-glow space-y-8">
            <div className="text-center">
              <Badge className="bg-primary/10 text-primary border-primary/20 mb-4 px-4 py-1">UPI / QR Payment</Badge>
              <h3 className="text-2xl font-bold mb-6">Scan to Pay</h3>
              <div className="relative mx-auto h-48 w-48 p-4 bg-white rounded-3xl shadow-xl flex items-center justify-center">
                <QrCode className="h-full w-full text-black" />
                <div className="absolute inset-0 flex items-center justify-center opacity-10">
                  <Zap className="h-20 w-20 text-primary fill-primary" />
                </div>
              </div>
              <div className="mt-6 p-4 rounded-2xl bg-muted/50 border border-border/40">
                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">UPI ID</p>
                <p className="font-mono text-sm font-bold">campusride.pay@okaxis</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="txId">Enter Transaction ID</Label>
                <Input
                  id="txId"
                  placeholder="12-digit Ref No."
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="h-12 rounded-xl text-center font-bold tracking-widest uppercase"
                />
              </div>

              {/* Checklist */}
              <div className="space-y-2 text-xs">
                {[
                  { label: "Identity Submitted", ok: identityStatus !== "not_submitted" },
                  { label: "GPS Captured", ok: !!locationData },
                  { label: "Selfie Taken", ok: !!selfiePreview },
                  { label: "Transaction ID", ok: transactionId.length >= 8 },
                ].map(({ label, ok }) => (
                  <div key={label} className={cn("flex items-center gap-2 font-medium", ok ? "text-emerald-600" : "text-muted-foreground")}>
                    <CheckCircle2 className={cn("h-3.5 w-3.5", ok ? "text-emerald-500" : "text-muted-foreground/30")} />
                    {label}
                  </div>
                ))}
              </div>

              <Button
                onClick={handlePayment}
                disabled={submitting || !selfieFile || !locationData || identityStatus === "not_submitted" || transactionId.length < 8}
                className="w-full h-14 rounded-2xl bg-gradient-premium-gold font-extrabold shadow-glow hover:opacity-90 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {submitting ? "Verifying..." : "Confirm Payment"} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <div className="flex justify-center gap-4 opacity-40">
              <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo.png" className="h-4 grayscale" alt="UPI" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <a href="https://wa.me/919876543210" target="_blank" rel="noreferrer"
              className="flex flex-col items-center justify-center p-4 rounded-3xl bg-card border border-border/60 hover:border-green-500/50 hover:bg-green-500/5 transition-all group">
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Smartphone className="h-5 w-5 text-green-500" />
              </div>
              <span className="text-sm font-bold">WhatsApp</span>
              <span className="text-[10px] text-muted-foreground">24/7 Support</span>
            </a>
            <a href="#" className="flex flex-col items-center justify-center p-4 rounded-3xl bg-card border border-border/60 hover:border-primary/50 hover:bg-primary/5 transition-all group">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Info className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm font-bold">Help Centre</span>
              <span className="text-[10px] text-muted-foreground">FAQs & Guides</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
