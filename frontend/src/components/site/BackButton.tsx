import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BackButton({ className = "" }: { className?: string }) {
  function back() {
    if (typeof window === "undefined") return;
    if (window.history.length > 1) window.history.back();
    else window.location.assign("/");
  }
  return (
    <Button onClick={back} variant="ghost" size="sm" className={className}>
      <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
    </Button>
  );
}
