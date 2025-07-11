import { queryOptions } from "@tanstack/react-query";
import { Route } from "@tanstack/react-router";
import axios, { AxiosError } from "axios";
import { AtSign } from "lucide-react";
import { z } from "zod";
import toastHandler from "@/data-access/errors/toastHandler";
import { ModeToggle } from "../components/ModeToggle";
import { Button } from "../components/ui/button";
import { useToast } from "../components/ui/use-toast";
import { rootRoute, router } from "../main";

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
