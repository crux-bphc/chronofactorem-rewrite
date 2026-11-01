import { Route } from "@tanstack/react-router";
import { HomeSkeleton } from "@/components/HomeSkeleton";
import { useToast } from "@/components/ui/use-toast";
import { handleLoginRedirect } from "@/data-access/errors/handlers";
import toastHandler from "@/data-access/errors/toastHandler";
import { userQueryOptions } from "@/data-access/hooks/useUser";
import authenticatedRoute from "../AuthenticatedRoute";

const homeRoute = new Route({
  getParentRoute: () => authenticatedRoute,
  path: "/",
  loader: ({ context: { queryClient }, preload }) =>
    queryClient.ensureQueryData(userQueryOptions).catch((error) => {
      if (!preload) handleLoginRedirect(error);
      throw error;
    }),
  pendingComponent: HomeSkeleton,
  errorComponent: ({ error }) => {
    const { toast } = useToast();
    toastHandler(error, toast);
  },
}).lazy(() => import("../pages/Home").then((d) => d.Route));

export default homeRoute;
