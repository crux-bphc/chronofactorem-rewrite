import { Route } from "@tanstack/react-router";
import { AxiosError } from "axios";
import { AtSign } from "lucide-react";
import toastHandler from "@/data-access/errors/toastHandler";
import { authStatusQueryOptions } from "@/data-access/hooks/useAuthStatus";
import { ModeToggle } from "../components/ModeToggle";
import { Button } from "../components/ui/button";
import { useToast } from "../components/ui/use-toast";
import { rootRoute, router } from "../router";

const loginRoute = new Route({
  getParentRoute: () => rootRoute,
  path: "login",
  loader: ({ context: { queryClient } }) =>
    queryClient
      .ensureQueryData(authStatusQueryOptions)
      .then((data) => {
        if (data) {
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

function Login() {
  return (
    <>
      <div className="flex bg-background h-screen w-full justify-center items-center">
        <div className="fixed top-4 right-4">
          <ModeToggle />
        </div>
        <div className="flex flex-col items-center gap-2">
          <h2 className="scroll-m-20 text-md md:text-lg lg:text-xl tracking-tight text-muted-foreground">
            Welcome to
          </h2>
          <h1 className="scroll-m-20 md:text-6xl text-4xl font-extrabold tracking-tight lg:text-7xl text-foreground">
            ChronoFactorem
          </h1>
          <Button
            size="lg"
            className="md:mt-6 mt-4 rounded-lg flex items-center"
            asChild
          >
            <a href="/api/auth/logto">
              <AtSign className="size-4" />
              <span className="font-bold md:text-lg text-base">Login</span>
            </a>
          </Button>
          <a
            href="/about"
            className="w-fit md:mt-8 mt-2 text-muted-foreground md:text-lg text-sm hover:underline underline-offset-4"
          >
            About ChronoFactorem
          </a>
          <p className="w-fit md:mt-12 mt-3 md:text-lg text-sm border px-4 py-2 rounded text-center">
            Draft Timetable for 2026-27 Sem 1 Out Now!!
            <br />
            <a
              href="https://draft.chrono.crux-bphc.com/"
              className="w-fit md:mt-2 mt-1 text-muted-foreground md:text-lg text-sm hover:underline underline-offset-4"
            >
              Check it out here
            </a>
          </p>
        </div>
      </div>
      <span className="fixed bottom-0 bg-muted w-full text-center py-1 text-xs md:px-0 px-8 tracking-tight md:text-lg text-muted-foreground">
        Powered by CRUx: The Programming and Computing Club of BITS Hyderabad
      </span>
    </>
  );
}

export default loginRoute;
