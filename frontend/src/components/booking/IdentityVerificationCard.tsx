import { useState, useRef } from "react";
import { GraduationCap, Briefcase, Upload, CheckCircle2, Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

interface IdentityVerificationCardProps {
  userType: "student" | "worker";
  token: string;
  apiUrl: string;
  currentStatus?: string;
  onSuccess: (data: any) => void;
}

export function IdentityVerificationCard({
  userType,
  token,
  apiUrl,
  currentStatus,
  onSuccess,
}: IdentityVerificationCardProps) {
  const [institutionName, setInstitutionName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [idFile, setIdFile] = useState<File | null>(null);
  const [idPreview, setIdPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { user } = useAuth();
  const isStudent = userType === "student";

  const handleFileChange = (file: File | null) => {
    if (!file) return;
    setIdFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setIdPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!idFile) {
      toast.error("Please upload your ID document");
      return;
    }
    const labelName = isStudent ? "Institution name" : "Company name";
    const labelId = isStudent ? "Student ID number" : "Employee ID number";
    if (!institutionName.trim()) {
      toast.error(`${labelName} is required`);
      return;
    }
    if (!idNumber.trim()) {
      toast.error(`${labelId} is required`);
      return;
    }

    setSubmitting(true);
    try {
      const timestamp = Date.now();
      const { data: uploadData, error: uploadError } = await supabase.storage.from('student-ids').upload(`${user?.id}/id_${timestamp}.jpg`, idFile);
      
      if (uploadError) throw uploadError;
      const { data: publicUrlData } = supabase.storage
        .from("student-ids")
        .getPublicUrl(uploadData.path);
          
      const identityVerification = {
        verificationStatus: 'pending',
        institutionName: institutionName,
        idNumber: idNumber,
        student_id_url: publicUrlData.publicUrl
      };

      const { error: updateError } = await supabase.auth.updateUser({
        data: { identityVerification }
      });
      
      if (updateError) throw updateError;

      toast.success("Identity submitted! Pending admin review.");
      onSuccess(identityVerification);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (currentStatus === "pending") {
    return (
      <div className="p-6 rounded-3xl bg-amber-500/5 border border-amber-500/20 flex items-center gap-4">
        <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0">
          <AlertCircle className="h-6 w-6 text-amber-500" />
        </div>
        <div>
          <p className="font-bold text-sm">Identity Pending Review</p>
          <p className="text-xs text-muted-foreground mt-1">
            Your {isStudent ? "Student ID" : "Employee ID"} has been submitted and is awaiting admin verification.
          </p>
        </div>
      </div>
    );
  }

  if (currentStatus === "verified") {
    return (
      <div className="p-6 rounded-3xl bg-emerald-500/5 border border-emerald-500/20 flex items-center gap-4">
        <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0">
          <ShieldCheck className="h-6 w-6 text-emerald-500" />
        </div>
        <div>
          <p className="font-bold text-sm text-emerald-600">Identity Verified</p>
          <p className="text-xs text-muted-foreground mt-1">
            Your {isStudent ? "Student ID" : "Employee ID"} has been successfully verified.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-border/60 overflow-hidden">
      {/* Header */}
      <div className={cn(
        "p-5 flex items-center gap-4",
        isStudent ? "bg-blue-500/5 border-b border-blue-500/20" : "bg-violet-500/5 border-b border-violet-500/20"
      )}>
        <div className={cn(
          "h-12 w-12 rounded-2xl flex items-center justify-center",
          isStudent ? "bg-blue-500/10 text-blue-600" : "bg-violet-500/10 text-violet-600"
        )}>
          {isStudent ? <GraduationCap className="h-6 w-6" /> : <Briefcase className="h-6 w-6" />}
        </div>
        <div>
          <p className="font-black text-sm">
            {isStudent ? "Student Identity Verification" : "Worker Identity Verification"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isStudent
              ? "Required: Student ID card from your institution"
              : "Required: Employee or Government-issued ID"}
          </p>
        </div>
      </div>

      <div className="p-6 space-y-5 bg-card">
        {/* Institution / Company */}
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            {isStudent ? "Institution Name" : "Company Name"} *
          </Label>
          <Input
            placeholder={isStudent ? "e.g. IIT Delhi, BITS Pilani" : "e.g. Infosys, Tata Motors"}
            value={institutionName}
            onChange={(e) => setInstitutionName(e.target.value)}
            className="h-11 rounded-xl"
          />
        </div>

        {/* ID Number */}
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            {isStudent ? "Student ID Number" : "Employee ID Number"} *
          </Label>
          <Input
            placeholder={isStudent ? "e.g. 2021BCS0042" : "e.g. EMP-2024-001"}
            value={idNumber}
            onChange={(e) => setIdNumber(e.target.value)}
            className="h-11 rounded-xl font-mono"
          />
        </div>

        {/* ID Card Upload */}
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            {isStudent ? "Student ID Card Image" : "Employee/Govt ID Document"} *
          </Label>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full"
          >
            {idPreview ? (
              <div className="relative aspect-[16/9] rounded-2xl overflow-hidden border border-border/40 group">
                <img src={idPreview} alt="ID Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white text-xs font-bold">Replace Image</span>
                </div>
                <div className="absolute top-2 right-2 h-7 w-7 rounded-full bg-emerald-500 flex items-center justify-center shadow">
                  <CheckCircle2 className="h-4 w-4 text-white" />
                </div>
              </div>
            ) : (
              <div className="aspect-[16/9] rounded-2xl border-2 border-dashed border-border/40 flex flex-col items-center justify-center gap-3 hover:border-primary/40 hover:bg-primary/5 transition-all group">
                <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold">Upload ID Photo</p>
                  <p className="text-xs text-muted-foreground">JPG, PNG, WEBP up to 5MB</p>
                </div>
              </div>
            )}
          </button>
        </div>

        {/* Security note */}
        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex items-start gap-3">
          <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Your ID documents are encrypted and stored securely. They are only used for identity
            verification and are never shared with third parties.
          </p>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full h-12 rounded-2xl font-bold gap-2"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ShieldCheck className="h-4 w-4" />
          )}
          Submit Identity Verification
        </Button>
      </div>
    </div>
  );
}
