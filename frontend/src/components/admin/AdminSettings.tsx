import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2, Save, ShieldCheck, Mail, Phone, MapPin, Percent, DollarSign, Clock, Settings, UserCog, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function AdminSettings() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);

  const [form, setForm] = useState({
    company_name: "",
    support_email: "",
    support_phone: "",
    gst_number: "",
    hourly_rate: 0,
    daily_rate: 0,
    weekly_discount: 0,
    monthly_discount: 0,
    security_deposit: 0,
    min_rental_hours: 1,
    max_rental_days: 30,
    late_fee_per_hour: 0,
    helmet_required: true,
    aadhaar_required: true,
    license_required: true,
    college_id_required: true,
    auto_approve: false,
    instant_booking: false,
    low_stock_threshold: 2,
    maintenance_reminder_days: 30,
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        const { data, error } = await supabase.from("app_settings").select("*").limit(1).single();
        if (error && error.code !== "PGRST116") { // PGRST116 is no rows returned
          console.error("Failed to load settings", error);
        } else if (data) {
          setSettingsId(data.id);
          setForm({
            company_name: data.company_name || "",
            support_email: data.support_email || "",
            support_phone: data.support_phone || "",
            gst_number: data.gst_number || "",
            hourly_rate: data.hourly_rate || 0,
            daily_rate: data.daily_rate || 0,
            weekly_discount: data.weekly_discount || 0,
            monthly_discount: data.monthly_discount || 0,
            security_deposit: data.security_deposit || 0,
            min_rental_hours: data.min_rental_hours || 1,
            max_rental_days: data.max_rental_days || 30,
            late_fee_per_hour: data.late_fee_per_hour || 0,
            helmet_required: data.helmet_required ?? true,
            aadhaar_required: data.aadhaar_required ?? true,
            license_required: data.license_required ?? true,
            college_id_required: data.college_id_required ?? true,
            auto_approve: data.auto_approve ?? false,
            instant_booking: data.instant_booking ?? false,
            low_stock_threshold: data.low_stock_threshold || 2,
            maintenance_reminder_days: data.maintenance_reminder_days || 30,
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleChange = (field: keyof typeof form, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!isSuperAdmin) return toast.error("Only Super Admins can update settings.");
    setSaving(true);
    try {
      if (settingsId) {
        const { error } = await supabase.from("app_settings").update(form).eq("id", settingsId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("app_settings").insert([form]).select().single();
        if (error) throw error;
        setSettingsId(data.id);
      }
      toast.success("Settings saved successfully.");
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-24">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Settings className="h-8 w-8 text-primary" />
            Platform Settings
          </h2>
          <p className="text-muted-foreground mt-1">
            Configure global rules, pricing, and integrations.
          </p>
        </div>
        {isSuperAdmin ? (
          <Button onClick={handleSave} disabled={saving} className="h-12 px-8 rounded-xl font-bold shadow-glow">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        ) : (
          <div className="px-4 py-2 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-lg text-sm font-bold flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" /> View Only (Super Admin Required)
          </div>
        )}
      </div>

      <Tabs defaultValue="pricing" className="w-full flex flex-col md:flex-row gap-6">
        <TabsList className="flex flex-col h-auto w-full md:w-64 bg-card border border-border p-2 gap-1 rounded-2xl">
          <TabsTrigger value="pricing" className="w-full justify-start gap-2 rounded-xl py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <DollarSign className="h-4 w-4" /> Rental Pricing
          </TabsTrigger>
          <TabsTrigger value="business" className="w-full justify-start gap-2 rounded-xl py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <MapPin className="h-4 w-4" /> Business Info
          </TabsTrigger>
          <TabsTrigger value="rules" className="w-full justify-start gap-2 rounded-xl py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Clock className="h-4 w-4" /> Rental Rules
          </TabsTrigger>
          <TabsTrigger value="docs" className="w-full justify-start gap-2 rounded-xl py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <ShieldCheck className="h-4 w-4" /> Verification
          </TabsTrigger>
          <TabsTrigger value="booking" className="w-full justify-start gap-2 rounded-xl py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Percent className="h-4 w-4" /> Booking Settings
          </TabsTrigger>
          <TabsTrigger value="inventory" className="w-full justify-start gap-2 rounded-xl py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Settings className="h-4 w-4" /> Inventory
          </TabsTrigger>
          <TabsTrigger value="admin" className="w-full justify-start gap-2 rounded-xl py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <UserCog className="h-4 w-4" /> Admin Mgmt
          </TabsTrigger>
          <TabsTrigger value="theme" className="w-full justify-start gap-2 rounded-xl py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Palette className="h-4 w-4" /> Theme
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 space-y-6 min-w-0">
          {/* PRICING TAB */}
          <TabsContent value="pricing" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-4">
            <Card className="rounded-[2rem] border-border shadow-sm">
              <CardHeader>
                <CardTitle>Rental Pricing Rules</CardTitle>
                <CardDescription>Set the baseline rates and automatic discounts across the platform.</CardDescription>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Default Hourly Rate (₹)</Label>
                  <Input type="number" disabled={!isSuperAdmin} value={form.hourly_rate} onChange={(e) => handleChange("hourly_rate", Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Default Daily Rate (₹)</Label>
                  <Input type="number" disabled={!isSuperAdmin} value={form.daily_rate} onChange={(e) => handleChange("daily_rate", Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Weekly Discount (%)</Label>
                  <Input type="number" disabled={!isSuperAdmin} value={form.weekly_discount} onChange={(e) => handleChange("weekly_discount", Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Monthly Discount (%)</Label>
                  <Input type="number" disabled={!isSuperAdmin} value={form.monthly_discount} onChange={(e) => handleChange("monthly_discount", Number(e.target.value))} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Standard Security Deposit (₹)</Label>
                  <Input type="number" disabled={!isSuperAdmin} value={form.security_deposit} onChange={(e) => handleChange("security_deposit", Number(e.target.value))} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* BUSINESS INFO TAB */}
          <TabsContent value="business" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-4">
            <Card className="rounded-[2rem] border-border shadow-sm">
              <CardHeader>
                <CardTitle>Business Information</CardTitle>
                <CardDescription>Public details displayed on invoices and emails.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input disabled={!isSuperAdmin} value={form.company_name} onChange={(e) => handleChange("company_name", e.target.value)} />
                </div>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Support Email</Label>
                    <Input disabled={!isSuperAdmin} value={form.support_email} onChange={(e) => handleChange("support_email", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Number</Label>
                    <Input disabled={!isSuperAdmin} value={form.support_phone} onChange={(e) => handleChange("support_phone", e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>GST Number (Optional)</Label>
                  <Input disabled={!isSuperAdmin} value={form.gst_number} onChange={(e) => handleChange("gst_number", e.target.value)} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* RENTAL RULES */}
          <TabsContent value="rules" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-4">
            <Card className="rounded-[2rem] border-border shadow-sm">
              <CardHeader>
                <CardTitle>Rental Rules</CardTitle>
                <CardDescription>Enforce limits on durations and penalties.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Minimum Rental Duration (Hours)</Label>
                    <Input type="number" disabled={!isSuperAdmin} value={form.min_rental_hours} onChange={(e) => handleChange("min_rental_hours", Number(e.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Maximum Rental Duration (Days)</Label>
                    <Input type="number" disabled={!isSuperAdmin} value={form.max_rental_days} onChange={(e) => handleChange("max_rental_days", Number(e.target.value))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Late Return Penalty (Per Hour ₹)</Label>
                  <Input type="number" disabled={!isSuperAdmin} value={form.late_fee_per_hour} onChange={(e) => handleChange("late_fee_per_hour", Number(e.target.value))} />
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl border border-border">
                  <div className="space-y-0.5">
                    <Label>Helmet Mandatory</Label>
                    <p className="text-xs text-muted-foreground">Force users to acknowledge helmet rules during checkout.</p>
                  </div>
                  <Switch disabled={!isSuperAdmin} checked={form.helmet_required} onCheckedChange={(v) => handleChange("helmet_required", v)} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* VERIFICATION */}
          <TabsContent value="docs" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-4">
            <Card className="rounded-[2rem] border-border shadow-sm">
              <CardHeader>
                <CardTitle>Document Verification</CardTitle>
                <CardDescription>Toggle which documents are mandatory for booking.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl border border-border">
                  <Label>Aadhaar Card Required</Label>
                  <Switch disabled={!isSuperAdmin} checked={form.aadhaar_required} onCheckedChange={(v) => handleChange("aadhaar_required", v)} />
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl border border-border">
                  <Label>Driving License Required</Label>
                  <Switch disabled={!isSuperAdmin} checked={form.license_required} onCheckedChange={(v) => handleChange("license_required", v)} />
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl border border-border">
                  <Label>College ID Required</Label>
                  <Switch disabled={!isSuperAdmin} checked={form.college_id_required} onCheckedChange={(v) => handleChange("college_id_required", v)} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* BOOKING */}
          <TabsContent value="booking" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-4">
            <Card className="rounded-[2rem] border-border shadow-sm">
              <CardHeader>
                <CardTitle>Booking Configuration</CardTitle>
                <CardDescription>Control the booking workflow and approvals.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl border border-border">
                  <div className="space-y-0.5">
                    <Label>Auto-Approve Bookings</Label>
                    <p className="text-xs text-muted-foreground">Skip manual admin approval for verified users.</p>
                  </div>
                  <Switch disabled={!isSuperAdmin} checked={form.auto_approve} onCheckedChange={(v) => handleChange("auto_approve", v)} />
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl border border-border">
                  <div className="space-y-0.5">
                    <Label>Allow Instant Booking</Label>
                    <p className="text-xs text-muted-foreground">Users can book within 1 hour of pickup.</p>
                  </div>
                  <Switch disabled={!isSuperAdmin} checked={form.instant_booking} onCheckedChange={(v) => handleChange("instant_booking", v)} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* INVENTORY */}
          <TabsContent value="inventory" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-4">
            <Card className="rounded-[2rem] border-border shadow-sm">
              <CardHeader>
                <CardTitle>Inventory Alerts</CardTitle>
                <CardDescription>Setup alerts for stock and maintenance.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Low Stock Alert Threshold</Label>
                  <Input type="number" disabled={!isSuperAdmin} value={form.low_stock_threshold} onChange={(e) => handleChange("low_stock_threshold", Number(e.target.value))} />
                  <p className="text-xs text-muted-foreground">Alert admins if available bikes drop below this number.</p>
                </div>
                <div className="space-y-2">
                  <Label>Maintenance Reminder (Days)</Label>
                  <Input type="number" disabled={!isSuperAdmin} value={form.maintenance_reminder_days} onChange={(e) => handleChange("maintenance_reminder_days", Number(e.target.value))} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ADMIN MANAGEMENT */}
          <TabsContent value="admin" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-4">
            <Card className="rounded-[2rem] border-border shadow-sm">
              <CardHeader>
                <CardTitle>Admin Directory</CardTitle>
                <CardDescription>Access to users tab is required to manage admins. This section redirects you there.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 rounded-xl p-6 text-center border border-dashed border-border">
                  <UserCog className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-bold mb-2">Role Management is Centralized</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">
                    To add or remove admins, modify their role directly from the central Users database tab.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* THEME */}
          <TabsContent value="theme" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-4">
            <Card className="rounded-[2rem] border-border shadow-sm">
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Theme settings are configured at the code level using Tailwind config for consistency.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 rounded-xl p-6 text-center border border-dashed border-border">
                  <Palette className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Dark mode toggle is available in the main navigation. Brand colors are locked to your design system.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </div>
      </Tabs>
    </div>
  );
}
