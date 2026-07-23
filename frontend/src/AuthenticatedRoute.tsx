import { Outlet, Route, redirect } from "@tanstack/react-router";
import { AxiosError } from "axios";
import { NavBar } from "./components/Navbar";
import { authStatusQueryOptions } from "./data-access/hooks/useAuthStatus";
import { rootRoute } from "./router";

const authenticatedRoute = new Route({
  id: "authenticated",
  getParentRoute: () => rootRoute,
  beforeLoad: async ({ context: { queryClient } }) => {
    try {
      await queryClient.ensureQueryData(authStatusQueryOptions);
    } catch (e) {
      if (e instanceof AxiosError && e.response) {
        if (
          e.response.status === 200 &&
          e.response.data.message === "user needs to get degrees"
        ) {
          throw redirect({
            to: e.response.data.redirect,
          });
        }
        if (e.response.status === 401 || e.response.status === 500) {
          throw redirect({
            to: "/login",
          });
        }
      } else {
        throw e;
      }
    }
  },
  component: () => {
    return (
      <>
        <NavBar />
        <Outlet />
      </>
    );
  },
});

export default authenticatedRoute;
