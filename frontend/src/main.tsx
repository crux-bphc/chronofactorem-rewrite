import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Router,
  RouterProvider,
  rootRouteWithContext,
} from "@tanstack/react-router";
import React from "react";
import ReactDOM from "react-dom/client";
import indexRoute from "./Home";
import loginRoute from "./Login";
import RootComponent from "./RootComponent";
import "./index.css";

const queryClient = new QueryClient();

export const rootRoute = rootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  component: RootComponent,
});

const routeTree = rootRoute.addChildren([indexRoute, loginRoute]);

export const router = new Router({
  routeTree,
  defaultPreload: "intent",
  // Since we're using React Query, we don't want loader calls to ever be stale
  // This will ensure that the loader is always called when the route is preloaded or visited
  defaultPreloadStaleTime: 0,
  context: {
    queryClient,
  },
});

// Register things for typesafety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("root");

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </React.StrictMode>,
  );
}
