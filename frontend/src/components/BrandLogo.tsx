import React from "react";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  variant?: "light" | "dark";
  size?: "sm" | "md" | "lg" | "xl";
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className,
  variant = "dark",
  size = "md",
}) => {
  const sizeMap = {
    sm: "h-6",
    md: "h-8",
    lg: "h-10",
    xl: "h-12",
  };

  const textColor = variant === "light" ? "text-white" : "text-foreground";
  const accentColor = "text-primary";

  return (
    <div className={cn("flex items-center gap-2 select-none", className)}>
      <div
        className={cn(
          "relative flex items-center justify-center rounded-xl bg-primary shadow-glow",
          sizeMap[size],
          "aspect-square",
        )}
      >
        {/* Modern abstract bike/wheel shape */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-2/3 h-2/3 text-primary-foreground"
        >
          <path
            d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z"
            fill="currentColor"
          />
          <path
            d="M12 2V5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 19V22"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M22 12H19"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M5 12H2"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h1
        className={cn(
          "font-black tracking-tighter uppercase italic",
          variant === "light" ? "text-white" : "text-foreground",
          size === "sm" && "text-lg",
          size === "md" && "text-xl",
          size === "lg" && "text-2xl",
          size === "xl" && "text-3xl",
        )}
      >
        Campus<span className="text-primary">Ride</span>
      </h1>
    </div>
  );
};
