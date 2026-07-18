import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Camera, Mail } from "lucide-react";
import { supabase } from "@/lib/supabase";

export function ProfileView() {
  const { user, updateUser } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [department, setDepartment] = useState(user?.department || "");
  const [studentId, setStudentId] = useState(user?.student_id || "");
  const [gender, setGender] = useState(user?.gender || "");
  const [address, setAddress] = useState(user?.address || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateUser({
        name,
        phone,
        department,
        student_id: studentId,
        gender,
        address
      });
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    setUploadingAvatar(true);
    try {
      const { data, error } = await supabase.storage
        .from("profile-photos")
        .upload(`${user.id}/avatar_${Date.now()}.jpg`, file, { upsert: true });
        
      if (error) throw error;
      
      const { data: publicUrlData } = supabase.storage
        .from("profile-photos")
        .getPublicUrl(data.path);
        
      await updateUser({ avatar_url: publicUrlData.publicUrl });
      toast.success("Avatar updated successfully!");
    } catch (err) {
      toast.error("Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black">My Profile</h2>
        <p className="text-muted-foreground">Manage your personal information</p>
      </div>

      <div className="bg-card rounded-[2rem] p-8 border border-border/60 shadow-elegant">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center gap-6 pb-6 border-b border-border/40">
            <div className="relative h-24 w-24 rounded-full bg-muted overflow-hidden flex items-center justify-center shrink-0 border-2 border-primary/20 group">
              {uploadingAvatar ? (
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              ) : user?.avatar_url ? (
                <img src={user.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <Camera className="h-8 w-8 text-muted-foreground" />
              )}
              <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <span className="text-[10px] font-bold text-white uppercase tracking-widest">Change</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={uploadingAvatar} />
              </label>
            </div>
            <div>
              <p className="font-bold text-lg">{user?.name}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Mail className="h-4 w-4" /> {user?.email}
              </div>
              <Badge className="mt-2 text-[10px] uppercase tracking-widest bg-primary/10 text-primary border-none">
                {user?.role}
              </Badge>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Full Name</Label>
              <Input required value={name} onChange={e => setName(e.target.value)} className="h-12 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Phone Number</Label>
              <Input required type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="h-12 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Department</Label>
              <Input required value={department} onChange={e => setDepartment(e.target.value)} className="h-12 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Department</Label>
              <Input value={department} onChange={e => setDepartment(e.target.value)} className="h-12 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Student ID</Label>
              <Input value={studentId} onChange={e => setStudentId(e.target.value)} className="h-12 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Gender</Label>
              <select 
                value={gender} 
                onChange={e => setGender(e.target.value)}
                className="flex h-12 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Address</Label>
              <Input value={address} onChange={e => setAddress(e.target.value)} className="h-12 rounded-xl" />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={loading} className="rounded-xl h-12 px-8 font-bold shadow-glow">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`}>
      {children}
    </span>
  )
}
