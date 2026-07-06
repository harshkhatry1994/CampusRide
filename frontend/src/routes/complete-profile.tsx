import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Camera, ChevronRight, Loader2, ShieldCheck, Zap } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { BrandLogo } from "@/components/BrandLogo";

export const Route = createFileRoute("/complete-profile")({
  head: () => ({ meta: [{ title: "Complete Profile — CampusRide" }] }),
  component: CompleteProfilePage,
});

function CompleteProfilePage() {
  const navigate = useNavigate();
  const { user, token, updateUser, profileComplete, isAdmin } = useAuth();

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  // Form State
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [studentId, setStudentId] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!token) {
      navigate({ to: "/login" });
      return;
    }
    if (isAdmin) {
      navigate({ to: "/admin" });
      return;
    }
    if (profileComplete) {
      navigate({ to: "/dashboard" });
    }

    // Set initial avatar if exists
    if (user?.avatar_url) {
      setAvatarPreview(user.avatar_url);
    }
  }, [token, profileComplete, navigate, user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image size must be less than 2MB");
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const uploadAvatar = async (): Promise<string | undefined> => {
    if (!avatarFile || !user) return user?.avatar_url;

    try {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(fileName, avatarFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('profile-images')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (err) {
      console.error("Avatar upload error:", err);
      toast.error("Failed to upload profile picture");
      return undefined;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const avatar_url = await uploadAvatar();

      await updateUser({
        name,
        phone,
        department,
        student_id: studentId,
        gender,
        address,
        ...(avatar_url && { avatar_url })
      });

      toast.success("Profile completed successfully!");
      navigate({ to: "/dashboard" });
    } catch (err) {
      console.error(err);
      toast.error("Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (step === 1 && (!name || !phone)) {
      toast.error("Please fill in all required fields to continue");
      return;
    }
    setStep(2);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-12 px-6 selection:bg-primary/20">
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-[500px]"
      >
        <div className="text-center mb-10">
          <BrandLogo size="lg" className="mx-auto mb-6" />
          <h1 className="text-3xl font-black tracking-tight">Complete your profile</h1>
          <p className="text-muted-foreground font-medium mt-2">
            Just a few more details to get you riding
          </p>
        </div>

        <div className="bg-card rounded-[2.5rem] p-8 sm:p-10 shadow-elegant border border-border/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

          {/* Progress Indicator */}
          <div className="flex items-center gap-2 mb-8">
            <div className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`h-2 flex-1 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">

            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Avatar Upload */}
                <div className="flex flex-col items-center mb-8">
                  <div
                    className="relative w-24 h-24 rounded-full border-2 border-dashed border-primary/40 flex items-center justify-center cursor-pointer group overflow-hidden bg-muted/20 hover:bg-muted/40 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-8 h-8 text-primary/60 group-hover:scale-110 transition-transform" />
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  <span className="text-xs font-bold text-primary mt-3 tracking-widest uppercase cursor-pointer hover:underline" onClick={() => fileInputRef.current?.click()}>
                    Upload Photo
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                      Full Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      placeholder="John Doe"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-14 rounded-2xl border-border bg-muted/20 focus:bg-background focus:ring-2 px-5"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                      Phone Number <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="tel"
                      placeholder="+91 9876543210"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-14 rounded-2xl border-border bg-muted/20 focus:bg-background focus:ring-2 px-5"
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={handleNext}
                  className="w-full h-14 rounded-2xl bg-foreground text-background font-bold shadow-glow hover:bg-foreground/90 transition-all gap-2 mt-4"
                >
                  Continue <ChevronRight className="h-5 w-5" />
                </Button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                        Department (Optional)
                      </Label>
                      <Input
                        placeholder="e.g. Computer Science"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="h-14 rounded-2xl border-border bg-muted/20 focus:bg-background focus:ring-2 px-5"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                        Student ID (Optional)
                      </Label>
                      <Input
                        placeholder="e.g. 2023CSE123"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        className="h-14 rounded-2xl border-border bg-muted/20 focus:bg-background focus:ring-2 px-5"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                      Gender (Optional)
                    </Label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="flex h-14 w-full items-center justify-between rounded-2xl border border-border bg-muted/20 px-5 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all focus:bg-background"
                    >
                      <option value="" disabled>Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                      Address (Optional)
                    </Label>
                    <Input
                      placeholder="e.g. Room 101, Boys Hostel A"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="h-14 rounded-2xl border-border bg-muted/20 focus:bg-background focus:ring-2 px-5"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  {/* Connect Telegram */}

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-14 rounded-2xl"
                    onClick={() =>
                      window.open(
                        `https://t.me/CampusRide_bot?start=${encodeURIComponent(user?.email || "")}`,
                        "_blank"
                      )
                    }
                  >
                    Connect Telegram
                  </Button>

                  <div className="flex gap-4 pt-4">

                    <Button
                      type="button"
                      variant="outline"
                    >
                      Back
                    </Button>

                    <Button
                      type="submit"
                    >
                      Complete Setup
                    </Button>

                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="h-14 rounded-2xl px-6 font-bold"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 h-14 rounded-2xl bg-primary text-primary-foreground font-black text-lg shadow-glow hover:opacity-90 transition-all gap-2"
                  >
                    {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : "Complete Setup"}
                  </Button>
                </div>
              </motion.div>
            )}
          </form>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 flex items-center justify-center gap-6"
        >
          <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
            <ShieldCheck className="h-3 w-3 text-primary" /> Data Secured
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
