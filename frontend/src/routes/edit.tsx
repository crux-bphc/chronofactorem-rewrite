import { Route } from "@tanstack/react-router";
import NotFound from "@/components/NotFound";
import { TimetablePageSkeleton } from "@/components/timetable/TimetablePageSkeleton";
import { timetableSearchSchema } from "@/lib/timetableSearch";
import authenticatedRoute from "../AuthenticatedRoute";
import { TimetablePageError, timetablePageLoader } from "./timetablePage";

const editTimetableRoute = new Route({
  getParentRoute: () => authenticatedRoute,
  path: "edit/$timetableId",
  loader: timetablePageLoader,
  validateSearch: timetableSearchSchema,
  loaderDeps: () => ({}),
  pendingComponent: () => <TimetablePageSkeleton page="edit" />,
  pendingMs: 200,
  notFoundComponent: NotFound,
  errorComponent: TimetablePageError,
}).lazy(() => import("../pages/EditTimetable").then((d) => d.Route));

export default editTimetableRoute;
