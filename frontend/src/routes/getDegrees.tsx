import { Route } from "@tanstack/react-router";
import { AxiosError } from "axios";
import * as z from "zod/mini";
import { useToast } from "@/components/ui/use-toast";
import toastHandler from "@/data-access/errors/toastHandler";
import { userQueryOptions } from "@/data-access/hooks/useUser";
import { rootRoute, router } from "../router";

/*
Although users are always redirected to /getDegrees after login, we don't want to show them the page if they've already filled it out.
Since the user is actually created in the DB only after they properly fill out their degrees, we check if they exist in the DB by querying /api/user. 
If this succeeds, they have already filled this out and so we redirect them away to /.
If they have not filled out their degrees, they will not exist in the DB and so /api/user will return a 401 response. 
Then, we do nothing (no error toasts) and just let them fill out their degrees.
*/
const getDegreesRoute = new Route({
  getParentRoute: () => rootRoute,
  path: "getDegrees",
  // same bounds as collegeYearType in lib, which uses full zod
  validateSearch: z.object({ year: z.int().check(z.minimum(1), z.maximum(6)) }),
  loader: ({ context: { queryClient }, preload }) =>
    queryClient
      .ensureQueryData(userQueryOptions)
      .then(() => {
        if (!preload) router.navigate({ to: "/" });
      })
      .catch((error) => {
        if (
          error instanceof AxiosError &&
          error.response &&
          error.response.status === 401
        ) {
          // The one exception to doing nothing is if they don't have a valid session cookie (from Google OAuth)
          if (
            error.response.data.error === "user session expired" &&
            !preload
          ) {
            router.navigate({ to: "/login" });
          }
        }
      }),
  errorComponent: ({ error }) => {
    const { toast } = useToast();
    toastHandler(error, toast);
  },
}).lazy(() => import("../pages/GetDegrees").then((d) => d.Route));

export default getDegreesRoute;
