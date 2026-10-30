import { Link } from "@tanstack/react-router";
import { LogOut, Monitor, Moon, Sun, User } from "lucide-react";
import { useRef } from "react";
import { useTheme } from "@/components/ThemeProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Segmented } from "@/components/ui/segmented";

type Theme = "light" | "dark" | "system";

const THEMES: Theme[] = ["light", "dark", "system"];

const OPTIONS = [
  {
    value: "light" as const,
    label: (
      <>
        <Sun className="size-3.5" />
        Light
      </>
    ),
  },
  {
    value: "dark" as const,
    label: (
      <>
        <Moon className="size-3.5" />
        Dark
      </>
    ),
  },
  {
    value: "system" as const,
    label: (
      <>
        <Monitor className="size-3.5" />
        Auto
      </>
    ),
  },
];

export function AvatarMenu({ user }: { user: { name: string } }) {
  const { theme, setTheme } = useTheme();
  const pointer = useRef<{ x: number; y: number } | null>(null);

  const change = (next: Theme, fallback: HTMLElement) => {
    const r = fallback.getBoundingClientRect();
    setTheme(
      next,
      pointer.current ?? { x: r.left + r.width / 2, y: r.top + r.height / 2 },
    );
    pointer.current = null;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="My account"
          className="relative grid size-9 shrink-0 cursor-pointer place-items-center rounded-full bg-sunk text-base font-semibold text-ink outline-none transition-colors duration-(--d-1) after:absolute after:-inset-[4px] after:content-[''] hover:bg-line lg:size-8 lg:text-sm lg:after:hidden"
        >
          <span aria-hidden="true">{user.name[0]}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[260px]">
        <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
          My Account
        </DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link to="/editProfile">
            <User className="size-4" />
            <span>Edit Profile</span>
          </Link>
        </DropdownMenuItem>
        {/* An item so keyboard users can reach it: arrows move onto the row,
            left/right then change the theme. Pointer use hits the segments. */}
        <DropdownMenuItem
          className="my-1 p-0 focus:bg-transparent"
          onSelect={(e) => e.preventDefault()}
          onKeyDown={(e) => {
            if (e.target !== e.currentTarget) return;
            const step =
              e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
            if (!step) return;
            e.preventDefault();
            e.stopPropagation();
            const i = THEMES.indexOf(theme);
            change(THEMES[(i + step + 3) % 3], e.currentTarget);
          }}
          onPointerDownCapture={(e) => {
            pointer.current = { x: e.clientX, y: e.clientY };
          }}
        >
          <Segmented
            size="sm"
            aria-label="Theme"
            className="w-full"
            value={theme}
            options={OPTIONS}
            onValueChange={(v) => {
              const el = document.activeElement as HTMLElement | null;
              change(v, el ?? document.body);
            }}
          />
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            // the backend clears the auth cookies and ends the logto sso session
            window.location.href = "/api/auth/logout";
          }}
        >
          <LogOut className="size-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
