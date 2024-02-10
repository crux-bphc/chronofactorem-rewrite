import { Route } from "@tanstack/react-router";
import { rootRoute } from "./main";

const notFoundRoute = new Route({
  getParentRoute: () => rootRoute,
  path: "404",
  component: () => {
    return <span>404: Not Found</span>;
  },
});

export default notFoundRoute;
