import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import {
  Calendar,
  Clock,
  ArrowRight,
  Sparkles,
  User,
  Mail,
  Phone,
  Home,
  MapPin,
  Info,
  Upload,
  ShieldCheck,
  CheckCircle2,
  Image as ImageIcon,
  Camera,
  RefreshCw as RetakeIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export const Route = createFileRoute("/booking/$bikeId")({
  head: () => ({ meta: [{ title: "Book Your Ride — CampusRide" }] }),
  component: BookingDetailsPage,
});

function BookingDetailsPage() {
  const { bikeId } = Route.useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [bike, setBike] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [bookingData, setBookingData] = useState({
    startDate: new Date().toISOString().split("T")[0],
    startTime: "10:00",
    endDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    endTime: "10:00",
    riderName: user?.name || "",
    riderEmail: user?.email || "",
    riderPhone: "",
    emergencyContact: "",
    address: "",
  });

  const [files, setFiles] = useState<{ [key: string]: File | null }>({
    licence: null,
    aadhaar: null,
    selfie: null,
  });
  const [previews, setPreviews] = useState<{ [key: string]: string | null }>({
    licence: null,
    aadhaar: null,
    selfie: null,
  });

  useEffect(() => {
    if (!token) {
      toast.error("Please login to continue");
      navigate({ to: "/login" });
      return;
    }

    fetch(`${import.meta.env.VITE_API_URL}/api/bikes/${bikeId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setBike(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [bikeId, token, navigate]);

  const handleFileChange = (key: string, file: File | null) => {
    if (file) {
      setFiles({ ...files, [key]: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews({ ...previews, [key]: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  // Price calculation
  const start = new Date(`${bookingData.startDate}T${bookingData.startTime}`);
  const end = new Date(`${bookingData.endDate}T${bookingData.endTime}`);
  const hours = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60)));
  const days = Math.ceil(hours / 24);

  const basePrice = days * (bike?.pricePerDay || 0);
  const deposit = bike?.securityDeposit || 1000;
  const platformFee = 49;
  const gst = Math.round(basePrice * 0.18);
  const totalAmount = basePrice + deposit + platformFee + gst;

  async function handleInitializeBooking() {
    if (!bookingData.riderPhone || !bookingData.address) {
      toast.error("Please fill in all contact details");
      return;
    }
    if (!files.licence || !files.aadhaar || !files.selfie) {
      toast.error("Please upload your identity documents and snap a live selfie");
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append("bikeId", bikeId);
    formData.append("startDate", bookingData.startDate);
    formData.append("startTime", bookingData.startTime);
    formData.append("endDate", bookingData.endDate);
    formData.append("returnTime", bookingData.endTime);

    formData.append(
      "riderDetails",
      JSON.stringify({
        name: bookingData.riderName,
        email: bookingData.riderEmail,
        phone: bookingData.riderPhone,
        emergencyContact: bookingData.emergencyContact,
        address: bookingData.address,
      }),
    );

    formData.append(
      "pricing",
      JSON.stringify({
        basePrice,
        securityDeposit: deposit,
        gst,
        platformFee,
        totalAmount,
      }),
    );

    if (files.licence) formData.append("drivingLicense", files.licence);
    if (files.aadhaar) formData.append("idProof", files.aadhaar);
    if (files.selfie) formData.append("selfieImage", files.selfie);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/bookings`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Booking & Documents Saved!");
        navigate({ to: "/policy/$bookingId", params: { bookingId: data.data._id } });
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error("Failed to save booking");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="p-20 text-center">Preparing booking portal...</div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="grid lg:grid-cols-3 gap-10">
        {/* Left: Forms */}
        <div className="lg:col-span-2 space-y-10">
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                1
              </div>
              <h2 className="text-2xl font-bold">Select Duration</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-6 p-6 rounded-3xl bg-gradient-card border border-border/60">
              <div className="space-y-4">
                <Label>Pickup Date & Time</Label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={bookingData.startDate}
                    onChange={(e) => setBookingData({ ...bookingData, startDate: e.target.value })}
                  />
                  <Input
                    type="time"
                    value={bookingData.startTime}
                    onChange={(e) => setBookingData({ ...bookingData, startTime: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <Label>Return Date & Time</Label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={bookingData.endDate}
                    onChange={(e) => setBookingData({ ...bookingData, endDate: e.target.value })}
                  />
                  <Input
                    type="time"
                    value={bookingData.endTime}
                    onChange={(e) => setBookingData({ ...bookingData, endTime: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                2
              </div>
              <h2 className="text-2xl font-bold">Rider Information</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-6 p-8 rounded-3xl bg-gradient-card border border-border/60">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={bookingData.riderName} disabled className="bg-muted/50" />
              </div>
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input value={bookingData.riderEmail} disabled className="bg-muted/50" />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  placeholder="+91 98765 43210"
                  value={bookingData.riderPhone}
                  onChange={(e) => setBookingData({ ...bookingData, riderPhone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Emergency Contact</Label>
                <Input
                  placeholder="Name & Phone"
                  value={bookingData.emergencyContact}
                  onChange={(e) =>
                    setBookingData({ ...bookingData, emergencyContact: e.target.value })
                  }
                />
              </div>
              <div className="sm:col-span-2 space-y-2">
                <Label>Full Address</Label>
                <Input
                  placeholder="House No, Street, City, State, PIN"
                  value={bookingData.address}
                  onChange={(e) => setBookingData({ ...bookingData, address: e.target.value })}
                />
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                3
              </div>
              <h2 className="text-2xl font-bold">Identity Verification</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-6 p-8 rounded-3xl bg-gradient-card border border-border/60">
              <DocUploadSection
                title="Driving Licence"
                preview={previews.licence}
                onUpload={(f: File | null) => handleFileChange("licence", f)}
                description="Front side of your valid Driving Licence."
              />
              <DocUploadSection
                title="Aadhaar Card"
                preview={previews.aadhaar}
                onUpload={(f: File | null) => handleFileChange("aadhaar", f)}
                description="Front side of your Aadhaar for address proof."
              />
              <div className="sm:col-span-2">
                <Label className="mb-3 block font-semibold text-base">
                  Live Selfie Verification <span className="text-destructive">*</span>
                </Label>
                <WebcamCapture
                  onCapture={(file, dataUri) => {
                    setFiles((prev) => ({ ...prev, selfie: file }));
                    setPreviews((prev) => ({ ...prev, selfie: dataUri }));
                  }}
                />
              </div>
              <div className="sm:col-span-2 p-4 rounded-2xl bg-primary/5 border border-primary/20 flex items-center gap-4">
                <ShieldCheck className="h-6 w-6 text-primary shrink-0" />
                <p className="text-[10px] text-muted-foreground italic">
                  Identity documents are required for campus security clearance. All data is
                  encrypted and stored according to our privacy policy.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Right: Summary Card */}
        <div className="space-y-6">
          <div className="sticky top-24 p-8 rounded-[2rem] bg-gradient-brand text-primary-foreground shadow-elegant space-y-6 overflow-hidden relative">
            <Sparkles className="absolute -right-4 -top-4 h-24 w-24 opacity-10" />

            <h3 className="text-xl font-bold">Price Summary</h3>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span>
                  Rental ({days} {days === 1 ? "day" : "days"})
                </span>
                <span className="font-bold">₹{basePrice}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span>Security Deposit (Refundable)</span>
                <span className="font-bold">₹{deposit}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span>GST (18%)</span>
                <span className="font-bold">₹{gst}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span>Platform Fee</span>
                <span className="font-bold">₹{platformFee}</span>
              </div>
              <div className="flex justify-between text-lg font-extrabold pt-2">
                <span>Total Amount</span>
                <span>₹{totalAmount}</span>
              </div>
            </div>

            <Button
              onClick={handleInitializeBooking}
              disabled={submitting}
              className="w-full h-14 rounded-2xl bg-gradient-premium-gold hover:opacity-90 font-bold shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {submitting ? "Saving Documents..." : "Continue to Payment"}{" "}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <div className="flex items-start gap-2 text-[10px] opacity-80 italic">
              <Info className="h-3 w-3 shrink-0 mt-0.5" />
              <p>
                By continuing, you agree to our rental terms and conditions including helmet and
                speed policies.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DocUploadSection({ title, preview, onUpload, description }: any) {
  return (
    <div className="space-y-3">
      <Label>{title}</Label>
      <label className="block w-full cursor-pointer">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onUpload(e.target.files?.[0] || null)}
        />
        {preview ? (
          <div className="relative aspect-[3/2] w-full rounded-2xl overflow-hidden border border-border/40 shadow-inner group">
            <img src={preview} alt="Preview" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-white text-xs font-bold">Replace File</span>
            </div>
            <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
        ) : (
          <div className="aspect-[3/2] w-full rounded-2xl border-2 border-dashed border-border/40 flex flex-col items-center justify-center gap-2 hover:bg-primary/5 transition-colors group">
            <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground group-hover:scale-110 transition-transform">
              <Upload className="h-5 w-5" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">Upload Photo</span>
            <p className="text-[10px] text-muted-foreground/60">{description}</p>
          </div>
        )}
      </label>
    </div>
  );
}

function WebcamCapture({ onCapture }: { onCapture: (f: File, uri: string) => void }) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState("");

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      setStream(mediaStream);
      setError("");
      setPreview(null);
    } catch (err: any) {
      console.error("Camera Error:", err);
      setError(err.message || "Camera access denied or unavailable.");
      toast.error("Please allow camera access to take a selfie");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  // Attach the stream to the video element after it has mounted
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current?.play().catch(e => console.error("Video play failed:", e));
      };
    }
  }, [stream]);

  // Ensure camera shuts off if the component is unmounted
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const capture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUri = canvas.toDataURL("image/jpeg", 0.9);
        setPreview(dataUri);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });
              onCapture(file, dataUri);
            }
          },
          "image/jpeg",
          0.9,
        );

        stopCamera();
      }
    }
  };

  const retake = () => {
    setPreview(null);
    startCamera();
  };

  return (
    <div className="w-full bg-muted/20 border border-border/60 rounded-3xl overflow-hidden shadow-inner flex flex-col items-center relative">
      {!stream && !preview && (
        <div className="py-14 flex flex-col items-center justify-center text-center gap-4 w-full h-full min-h-[300px]">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-glow">
            <Camera className="h-8 w-8" />
          </div>
          <div>
            <p className="font-bold text-lg">Take a Selfie</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-[250px] mx-auto">
              We need a live photo to securely verify your identity.
            </p>
          </div>
          {error && <p className="text-xs text-destructive mt-1 font-medium">{error}</p>}
          <Button
            type="button"
            onClick={startCamera}
            className="mt-2 rounded-full px-8 shadow-md hover:scale-105 transition-transform font-bold"
          >
            Open Camera
          </Button>
        </div>
      )}

      {stream && !preview && (
        <div className="relative w-full aspect-video sm:aspect-[21/9] bg-black flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover -scale-x-100 opacity-90"
          />
          <div className="absolute bottom-6 left-0 right-0 flex justify-center">
            <Button
              type="button"
              onClick={capture}
              className="rounded-full h-16 w-16 p-0 border-4 border-white bg-white/20 backdrop-blur-md hover:bg-white/40 shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all hover:scale-110"
            >
              <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center">
                <Camera className="h-5 w-5 text-black" />
              </div>
            </Button>
          </div>
        </div>
      )}

      {preview && (
        <div className="relative w-full aspect-video sm:aspect-[21/9] bg-black group overflow-hidden">
          <img
            src={preview}
            alt="Selfie Preview"
            className="h-full w-full object-cover -scale-x-100"
          />
          <div className="absolute top-4 right-4 h-10 w-10 rounded-full bg-green-500 flex items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.6)] animate-in fade-in zoom-in duration-300">
            <CheckCircle2 className="h-6 w-6 text-white" />
          </div>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button
              type="button"
              onClick={retake}
              variant="secondary"
              className="gap-2 rounded-full px-6 shadow-xl hover:scale-105 transition-transform font-bold"
            >
              <RetakeIcon className="h-4 w-4" /> Retake Photo
            </Button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
