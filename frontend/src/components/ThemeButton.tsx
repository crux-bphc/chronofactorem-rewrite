import { Moon, Sun } from "lucide-react";
import { useSystemTheme, useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";

/** Flips between explicit light and dark. Used where the avatar menu isn't available. */
export function ThemeButton() {
  const { theme, setTheme } = useTheme();
  const system = useSystemTheme();
  // the class the provider applied is the resolved theme, whatever the setting
  const isDark = (theme === "system" ? system : theme) === "dark";
  const Icon = isDark ? Moon : Sun;

  return (
    <Button
      variant="quiet"
      size="icon"
      aria-label="Toggle theme"
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setTheme(isDark ? "light" : "dark", {
          x: r.left + r.width / 2,
          y: r.top + r.height / 2,
        });
      }}
    >
      <Icon />
    </Button>
  );
}
