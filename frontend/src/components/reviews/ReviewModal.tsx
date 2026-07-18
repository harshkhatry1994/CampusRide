import { useState, useEffect } from "react";
import { Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { reviewService } from "@/services/reviewService";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { RatingStars } from "./RatingStars";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  rentalId: string;
  existingReview?: any;
  onSuccess: (reviewData: any) => void;
}

export function ReviewModal({ isOpen, onClose, rentalId, existingReview, onSuccess }: ReviewModalProps) {
  const { token } = useAuth();
  
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [rideExperience, setRideExperience] = useState("");
  const [bikeCondition, setBikeCondition] = useState("");
  const [wouldRecommend, setWouldRecommend] = useState(true);
  
  const [submitting, setSubmitting] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    if (existingReview && isOpen) {
      setRating(existingReview.rating || 5);
      setReview(existingReview.review || "");
      setRideExperience(existingReview.ride_experience || "");
      setBikeCondition(existingReview.bike_condition || "");
      setWouldRecommend(existingReview.would_recommend ?? true);
      setAiError(null);
    } else if (isOpen) {
      setRating(5);
      setReview("");
      setRideExperience("");
      setBikeCondition("");
      setWouldRecommend(true);
      setAiError(null);
    }
  }, [existingReview, isOpen]);

  const handleSubmit = async () => {
    if (!rideExperience || !bikeCondition || !review.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (review.length > 500) {
      toast.error("Review must be 500 characters or less.");
      return;
    }

    setSubmitting(true);
    setAiError(null);

    const payload = {
      rental_id: rentalId,
      rating,
      review,
      ride_experience: rideExperience,
      bike_condition: bikeCondition,
      would_recommend: wouldRecommend,
    };

    try {
      let res;
      if (existingReview?.id) {
        res = await reviewService.updateReview(existingReview.id, payload, token!);
      } else {
        res = await reviewService.createReview(payload, token!);
      }

      if (res.success) {
        toast.success("Review submitted successfully!");
        onSuccess(res.data);
        onClose();
      } else {
        setAiError(res.message || "Failed to submit review.");
      }
    } catch (error: any) {
      console.error(error);
      toast.error("An error occurred while submitting.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !submitting && onClose()}>
      <DialogContent className="sm:max-w-[500px] p-6 rounded-3xl bg-background border border-border/60 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black">
            {existingReview ? "Edit Your Review" : "Rate Your Ride"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* AI Rejection Error */}
          {aiError && (
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex gap-3 text-destructive">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <div>
                <p className="text-sm font-bold">Review Flagged</p>
                <p className="text-xs mt-1">{aiError}</p>
              </div>
            </div>
          )}

          {/* Rating */}
          <div className="space-y-2">
            <Label className="text-sm font-bold flex justify-between">
              <span>Overall Rating <span className="text-destructive">*</span></span>
              <span className="text-muted-foreground">{rating}/5</span>
            </Label>
            <RatingStars
              rating={rating}
              size="lg"
              interactive
              onChange={setRating}
            />
          </div>

          {/* Review Text */}
          <div className="space-y-2">
            <Label className="text-sm font-bold flex justify-between">
              <span>Review <span className="text-destructive">*</span></span>
              <span className={`text-xs ${review.length > 500 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {review.length}/500
              </span>
            </Label>
            <Textarea
              placeholder="Tell us about your ride..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              className="resize-none h-24 rounded-xl border-border/60 focus-visible:ring-primary/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Ride Experience */}
            <div className="space-y-2">
              <Label className="text-sm font-bold">Ride Experience <span className="text-destructive">*</span></Label>
              <Select value={rideExperience} onValueChange={setRideExperience}>
                <SelectTrigger className="rounded-xl border-border/60">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Excellent">Excellent</SelectItem>
                  <SelectItem value="Good">Good</SelectItem>
                  <SelectItem value="Average">Average</SelectItem>
                  <SelectItem value="Poor">Poor</SelectItem>
                  <SelectItem value="Terrible">Terrible</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bike Condition */}
            <div className="space-y-2">
              <Label className="text-sm font-bold">Bike Condition <span className="text-destructive">*</span></Label>
              <Select value={bikeCondition} onValueChange={setBikeCondition}>
                <SelectTrigger className="rounded-xl border-border/60">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Excellent">Excellent</SelectItem>
                  <SelectItem value="Good">Good</SelectItem>
                  <SelectItem value="Average">Average</SelectItem>
                  <SelectItem value="Needs Maintenance">Needs Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Would Recommend */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/40">
            <div>
              <Label className="text-sm font-bold text-foreground">Would Recommend?</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Would you suggest this bike to others?</p>
            </div>
            <Switch checked={wouldRecommend} onCheckedChange={setWouldRecommend} />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
            <Button variant="ghost" onClick={onClose} disabled={submitting} className="rounded-xl font-bold">
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={submitting} 
              className="rounded-xl font-bold bg-primary text-primary-foreground min-w-[140px] shadow-glow"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Checking your review...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Submit Review
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
