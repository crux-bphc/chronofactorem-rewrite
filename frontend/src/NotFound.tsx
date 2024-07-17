import { Route } from '@tanstack/react-router';
import { rootRoute } from "./main";
import NotFound from './components/NotFound';

const notFoundRoute = new Route({
  getParentRoute: () => rootRoute,
  path: "404",
  component: () => <NotFound />
});

export default notFoundRoute;
