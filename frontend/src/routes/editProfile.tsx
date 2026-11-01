import { Route } from "@tanstack/react-router";
import { useToast } from "@/components/ui/use-toast";
import { handleLoginRedirect } from "@/data-access/errors/handlers";
import toastHandler from "@/data-access/errors/toastHandler";
import { userQueryOptions } from "@/data-access/hooks/useUser";
import authenticatedRoute from "../AuthenticatedRoute";

const editUserProfileRoute = new Route({
  getParentRoute: () => authenticatedRoute,
  path: "editProfile",
  loader: async ({ context: { queryClient }, preload }) => {
    try {
      return await queryClient.ensureQueryData(userQueryOptions);
    } catch (error: unknown) {
      if (!preload) handleLoginRedirect(error);
      throw error;
    }
  },
  errorComponent: ({ error }) => {
    const { toast } = useToast();
    toastHandler(error, toast);
  },
}).lazy(() => import("../pages/EditUserProfile").then((d) => d.Route));

export default editUserProfileRoute;
