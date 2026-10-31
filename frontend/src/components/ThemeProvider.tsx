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
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
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

  const systemTheme = useSystemTheme();

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark");

    root.classList.add(theme === "system" ? systemTheme : theme);
  }, [theme, systemTheme]);

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
