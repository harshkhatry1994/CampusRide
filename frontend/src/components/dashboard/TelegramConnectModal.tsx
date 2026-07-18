import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface TelegramConnectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isConnected: boolean;
  onStatusChange: (status: boolean) => void;
}

export function TelegramConnectModal({ open, onOpenChange, isConnected, onStatusChange }: TelegramConnectModalProps) {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [connectCode, setConnectCode] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (open && isConnected && user?.id) {
      // Fetch profile info if connected
      const fetchProfile = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('telegram_username, telegram_chat_id, created_at')
          .eq('id', user.id)
          .single();
        if (data) setProfile(data);
      };
      fetchProfile();
    }
  }, [open, isConnected, user]);

  const handleGenerateCode = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/telegram/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id })
      });
      const data = await res.json();
      if (data.success) {
        setConnectCode(data.code);
      } else {
        toast.error(data.message || "Failed to generate code");
      }
    } catch (error) {
      toast.error("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/telegram/disconnect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id })
      });
      const data = await res.json();
      if (data.success) {
        onStatusChange(false);
        onOpenChange(false);
        toast.success("Telegram disconnected");
      } else {
        toast.error(data.message || "Failed to disconnect");
      }
    } catch (error) {
      toast.error("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] sm:rounded-[2rem] p-0 overflow-hidden bg-background border-none shadow-2xl">
        <div className="bg-[#229ED9] p-8 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 flex items-center justify-center">
            <Send className="w-64 h-64 -rotate-12" />
          </div>
          <div className="relative z-10 flex justify-center mb-4">
            <div className="h-20 w-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md shadow-lg">
              <Send className="h-10 w-10 text-white fill-white -ml-1 mt-1" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-black relative z-10 text-white">
            {isConnected ? "Telegram Connected" : "Connect Telegram"}
          </DialogTitle>
          <DialogDescription className="text-white/80 font-medium relative z-10 mt-2">
            {isConnected ? "You are receiving real-time booking updates." : "Get instant notifications for your bookings directly on Telegram."}
          </DialogDescription>
        </div>

        <div className="p-8">
          {!isConnected ? (
            <div className="space-y-6 text-center">
              {!connectCode ? (
                <Button
                  onClick={handleGenerateCode}
                  disabled={loading}
                  className="w-full h-14 rounded-2xl font-bold bg-[#229ED9] hover:bg-[#1E8CC0] text-white shadow-lg transition-all hover:-translate-y-1"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Generate Connect Link"}
                </Button>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm font-medium text-muted-foreground">Click below to open Telegram and send the connection code automatically.</p>
                  <Button
                    asChild
                    className="w-full h-14 rounded-2xl font-bold bg-[#229ED9] hover:bg-[#1E8CC0] text-white shadow-lg transition-all hover:-translate-y-1"
                  >
                    <a href={`https://t.me/CampusRideBot?start=${connectCode}`} target="_blank" rel="noreferrer">
                      <Send className="h-5 w-5 mr-2" /> Open Telegram Bot
                    </a>
                  </Button>
                  <p className="text-xs text-muted-foreground mt-4">
                    Or send <strong>/start {connectCode}</strong> to @CampusRideBot
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center p-4 bg-muted/40 rounded-2xl border border-border/50">
                  <span className="text-sm font-bold text-muted-foreground">Username</span>
                  <span className="font-bold">@{profile?.telegram_username || 'user'}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-muted/40 rounded-2xl border border-border/50">
                  <span className="text-sm font-bold text-muted-foreground">Connection Date</span>
                  <span className="font-bold text-sm">
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Recent'}
                  </span>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-border/50">
                <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-4">Enabled Alerts</h4>
                {[
                  "Booking Updates",
                  "Payment Status",
                  "Admin Messages",
                  "Identity Verification",
                  "Premium Notifications"
                ].map((alert, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-[#229ED9]" />
                    <span className="font-medium text-sm">{alert}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-6">
                <Button
                  variant="outline"
                  className="flex-1 h-12 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20"
                  onClick={handleDisconnect}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Disconnect"}
                </Button>
                <Button
                  variant="default"
                  className="flex-1 h-12 rounded-xl bg-foreground text-background hover:bg-foreground/90"
                  onClick={() => onOpenChange(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
