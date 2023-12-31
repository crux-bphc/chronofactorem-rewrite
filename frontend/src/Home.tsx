import { ToastAction } from "@/components/ui/toast";
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { ErrorComponent, Route } from "@tanstack/react-router";
import axios, { AxiosError } from "axios";
import { CalendarX2 } from "lucide-react";
import { z } from "zod";
import { timetableType, userWithTimetablesType } from "../../lib";
import TimetableCard from "./components/TimetableCard";
import { Button } from "./components/ui/button";
import { toast, useToast } from "./components/ui/use-toast";
import { rootRoute, router } from "./main";

const fetchUserDetails = async (): Promise<
  z.infer<typeof userWithTimetablesType>
> => {
  const response = await axios.get<z.infer<typeof userWithTimetablesType>>(
    "/api/user",
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json ",
      },
    },
  );
  return response.data;
};

type Timetable = z.infer<typeof timetableType>;

const filterTimetables = (timetables: Timetable[]) => {
  const publicTimetables: Timetable[] = [];
  const privateTimetables: Timetable[] = [];
  const draftTimetables: Timetable[] = [];

  for (const timetable of timetables) {
    if (timetable.draft) {
      draftTimetables.push(timetable);
    } else if (timetable.private) {
      privateTimetables.push(timetable);
    } else {
      publicTimetables.push(timetable);
    }
  }

  return { publicTimetables, privateTimetables, draftTimetables };
};

const renderTimetableSection = (
  title: string,
  timetables: Timetable[],
  isPrivate: boolean,
  isDraft = false,
) => {
  if (timetables.length === 0) return null;

  return (
    <>
      <section className="pt-8">
        <h2 className="text-2xl md:text-3xl font-bold">{title}</h2>
        <div className="flex flex-col items-center justify-center sm:flex-row sm:flex-wrap gap-8 pt-4 md:justify-normal">
          {timetables.map((timetable) => (
            <TimetableCard
              key={timetable.id}
              timetable={timetable}
              isPrivate={isPrivate}
              isDraft={isDraft}
            />
          ))}
        </div>
      </section>
    </>
  );
};

const userQueryOptions = queryOptions({
  queryKey: ["user"],
  queryFn: () => fetchUserDetails(),
  select: (data) => {
    return filterTimetables(data.timetables);
  },
});

const indexRoute = new Route({
  getParentRoute: () => rootRoute,
  path: "/",
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(userQueryOptions).catch((error) => {
      if (
        error instanceof AxiosError &&
        error.response &&
        error.response.status === 401
      ) {
        router.navigate({
          to: "/login",
        });
      }

      throw error;
    }),
  component: Home,
  errorComponent: ({ error }) => {
    const { toast } = useToast();

    if (error instanceof AxiosError) {
      if (error.response) {
        switch (error.response.status) {
          case 404:
            toast({
              title: "Error",
              description:
                "message" in error.response.data
                  ? error.response.data.message
                  : "API returned 404",
              variant: "destructive",
              action: (
                <ToastAction altText="Report issue: https://github.com/crux-bphc/chronofactorem-rewrite/issues">
                  <a href="https://github.com/crux-bphc/chronofactorem-rewrite/issues">
                    Report
                  </a>
                </ToastAction>
              ),
            });
            break;
          case 500:
            toast({
              title: "Server Error",
              description:
                "message" in error.response.data
                  ? error.response.data.message
                  : "API returned 500",
              variant: "destructive",
              action: (
                <ToastAction altText="Report issue: https://github.com/crux-bphc/chronofactorem-rewrite/issues">
                  <a href="https://github.com/crux-bphc/chronofactorem-rewrite/issues">
                    Report
                  </a>
                </ToastAction>
              ),
            });
            break;

          default:
            toast({
              title: "Unknown Error",
              description:
                "message" in error.response.data
                  ? error.response.data.message
                  : `API returned ${error.response.status}`,
              variant: "destructive",
              action: (
                <ToastAction altText="Report issue: https://github.com/crux-bphc/chronofactorem-rewrite/issues">
                  <a href="https://github.com/crux-bphc/chronofactorem-rewrite/issues">
                    Report
                  </a>
                </ToastAction>
              ),
            });
        }
      } else {
        // Fallback to the default ErrorComponent
        return <ErrorComponent error={error} />;
      }
    }
  },
});

function Home() {
  const userQueryResult = useQuery(userQueryOptions);
  const queryClient = useQueryClient();
  const createMutation = useMutation({
    mutationFn: () => {
      return axios.post<{ message: string; id: number }>(
        "/api/timetable/create",
      );
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      // TODO: Navigate to the newly created page
      console.log(response.data.id);
    },
    onError: (error) => {
      // TODO: Discuss about error handling
      if (error instanceof AxiosError) {
        toast({
          title: "Error",
          description: error.response?.data.message,
          variant: "destructive",
        });
      }
    },
  });

  if (userQueryResult.isFetching) {
    return <span>Loading...</span>;
  }

  if (userQueryResult.isError) {
    return (
      <span>
        Unexpected error: {JSON.stringify(userQueryResult.error.message)} Please
        report this{" "}
        <a href="https://github.com/crux-bphc/chronofactorem-rewrite/issues">
          here
        </a>
      </span>
    );
  }

  if (userQueryResult.isSuccess) {
    const { draftTimetables, privateTimetables, publicTimetables } =
      userQueryResult.data;

    return (
      <>
        <main className="bg-background min-h-screen text-foreground py-20 px-10 md:px-16">
          <h1 className="text-3xl font-bold text-center sm:text-left md:text-4xl">
            My Timetables
          </h1>
          {draftTimetables.length === 0 &&
            privateTimetables.length === 0 &&
            publicTimetables.length === 0 && (
              <>
                <div className="bg-secondary mt-10 text-center flex flex-col items-center justify-center gap-8 py-16 rounded-lg">
                  <span>
                    <CalendarX2 className="h-24 w-24 md:h-32 md:w-32" />
                  </span>
                  <h2 className="text-xl sm:text-2xl">It's empty in here.</h2>
                  <Button
                    className="text-lg sm:text-2xl py-6 px-10 font-bold"
                    onClick={() => createMutation.mutate()}
                  >
                    Create Timetable
                  </Button>
                </div>
              </>
            )}

          <div>
            {renderTimetableSection(
              "Draft Timetables:",
              draftTimetables,
              false, // the value of isPrivate shouldn't matter here
              true,
            )}

            {renderTimetableSection(
              "Private Timetables:",
              privateTimetables,
              true,
            )}

            {renderTimetableSection(
              "Public Timetables:",
              publicTimetables,
              false,
            )}
          </div>
        </main>
      </>
    );
  }
}

export default indexRoute;
