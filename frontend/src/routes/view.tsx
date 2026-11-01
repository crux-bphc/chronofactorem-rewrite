import { Route } from "@tanstack/react-router";
import NotFound from "@/components/NotFound";
import { TimetablePageSkeleton } from "@/components/timetable/TimetablePageSkeleton";
import { timetableSearchSchema } from "@/lib/timetableSearch";
import { rootRoute } from "../router";
import { TimetablePageError, timetablePageLoader } from "./timetablePage";

const viewTimetableRoute = new Route({
  getParentRoute: () => rootRoute,
  path: "view/$timetableId",
  loader: timetablePageLoader,
  validateSearch: timetableSearchSchema,
  loaderDeps: () => ({}),
  pendingComponent: () => <TimetablePageSkeleton page="view" />,
  pendingMs: 200,
  notFoundComponent: NotFound,
  errorComponent: TimetablePageError,
}).lazy(() => import("../pages/ViewTimetable").then((d) => d.Route));

export default viewTimetableRoute;
