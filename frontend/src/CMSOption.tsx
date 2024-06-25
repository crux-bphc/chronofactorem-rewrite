import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { ErrorComponent, Link, Route } from "@tanstack/react-router";
import axios, { AxiosError } from "axios";
import { ArrowUpRightFromCircle, FlaskConical, HelpCircle } from "lucide-react";
import { z } from "zod";
import { timetableWithSectionsType } from "../../lib/src";
import authenticatedRoute from "./AuthenticatedRoute";
import { ToastAction } from "./components/ui/toast";
import { useToast } from "./components/ui/use-toast";
import { router } from "./main";

const fetchTimetable = async (timetableId: string) => {
  const response = await axios.get<z.infer<typeof timetableWithSectionsType>>(
    `/api/timetable/${timetableId}`,
    {
      headers: {
        "Content-Type": "application/json ",
      },
    },
  );
  return response.data;
};

const timetableQueryOptions = (timetableId: string) =>
  queryOptions({
    queryKey: ["timetable", timetableId],
    queryFn: () => fetchTimetable(timetableId),
  });

const CMSOptionRoute = new Route({
  getParentRoute: () => authenticatedRoute,
  path: "CMSOption/$timetableId",
  loader: ({ context: { queryClient }, params: { timetableId } }) =>
    queryClient
      .ensureQueryData(timetableQueryOptions(timetableId))
      .catch((error: Error) => {
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
  component: CMSOption,
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

function CMSOption() {
  const { timetableId } = CMSOptionRoute.useParams();
  const timetableQueryResult = useQuery(timetableQueryOptions(timetableId));

  if (timetableQueryResult.isFetching) {
    return <span>Loading...</span>;
  }

  if (timetableQueryResult.isError || timetableQueryResult.data === undefined) {
    return (
      <span>
        Unexpected error:{" "}
        {JSON.stringify(
          timetableQueryResult.error
            ? timetableQueryResult.error.message
            : "timetable query result is undefined",
        )}{" "}
        Please report this{" "}
        <a href="https://github.com/crux-bphc/chronofactorem-rewrite/issues">
          <span className="text-blue-700 dark:text-blue-400">here</span>
        </a>
      </span>
    );
  }

  if (timetableQueryResult.data === undefined) {
    return (
      <span>
        Unexpected error: timetableQueryResult.data is undefined. Please report
        this{" "}
        <a href="https://github.com/crux-bphc/chronofactorem-rewrite/issues">
          <span className="text-blue-700 dark:text-blue-400">here</span>
        </a>
      </span>
    );
  }

  return (
    <>
      <TooltipProvider>
        <div className="flex xl:pl-96 lg:pl-48 md:pl-24 pl-8 xl:pt-48 lg:pt-36 md:pt-36 pt-24 w-full">
          <div className="flex flex-col w-full">
            <div className="flex flex-col">
              <div className="flex items-center">
                <span className="xl:text-5xl lg:text-4xl md:text-3xl text-2xl font-bold">
                  Auto-Enroll these Sections into CMS?
                </span>
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <div className="inline bg-transparent w-fit rounded-full dark:hover:bg-slate-800/80 text-muted-foreground hover:bg-slate-300/80 p-1 transition duration-200 ease-in-out ml-2 text-sm font-bold">
                      <HelpCircle className="xl:w-12 lg:w-10 md:w-8 w-8 xl:h-12 lg:h-10 md:h-8 h-8" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="lg:w-[48rem] md:w-[36rem] w-[24rem] flex flex-col bg-secondary text-secondary-foreground border-slate-300 dark:border-slate-600 text-md">
                    <span>
                      ChronoFactorem now allows you to cut the hassle of
                      enrolling into the CMS sections for your courses, and
                      automates it all away.
                    </span>
                    <span className="pt-2">
                      With just a few clicks, you can now sync everything in
                      your academic life with ChronoFactorem.
                    </span>
                    <span className="pt-2">
                      For those unaware, CMS is the single most important
                      academic resource for your life at BITS Hyderabad. All
                      your course slides, assignment details, and important
                      announcements are posted on CMS. You can access CMS at
                      <a
                        href="https://cms.bits-hyderabad.ac.in/"
                        className="text-blue-700 dark:text-blue-400 ml-1 inline items-center"
                      >
                        https://cms.bits-hyderabad.ac.in/
                        <ArrowUpRightFromCircle className="inline w-4 h-4 ml-1 mr-1" />
                      </a>
                      , download the Android app
                      <a
                        href="https://play.google.com/store/apps/details?id=crux.bphc.cms"
                        className="text-blue-700 dark:text-blue-400 ml-1 inline items-center"
                      >
                        here
                        <ArrowUpRightFromCircle className="inline w-4 h-4 ml-1 mr-1" />
                      </a>
                      , and download the iOS app
                      <a
                        href="https://apps.apple.com/in/app/cms-bphc/id1489946522"
                        className="text-blue-700 dark:text-blue-400 ml-1 inline items-center"
                      >
                        here
                        <ArrowUpRightFromCircle className="inline w-4 h-4 ml-1 mr-1" />
                      </a>
                    </span>
                  </TooltipContent>
                </Tooltip>
              </div>
              <span className="lg:text-xl md:text-lg text-md font-normal text-muted-foreground pt-2 w-2/3">
                You can always come back and edit your timetable and auto-enroll
                from the dashboard.
              </span>
              <span className="lg:text-xl md:text-lg text-md inline items-center font-normal text-muted-foreground pt-2 w-2/3">
                <span className="font-bold">Note:</span> This feature is
                experimental.
                <FlaskConical className="inline ml-1" />
              </span>
              <span className="lg:text-xl md:text-lg text-md inline items-center font-normal text-muted-foreground pt-2 w-2/3">
                It won't break your CMS, but it might miss some sections. Such
                cases are extremely rare, and the sections that error out are
                reported to you, so you can go enroll into them manually.
              </span>
            </div>
            <div className="flex space-x-4 pt-4">
              <Link
                to="/"
                className="bg-secondary text-secondary-foreground hover:bg-secondary/80 transition duration-200 w-4/12 px-4 h-fit py-4 rounded-lg xl:text-xl lg:text-lg md:text-md text-sm font-bold flex items-center"
              >
                No, Thanks
              </Link>
              <Link
                to={"/CMS/$timetableId"}
                params={{
                  timetableId: timetableId,
                }}
                className="text-green-200 bg-green-700 hover:bg-green-800 dark:bg-green-900 transition duration-200 ease-in-out w-4/12 px-4 h-fit py-4 rounded-lg xl:text-xl lg:text-lg md:text-md text-sm font-bold flex items-center"
              >
                Sure!
              </Link>
            </div>
          </div>
        </div>
      </TooltipProvider>
    </>
  );
}

export default CMSOptionRoute;
