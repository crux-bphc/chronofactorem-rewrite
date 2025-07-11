import { useQueryClient } from "@tanstack/react-query";
import { Route } from "@tanstack/react-router";
import type { timetableType } from "lib";
import { CalendarX2 } from "lucide-react";
import type { z } from "zod";
import ReportIssue from "@/components/ReportIssue";
import handleLoginRedirect from "@/data-access/errors/redirectToLogin";
import toastHandler from "@/data-access/errors/toastHandler";
import useCreateTimetable from "@/data-access/useCreateTimetable";
import useUser, { userQueryOptions } from "@/data-access/useUser";
import authenticatedRoute from "../AuthenticatedRoute";
import TimetableCard from "../components/TimetableCard";
import { Button } from "../components/ui/button";
import { toast, useToast } from "../components/ui/use-toast";
import { router } from "../main";

type Timetable = z.infer<typeof timetableType>;
const renderTimetableSection = (title: string, timetables: Timetable[]) => {
  if (timetables.length === 0) return null;

  return (
    <section className="pt-8">
      <h2 className="text-2xl md:text-3xl font-bold">{title}</h2>
      <div className="flex flex-col items-center justify-center sm:flex-row sm:flex-wrap gap-8 pt-4 md:justify-normal">
        {timetables.map((timetable) => (
          <TimetableCard
            key={timetable.id}
            timetable={timetable}
            showFooter={true}
          />
        ))}
      </div>
    </section>
  );
};

const homeRoute = new Route({
  getParentRoute: () => authenticatedRoute,
  path: "/",
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(userQueryOptions).catch((error) => {
      handleLoginRedirect(error);
      throw error;
    }),
  component: Home,
  errorComponent: ({ error }) => {
    const { toast } = useToast();
    toastHandler(error, toast);
  },
});

function Home() {
  const { data: user, isLoading, isError, error } = useUser();
  const queryClient = useQueryClient();
  const { mutate: createTimetable } = useCreateTimetable();

  if (isLoading) {
    return <span>Loading...</span>;
  }

  if (isError || user === undefined) {
    return (
      <ReportIssue
        error={error ? JSON.stringify(error.message) : "user is undefined"}
      />
    );
  }

  const {
    draftTimetables,
    privateTimetables,
    publicTimetables,
    archivedTimetables,
  } = user;

  return (
    <main className="text-foreground py-6 md:py-12 px-10 md:px-16">
      <h1 className="text-3xl font-bold text-center sm:text-left md:text-4xl">
        My Timetables
      </h1>
      {draftTimetables.length === 0 &&
        privateTimetables.length === 0 &&
        publicTimetables.length === 0 &&
        archivedTimetables.length === 0 && (
          <div className="bg-secondary mt-10 text-center flex flex-col items-center justify-center gap-8 py-16 rounded-lg">
            <span>
              <CalendarX2 className="h-24 w-24 md:h-32 md:w-32" />
            </span>
            <h2 className="text-xl sm:text-2xl">It's empty in here.</h2>
            <Button
              className="text-lg sm:text-2xl py-6 px-10 font-bold"
              onClick={() =>
                createTimetable(void null, {
                  onError: (error) => toastHandler(error, toast),
                  onSuccess: (_response) => {
                    queryClient.invalidateQueries({ queryKey: ["user"] });
                    router.navigate({
                      to: "/edit/$timetableId",
                      params: { timetableId: _response.data.id },
                    });
                  },
                })
              }
            >
              Create Timetable
            </Button>
          </div>
        )}

      <div>
        {renderTimetableSection("Draft Timetables:", draftTimetables)}
        {renderTimetableSection("Private Timetables:", privateTimetables)}
        {renderTimetableSection("Public Timetables:", publicTimetables)}
        {renderTimetableSection("Archived Timetables:", archivedTimetables)}
      </div>
    </main>
  );
}

export default homeRoute;
