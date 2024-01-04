import { ToastAction } from "@/components/ui/toast";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { ErrorComponent, Route } from "@tanstack/react-router";
import axios, { AxiosError } from "axios";
import { toPng } from "html-to-image";
import {
  Copy,
  Download,
  Edit2,
  GripHorizontal,
  GripVertical,
  Trash,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { z } from "zod";
import { courseType, timetableWithSectionsType } from "../../lib/src";
import { userWithTimetablesType } from "../../lib/src/index";
import authenticatedRoute from "./AuthenticatedRoute";
import { TimetableGrid } from "./components/TimetableGrid";
import { SideMenu } from "./components/side-menu";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./components/ui/alert-dialog";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import { TooltipProvider } from "./components/ui/tooltip";
import { toast, useToast } from "./components/ui/use-toast";
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

const fetchUserDetails = async () => {
  const response =
    await axios.get<z.infer<typeof userWithTimetablesType>>("/api/user");
  return response.data;
};

const timetableQueryOptions = (timetableId: string) =>
  queryOptions({
    queryKey: ["timetable", timetableId],
    queryFn: () => fetchTimetable(timetableId),
  });

const fetchCourses = async () => {
  const response = await axios.get<z.infer<typeof courseType>[]>(
    "/api/course",
    {
      headers: {
        "Content-Type": "application/json ",
      },
    },
  );
  return response.data;
};

const courseQueryOptions = () =>
  queryOptions({
    queryKey: ["courses"],
    queryFn: () => fetchCourses(),
  });

const userQueryOptions = queryOptions({
  queryKey: ["user"],
  queryFn: () => fetchUserDetails(),
});

const viewTimetableRoute = new Route({
  getParentRoute: () => authenticatedRoute,
  path: "view/$timetableId",
  beforeLoad: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(courseQueryOptions()).catch((error: Error) => {
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
  component: ViewTimetable,
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

function ViewTimetable() {
  const [isVertical, setIsVertical] = useState(false);

  const { timetableId } = viewTimetableRoute.useParams();

  const timetableQueryResult = useQuery(timetableQueryOptions(timetableId));
  const courseQueryResult = useQuery(courseQueryOptions());
  const queryClient = useQueryClient();
  const userQueryResult = useQuery(userQueryOptions);
  const screenshotContentRef = useRef<HTMLDivElement>(null);
  const [isScreenshotMode, setIsScreenshotMode] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => {
      return axios.post(`/api/timetable/${timetableId}/delete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      router.navigate({ to: "/" });
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

  const copyMutation = useMutation({
    mutationFn: () => {
      return axios.post<{ message: string; id: string }>(
        `/api/timetable/${timetableId}/copy`,
      );
    },
    onSuccess: (_data) => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      // TODO: Uncomment this when the edit route is ready
      // router.navigate({ to: "/edit/$timetableId", params: { data.id } });
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

  const editMutation = useMutation({
    mutationFn: (body: {
      name: string;
      isPrivate: boolean;
      isDraft: boolean;
    }) => {
      return axios.post(`/api/timetable/${timetableId}/edit`, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      // TODO: Uncomment this when the edit route is ready
      // router.navigate({ to: "/edit/$timetableId", params: { timetableId } });
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

  const generateScreenshot = useCallback(() => {
    const screenShotContent = screenshotContentRef.current;
    setIsScreenshotMode(true);

    if (screenShotContent === null) {
      return;
    }

    // use some standard values where it is going to render properly
    screenShotContent.style.height = isVertical ? "640px" : "512px";
    screenShotContent.style.width = "1920px";

    toPng(screenShotContent, {
      cacheBust: true,
    })
      .then((dataUrl) => {
        const link = document.createElement("a");
        link.download = "timetable.png";
        link.href = dataUrl;
        link.click();

        // later remove those values let the browser figure it out the proper values
        screenShotContent.style.height = "";
        screenShotContent.style.width = "";

        setIsScreenshotMode(false);
      })
      .catch((err: Error) => {
        setIsScreenshotMode(false);

        console.error("something went wrong with image generation", err);
        toast({
          title: "Error",
          description: err.message,
          variant: "destructive",
          action: (
            <ToastAction altText="Report issue: https://github.com/crux-bphc/chronofactorem-rewrite/issues">
              <a href="https://github.com/crux-bphc/chronofactorem-rewrite/issues">
                Report
              </a>
            </ToastAction>
          ),
        });
      });
  }, [isVertical]);

  if (courseQueryResult.isFetching) {
    return <span>Loading...</span>;
  }

  if (courseQueryResult.isError || courseQueryResult.data === undefined) {
    return (
      <span>
        Unexpected error:{" "}
        {JSON.stringify(
          courseQueryResult.error
            ? courseQueryResult.error.message
            : "course query result is undefined",
        )}{" "}
        Please report this{" "}
        <a href="https://github.com/crux-bphc/chronofactorem-rewrite/issues">
          here
        </a>
      </span>
    );
  }

  if (courseQueryResult.data === undefined) {
    return (
      <span>
        Unexpected error: courseQueryResult.data is undefined. Please report
        this{" "}
        <a href="https://github.com/crux-bphc/chronofactorem-rewrite/issues">
          here
        </a>
      </span>
    );
  }

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
          here
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
          here
        </a>
      </span>
    );
  }

  if (userQueryResult.data === undefined) {
    return (
      <span>
        Unexpected error: timetableQueryResult.data is undefined. Please report
        this{" "}
        <a href="https://github.com/crux-bphc/chronofactorem-rewrite/issues">
          here
        </a>
      </span>
    );
  }

  const timetableDetailsSections: {
    id: string;
    name: string;
    roomTime: string[];
    courseId: string;
    type: string;
    number: number;
    instructors: string[];
  }[] = [];
  const courses = courseQueryResult.data;
  const timetable = timetableQueryResult.data;

  for (let i = 0; i < timetable.sections.length; i++) {
    const sections = timetable.sections;
    const course = courses.find((course) => course.id === sections[i].courseId);
    if (course) {
      timetableDetailsSections.push({
        id: sections[i].id,
        name: course.name,
        roomTime: sections[i].roomTime,
        courseId: course.code,
        type: sections[i].type,
        number: sections[i].number,
        instructors: sections[i].instructors,
      });
    }
  }

  return (
    <>
      <div className="grow">
        <TooltipProvider>
          <div className="flex justify-between p-4">
            <span>
              <p className="font-bold text-3xl">{timetable.name}</p>
              <span className="flex justify-between items-center gap-2">
                <Badge variant="default" className="w-fit">
                  <p className="flex items-center gap-1">
                    <span>{timetable.acadYear}</span>
                    <span>|</span>
                    <span>{timetable.degrees.join("")}</span>
                    <span>|</span>
                    <span className="flex-none">{`${timetable.year}-${timetable.semester}`}</span>
                  </p>
                </Badge>
                <span className="text-muted-foreground">
                  <p className="text-sm font-bold inline">Last Updated: </p>
                  <p className="inline">
                    {new Date(timetable.lastUpdated).toLocaleString()}
                  </p>
                </span>
              </span>
            </span>
            <span className="flex justify-center items-center gap-2">
              <Button
                onClick={generateScreenshot}
                className="flex justify-between items-center gap-2"
              >
                <Download />
                PNG
              </Button>
              <Button
                variant="ghost"
                className="rounded-full p-3"
                onClick={() => setIsVertical(!isVertical)}
              >
                {isVertical ? <GripVertical /> : <GripHorizontal />}
              </Button>
              {userQueryResult.data.id ===
                timetableQueryResult.data.authorId && (
                <Button
                  variant="ghost"
                  className="rounded-full p-3"
                  onClick={() =>
                    editMutation.mutate({
                      isDraft: true,
                      isPrivate: true,
                      name: timetableQueryResult.data.name,
                    })
                  }
                >
                  <Edit2 />
                </Button>
              )}
              <Button
                variant="ghost"
                className="rounded-full p-3"
                onClick={() => copyMutation.mutate()}
              >
                <Copy />
              </Button>
              {userQueryResult.data.id ===
                timetableQueryResult.data.authorId && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      className="rounded-full p-3 hover:bg-destructive/90 hover:text-destructive-foreground"
                    >
                      <Trash />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="p-8">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-2xl">
                        Are you sure?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-destructive text-lg font-bold">
                        All your progress on this timetable will be lost, and
                        unrecoverable.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogPrimitive.Action asChild>
                        <Button
                          variant="destructive"
                          onClick={() => deleteMutation.mutate()}
                        >
                          Delete
                        </Button>
                      </AlertDialogPrimitive.Action>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </span>
          </div>
          {/* the bg-background here is necessary so the generated image has the background in it */}
          <div
            className="flex flex-row gap-4 bg-background"
            ref={screenshotContentRef}
          >
            <SideMenu
              timetable={timetable}
              isOnEditPage={false}
              allCoursesDetails={courses}
              isScreenshotMode={isScreenshotMode}
            />
            <TimetableGrid
              isVertical={isVertical}
              timetableDetailsSections={timetableDetailsSections}
              handleUnitClick={(e) => console.log(e)}
              handleUnitDelete={(e) => console.log("DELETING", e)}
            />
          </div>
        </TooltipProvider>
      </div>
    </>
  );
}

export default viewTimetableRoute;
