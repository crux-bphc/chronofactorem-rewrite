import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";

const NEXT = { light: "dark", dark: "system", system: "light" } as const;

/** Cycles light, dark, auto. Used where the avatar menu isn't available. */
export function ThemeButton() {
  const { theme, setTheme } = useTheme();
  const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;

  return (
    <Button
      variant="quiet"
      size="icon"
      aria-label="Toggle theme"
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setTheme(NEXT[theme], {
          x: r.left + r.width / 2,
          y: r.top + r.height / 2,
        });
      }}
    >
      <Icon />
    </Button>
  );
}
