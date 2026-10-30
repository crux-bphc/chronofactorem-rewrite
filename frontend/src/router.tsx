import { QueryClient } from "@tanstack/react-query";
import { Router, rootRouteWithContext } from "@tanstack/react-router";
import { AxiosError } from "axios";
import authenticatedRoute from "./AuthenticatedRoute";
import NotFound from "./components/NotFound";
import aboutRoute from "./pages/About";
import editTimetableRoute from "./pages/EditTimetable";
import editUserProfileRoute from "./pages/EditUserProfile";
import finalizeTimetableRoute from "./pages/FinalizeTimetable";
import getDegreesRoute from "./pages/GetDegrees";
import homeRoute from "./pages/Home";
import loginRoute from "./pages/Login";
import viewTimetableRoute from "./pages/ViewTimetable";
import RootComponent from "./RootComponent";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 30_000,
      retry: (failureCount, error) => {
        if (
          error instanceof AxiosError &&
          error.response &&
          error.response.status < 500
        )
          return false;
        return failureCount < 1;
      },
    },
  },
});

export const rootRoute = rootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  component: RootComponent,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  getDegreesRoute,
  aboutRoute,
  viewTimetableRoute,
  authenticatedRoute.addChildren([
    homeRoute,
    editUserProfileRoute,
    editTimetableRoute,
    finalizeTimetableRoute,
  ]),
]);

export const router = new Router({
  routeTree,
  // Since we're using React Query, we don't want loader calls to ever be stale
  // This will ensure that the loader is always called when the route is preloaded or visited
  defaultPreloadStaleTime: 0,
  defaultPendingMs: 200,
  defaultPendingMinMs: 200,
  context: {
    queryClient,
  },
  defaultNotFoundComponent: NotFound,
});

// Register things for typesafety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
