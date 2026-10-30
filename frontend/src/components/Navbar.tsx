import { Link, useRouterState } from "@tanstack/react-router";
import { AxiosError } from "axios";
import { Info, Plus } from "lucide-react";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import useCreateTimetable from "@/data-access/hooks/useCreateTimetable";
import useUser from "@/data-access/hooks/useUser";
import { cn } from "@/lib/utils";
import { router } from "../router";
import Announcements from "./Announcements";
import { AvatarMenu } from "./AvatarMenu";
import ReportIssue from "./ReportIssue";
import { ThemeButton } from "./ThemeButton";

type User = NonNullable<ReturnType<typeof useUser>["data"]>;

const desktopQuery = "(min-width: 1024px)";

// Only one bar is mounted: two copies would double the announcement fetch
// and its "new announcements" toast.
function useIsDesktop() {
  return useSyncExternalStore(
    (notify) => {
      const media = window.matchMedia(desktopQuery);
      media.addEventListener("change", notify);
      return () => media.removeEventListener("change", notify);
    },
    () => window.matchMedia(desktopQuery).matches,
  );
}

export function NavBar() {
  const isDesktop = useIsDesktop();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isEditPage =
    pathname.includes("/edit/") || pathname.includes("/finalize/");

  const {
    data: user,
    error: userError,
    isError: isUserError,
    isFetching: isUserFetching,
  } = useUser();

  // a 401 here just means the visitor is logged out, not that something broke
  const isUnauthenticated =
    isUserError &&
    userError instanceof AxiosError &&
    userError.response?.status === 401;

  const { mutate: createTimetable, isPending: isCreating } =
    useCreateTimetable();

  const create = () =>
    createTimetable(void null, {
      onSuccess: (_response) => {
        router.navigate({
          to: "/edit/$timetableId",
          params: { timetableId: _response.data.id },
        });
      },
    });

  if (!isUserFetching && isUserError && !isUnauthenticated) {
    return (
      <ReportIssue
        error={JSON.stringify(
          userError ? userError.message : "user query result is undefined",
        )}
      />
    );
  }

  // user is undefined when the visitor is logged out, so the bars render
  // without the parts that need authentication
  const props = {
    user,
    pathname,
    showCreate: !!user && !isEditPage,
    isCreating,
    create,
    showLogin: !user && isUnauthenticated,
  };
  return isDesktop ? <DesktopNav {...props} /> : <AppBar {...props} />;
}

type BarProps = {
  user: User | undefined;
  pathname: string;
  showCreate: boolean;
  isCreating: boolean;
  create: () => void;
  showLogin: boolean;
};

const loginLink = (
  <Button variant="quiet" size="sm" asChild>
    <Link to="/login">Login</Link>
  </Button>
);

function AppBar({ user, showCreate, isCreating, create, showLogin }: BarProps) {
  return (
    <header className="flex h-[52px] w-full shrink-0 items-center justify-between bg-bg px-4">
      {user ? (
        <Link
          to="/"
          className="relative flex h-11 items-center text-[20px] font-bold tracking-tight text-ink"
        >
          Chrono
        </Link>
      ) : (
        <span className="text-[20px] font-bold tracking-tight text-ink">
          Chrono
        </span>
      )}
      <div className="flex items-center gap-1">
        {user ? (
          <>
            {showCreate && (
              <Button
                variant="quiet"
                size="icon"
                aria-label="Create a timetable"
                disabled={isCreating}
                onClick={create}
              >
                <Plus className="size-5" />
              </Button>
            )}
            <Announcements />
            <AvatarMenu user={user} />
          </>
        ) : (
          <>
            <Button variant="quiet" size="icon" aria-label="About" asChild>
              <Link to="/about">
                <Info />
              </Link>
            </Button>
            <ThemeButton />
            {showLogin && loginLink}
          </>
        )}
      </div>
    </header>
  );
}

function DesktopNav({
  user,
  pathname,
  showCreate,
  isCreating,
  create,
  showLogin,
}: BarProps) {
  const linkClass = (active: boolean) =>
    cn(
      "text-base font-medium transition-colors duration-(--d-1) hover:text-ink",
      active ? "text-ink" : "text-ink-muted",
    );
  return (
    <header className="flex h-[60px] w-full shrink-0 items-center gap-6 border-b border-line bg-bg px-7">
      {user ? (
        <Link to="/" className="text-[21px] font-bold tracking-tight text-ink">
          ChronoFactorem
        </Link>
      ) : (
        <span className="text-[21px] font-bold tracking-tight text-ink">
          ChronoFactorem
        </span>
      )}
      <nav className="flex items-center gap-5" aria-label="Main">
        {user && (
          <Link to="/" className={linkClass(pathname === "/")}>
            Timetables
          </Link>
        )}
        <Link to="/about" className={linkClass(pathname.startsWith("/about"))}>
          About
        </Link>
      </nav>
      <div className="flex-1" />
      <div className="flex items-center gap-2">
        {user ? (
          <>
            {showCreate && (
              <Button
                size="sm"
                disabled={isCreating}
                onClick={create}
                className="mr-1"
              >
                <Plus />
                Create a timetable
              </Button>
            )}
            <Announcements />
            <AvatarMenu user={user} />
          </>
        ) : (
          <>
            <ThemeButton />
            {showLogin && loginLink}
          </>
        )}
      </div>
    </header>
  );
}
