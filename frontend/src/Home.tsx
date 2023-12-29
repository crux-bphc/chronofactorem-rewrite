import { ToastAction } from "@/components/ui/toast";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { ErrorComponent, Route } from "@tanstack/react-router";
import axios, { AxiosError } from "axios";
import { z } from "zod";
import { userWithTimetablesType, timetableType } from "../../lib";
import { useToast } from "./components/ui/use-toast";
import { rootRoute, router } from "./main";
import { Button } from "./components/ui/button";
import { useState } from "react";

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
  const [isPrivate, setIsPrivate] = useState(true);

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

  return (
    <>
      <main className="bg-primary min-h-screen text-slate-50 w-screen px-9 pt-20 xl:px-96">
        <h1 className="text-5xl font-bold uppercase text-center">
          My Timetables
        </h1>
        <div className="flex gap-4 p-4 justify-center lg:justify-normal">
          <Button
            variant={!isPrivate ? "secondary" : "default"}
            className="text-lg"
            onClick={() => setIsPrivate(false)}
          >
            Public
          </Button>
          <Button
            variant={isPrivate ? "secondary" : "default"}
            className="text-lg"
            onClick={() => setIsPrivate(true)}
          >
            Private
          </Button>
        </div>
        <div className="pt-16">
          {isPrivate
            ? JSON.stringify(userQueryResult.data?.privateTimetables)
            : JSON.stringify(userQueryResult.data?.publicTimetables)}
        </div>
      </main>
    </>
  );
}

export default indexRoute;
