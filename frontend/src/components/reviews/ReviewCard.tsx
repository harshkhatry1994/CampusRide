import { ThumbsUp, Bike as BikeIcon } from "lucide-react";
import { RatingStars } from "./RatingStars";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ReviewCardProps {
  review: any;
  className?: string;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getInitials(name: string) {
  if (!name) return "U";
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export function ReviewCard({ review, className }: ReviewCardProps) {
  const author =
    review.profiles?.full_name ||
    review.profiles?.name ||
    review.user_name ||
    "Anonymous";

  const initials = getInitials(author);
  // Show only first name + last initial for privacy
  const displayName =
    author !== "Anonymous"
      ? author.split(" ")[0] +
        (author.split(" ")[1] ? " " + author.split(" ")[1][0] + "." : "")
      : "Anonymous";

  return (
    <div
      className={cn(
        "p-5 rounded-2xl bg-card border border-border/60 shadow-sm hover:border-primary/30 transition-colors space-y-4",
        className
      )}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          {review.profiles?.avatar_url ? (
            <img
              src={review.profiles.avatar_url}
              alt={displayName}
              className="h-9 w-9 rounded-full object-cover border border-border/60"
            />
          ) : (
            <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-black">
              {initials}
            </div>
          )}
          <div>
            <p className="font-bold text-sm leading-tight">{displayName}</p>
            <p className="text-[10px] text-muted-foreground">
              {formatDate(review.created_at)}
            </p>
          </div>
        </div>
        <RatingStars rating={review.rating} size="sm" />
      </div>

      {/* Review text */}
      <p className="text-sm text-foreground leading-relaxed">{review.review}</p>

      {/* Tags row */}
      <div className="flex flex-wrap gap-2 text-xs">
        {review.ride_experience && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 font-semibold border border-blue-500/20">
            🏍️ {review.ride_experience}
          </span>
        )}
        {review.bike_condition && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 font-semibold border border-emerald-500/20">
            <BikeIcon className="h-3 w-3" /> {review.bike_condition}
          </span>
        )}
        {review.would_recommend !== undefined && (
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold border text-xs",
              review.would_recommend
                ? "bg-green-500/10 text-green-500 border-green-500/20"
                : "bg-rose-500/10 text-rose-500 border-rose-500/20"
            )}
          >
            <ThumbsUp className="h-3 w-3" />
            {review.would_recommend ? "Recommends" : "Not Recommended"}
          </span>
        )}
      </div>
    </div>
  );
}
