import { Link } from "@tanstack/react-router";
import { CalendarSearch } from "lucide-react";
import { Button } from "./ui/button";

const NotFound = () => (
  <main className="flex min-h-[70dvh] flex-col items-center justify-center gap-4 px-6 text-center">
    <CalendarSearch className="size-12 text-muted-foreground" />
    <p className="text-sm font-medium text-muted-foreground">404</p>
    <h1 className="text-3xl font-semibold tracking-tight">
      We couldn't find that page
    </h1>
    <p className="max-w-sm text-muted-foreground">
      Check the link and try again. Draft timetables are only visible to their
      owner.
    </p>
    <Button asChild className="mt-2">
      <Link to="/">Go to your timetables</Link>
    </Button>
  </main>
);
export default NotFound;
