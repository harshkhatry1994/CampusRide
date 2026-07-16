import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Search, Send, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const API_URL = import.meta.env.VITE_API_URL;
import { supabase } from "@/lib/supabase";

export function AdminMessages({ token }: { token?: string | null }) {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase.from('profiles').select('*');
        if (error) throw error;
        if (data) {
          setUsers(data);
        }
      } catch (err) {
        toast.error("Failed to fetch users");
      } finally {
        setFetchingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((u) => {
    const nameToMatch = u.full_name || u.name || "";
    return nameToMatch.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
  });

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) {
      toast.error("Please select a user");
      return;
    }
    if (!title || !message) {
      toast.error("Title and message are required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/notify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "admin_message",
          userId: selectedUser.id,
          customerEmail: selectedUser.email,
          title,
          message,
        }),
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success("Message sent successfully!");
        setTitle("");
        setMessage("");
        setSelectedUser(null);
      } else {
        toast.error(data.message || "Failed to send message");
      }
    } catch (err) {
      toast.error("Error sending message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[70vh]">
      {/* Users List Sidebar */}
      <div className="col-span-1 border border-border/60 rounded-2xl bg-card p-4 flex flex-col shadow-elegant">
        <h3 className="font-bold text-lg mb-4">Select User</h3>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search users..." 
            className="pl-9 bg-muted/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
          {fetchingUsers ? (
            <div className="text-center py-4 text-muted-foreground text-sm animate-pulse">Loading...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground text-sm">No users found</div>
          ) : (
            filteredUsers.map((user) => (
              <div 
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                  selectedUser?.id === user.id ? 'bg-primary/10 border-primary/20 border' : 'hover:bg-muted/50 border border-transparent'
                }`}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.avatar_url} />
                  <AvatarFallback className="bg-primary/20 text-primary">
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{user.full_name || user.name || "Unknown User"}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Message Composer */}
      <div className="col-span-1 md:col-span-2 border border-border/60 rounded-2xl bg-card p-6 shadow-elegant flex flex-col">
        {selectedUser ? (
          <>
            <div className="mb-6 pb-4 border-b border-border/40 flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={selectedUser.avatar_url} />
                <AvatarFallback className="bg-primary/20 text-primary">
                  <User className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-bold text-lg">Send Message to {selectedUser.full_name || selectedUser.name || "User"}</h3>
                <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
              </div>
            </div>

            <form onSubmit={handleSend} className="flex-1 flex flex-col space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Message Title</Label>
                <Input
                  id="title"
                  placeholder="e.g. Important Update Regarding Your Account"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2 flex-1 flex flex-col">
                <Label htmlFor="message">Message Body</Label>
                <Textarea
                  id="message"
                  placeholder="Type your message here... They will receive it via Dashboard, Email, and Telegram."
                  className="flex-1 min-h-[200px] resize-none"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
              </div>

              <div className="pt-4 flex justify-end">
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="bg-primary text-primary-foreground shadow-glow w-full sm:w-auto min-w-[150px]"
                >
                  {loading ? (
                    "Sending..."
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Message
                    </>
                  )}
                </Button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <Send className="h-12 w-12 mb-4 opacity-20" />
            <p className="text-lg font-medium">No User Selected</p>
            <p className="text-sm">Select a user from the list to compose a message.</p>
          </div>
        )}
      </div>
    </div>
  );
}
