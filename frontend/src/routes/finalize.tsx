import { Route } from "@tanstack/react-router";
import { timetableQueryOptions } from "@/data-access/hooks/useTimetable";
import authenticatedRoute from "../AuthenticatedRoute";
import { TimetablePageError } from "./timetablePage";

const finalizeTimetableRoute = new Route({
  getParentRoute: () => authenticatedRoute,
  path: "finalize/$timetableId",
  loader: ({ context: { queryClient }, params: { timetableId } }) =>
    queryClient.ensureQueryData(timetableQueryOptions(timetableId)),
  errorComponent: TimetablePageError,
}).lazy(() => import("../pages/FinalizeTimetable").then((d) => d.Route));

export default finalizeTimetableRoute;
