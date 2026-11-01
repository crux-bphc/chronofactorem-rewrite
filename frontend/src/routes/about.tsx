import { Route } from "@tanstack/react-router";
import { rootRoute } from "../router";

const aboutRoute = new Route({
  getParentRoute: () => rootRoute,
  path: "about",
}).lazy(() => import("../pages/About").then((d) => d.Route));

export default aboutRoute;
