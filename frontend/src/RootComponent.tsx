import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Outlet, useRouter } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { NavBar } from "./components/Navbar";
import { Toaster } from "./components/ui/toaster";

export default function RootComponent() {
  const stateRouter = useRouter();
  // login and getDegrees are fullscreen onboarding flows, so they render
  // without the navbar
  const pathname = stateRouter.state.location.pathname;
  const showNavbar = pathname !== "/login" && pathname !== "/getDegrees";

  return (
    <>
      <Toaster />
      {showNavbar && <NavBar />}
      <Outlet />
      {import.meta.env.DEV && (
        <>
          <ReactQueryDevtools buttonPosition="bottom-right" />
          <TanStackRouterDevtools position="bottom-left" />
        </>
      )}
    </>
  );
}
