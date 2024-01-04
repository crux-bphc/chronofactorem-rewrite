import { ToastAction } from "@/components/ui/toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { ErrorComponent, Route } from "@tanstack/react-router";
import axios, { AxiosError } from "axios";
import { ArrowUpRightFromCircle, CalendarX2, HelpCircle } from "lucide-react";
import { z } from "zod";
import { timetableType, userWithTimetablesType } from "../../lib/src/index";
import authenticatedRoute from "./AuthenticatedRoute";
import TimetableCard from "./components/TimetableCard";
import { Button } from "./components/ui/button";
import { toast, useToast } from "./components/ui/use-toast";
import { router } from "./main";

const fetchUserDetails = async (): Promise<
  z.infer<typeof userWithTimetablesType>
> => {
  const response = await axios.get<z.infer<typeof userWithTimetablesType>>(
    "/api/user",
    {
      headers: {
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
  const archivedTimetables: Timetable[] = [];

  for (const timetable of timetables) {
    if (timetable.archived) {
      archivedTimetables.push(timetable);
    } else if (timetable.draft) {
      draftTimetables.push(timetable);
    } else if (timetable.private) {
      privateTimetables.push(timetable);
    } else {
      publicTimetables.push(timetable);
    }
  }

  return {
    publicTimetables,
    privateTimetables,
    draftTimetables,
    archivedTimetables,
  };
};

const renderTimetableSection = (title: string, timetables: Timetable[]) => {
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
              showFooter={false}
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

const cmsExportRoute = new Route({
  getParentRoute: () => authenticatedRoute,
  path: "/cmsExport",
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
  component: CmsExport,
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

function CmsExport() {
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
      if (error instanceof AxiosError && error.response) {
        if (error.response.status === 401) {
          router.navigate({ to: "/login" });
        }
        if (error.response.status === 400) {
          toast({
            title: "Error",
            description:
              "message" in error.response.data
                ? error.response.data.message
                : "API returned 400",
            variant: "destructive",
            action: (
              <ToastAction altText="Report issue: https://github.com/crux-bphc/chronofactorem-rewrite/issues">
                <a href="https://github.com/crux-bphc/chronofactorem-rewrite/issues">
                  Report
                </a>
              </ToastAction>
            ),
          });
        } else if (error.response.status === 404) {
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
        } else if (error.response.status === 500) {
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
        } else {
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
    const { privateTimetables, publicTimetables, archivedTimetables } =
      userQueryResult.data;

    return (
      <>
        <TooltipProvider>
          <div className="flex items-center py-2 md:py-4 px-4 md:px-8">
            <span className="xl:text-5xl lg:text-4xl md:text-3xl text-2xl font-bold m-4 text-foreground">
              CMS Auto-Enroll
            </span>
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild>
                <div className="inline bg-transparent w-fit rounded-full dark:hover:bg-slate-800/80 text-muted-foreground hover:bg-slate-300/80 p-1 transition duration-200 ease-in-out ml-2 text-sm font-bold">
                  <HelpCircle className="xl:w-12 lg:w-10 md:w-8 w-8 xl:h-12 lg:h-10 md:h-8 h-8" />
                </div>
              </TooltipTrigger>
              <TooltipContent className="w-[48rem] flex flex-col bg-muted text-foreground border-muted-foreground text-md">
                <span>
                  ChronoFactorem now allows you to cut the hassle of enrolling
                  into the CMS sections for your courses, and automates it all
                  away.
                </span>
                <span className="pt-2">
                  With just a few clicks, you can now sync everything in your
                  academic life with ChronoFactorem.
                </span>
                <span className="pt-2">
                  For those unaware, CMS is the single most important academic
                  resource for your life at BITS Hyderabad. All your course
                  slides, assignment details, and important announcements are
                  posted on CMS. You can access CMS at
                  <a
                    href="https://cms.bits-hyderabad.ac.in/"
                    className="text-blue-400 ml-1 inline items-center"
                  >
                    https://cms.bits-hyderabad.ac.in/
                    <ArrowUpRightFromCircle className="inline w-4 h-4 ml-1 mr-1" />
                  </a>
                  , download the Android app
                  <a
                    href="https://play.google.com/store/apps/details?id=crux.bphc.cms"
                    className="text-blue-400 ml-1 inline items-center"
                  >
                    here
                    <ArrowUpRightFromCircle className="inline w-4 h-4 ml-1 mr-1" />
                  </a>
                  , and download the iOS app
                  <a
                    href="https://apps.apple.com/in/app/cms-bphc/id1489946522"
                    className="text-blue-400 ml-1 inline items-center"
                  >
                    here
                    <ArrowUpRightFromCircle className="inline w-4 h-4 ml-1 mr-1" />
                  </a>
                </span>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
        <main className="text-foreground py-2 md:py-4 px-10 md:px-16">
          <h1 className="xl:text-4xl lg:text-3xl md:text-2xl text-xl font-bold text-center sm:text-left md:text-4xl">
            My Timetables
          </h1>
          {privateTimetables.length === 0 &&
            publicTimetables.length === 0 &&
            archivedTimetables.length === 0 && (
              <>
                <div className="bg-secondary mt-10 text-center flex flex-col items-center justify-center gap-8 py-16 px-4 rounded-lg">
                  <span>
                    <CalendarX2 className="h-24 w-24 md:h-32 md:w-32" />
                  </span>
                  <h2 className="lg:text-2xl text-lg">
                    Publish a timetable to enable CMS Auto-Enroll.
                    <br />
                    Draft timetables cannot be used with CMS Auto-Enroll.
                  </h2>
                  <Button
                    className="lg:text-2xl text-lg py-6 px-10 font-bold"
                    onClick={() => createMutation.mutate()}
                  >
                    Create Timetable
                  </Button>
                </div>
              </>
            )}

          <div>
            {renderTimetableSection("Private Timetables:", privateTimetables)}

            {renderTimetableSection("Public Timetables:", publicTimetables)}

            {renderTimetableSection("Archived Timetables:", archivedTimetables)}
          </div>
        </main>
      </>
    );
  }
}

export default cmsExportRoute;
