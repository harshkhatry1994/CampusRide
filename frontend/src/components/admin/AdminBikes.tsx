import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Plus,
  Edit,
  Trash2,
  Check,
  ToggleLeft,
  ToggleRight,
  Upload,
  Image as ImageIcon,
  Loader2,
  Search,
  RefreshCw,
  IndianRupee,
  Fuel,
  Star,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const API_URL = import.meta.env.VITE_API_URL;
const CATEGORIES = ["Cruiser", "Sports", "Street", "Adventure", "Scooter"];
const FUEL_TYPES = ["Petrol", "Electric", "Hybrid"];

function getImageSrc(imageUrl: string | undefined) {
  if (!imageUrl) return null;
  if (imageUrl.startsWith("http")) return imageUrl;
  if (imageUrl.startsWith("/uploads")) return `${API_URL}${imageUrl}`;
  return imageUrl;
}

export function AdminBikes() {
  const { token } = useAuth();
  const [bikes, setBikes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editBike, setEditBike] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchBikes = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/bikes?limit=100`);
      const data = await res.json();
      if (data.success) setBikes(data.data.bikes);
    } catch {
      toast.error("Failed to load bikes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBikes();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/bikes/${deleteId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success("Bike removed from inventory");
        fetchBikes();
      } else {
        const d = await res.json();
        toast.error(d.message || "Failed to delete");
      }
    } catch {
      toast.error("Connection error");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const handleToggle = async (bike: any) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/bikes/${bike._id}/availability`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success(`Bike ${bike.available ? "disabled" : "enabled"}`);
        fetchBikes();
      }
    } catch {
      toast.error("Failed to update");
    }
  };

  const filtered = bikes.filter((b) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return `${b.name} ${b.brand} ${b.model} ${b.category}`.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-8 bg-background text-foreground transition-colors duration-300 p-4 sm:p-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight">Bike Inventory</h2>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest">
              {bikes.length} TOTAL ASSETS
            </Badge>
            <Badge variant="outline" className="bg-muted text-muted-foreground px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest border-border">
              {bikes.filter((b) => b.available).length} ACTIVE
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="lg" onClick={fetchBikes} className="gap-2 rounded-2xl border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground shadow-sm">
            <RefreshCw className={cn("h-4 w-4 text-primary", loading && "animate-spin")} /> Refresh
          </Button>
          <Button
            size="lg"
            className="bg-gradient-brand text-primary-foreground shadow-glow gap-2 rounded-2xl px-8"
            onClick={() => {
              setEditBike(null);
              setAddOpen(true);
            }}
          >
            <Plus className="h-5 w-5" /> Add Bike
          </Button>
        </div>
      </div>

      <div className="relative max-w-2xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search bikes by name, brand or category..."
          className="pl-12 h-14 bg-card border-border rounded-[1.25rem] text-foreground placeholder:text-muted-foreground focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 rounded-[2.5rem] bg-muted/40 animate-pulse border border-border/40" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-32 border-2 border-dashed border-border rounded-[2.5rem] bg-muted/10">
          <AlertCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-xl font-black text-muted-foreground">No matching bikes found</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Try a different search term</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((bike) => (
            <div
              key={bike._id}
              className="group rounded-[2.5rem] border border-border bg-card overflow-hidden shadow-elegant hover:border-primary/30 hover:shadow-glow transition-all duration-300 flex flex-col"
            >
              <div className="relative h-48 bg-muted/30 overflow-hidden">
                {getImageSrc(bike.imageUrl) ? (
                  <img
                    src={getImageSrc(bike.imageUrl)!}
                    alt={bike.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-16 w-16 text-muted-foreground/10" />
                  </div>
                )}
                <div className="absolute top-4 left-4">
                  <Badge
                    className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-lg",
                      bike.available ? "bg-emerald-500 text-white border-emerald-400" : "bg-rose-500 text-white border-rose-400"
                    )}
                  >
                    {bike.available ? "Available" : "On Hold"}
                  </Badge>
                </div>
                <Badge
                  variant="outline"
                  className="absolute top-4 right-4 bg-background/80 backdrop-blur-md border-border/60 text-foreground text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full"
                >
                  {bike.category}
                </Badge>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <div className="mb-4">
                  <h3 className="font-black text-xl leading-none mb-2 truncate">{bike.name}</h3>
                  <p className="text-sm font-bold text-muted-foreground">
                    {bike.brand} · {bike.model}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="p-3 rounded-2xl bg-muted/30 border border-border/40 flex flex-col gap-1">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Base Rate</p>
                    <p className="text-sm font-black text-primary">₹{bike.pricePerDay?.toLocaleString()}/day</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-muted/30 border border-border/40 flex flex-col gap-1">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Engine</p>
                    <p className="text-sm font-black text-foreground">{bike.engineCC}CC · {bike.fuelType}</p>
                  </div>
                </div>

                <div className="mt-auto flex items-center gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 h-12 rounded-xl text-xs font-black uppercase tracking-widest gap-2 bg-muted/50 border-border/60 hover:bg-primary hover:text-white hover:border-primary transition-all"
                    onClick={() => {
                      setEditBike(bike);
                      setAddOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" /> Edit
                  </Button>
                  <Button
                    variant="outline"
                    className={cn(
                      "flex-1 h-12 rounded-xl text-xs font-black uppercase tracking-widest gap-2 transition-all border-border/60",
                      bike.available ? "text-amber-600 bg-amber-500/5 hover:bg-amber-500 hover:text-white" : "text-emerald-600 bg-emerald-500/5 hover:bg-emerald-500 hover:text-white"
                    )}
                    onClick={() => handleToggle(bike)}
                  >
                    {bike.available ? (
                      <ToggleLeft className="h-4 w-4" />
                    ) : (
                      <ToggleRight className="h-4 w-4" />
                    )}
                    {bike.available ? "Pause" : "Resume"}
                  </Button>
                  <Button
                    variant="ghost"
                    className="h-12 w-12 rounded-xl p-0 text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20"
                    onClick={() => setDeleteId(bike._id)}
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open);
          if (!open) setEditBike(null);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto sm:rounded-[2.5rem] border-border bg-card text-foreground shadow-2xl p-0 overflow-hidden">
          <div className="p-8 border-b border-border bg-muted/30">
            <DialogTitle className="text-2xl font-black">{editBike ? "Modify Bike" : "Expand Fleet"}</DialogTitle>
            <DialogDescription className="text-muted-foreground font-medium">
              {editBike ? "Update technical specifications." : "Register a new asset in the CampusRide network."}
            </DialogDescription>
          </div>
          <div className="p-8">
            <BikeForm
              bike={editBike}
              token={token}
              onSuccess={() => {
                setAddOpen(false);
                setEditBike(null);
                fetchBikes();
              }}
              onCancel={() => {
                setAddOpen(false);
                setEditBike(null);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="sm:rounded-[2rem] border-border bg-card shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black">Decommission Asset?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground font-medium text-sm">
              This will permanently remove the bike from the system. Active bookings may be affected. This action cannot be reversed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 mt-4">
            <AlertDialogCancel className="rounded-xl font-bold">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90 rounded-xl font-black text-xs uppercase tracking-widest px-6"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Confirm Deletion
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function BikeForm({ bike, token, onSuccess, onCancel }: any) {
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const formInputClass =
    "h-12 bg-muted/20 text-foreground font-bold border-border/60 focus-visible:border-primary focus-visible:ring-primary/20 rounded-xl transition-all placeholder:font-medium placeholder:text-muted-foreground/40";

  const [form, setFormState] = useState({
    name: bike?.name || "",
    brand: bike?.brand || "",
    model: bike?.model || "",
    category: bike?.category || "Street",
    pricePerDay: bike?.pricePerDay?.toString() || "",
    pricePerHour: bike?.pricePerHour?.toString() || "",
    mileage: bike?.mileage?.toString() || "",
    fuelType: bike?.fuelType || "Petrol",
    engineCC: bike?.engineCC?.toString() || "",
    year: bike?.year?.toString() || new Date().getFullYear().toString(),
    description: bike?.description || "",
    available: bike?.available ?? true,
    helmetIncluded: bike?.helmetIncluded ?? true,
    securityDeposit: bike?.securityDeposit?.toString() || "1000",
    pickupLocation: bike?.pickupLocation || "Campus Hub Main Gate",
    color: bike?.color || "",
  });

  const set = (field: string, value: any) => {
    setFormState((f) => ({ ...f, [field]: value }));
    setErrors((e) => {
      const n = { ...e };
      delete n[field];
      return n;
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Required";
    if (!form.brand.trim()) errs.brand = "Required";
    if (!form.model.trim()) errs.model = "Required";
    if (!form.pricePerDay || Number(form.pricePerDay) <= 0) errs.pricePerDay = "Must be > 0";
    if (!form.pricePerHour || Number(form.pricePerHour) <= 0) errs.pricePerHour = "Must be > 0";
    if (!form.mileage || Number(form.mileage) < 0) errs.mileage = "Required";
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      toast.error("Please fix required fields");
      return;
    }
    setLoading(true);
    const data = new FormData();
    Object.entries(form).forEach(([k, v]) => data.append(k, String(v)));
    if (imageFile) data.append("image", imageFile);
    try {
      const url = bike ? `${API_URL}/api/admin/bikes/${bike._id}` : `${API_URL}/api/admin/bikes`;
      const res = await fetch(url, {
        method: bike ? "PUT" : "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      });
      const result = await res.json();
      if (res.ok && result.success) {
        toast.success(bike ? "Asset updated" : "Asset registered");
        onSuccess();
      } else {
        toast.error(result.message || "Operation failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const existingImg = bike ? getImageSrc(bike.imageUrl) : null;
  const previewSrc = imagePreview || existingImg;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Image Upload */}
      <div className="space-y-3">
        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Vehicle Imagery</Label>
        <div
          className="border-2 border-dashed border-border rounded-2xl p-6 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group"
          onClick={() => fileRef.current?.click()}
        >
          {previewSrc ? (
            <div className="flex items-center gap-6">
              <img
                src={previewSrc}
                className="h-24 w-32 object-cover rounded-2xl border border-border shadow-lg"
                alt="Preview"
              />
              <div className="flex-1">
                <p className="text-sm font-black text-foreground">
                  {imageFile ? imageFile.name : "Active system image"}
                </p>
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest mt-1">Tap to re-upload</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <Upload className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3 group-hover:text-primary transition-colors" />
              <p className="text-sm font-black text-muted-foreground uppercase tracking-wider">Click to upload image</p>
              <p className="text-[10px] font-bold text-muted-foreground/50 mt-1 uppercase">JPG, PNG, WebP · Max 5MB</p>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />
        </div>
      </div>

      {/* Fields Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
        {[
          { id: "name", label: "Display Name", placeholder: "Bullet 350", required: true },
          { id: "brand", label: "Manufacturer", placeholder: "Royal Enfield", required: true },
          { id: "model", label: "Model Variant", placeholder: "2024 Classic", required: true },
        ].map((f) => (
          <div key={f.id} className="space-y-2">
            <Label htmlFor={`bf-${f.id}`} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              {f.label} {f.required && <span className="text-primary">*</span>}
            </Label>
            <Input
              id={`bf-${f.id}`}
              placeholder={f.placeholder}
              value={(form as any)[f.id]}
              onChange={(e) => set(f.id, e.target.value)}
              className={cn(formInputClass, errors[f.id] && "border-rose-500")}
            />
          </div>
        ))}

        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Category <span className="text-primary">*</span>
          </Label>
          <Select value={form.category} onValueChange={(v) => set("category", v)}>
            <SelectTrigger className={formInputClass}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border rounded-xl">
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c} className="font-bold text-xs uppercase tracking-widest">
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bf-ppd" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Day Rate (₹) <span className="text-primary">*</span>
          </Label>
          <Input
            id="bf-ppd"
            type="number"
            min="0"
            value={form.pricePerDay}
            onChange={(e) => set("pricePerDay", e.target.value)}
            className={cn(formInputClass, errors.pricePerDay && "border-rose-500")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bf-pph" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Hour Rate (₹) <span className="text-primary">*</span>
          </Label>
          <Input
            id="bf-pph"
            type="number"
            min="0"
            value={form.pricePerHour}
            onChange={(e) => set("pricePerHour", e.target.value)}
            className={cn(formInputClass, errors.pricePerHour && "border-rose-500")}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Fuel System <span className="text-primary">*</span>
          </Label>
          <Select value={form.fuelType} onValueChange={(v) => set("fuelType", v)}>
            <SelectTrigger className={formInputClass}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border rounded-xl">
              {FUEL_TYPES.map((f) => (
                <SelectItem key={f} value={f} className="font-bold text-xs uppercase tracking-widest">
                  {f}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bf-mil" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Mileage (kmpl) <span className="text-primary">*</span>
          </Label>
          <Input
            id="bf-mil"
            type="number"
            min="0"
            value={form.mileage}
            onChange={(e) => set("mileage", e.target.value)}
            className={cn(formInputClass, errors.mileage && "border-rose-500")}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-border/40">
          <div>
            <Label className="text-xs font-black uppercase tracking-widest">Fleet Status</Label>
            <p className="text-[10px] text-muted-foreground font-bold mt-0.5">Show in browse</p>
          </div>
          <Switch checked={form.available} onCheckedChange={(v) => set("available", v)} />
        </div>
        <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-border/40">
          <div>
            <Label className="text-xs font-black uppercase tracking-widest">Gear Bonus</Label>
            <p className="text-[10px] text-muted-foreground font-bold mt-0.5">Helmet included</p>
          </div>
          <Switch checked={form.helmetIncluded} onCheckedChange={(v) => set("helmetIncluded", v)} />
        </div>
      </div>

      <DialogFooter className="gap-3 pt-6">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading} className="rounded-xl font-black text-xs uppercase tracking-widest">
          Dismiss
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow rounded-xl px-10 h-12 font-black text-xs uppercase tracking-widest"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Processing
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              {bike ? "Confirm Updates" : "Register Bike"}
            </>
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}
