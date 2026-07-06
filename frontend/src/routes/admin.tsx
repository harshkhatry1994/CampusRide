import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Shield } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminBikes } from "@/components/admin/AdminBikes";
import { AdminBookings } from "@/components/admin/AdminBookings";
import { AdminUsers } from "@/components/admin/AdminUsers";
import { AdminMemberships } from "@/components/admin/AdminMemberships";
import { AdminSettings } from "@/components/admin/AdminSettings";
import { toast } from "sonner";
import { AdminLayout, AdminSection } from "@/layouts/AdminLayout";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Panel — CampusRide" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { user, token, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const [section, setSection] = useState<AdminSection>("dashboard");

  useEffect(() => {
    if (!isLoading) {
      if (!token) {
        navigate({ to: "/login" });
        return;
      }
      if (!isAdmin) {
        toast.error("Access denied. Admins only.");
        navigate({ to: "/dashboard" });
      }
    }
  }, [token, isAdmin, isLoading]);

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">Verifying access...</p>
        </div>
      </div>
    );

  if (!token || !isAdmin) return null;

  return (
    <AdminLayout section={section} setSection={setSection}>
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
        {section === "dashboard" && <AdminDashboard />}
        {section === "inventory" && <AdminBikes readOnly={true} />}
        {section === "bike_management" && <AdminBikes />}
        {section === "rentals" && <AdminBookings />}
        {section === "users" && <AdminUsers />}
        {section === "memberships" && <AdminMemberships />}
        {section === "settings" && <AdminSettings />}
      </main>
    </AdminLayout>
  );
}
