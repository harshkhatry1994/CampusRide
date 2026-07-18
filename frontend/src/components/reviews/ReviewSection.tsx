import { useEffect, useState } from "react";
import { Star, MessageSquare, Loader2 } from "lucide-react";
import { reviewService } from "@/services/reviewService";
import { ReviewCard } from "./ReviewCard";
import { RatingStars } from "./RatingStars";

interface ReviewSectionProps {
  bikeId: string;
  /** External review data to add optimistically after a user submits */
  newReview?: any;
}

export function ReviewSection({ bikeId, newReview }: ReviewSectionProps) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await reviewService.getBikeReviews(bikeId);
      if (res.success) {
        setReviews(res.reviews || []);
        setAnalytics(res);
      }
      setLoading(false);
    }
    load();
  }, [bikeId]);

  // Optimistic insert when parent notifies of a new review
  useEffect(() => {
    if (!newReview) return;
    setReviews((prev) => {
      const exists = prev.find((r) => r.id === newReview.id);
      if (exists) return prev.map((r) => (r.id === newReview.id ? newReview : r));
      return [newReview, ...prev];
    });
  }, [newReview]);

  const reviewCount = reviews.length;
  const avg = analytics?.averageRating || 0;
  const displayAvg = parseFloat(avg.toFixed(1));

  return (
    <section className="mt-12 space-y-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-primary" />
          Rider Reviews
        </h2>
        {reviewCount > 0 && (
          <div className="flex items-center gap-3 bg-card border border-border/60 rounded-2xl px-4 py-2.5 shadow-sm">
            <RatingStars rating={displayAvg} size="sm" />
            <div>
              <span className="text-xl font-black">{displayAvg}</span>
              <span className="text-xs text-muted-foreground ml-1">
                ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
              </span>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-3">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading reviews & analytics...</span>
        </div>
      ) : reviewCount === 0 ? (
        <div className="text-center py-16 bg-card border border-dashed border-border/60 rounded-[2rem]">
          <div className="flex items-center justify-center gap-0.5 mb-4">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className="h-7 w-7 text-muted-foreground/20" />
            ))}
          </div>
          <h3 className="text-lg font-bold mb-2">No reviews yet.</h3>
          <p className="text-muted-foreground text-sm">
            Be the first to review this bike after your ride.
          </p>
        </div>
      ) : (
        <>
          {/* Analytics Dashboard (Phase 13.7) */}
          <div className="grid lg:grid-cols-3 gap-6">
            
            {/* AI Summary */}
            <div className="lg:col-span-2 p-6 rounded-[2rem] bg-gradient-brand text-primary-foreground shadow-glow space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                🤖 AI Summary
              </h3>
              {analytics?.summary ? (
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <p className="text-xs font-bold uppercase tracking-widest opacity-80">Customers Liked</p>
                    <ul className="space-y-2">
                      {analytics.summary.liked?.map((item: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm font-medium">
                          <span className="text-green-300">✓</span> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <p className="text-xs font-bold uppercase tracking-widest opacity-80">Common Complaints</p>
                    {analytics.summary.complaints?.length > 0 ? (
                      <ul className="space-y-2">
                        {analytics.summary.complaints.map((item: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm font-medium">
                            <span className="text-rose-300">✗</span> {item}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm italic opacity-80">No major complaints.</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm opacity-80 italic">Not enough data to generate an AI summary yet.</p>
              )}
            </div>

            {/* Stats Sidebar */}
            <div className="space-y-4">
              {/* Sentiment Stats */}
              <div className="p-5 rounded-3xl bg-card border border-border/60 shadow-sm space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Sentiment</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-green-500 font-medium">Positive</span>
                    <span className="font-bold">{analytics?.positive || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-500 font-medium">Neutral</span>
                    <span className="font-bold">{analytics?.neutral || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-rose-500 font-medium">Negative</span>
                    <span className="font-bold">{analytics?.negative || 0}</span>
                  </div>
                </div>
              </div>

              {/* Rating Distribution */}
              <div className="p-5 rounded-3xl bg-card border border-border/60 shadow-sm space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Distribution</p>
                <div className="space-y-1.5">
                  {[5, 4, 3, 2, 1].map(star => {
                    const count = analytics?.ratingDistribution?.[star] || 0;
                    const percentage = reviewCount > 0 ? (count / reviewCount) * 100 : 0;
                    return (
                      <div key={star} className="flex items-center gap-2 text-xs">
                        <span className="w-8 text-right font-medium">{star} <Star className="inline h-2.5 w-2.5 mb-0.5 text-amber-400 fill-amber-400" /></span>
                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-amber-400" style={{ width: `${percentage}%` }} />
                        </div>
                        <span className="w-6 text-muted-foreground text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 mt-8">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
