import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Moon, Sun, Globe, ShieldAlert, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function SettingsView() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      // Soft delete: set is_active = false and deleted_at = now()
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_active: false, 
          deleted_at: new Date().toISOString() 
        })
        .eq('id', user.id);

      if (error) throw error;
      
      toast.success("Your account has been deactivated.");
      await logout();
    } catch (err) {
      console.error(err);
      toast.error("Failed to deactivate account. Please contact support.");
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-black">Settings</h2>
        <p className="text-muted-foreground">Manage your app preferences and privacy</p>
      </div>

      <div className="bg-card rounded-[2rem] border border-border/60 shadow-elegant overflow-hidden">
        {/* Appearance */}
        <div className="p-8 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-bold text-lg flex items-center gap-2">
                {theme === 'dark' ? <Moon className="h-5 w-5 text-primary" /> : <Sun className="h-5 w-5 text-primary" />}
                Appearance
              </h3>
              <p className="text-sm text-muted-foreground">Toggle between light and dark themes.</p>
            </div>
            <Button variant="outline" onClick={toggleTheme} className="rounded-xl h-12 px-6 font-bold">
              {theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            </Button>
          </div>
        </div>

        {/* Language */}
        <div className="p-8 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Language
              </h3>
              <p className="text-sm text-muted-foreground">Select your preferred language.</p>
            </div>
            <select 
              className="h-12 rounded-xl border border-border bg-muted/20 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary font-medium w-48"
              defaultValue="en"
            >
              <option value="en">English (US)</option>
              <option value="hi">Hindi (Coming Soon)</option>
              <option value="fr">French (Coming Soon)</option>
            </select>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="p-8 bg-destructive/5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-bold text-lg text-destructive flex items-center gap-2">
                <ShieldAlert className="h-5 w-5" />
                Danger Zone
              </h3>
              <p className="text-sm text-muted-foreground">Permanently deactivate your account and remove access.</p>
            </div>
            <Button 
              variant="destructive" 
              className="rounded-xl h-12 px-6 font-bold shadow-lg shadow-destructive/20"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" /> Deactivate Account
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-[2rem] p-8 border-destructive/20">
          <DialogHeader className="mb-6">
            <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="h-8 w-8 text-destructive" />
            </div>
            <DialogTitle className="text-center text-xl font-black text-destructive">Deactivate Account?</DialogTitle>
            <DialogDescription className="text-center mt-2">
              Are you sure you want to deactivate your account? Your profile will be hidden, and you won't be able to log in. 
              Your past bookings will be retained for record-keeping.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-4">
            <Button variant="outline" className="flex-1 h-12 rounded-xl font-bold" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              className="flex-1 h-12 rounded-xl font-bold"
              disabled={deleting}
              onClick={handleDeleteAccount}
            >
              {deleting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Yes, Deactivate"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
