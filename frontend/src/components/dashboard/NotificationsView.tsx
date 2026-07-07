import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Bell, Check, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
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
        .from('user_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data) setNotifications(data);
      setLoading(false);
    };

    fetchNotifications();

    // Subscribe to new notifications
    const channel = supabase
      .channel('user_notifications')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'user_notifications',
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
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    await supabase.from('user_notifications').update({ is_read: true }).eq('id', id);
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    await supabase.from('user_notifications').update({ is_read: true }).eq('user_id', user?.id).eq('is_read', false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

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
                className={`p-6 transition-colors ${notification.is_read ? 'opacity-70' : 'bg-primary/5 hover:bg-primary/10'}`}
                onClick={() => !notification.is_read && markAsRead(notification.id)}
              >
                <div className="flex gap-4">
                  <div className={`mt-1 h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                    notification.is_read ? 'bg-muted text-muted-foreground' : 'bg-primary/20 text-primary'
                  }`}>
                    {notification.type === 'booking_confirmed' || notification.type === 'payment_success' ? (
                      <Check className="h-5 w-5" />
                    ) : notification.type === 'booking_cancelled' ? (
                      <AlertCircle className="h-5 w-5" />
                    ) : (
                      <Bell className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-2 items-start">
                      <h4 className={`text-base truncate ${notification.is_read ? 'font-medium' : 'font-bold'}`}>
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
