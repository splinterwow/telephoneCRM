
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { isDarkMode, toggleDarkMode } = useApp();

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={toggleDarkMode} 
      className="rounded-full"
      title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDarkMode ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
