import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  Shield,
  Bike as BikeIcon,
  Users,
  ReceiptText,
  BarChart3,
  IndianRupee,
  TrendingUp,
  Package,
  Image as ImageIcon,
  Eye,
  FileText,
  UserCircle,
  Phone,
  MapPin,
  Zap,
  MessageCircle,
  Settings,
  History,
  Bot,
  MessageSquare,
  Trophy,
  Mail,
  Download,
  Crown,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { AdminSettings } from "./AdminSettings";
import { AdminMemberships } from "./AdminMemberships";

const API_URL = import.meta.env.VITE_API_URL;

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState("stats");
  const { token } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <Shield className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Admin Control Center</h2>
          <p className="text-sm text-muted-foreground">
            Manage inventory, track revenue, and oversee users.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex w-full overflow-x-auto justify-start lg:w-fit bg-card border border-border/40 p-1 mb-6 rounded-2xl shadow-sm">
          <TabsTrigger
            value="stats"
            className="gap-2 px-6 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all"
          >
            <BarChart3 className="h-4 w-4" /> Stats
          </TabsTrigger>
          <TabsTrigger
            value="bikes"
            className="gap-2 px-6 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all"
          >
            <BikeIcon className="h-4 w-4" /> Inventory
          </TabsTrigger>
          <TabsTrigger
            value="bookings"
            className="gap-2 px-6 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all"
          >
            <ReceiptText className="h-4 w-4" /> Bookings
          </TabsTrigger>
          <TabsTrigger
            value="users"
            className="gap-2 px-6 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all"
          >
            <Users className="h-4 w-4" /> Users
          </TabsTrigger>
          <TabsTrigger
            value="invoices"
            className="gap-2 px-6 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all"
          >
            <FileText className="h-4 w-4" /> Invoices
          </TabsTrigger>
          <TabsTrigger
            value="contacts"
            className="gap-2 px-6 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all"
          >
            <MessageSquare className="h-4 w-4" /> Messages
          </TabsTrigger>
          <TabsTrigger
            value="memberships"
            className="gap-2 px-6 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all"
          >
            <Crown className="h-4 w-4" /> Memberships
          </TabsTrigger>
          <TabsTrigger
            value="chatbot"
            className="gap-2 px-6 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all"
          >
            <MessageCircle className="h-4 w-4" /> AI Chatbot
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className="gap-2 px-6 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all"
          >
            <Settings className="h-4 w-4" /> Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="mt-0">
          <StatsOverview token={token} />
        </TabsContent>

        <TabsContent value="bikes" className="mt-0">
          <BikesManagement token={token} />
        </TabsContent>

        <TabsContent value="bookings" className="mt-0">
          <BookingsManagement token={token} />
        </TabsContent>

        <TabsContent value="users" className="mt-0">
          <UsersManagement token={token} />
        </TabsContent>

        <TabsContent value="invoices" className="mt-0">
          <InvoicesManagement token={token} />
        </TabsContent>

        <TabsContent value="contacts" className="mt-0">
          <ContactMessages token={token} />
        </TabsContent>

        <TabsContent value="memberships" className="mt-0">
          <AdminMemberships />
        </TabsContent>
        <TabsContent value="chatbot" className="mt-0">
          <ChatbotSettings />
        </TabsContent>

        <TabsContent value="settings" className="mt-0">
          <AdminSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatsOverview({ token }: { token: string | null }) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/admin/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setStats(data.data.stats);
        setLoading(false);
      });
  }, [token]);

  if (loading)
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 rounded-2xl bg-muted animate-pulse" />
        ))}
      </div>
    );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon={<IndianRupee />}
        title="Total Revenue"
        value={`₹${stats?.totalRevenue.toLocaleString()}`}
        trend="+12.5%"
      />
      <StatCard icon={<Package />} title="Total Bikes" value={stats?.totalBikes} trend="In stock" />
      <StatCard
        icon={<TrendingUp />}
        title="Bookings"
        value={stats?.totalBookings}
        trend="All time"
      />
      <StatCard icon={<Users />} title="Customers" value={stats?.totalUsers} trend="Active" />
    </div>
  );
}

function StatCard({ icon, title, value, trend }: any) {
  return (
    <div className="p-6 rounded-2xl bg-gradient-card border border-border/60 shadow-sm relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        {icon}
      </div>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">{icon}</div>
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
      </div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-xs text-green-500 font-medium">{trend}</div>
    </div>
  );
}

function BikesManagement({ token }: { token: string | null }) {
  const [bikes, setBikes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBike, setEditingBike] = useState<any>(null);

  const fetchBikes = async () => {
    try {
      const res = await fetch(`${API_URL}/api/bikes`);
      const data = await res.json();
      if (data.success) setBikes(data.data.bikes);
    } catch (err) {
      toast.error("Failed to fetch bikes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBikes();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this bike?")) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/bikes/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success("Bike removed");
        fetchBikes();
      }
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-elegant">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Inventory</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              className="bg-gradient-brand text-primary-foreground shadow-glow"
              onClick={() => setEditingBike(null)}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Bike
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingBike ? "Edit Bike" : "Add New Bike"}</DialogTitle>
            </DialogHeader>
            <BikeForm
              bike={editingBike}
              token={token}
              onSuccess={() => {
                setIsDialogOpen(false);
                fetchBikes();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bike</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price/Day</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : (
              bikes.map((bike) => (
                <TableRow key={bike._id} className="group">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          bike.imageUrl?.startsWith("/uploads")
                            ? `${API_URL}${bike.imageUrl}`
                            : bike.imageUrl || "/placeholder-bike.jpg"
                        }
                        className="h-10 w-12 object-cover rounded-md border border-border/40"
                      />
                      <div>
                        <div className="text-sm">{bike.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {bike.brand} {bike.model}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {bike.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold">₹{bike.pricePerDay}</TableCell>
                  <TableCell>
                    <Badge variant={bike.available ? "default" : "secondary"}>
                      {bike.available ? "Active" : "Booked"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setEditingBike(bike);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDelete(bike._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function BikeForm({ bike, token, onSuccess }: any) {
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: bike?.name || "",
    brand: bike?.brand || "",
    model: bike?.model || "",
    category: bike?.category || "Street",
    pricePerHour: bike?.pricePerHour || "",
    pricePerDay: bike?.pricePerDay || "",
    mileage: bike?.mileage || "",
    fuelType: bike?.fuelType || "Petrol",
    description: bike?.description || "",
    available: bike?.available ?? true,
    engineCC: bike?.engineCC || "",
    year: bike?.year || new Date().getFullYear(),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    Object.entries(formData).forEach(([key, val]) => data.append(key, val.toString()));
    if (imageFile) data.append("image", imageFile);

    try {
      const url = bike ? `${API_URL}/api/admin/bikes/${bike._id}` : `${API_URL}/api/admin/bikes`;
      const method = bike ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      });

      if (res.ok) {
        toast.success(bike ? "Bike updated" : "Bike added successfully!");
        onSuccess();
      } else {
        const errData = await res.json();
        toast.error(errData.message || "Failed to save bike");
      }
    } catch (err) {
      toast.error("Connection error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Display Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="e.g. Electric Beast"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select
            value={formData.category}
            onValueChange={(v) => setFormData({ ...formData, category: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["Cruiser", "Sports", "Street", "Adventure", "Scooter"].map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="brand">Brand</Label>
          <Input
            id="brand"
            value={formData.brand}
            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
            required
            placeholder="Yamaha"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          <Input
            id="model"
            value={formData.model}
            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
            required
            placeholder="R15 V4"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="priceDay">Price / Day (₹)</Label>
          <Input
            id="priceDay"
            type="number"
            value={formData.pricePerDay}
            onChange={(e) => setFormData({ ...formData, pricePerDay: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="priceHour">Price / Hour (₹)</Label>
          <Input
            id="priceHour"
            type="number"
            value={formData.pricePerHour}
            onChange={(e) => setFormData({ ...formData, pricePerHour: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe the bike features..."
        />
      </div>

      <div className="space-y-2">
        <Label>Bike Image</Label>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            />
          </div>
          {bike?.imageUrl && !imageFile && (
            <img
              src={`${API_URL}${bike.imageUrl}`}
              className="h-10 w-10 object-cover rounded border"
            />
          )}
        </div>
        <p className="text-[10px] text-muted-foreground italic">
          Preferred size: 800x600px. JPG/PNG only.
        </p>
      </div>

      <DialogFooter className="gap-2">
        <Button
          type="submit"
          disabled={loading}
          className="bg-gradient-brand text-primary-foreground shadow-glow w-full sm:w-auto"
        >
          {loading ? (
            "Saving..."
          ) : (
            <>
              <Check className="h-4 w-4 mr-1" /> Save Bike
            </>
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}

function BookingsManagement({ token }: { token: string | null }) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  const fetchAllBookings = async () => {
    try {
      const res = await fetch(`${API_URL}/api/bookings/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setBookings(data.data);
    } catch (err) {
      toast.error("Failed to fetch bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllBookings();
  }, []);

  const updateMilestone = async (id: string, currentMilestone: string) => {
    try {
      const res = await fetch(`${API_URL}/api/bookings/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentMilestone }),
      });
      if (res.ok) {
        toast.success("Milestone updated");
        fetchAllBookings();
        // Update local selected booking state
        setSelectedBooking((prev: any) => ({ ...prev, currentMilestone }));
      }
    } catch (err) {
      toast.error("Update failed");
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`${API_URL}/api/bookings/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast.success(`Booking ${status}`);
        fetchAllBookings();
        setSelectedBooking(null);
      }
    } catch (err) {
      toast.error("Action failed");
    }
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-elegant overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Bike</TableHead>
            <TableHead>Dates</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8">
                Loading...
              </TableCell>
            </TableRow>
          ) : (
            bookings.map((b) => (
              <TableRow key={b._id} className="group">
                <TableCell>
                  <div className="font-bold">{b.riderDetails?.name || b.user?.name}</div>
                  <div className="text-xs text-muted-foreground">{b.user?.email}</div>
                </TableCell>
                <TableCell>
                  {b.bike?.brand} {b.bike?.model}
                </TableCell>
                <TableCell className="text-xs font-medium">
                  {new Date(b.startDate).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      b.status === "pending"
                        ? "outline"
                        : b.status === "confirmed"
                          ? "default"
                          : "secondary"
                    }
                  >
                    {b.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => setSelectedBooking(b)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Verification Modal */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Verification: {selectedBooking?.bookingId}</DialogTitle>
            <DialogDescription>Review documents and payment for this ride.</DialogDescription>
          </DialogHeader>

          <div className="grid md:grid-cols-2 gap-8 py-4">
            <div className="space-y-6">
              <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex justify-between items-center">
                Rider Documents
                <Select
                  value={selectedBooking?.documentVerificationStatus || "pending"}
                  onValueChange={async (val) => {
                    try {
                      const res = await fetch(
                        `${API_URL}/api/bookings/${selectedBooking._id}/status`,
                        {
                          method: "PATCH",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                          },
                          body: JSON.stringify({ documentVerificationStatus: val }),
                        },
                      );
                      if (res.ok) {
                        toast.success(`Documents ${val}`);
                        fetchAllBookings();
                        setSelectedBooking((prev: any) => ({
                          ...prev,
                          documentVerificationStatus: val,
                        }));
                      }
                    } catch (err) {
                      toast.error("Update failed");
                    }
                  }}
                >
                  <SelectTrigger className="w-[100px] h-6 text-[8px] uppercase tracking-widest">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <DocumentPreview label="Driving Licence" url={selectedBooking?.licenceUrl} />
                <DocumentPreview label="Aadhaar Card" url={selectedBooking?.aadhaarUrl} />
                <DocumentPreview label="Selfie Verification" url={selectedBooking?.selfieUrl} />
                <DocumentPreview label="Passport / Other" url={selectedBooking?.additionalDocUrl} />
              </div>
              <div className="p-4 rounded-2xl bg-muted/50 border border-border/40 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <UserCircle className="h-4 w-4" /> Rider Info
                </h4>
                <div className="space-y-1">
                  <p className="text-sm font-bold">{selectedBooking?.riderDetails?.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Phone className="h-3 w-3" /> {selectedBooking?.riderDetails?.phone}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="h-3 w-3" /> {selectedBooking?.riderDetails?.address}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-5 rounded-3xl bg-gradient-brand text-primary-foreground shadow-glow">
                <h4 className="text-xs font-bold uppercase tracking-widest opacity-80 mb-4">
                  Payment Summary
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between font-medium">
                    <span>Transaction ID:</span>{" "}
                    <span>{selectedBooking?.payment?.transactionId}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Total Paid:</span>{" "}
                    <span className="text-xl font-black">
                      ₹{selectedBooking?.pricing?.totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                  Manage Request
                </h4>

                <div className="space-y-2">
                  <Label className="text-xs">Update Ride Milestone</Label>
                  <Select
                    value={selectedBooking?.currentMilestone || "booked"}
                    onValueChange={(val) => updateMilestone(selectedBooking._id, val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="booked">Booked (20%)</SelectItem>
                      <SelectItem value="picked_up">Bike Picked Up (40%)</SelectItem>
                      <SelectItem value="on_ride">In Progress (60%)</SelectItem>
                      <SelectItem value="near_completion">Near Completion (80%)</SelectItem>
                      <SelectItem value="completed">Completed (100%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Invoice Actions</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Link to="/invoice/$bookingId" params={{ bookingId: selectedBooking._id }}>
                      <Button variant="outline" size="sm" className="w-full gap-2 text-xs">
                        <FileText className="h-3.5 w-3.5" /> View
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 text-xs"
                      onClick={() => window.open(`/invoice/${selectedBooking._id}`, "_blank")}
                    >
                      <Download className="h-3.5 w-3.5" /> PDF
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 text-xs col-span-2"
                      onClick={async () => {
                        try {
                          // Need to find the invoice ID first
                          const invRes = await fetch(
                            `${API_URL}/api/invoices/booking/${selectedBooking._id}`,
                            {
                              headers: { Authorization: `Bearer ${token}` },
                            },
                          );
                          const invData = await invRes.json();
                          if (invData.success) {
                            const res = await fetch(
                              `${API_URL}/api/invoices/${invData.data._id}/email`,
                              {
                                method: "POST",
                                headers: { Authorization: `Bearer ${token}` },
                              },
                            );
                            if (res.ok) toast.success("Invoice resent to customer!");
                          } else {
                            toast.error("Generate invoice first");
                          }
                        } catch (err) {
                          toast.error("Resend failed");
                        }
                      }}
                    >
                      <Mail className="h-3.5 w-3.5" /> Resend Invoice Email
                    </Button>
                  </div>
                </div>

                <div className="flex gap-3">
                  {selectedBooking.status === "pending" && (
                    <Button
                      onClick={() => updateStatus(selectedBooking._id, "confirmed")}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                    >
                      <Check className="h-4 w-4 mr-2" /> Verify & Confirm
                    </Button>
                  )}
                  {selectedBooking.status !== "completed" &&
                    selectedBooking.status !== "cancelled" && (
                      <Button
                        onClick={() => updateStatus(selectedBooking._id, "completed")}
                        variant="outline"
                        className="flex-1 border-primary/40 text-primary"
                      >
                        <Trophy className="h-4 w-4 mr-2" /> Finish Ride
                      </Button>
                    )}
                  <Button
                    onClick={() => updateStatus(selectedBooking._id, "rejected")}
                    variant="destructive"
                    className="flex-1"
                  >
                    <X className="h-4 w-4 mr-2" /> Reject / Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DocumentPreview({ label, url }: any) {
  if (!url)
    return (
      <div className="space-y-1.5 opacity-40">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
        <div className="aspect-[3/2] rounded-xl border border-dashed border-border/60 flex items-center justify-center bg-muted/20 text-[10px] italic">
          Not Uploaded
        </div>
      </div>
    );

  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <div className="aspect-[3/2] rounded-xl border border-border/40 overflow-hidden bg-black group relative shadow-sm">
        <img
          src={`${API_URL}${url}`}
          className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-all duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/60 backdrop-blur-[2px]">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full shadow-lg">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl p-0 bg-transparent border-none overflow-hidden flex items-center justify-center">
              <img
                src={`${API_URL}${url}`}
                className="max-h-[85vh] w-auto rounded-lg shadow-2xl animate-in zoom-in-95 duration-300"
              />
            </DialogContent>
          </Dialog>
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 rounded-full shadow-lg"
            asChild
          >
            <a href={`${API_URL}${url}`} download target="_blank">
              <Download className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}

function UsersManagement({ token }: { token: string | null }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/admin/users`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setUsers(data.data);
        setLoading(false);
      });
  }, [token]);

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-elegant overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Join Date</TableHead>
            <TableHead>Verification</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8">
                Loading...
              </TableCell>
            </TableRow>
          ) : (
            users.map((u) => (
              <TableRow key={u._id}>
                <TableCell>
                  <div className="font-medium">{u.name}</div>
                  <div className="text-xs text-muted-foreground">{u.email}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{u.role}</Badge>
                </TableCell>
                <TableCell className="text-xs">
                  {new Date(u.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {u.googleId ? (
                    <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                      Google Verified
                    </Badge>
                  ) : (
                    <Badge variant="outline">Email Only</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

interface SiriSettings {
  enabled: boolean;
  welcomeMessage: string;
  faqs: { q: string; a: string }[];
}

function ChatbotSettings() {
  const [settings, setSettings] = useState<SiriSettings>({
    enabled: true,
    welcomeMessage:
      "Hi, I'm Siri 👋\nYour premium bike rental assistant at CampusRide.\n\nI pull **real-time data** from our fleet — bikes, prices, and availability are always up to date!\n\nHow can I help you today?",
    faqs: [],
  });

  const [history, setHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("settings");

  useEffect(() => {
    const saved = localStorage.getItem("siri_settings");
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse siri_settings", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("siri_settings", JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    const savedHistory = localStorage.getItem("siri_chat_history");
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  const handleSaveFaq = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const question = formData.get("question") as string;
    const answer = formData.get("answer") as string;

    setSettings({
      ...settings,
      faqs: [...settings.faqs, { q: question, a: answer }],
    });
    e.currentTarget.reset();
    toast.success("Custom FAQ added");
  };

  const removeFaq = (index: number) => {
    const newFaqs = [...settings.faqs];
    newFaqs.splice(index, 1);
    setSettings({ ...settings, faqs: newFaqs });
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-elegant">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Bot className="h-5 w-5 text-violet-500" /> Siri AI Control Panel
        </h3>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 bg-muted/50">
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" /> Core Settings
          </TabsTrigger>
          <TabsTrigger value="faqs" className="gap-2">
            <MessageCircle className="h-4 w-4" /> Custom FAQs
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" /> Chat Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-xl border border-border/60 bg-muted/30">
            <div>
              <h4 className="font-semibold">Enable Siri Chatbot</h4>
              <p className="text-sm text-muted-foreground">
                Show the AI chat widget on the website
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={
                  settings.enabled
                    ? "text-green-500 font-medium text-sm"
                    : "text-muted-foreground text-sm"
                }
              >
                {settings.enabled ? "Active" : "Disabled"}
              </span>
              <button
                onClick={() => setSettings({ ...settings, enabled: !settings.enabled })}
                className={cn(
                  "w-11 h-6 rounded-full relative transition-colors",
                  settings.enabled ? "bg-green-500" : "bg-slate-300",
                )}
              >
                <span
                  className={cn(
                    "absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform",
                    settings.enabled ? "translate-x-5" : "translate-x-0",
                  )}
                />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Welcome Message</Label>
            <Textarea
              rows={4}
              value={settings.welcomeMessage}
              onChange={(e) => setSettings({ ...settings, welcomeMessage: e.target.value })}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">Supports **bold** text and emojis.</p>
          </div>
          <Button
            onClick={() => toast.success("Settings saved successfully")}
            className="bg-violet-600 hover:bg-violet-700 text-white"
          >
            Save Changes
          </Button>
        </TabsContent>

        <TabsContent value="faqs" className="space-y-6">
          <form
            onSubmit={handleSaveFaq}
            className="p-4 rounded-xl border border-border/60 bg-muted/30 space-y-4"
          >
            <h4 className="font-semibold text-sm">Add Custom FAQ Knowledge</h4>
            <div className="grid gap-4">
              <div className="space-y-1">
                <Label>Keywords (Comma separated)</Label>
                <Input name="question" placeholder="e.g. promo code, discount, offer" required />
              </div>
              <div className="space-y-1">
                <Label>Siri's Response</Label>
                <Textarea name="answer" placeholder="The response Siri should give..." required />
              </div>
            </div>
            <Button type="submit" variant="secondary">
              <Plus className="h-4 w-4 mr-2" /> Add to Knowledge Base
            </Button>
          </form>

          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Current Custom FAQs ({settings.faqs.length})</h4>
            {settings.faqs.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No custom FAQs added yet.</p>
            ) : (
              settings.faqs.map((faq: any, i: number) => (
                <div
                  key={i}
                  className="p-3 rounded-lg border border-border/60 flex justify-between items-start gap-4"
                >
                  <div>
                    <div className="text-xs font-bold text-violet-600 mb-1">Keywords: {faq.q}</div>
                    <div className="text-sm">{faq.a}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFaq(i)}
                    className="text-destructive h-8 w-8 shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Recent Chat Logs</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                localStorage.removeItem("siri_chat_history");
                setHistory([]);
                toast.success("History cleared");
              }}
            >
              Clear Logs
            </Button>
          </div>

          {history.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground border border-dashed rounded-xl">
              No chat history recorded yet.
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {history.map((log, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl border border-border/60 bg-muted/20 text-sm space-y-2"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex gap-2 items-start">
                    <UserCircle className="h-4 w-4 text-slate-500 mt-0.5" />{" "}
                    <span className="font-medium">{log.user}</span>
                  </div>
                  <div className="flex gap-2 items-start">
                    <Bot className="h-4 w-4 text-violet-500 mt-0.5" />{" "}
                    <span className="text-muted-foreground">{log.bot}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InvoicesManagement({ token }: { token: string | null }) {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvoices = async () => {
    try {
      const res = await fetch(`${API_URL}/api/invoices/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setInvoices(data.data);
    } catch (err) {
      toast.error("Failed to fetch invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [token]);

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-elegant overflow-x-auto">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Financial Invoices</h3>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice #</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Downloads</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8">
                Loading invoices...
              </TableCell>
            </TableRow>
          ) : invoices.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8">
                No invoices found.
              </TableCell>
            </TableRow>
          ) : (
            invoices.map((inv) => (
              <TableRow key={inv._id}>
                <TableCell className="font-bold">{inv.invoiceNumber}</TableCell>
                <TableCell>{inv.user?.name}</TableCell>
                <TableCell>₹{inv.amount.toLocaleString()}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="gap-1.5">
                    <Download className="h-3 w-3" /> {inv.downloadCount || 0}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={inv.status === "paid" ? "default" : "secondary"}>
                    {inv.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs">
                  {new Date(inv.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to="/invoice/$bookingId" params={{ bookingId: inv.booking?._id }}>
                        View
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        try {
                          const res = await fetch(`${API_URL}/api/invoices/${inv._id}/email`, {
                            method: "POST",
                            headers: { Authorization: `Bearer ${token}` },
                          });
                          if (res.ok) toast.success("Email resent!");
                        } catch (err) {
                          toast.error("Resend failed");
                        }
                      }}
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function ContactMessages({ token }: { token: string | null }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`${API_URL}/api/contact/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setMessages(data.data);
    } catch (err) {
      toast.error("Failed to fetch messages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [token]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await fetch(`${API_URL}/api/contact/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      toast.success(`Message marked as ${status}`);
      fetchMessages();
    } catch (err) {
      toast.error("Action failed");
    }
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-elegant overflow-x-auto">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Customer Inquiries</h3>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Sender</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>Message</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8">
                Loading messages...
              </TableCell>
            </TableRow>
          ) : messages.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8">
                No messages found.
              </TableCell>
            </TableRow>
          ) : (
            messages.map((m) => (
              <TableRow key={m._id} className={m.status === "new" ? "bg-primary/5" : ""}>
                <TableCell>
                  <div className="font-bold">{m.name}</div>
                  <div className="text-xs text-muted-foreground">{m.email}</div>
                </TableCell>
                <TableCell className="font-medium">{m.subject}</TableCell>
                <TableCell className="max-w-[300px] truncate text-xs">{m.message}</TableCell>
                <TableCell>
                  <Badge variant={m.status === "new" ? "default" : "secondary"}>{m.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updateStatus(m._id, "read")}
                      disabled={m.status === "read"}
                    >
                      Read
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updateStatus(m._id, "replied")}
                    >
                      Replied
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function updateMilestone(bookingId: any, milestone: any) {
  fetch(`${import.meta.env.VITE_API_URL}/api/bookings/${bookingId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify({ currentMilestone: milestone }),
  }).then(() => {
    toast.success("Milestone updated");
    window.location.reload(); // Refresh to show changes
  });
}

function MembershipsManagement({ token }: { token: string | null }) {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const res = await fetch(`${API_URL}/api/membership/admin/requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setRequests(data.data);
    } catch (err) {
      toast.error("Failed to fetch membership requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [token]);

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      const res = await fetch(`${API_URL}/api/membership/admin/approve/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Membership ${status}`);
        fetchRequests();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error("Action failed");
    }
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-elegant">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Membership Requests</h3>
        <Badge variant="outline" className="bg-primary/10 text-primary">
          {requests.filter((r) => r.status === "pending").length} Pending
        </Badge>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Transaction ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground italic">
                  No membership requests found
                </TableCell>
              </TableRow>
            ) : (
              requests.map((r) => (
                <TableRow key={r._id} className="group">
                  <TableCell>
                    <div className="font-bold">{r.user?.name}</div>
                    <div className="text-xs text-muted-foreground">{r.user?.email}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {r.plan}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{r.transactionId}</TableCell>
                  <TableCell className="text-xs">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={cn(
                        "capitalize",
                        r.status === "pending"
                          ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                          : r.status === "approved"
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                          : "bg-red-500/10 text-red-500 border-red-500/20",
                      )}
                    >
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {r.status === "pending" && (
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50"
                          onClick={() => handleStatusUpdate(r._id, "approved")}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                          onClick={() => handleStatusUpdate(r._id, "rejected")}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

