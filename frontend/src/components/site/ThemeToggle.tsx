import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/context/ThemeContext";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button 
      onClick={toggleTheme} 
      variant="ghost" 
      size="icon" 
      aria-label="Toggle theme"
      className="rounded-xl hover:bg-primary/10 transition-all active:scale-95"
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4 text-amber-500" />
      ) : (
        <Moon className="h-4 w-4 text-indigo-600" />
      )}
    </Button>
  );
}
