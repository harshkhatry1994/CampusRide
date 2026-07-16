import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Bell, Check, Loader2, AlertCircle, Trash2, MessageSquare, ShieldCheck, CreditCard, Bike } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  action_url: string | null;
  created_at: string;
}

export function NotificationsView() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data) setNotifications(data);
      setLoading(false);
    };

    fetchNotifications();

    // Subscribe to new notifications
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        setNotifications(prev => [payload.new as AppNotification, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    await supabase.from('notifications').update({ read: true }).eq('id', id);
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    await supabase.from('notifications').update({ read: true }).eq('user_id', user?.id).eq('read', false);
  };

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
    await supabase.from('notifications').delete().eq('id', id);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black flex items-center gap-2">
            Notifications 
            {unreadCount > 0 && (
              <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                {unreadCount} new
              </span>
            )}
          </h2>
          <p className="text-muted-foreground">Stay updated on your rides and account</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllAsRead} className="rounded-xl h-10 px-4">
            <Check className="h-4 w-4 mr-2" /> Mark all as read
          </Button>
        )}
      </div>

      <div className="bg-card rounded-[2rem] border border-border/60 shadow-elegant overflow-hidden">
        {notifications.length === 0 ? (
          <div className="text-center py-20">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-bold mb-2">All caught up!</h3>
            <p className="text-muted-foreground">You have no notifications at the moment.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {notifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`p-6 transition-colors ${notification.read ? 'opacity-70' : 'bg-primary/5 hover:bg-primary/10'}`}
                onClick={() => !notification.read && markAsRead(notification.id)}
              >
                <div className="flex gap-4">
                  <div className={`mt-1 h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                    notification.read ? 'bg-muted text-muted-foreground' : 'bg-primary/20 text-primary'
                  }`}>
                    {notification.type.includes('approved') || notification.type.includes('success') ? (
                      <Check className="h-5 w-5" />
                    ) : notification.type.includes('cancelled') || notification.type.includes('rejected') ? (
                      <AlertCircle className="h-5 w-5" />
                    ) : notification.type === 'admin_message' ? (
                      <MessageSquare className="h-5 w-5" />
                    ) : notification.type.includes('payment') ? (
                      <CreditCard className="h-5 w-5" />
                    ) : notification.type.includes('ride') || notification.type.includes('booking') ? (
                      <Bike className="h-5 w-5" />
                    ) : notification.type.includes('membership') ? (
                      <ShieldCheck className="h-5 w-5" />
                    ) : (
                      <Bell className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-2 items-start">
                      <h4 className={`text-base truncate ${notification.read ? 'font-medium' : 'font-bold'}`}>
                        {notification.title}
                      </h4>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(notification.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    {notification.action_url && (
                      <Button 
                        variant="link" 
                        className="p-0 h-auto mt-2 text-primary text-xs font-bold uppercase tracking-widest"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = notification.action_url!;
                        }}
                      >
                        View Details
                      </Button>
                    )}
                  </div>
                  <div className="shrink-0 flex items-start">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => deleteNotification(notification.id, e)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
