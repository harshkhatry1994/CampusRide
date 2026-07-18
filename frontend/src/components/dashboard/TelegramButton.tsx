import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Send, Check, Loader2, Unlink } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export function TelegramButton() {
  const { user, token } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    if (user?.id) {
      const fetchStatus = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('telegram_chat_id, telegram_username')
          .eq('id', user.id)
          .single();

        if (data) {
          setIsConnected(!!data.telegram_chat_id);
          setUsername(data.telegram_username || "");
        }
        setLoading(false);
      };
      fetchStatus();

      const channel = supabase
        .channel('telegram-status')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${user.id}`,
          },
          (payload) => {
            setIsConnected(!!payload.new.telegram_chat_id);
            setUsername(payload.new.telegram_username || "");
            setLoading(false);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setLoading(false);
    }
  }, [user]);

  if (!user || !token) return null;

  const handleConnect = () => {
    setLoading(true);
    window.open(`https://t.me/CampusRideBot?start=${user.id}`, '_blank');
    // loading will be cleared by the realtime update
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/telegram/disconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      if (res.ok) {
        toast.success('Telegram disconnected');
      } else {
        toast.error('Failed to disconnect');
      }
    } catch (e) {
      toast.error('Failed to disconnect');
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading && !isConnected) {
    return (
      <Button variant="outline" size="icon" className="h-8 w-8 rounded-full mr-2 hidden sm:flex border-[#229ED9]/30 text-[#229ED9]">
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  if (isConnected) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="hidden sm:flex relative group transition-all duration-300 mr-2 rounded-full h-8 px-3 bg-[#229ED9]/10 text-[#229ED9] hover:bg-[#229ED9]/20 hover:shadow-[0_0_15px_rgba(34,158,217,0.3)] border border-[#229ED9]/30 hover:-translate-y-0.5"
          >
            <Check className="h-3.5 w-3.5 mr-1" />
            <span className="font-bold tracking-widest text-[10px] uppercase">
              Connected
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 rounded-2xl border-border/40 shadow-xl p-2">
          <DropdownMenuLabel className="font-normal px-2">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-bold leading-none text-[#229ED9]">Telegram Linked</p>
              <p className="text-xs text-muted-foreground">{username ? `@${username}` : 'Receiving notifications'}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-border/40 my-2" />
          <DropdownMenuItem
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer rounded-xl transition-colors"
          >
            {disconnecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Unlink className="mr-2 h-4 w-4" />}
            <span>Disconnect</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button
      onClick={handleConnect}
      size="icon"
      className="hidden sm:flex relative group transition-all duration-300 mr-2 rounded-full h-8 w-8 bg-[#229ED9] text-white hover:bg-[#1E8CC0] hover:shadow-[0_0_15px_rgba(34,158,217,0.5)] shadow-lg hover:-translate-y-0.5"
    >
      <Send className="h-4 w-4 -ml-0.5" />
    </Button>
  );
}
