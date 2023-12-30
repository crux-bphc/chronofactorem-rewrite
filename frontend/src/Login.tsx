import { ErrorComponent, Route } from "@tanstack/react-router";
import { AtSign } from "lucide-react";
import { ModeToggle } from "./components/mode-toggle";
import { Button } from "./components/ui/button";
import { rootRoute, router } from "./main";
import { queryOptions } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { ToastAction } from "@radix-ui/react-toast";
import { useToast } from "./components/ui/use-toast";
import { z } from "zod";

const userAuthStatusType = z.object({
  message: z.string(),
  redirect: z.string().optional(),
  error: z.string().optional(),
});

const fetchUserAuthStatus = async (): Promise<
  z.infer<typeof userAuthStatusType>
> => {
  const response = await axios.get("/api/auth/check", {
    headers: {
      "Content-Type": "application/json ",
    },
  });
  return response.data;
};

const authStatusQueryOptions = queryOptions({
  queryKey: ["authStatusCheck"],
  queryFn: () => fetchUserAuthStatus(),
});

const loginRoute = new Route({
  getParentRoute: () => rootRoute,
  path: "login",
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(authStatusQueryOptions).catch((error) => {
      if (error instanceof AxiosError && error.response) {
        if (error.response.status === 400) {
          router.navigate({
            to: error.response.data.redirect,
          });
        }
      }

      throw error;
    }),
  component: Login,
  errorComponent: ({ error }) => {
    const { toast } = useToast();

    if (error instanceof AxiosError) {
      if (error.response) {
        switch (error.response.status) {
          case 401:
            toast({
              title: "Error",
              description: `${error.response.data.message}; ${error.response.data.error}`,
              variant: "destructive",
              action: (
                <ToastAction altText="Report issue: https://github.com/crux-bphc/chronofactorem-rewrite/issues">
                  <a href="https://github.com/crux-bphc/chronofactorem-rewrite/issues">
                    Report
                  </a>
                </ToastAction>
              ),
            });
            break;
          case 500:
            toast({
              title: "Server Error",
              description: `${error.response.data.message}; ${error.response.data.error}`,
              variant: "destructive",
              action: (
                <ToastAction altText="Report issue: https://github.com/crux-bphc/chronofactorem-rewrite/issues">
                  <a href="https://github.com/crux-bphc/chronofactorem-rewrite/issues">
                    Report
                  </a>
                </ToastAction>
              ),
            });
            break;

          default:
            toast({
              title: "Unknown Error",
              description:
                "message" in error.response.data
                  ? error.response.data.message
                  : `API returned ${error.response.status}`,
              variant: "destructive",
              action: (
                <ToastAction altText="Report issue: https://github.com/crux-bphc/chronofactorem-rewrite/issues">
                  <a href="https://github.com/crux-bphc/chronofactorem-rewrite/issues">
                    Report
                  </a>
                </ToastAction>
              ),
            });
        }
      } else {
        // Fallback to the default ErrorComponent
        return <ErrorComponent error={error} />;
      }
    }
  },
});

function Login() {
  return (
    <>
      <div className="flex bg-background h-screen w-full justify-center items-center">
        <div className="fixed top-4 right-4">
          <ModeToggle />
        </div>
        <div className="flex flex-col items-center">
          <h2 className="scroll-m-20 md:text-lg text-md tracking-tight lg:text-xl text-muted-foreground">
            Welcome to
          </h2>
          <h1 className="scroll-m-20 md:text-6xl text-4xl font-extrabold tracking-tight lg:text-7xl text-foreground">
            ChronoFactorem
          </h1>
          <Button
            asChild
            className="md:mt-6 mt-2 rounded-lg flex px-4 py-2 items-center"
          >
            <a href="/api/auth/google">
              <AtSign className="mr-2 md:h-4 md:w-4 w-3 h-3" />
              <span className="font-bold md:text-lg text-sm">
                Login with Google
              </span>
            </a>
          </Button>
          <a
            href="/about"
            className="w-fit md:mt-8 mt-2 text-muted-foreground md:text-lg text-sm hover:underline underline-offset-4"
          >
            About ChronoFactorem
          </a>
        </div>
      </div>
      <span className="fixed bottom-0 bg-muted w-full text-center py-1 text-xs md:px-0 px-8 tracking-tight md:text-lg text-muted-foreground">
        Powered by CRUx: The Programming and Computing Club of BITS Hyderabad
      </span>
    </>
  );
}

export default loginRoute;
