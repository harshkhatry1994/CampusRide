import { useState, useEffect } from "react";
import { Loader2, Search, Filter, Eye, Trash2, ShieldOff, CheckCircle2, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RatingStars } from "@/components/reviews/RatingStars";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const API_URL = import.meta.env.VITE_API_URL;

interface AdminReviewsProps {
  token: string | null;
}

export function AdminReviews({ token }: AdminReviewsProps) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRating, setFilterRating] = useState("all");
  const [filterSentiment, setFilterSentiment] = useState("all");

  const [viewReview, setViewReview] = useState<any | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchReviews();
  }, [token]);

  const fetchReviews = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/admin/reviews`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setReviews(data.data);
      } else {
        toast.error(data.message || "Failed to fetch reviews");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while fetching reviews");
    } finally {
      setLoading(false);
    }
  };

  const handleHide = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/reviews/${id}/hide`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Review hidden successfully");
        setReviews(prev => prev.map(r => r.id === id ? { ...r, is_approved: false } : r));
      } else {
        toast.error(data.message || "Failed to hide review");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error hiding review");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this review?")) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/reviews/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Review deleted permanently");
        setReviews(prev => prev.filter(r => r.id !== id));
      } else {
        toast.error(data.message || "Failed to delete review");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error deleting review");
    }
  };

  // Client-side filtering and search
  const filteredReviews = reviews.filter(r => {
    const matchesSearch = 
      (r.user_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.bike_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.review || "").toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesRating = filterRating === "all" || r.rating.toString() === filterRating;
    const matchesSentiment = filterSentiment === "all" || (r.ai_sentiment || "").toLowerCase() === filterSentiment.toLowerCase();
    
    return matchesSearch && matchesRating && matchesSentiment;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredReviews.length / itemsPerPage);
  const paginatedReviews = filteredReviews.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Client-side Analytics Computation (Phase 13.7)
  const approvedReviews = reviews.filter(r => r.is_approved !== false);
  const totalReviews = approvedReviews.length;
  const hiddenReviewsCount = reviews.length - totalReviews;
  
  const avgRating = totalReviews > 0 ? approvedReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews : 0;
  
  let pos = 0, neg = 0, neu = 0;
  let toxSum = 0;
  let flaggedCount = 0;
  const ratingDist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  approvedReviews.forEach(r => {
    const sent = (r.ai_sentiment || "").toLowerCase();
    if (sent === "positive") pos++;
    else if (sent === "negative") neg++;
    else neu++;
    
    if (r.rating >= 1 && r.rating <= 5) ratingDist[r.rating as keyof typeof ratingDist]++;
    
    toxSum += (r.toxicity_score || 0);
    if (r.toxicity_score > 30 || r.contains_vulgarity) flaggedCount++;
  });

  const posPercent = totalReviews > 0 ? Math.round((pos / totalReviews) * 100) : 0;
  const negPercent = totalReviews > 0 ? Math.round((neg / totalReviews) * 100) : 0;
  const avgTox = totalReviews > 0 ? Math.round(toxSum / totalReviews) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black">Review Management</h2>
          <p className="text-muted-foreground text-sm">Monitor and moderate user reviews.</p>
        </div>
      </div>

      {/* Admin Review Analytics (Phase 13.7) */}
      {!loading && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="p-4 rounded-2xl bg-card border border-border/40 flex flex-col justify-center">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Total Reviews</p>
            <p className="text-2xl font-black">{totalReviews}</p>
          </div>
          <div className="p-4 rounded-2xl bg-card border border-border/40 flex flex-col justify-center">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Avg Rating</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-black">{avgRating.toFixed(1)}</p>
              <RatingStars rating={avgRating} size="sm" />
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-card border border-border/40 flex flex-col justify-center">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Sentiment</p>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-green-500">{posPercent}% Pos</span>
              <span className="text-sm font-bold text-rose-500">{negPercent}% Neg</span>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-card border border-border/40 flex flex-col justify-center">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Toxicity</p>
            <div className="flex items-center gap-3">
              <span className={cn("text-lg font-black", avgTox > 15 ? "text-amber-500" : "text-green-500")}>{avgTox}% Avg</span>
              {flaggedCount > 0 && <Badge variant="destructive" className="h-5 px-1.5">{flaggedCount} Flagged</Badge>}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-card border border-border/40 flex flex-col justify-center">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Hidden</p>
            <p className="text-2xl font-black text-muted-foreground">{hiddenReviewsCount}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 p-4 rounded-2xl bg-card border border-border/40">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by user, bike, or review content..." 
            className="pl-9 bg-background"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Select value={filterRating} onValueChange={setFilterRating}>
          <SelectTrigger className="w-full md:w-[150px] bg-background">
            <SelectValue placeholder="Rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ratings</SelectItem>
            <SelectItem value="5">5 Stars</SelectItem>
            <SelectItem value="4">4 Stars</SelectItem>
            <SelectItem value="3">3 Stars</SelectItem>
            <SelectItem value="2">2 Stars</SelectItem>
            <SelectItem value="1">1 Star</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterSentiment} onValueChange={setFilterSentiment}>
          <SelectTrigger className="w-full md:w-[160px] bg-background">
            <SelectValue placeholder="Sentiment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sentiments</SelectItem>
            <SelectItem value="positive">Positive</SelectItem>
            <SelectItem value="neutral">Neutral</SelectItem>
            <SelectItem value="negative">Negative</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-2xl border border-border/40 overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border/40">
              <tr>
                <th className="px-6 py-4 font-bold">Rating</th>
                <th className="px-6 py-4 font-bold">User</th>
                <th className="px-6 py-4 font-bold">Bike</th>
                <th className="px-6 py-4 font-bold">Sentiment</th>
                <th className="px-6 py-4 font-bold">Toxicity</th>
                <th className="px-6 py-4 font-bold">Date</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading reviews...
                  </td>
                </tr>
              ) : paginatedReviews.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    No reviews found matching your criteria.
                  </td>
                </tr>
              ) : (
                paginatedReviews.map((r) => (
                  <tr key={r.id} className={cn("border-b border-border/40 hover:bg-muted/30 transition-colors", !r.is_approved && "opacity-60 bg-red-500/5 hover:bg-red-500/10")}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <RatingStars rating={r.rating} size="sm" />
                        {!r.is_approved && <Badge variant="destructive" className="text-[10px] px-1 py-0 h-4">HIDDEN</Badge>}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium whitespace-nowrap">{r.user_name}</td>
                    <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">{r.bike_name}</td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={cn("capitalize", 
                        r.ai_sentiment === "positive" && "text-green-500 border-green-500/30 bg-green-500/10",
                        r.ai_sentiment === "negative" && "text-red-500 border-red-500/30 bg-red-500/10",
                        r.ai_sentiment === "neutral" && "text-blue-500 border-blue-500/30 bg-blue-500/10"
                      )}>
                        {r.ai_sentiment || "Unknown"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("font-bold", (r.toxicity_score > 30) ? "text-red-500" : "text-green-500")}>
                        {r.toxicity_score || 0}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary" onClick={() => setViewReview(r)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {r.is_approved && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-amber-500 hover:bg-amber-500/10" onClick={() => handleHide(r.id)}>
                            <ShieldOff className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-red-500 hover:bg-red-500/10" onClick={() => handleDelete(r.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border/40">
            <span className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredReviews.length)} of {filteredReviews.length} reviews
            </span>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Review Details Dialog */}
      <Dialog open={!!viewReview} onOpenChange={(open) => !open && setViewReview(null)}>
        <DialogContent className="sm:max-w-[500px] p-6 rounded-3xl bg-background border border-border/60 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black flex items-center justify-between">
              Review Details
              {!viewReview?.is_approved && <Badge variant="destructive">HIDDEN</Badge>}
            </DialogTitle>
          </DialogHeader>
          
          {viewReview && (
            <div className="space-y-6 mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold">{viewReview.user_name}</p>
                  <p className="text-xs text-muted-foreground">{viewReview.bike_name}</p>
                </div>
                <div className="text-right">
                  <RatingStars rating={viewReview.rating} size="md" />
                  <p className="text-xs text-muted-foreground mt-1">{new Date(viewReview.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-muted/30 border border-border/40">
                <p className="text-sm">{viewReview.review}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Ride Experience</p>
                  <p className="font-semibold text-sm capitalize">{viewReview.ride_experience}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Bike Condition</p>
                  <p className="font-semibold text-sm capitalize">{viewReview.bike_condition}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Would Recommend</p>
                  <p className="font-semibold text-sm">{viewReview.would_recommend ? 'Yes' : 'No'}</p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-4">
                <h4 className="text-sm font-bold flex items-center gap-2">
                  🤖 AI Moderation Analysis
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Sentiment</p>
                    <Badge variant="outline" className="capitalize text-xs py-0 h-5">
                      {viewReview.ai_sentiment}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Toxicity</p>
                    <p className={cn("font-semibold text-sm", viewReview.toxicity_score > 30 ? "text-red-500" : "text-green-500")}>
                      {viewReview.toxicity_score}%
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Vulgarity</p>
                    <div className="flex items-center gap-1 text-sm font-semibold">
                      {viewReview.contains_vulgarity ? <X className="h-4 w-4 text-red-500" /> : <CheckCircle2 className="h-4 w-4 text-green-500" />}
                      {viewReview.contains_vulgarity ? 'Yes' : 'No'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                {viewReview.is_approved && (
                  <Button variant="outline" className="text-amber-500 hover:text-amber-600 hover:bg-amber-50" onClick={() => {
                    handleHide(viewReview.id);
                    setViewReview(null);
                  }}>
                    <ShieldOff className="h-4 w-4 mr-2" /> Hide Review
                  </Button>
                )}
                <Button variant="destructive" onClick={() => {
                  handleDelete(viewReview.id);
                  setViewReview(null);
                }}>
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
