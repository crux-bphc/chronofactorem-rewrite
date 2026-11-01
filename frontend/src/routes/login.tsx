import { Route } from "@tanstack/react-router";
import { AxiosError } from "axios";
import { useToast } from "@/components/ui/use-toast";
import toastHandler from "@/data-access/errors/toastHandler";
import { authStatusQueryOptions } from "@/data-access/hooks/useAuthStatus";
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
  errorComponent: ({ error }) => {
    const { toast } = useToast();
    toastHandler(error, toast);
  },
}).lazy(() => import("../pages/Login").then((d) => d.Route));

export default loginRoute;
