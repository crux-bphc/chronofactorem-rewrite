import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { flushSync } from "react-dom";
import { startThemeTransition } from "@/lib/viewTransitions";

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  /** `origin` (viewport px) makes the change a circular-reveal transition. */
  setTheme: (theme: Theme, origin?: { x: number; y: number }) => void;
  colorSeed: number;
  shuffleColors: () => void;
};

const COLOR_SEED_KEY = "chrono-color-seed";

const readColorSeed = (): number => {
  try {
    const raw = Number(localStorage.getItem(COLOR_SEED_KEY));
    return Number.isInteger(raw) && raw >= 0 ? raw : 0;
  } catch {
    return 0;
  }
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
  colorSeed: 0,
  shuffleColors: () => null,
};

const DARK_QUERY = "(prefers-color-scheme: dark)";

/** The theme the OS currently asks for; follows changes while the page is open. */
export function useSystemTheme(): "light" | "dark" {
  const dark = useSyncExternalStore(
    (notify) => {
      const mq = window.matchMedia(DARK_QUERY);
      mq.addEventListener("change", notify);
      return () => mq.removeEventListener("change", notify);
    },
    () => window.matchMedia(DARK_QUERY).matches,
  );
  return dark ? "dark" : "light";
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme,
  );
  const [colorSeed, setColorSeed] = useState<number>(readColorSeed);

  const systemTheme = useSystemTheme();

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark");

    root.classList.add(theme === "system" ? systemTheme : theme);
  }, [theme, systemTheme]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === COLOR_SEED_KEY) setColorSeed(readColorSeed());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const value = {
    theme,
    setTheme: (theme: Theme, origin?: { x: number; y: number }) => {
      localStorage.setItem(storageKey, theme);
      if (!origin) {
        setTheme(theme);
        return;
      }
      // the view transition snapshots the DOM right after this callback, so
      // the state and the class-applying effect must flush synchronously
      startThemeTransition(() => flushSync(() => setTheme(theme)), origin);
    },
    colorSeed,
    shuffleColors: () => {
      setColorSeed((previous) => {
        const next = previous + 1;
        try {
          localStorage.setItem(COLOR_SEED_KEY, String(next));
        } catch {}
        return next;
      });
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
