import { useQuery } from "@tanstack/react-query";
import { createLazyRoute, Link } from "@tanstack/react-router";
import { unknownDegree } from "lib";
import { AtSign, ChevronRight } from "lucide-react";
import { CruxMark } from "../components/CruxMark";
import { ThemeButton } from "../components/ThemeButton";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import chronoAPI from "../data-access/axios";

type LoginAsUser = {
  email: string;
  name: string;
  batch: number;
  degrees: string[];
  timetableCount: number;
};

type AuthMethodsResponse = {
  loginAs: boolean;
  users?: LoginAsUser[];
};

const stagger = (i: number) => ({ animationDelay: `${i * 40}ms` });
const enter =
  "animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-(--d-2) ease-(--e-out)";

const formatUserMeta = (user: LoginAsUser): string => {
  const degree =
    user.batch === 0 || user.degrees.includes(unknownDegree)
      ? "HD"
      : user.degrees.join("+");
  const count =
    user.timetableCount === 0
      ? "empty"
      : user.timetableCount === 1
        ? "1 timetable"
        : `${user.timetableCount} timetables`;
  return `${degree} · ${count}`;
};

const CustomLoginAsForm = () => {
  return (
    <form
      action="/api/auth/as"
      method="get"
      className="flex flex-col gap-2 pt-2.5"
    >
      <Input
        name="email"
        type="email"
        required
        placeholder="f20250001@hyderabad.bits-pilani.ac.in"
        aria-label="Email"
        className="h-9 font-mono text-xs"
      />
      <Input
        name="name"
        type="text"
        placeholder="Name (optional)"
        aria-label="Name"
        className="h-9 text-sm"
      />
      <Button type="submit" variant="secondary" className="h-9 w-full text-sm">
        Login as custom user
      </Button>
    </form>
  );
};

function Login() {
  const { data: authMethods } = useQuery({
    queryKey: ["authMethods"],
    queryFn: async () => {
      const { data } =
        await chronoAPI.get<AuthMethodsResponse>("/api/auth/methods");
      return data;
    },
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
  });

  const seededUsers = authMethods?.users ?? [];

  return (
    <div className="min-h-dvh flex flex-col text-ink">
      <CruxMark />
      <div className="fixed top-3 right-3">
        <ThemeButton />
      </div>
      <div className="flex-1 flex flex-col justify-center mx-auto w-full max-w-[400px] px-7 py-10">
        <div className={enter} style={stagger(0)}>
          <p className="text-lg text-ink-muted">Welcome to</p>
          <h1 className="text-[40px] lg:text-[46px] font-medium tracking-[-0.03em] leading-tight">
            ChronoFactorem
          </h1>
        </div>
        <div className={enter} style={stagger(1)}>
          <Button className="w-full mt-7" asChild>
            <a href="/api/auth/logto">
              <AtSign className="size-5" />
              Login
            </a>
          </Button>
        </div>
        <div className={enter} style={stagger(2)}>
          <Button variant="quiet" className="w-full mt-2" asChild>
            <Link to="/about">About ChronoFactorem</Link>
          </Button>
        </div>
        {authMethods?.loginAs && (
          <section
            aria-label="Login as seeded user"
            className={`${enter} mt-6 rounded-xl border border-line bg-surface`}
            style={stagger(3)}
          >
            <div className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
              <span className="text-xs font-medium text-ink-muted">
                Login as (testing)
              </span>
              {seededUsers.length > 0 && (
                <span className="font-mono text-[11px] text-ink-faint">
                  {seededUsers.length} users
                </span>
              )}
            </div>
            {seededUsers.length > 0 ? (
              <>
                <div className="divide-y divide-line">
                  {seededUsers.map((user) => (
                    <a
                      key={user.email}
                      href={`/api/auth/as?email=${encodeURIComponent(user.email)}`}
                      className="flex items-center gap-2.5 px-3.5 py-2.5 transition-colors duration-(--d-1) hover:bg-sunk"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="truncate text-sm font-medium text-ink">
                            {user.name}
                          </span>
                          <span className="shrink-0 font-mono text-[11px] text-ink-muted">
                            {formatUserMeta(user)}
                          </span>
                        </span>
                        <span className="block truncate font-mono text-[11px] text-ink-faint">
                          {user.email}
                        </span>
                      </span>
                      <ChevronRight
                        className="size-4 shrink-0 text-ink-faint"
                        aria-hidden="true"
                      />
                    </a>
                  ))}
                </div>
                <details className="border-t border-line px-3.5 py-2.5">
                  <summary className="cursor-pointer select-none text-xs font-medium text-ink-muted hover:text-ink">
                    Other email…
                  </summary>
                  <CustomLoginAsForm />
                </details>
              </>
            ) : (
              <div className="px-3.5 pb-3">
                <CustomLoginAsForm />
              </div>
            )}
          </section>
        )}
        <div className={enter} style={stagger(authMethods?.loginAs ? 4 : 3)}>
          <a
            href="https://draft.chrono.crux-bphc.com/"
            className="mt-8 flex items-center gap-3 rounded-xl border border-line bg-surface px-3.5 py-3"
          >
            <span className="flex-1">
              <span className="block text-base font-medium">
                Draft Timetable for 2026-27 Sem 1 Out Now!!
              </span>
              <span className="block text-sm text-ink-muted">
                Check it out here
              </span>
            </span>
            <ChevronRight className="size-5 text-ink-faint" />
          </a>
        </div>
      </div>
      <p className="text-sm text-ink-muted text-center px-6 pb-[22px]">
        Powered by CRUx: The Programming and Computing Club of BITS Hyderabad
      </p>
    </div>
  );
}

export const Route = createLazyRoute("/login")({
  component: Login,
});
