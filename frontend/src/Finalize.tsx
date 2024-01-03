import { Route } from "@tanstack/react-router";
import authenticatedRoute from "./AuthenticatedRoute";

const finalizeTimetableRoute = new Route({
  getParentRoute: () => authenticatedRoute,
  path: "finalize/$timetableId",
  component: FinalizeTimetable,
});

function FinalizeTimetable() {}

export default finalizeTimetableRoute;
