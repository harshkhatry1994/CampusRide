import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingStarsProps {
  rating: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onChange?: (rating: number) => void;
  className?: string;
}

export function RatingStars({
  rating,
  max = 5,
  size = "md",
  interactive = false,
  onChange,
  className,
}: RatingStarsProps) {
  const sizeClass = {
    sm: "h-3 w-3",
    md: "h-5 w-5",
    lg: "h-8 w-8",
  }[size];

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onChange?.(star)}
          className={cn(
            "focus:outline-none transition-transform",
            interactive && "hover:scale-110 cursor-pointer",
            !interactive && "cursor-default"
          )}
        >
          <Star
            className={cn(
              sizeClass,
              star <= rating
                ? "fill-amber-400 text-amber-400 drop-shadow-sm"
                : "text-muted-foreground/30"
            )}
          />
        </button>
      ))}
    </div>
  );
}
