import { Link, Route } from "@tanstack/react-router";
import { AxiosError } from "axios";
import { AtSign, ChevronRight } from "lucide-react";
import toastHandler from "@/data-access/errors/toastHandler";
import { authStatusQueryOptions } from "@/data-access/hooks/useAuthStatus";
import { CruxMark } from "../components/CruxMark";
import { ThemeButton } from "../components/ThemeButton";
import { Button } from "../components/ui/button";
import { useToast } from "../components/ui/use-toast";
import { rootRoute, router } from "../router";

const loginRoute = new Route({
  getParentRoute: () => rootRoute,
  path: "login",
  loader: ({ context: { queryClient }, preload }) =>
    queryClient
      .ensureQueryData(authStatusQueryOptions)
      .then((data) => {
        if (data && !preload) {
          router.navigate({
            to: data.redirect,
          });
        }
      })
      .catch((error) => {
        if (error instanceof AxiosError && error.response) {
          if (error.response.status === 401) {
            // do nothing, as the user should be on the login page in this case
            return;
          }
        }
        throw error;
      }),
  component: Login,
  errorComponent: ({ error }) => {
    const { toast } = useToast();
    toastHandler(error, toast);
  },
});

const stagger = (i: number) => ({ animationDelay: `${i * 40}ms` });
const enter =
  "animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-(--d-2) ease-(--e-out)";

function Login() {
  return (
    <div className="min-h-dvh flex flex-col text-ink">
      <CruxMark />
      <div className="fixed top-3 right-3">
        <ThemeButton />
      </div>
      <div className="flex-1 flex flex-col justify-center mx-auto w-full max-w-[400px] px-7">
        <div className={enter} style={stagger(0)}>
          <p className="text-lg text-ink-muted">Welcome to</p>
          <h1 className="text-[40px] lg:text-[46px] font-bold tracking-tight leading-tight">
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
        <div className={enter} style={stagger(3)}>
          <a
            href="https://draft.chrono.crux-bphc.com/"
            className="mt-10 flex items-center gap-3 rounded-xl border border-line bg-surface px-3.5 py-3"
          >
            <span className="flex-1">
              <span className="block text-base font-semibold">
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

export default loginRoute;
