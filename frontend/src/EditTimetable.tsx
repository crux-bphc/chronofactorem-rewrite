import { ToastAction } from "@/components/ui/toast";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { ErrorComponent, Route } from "@tanstack/react-router";
import axios, { AxiosError } from "axios";
import { Copy, GripHorizontal, GripVertical, Send, Trash } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { courseType, timetableWithSectionsType } from "../../lib/src";
import { userWithTimetablesType } from "../../lib/src/index";
import authenticatedRoute from "./AuthenticatedRoute";
import { TimetableGrid } from "./components/TimetableGrid";
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

const timetableQueryOptions = (timetableId: string) =>
  queryOptions({
    queryKey: ["timetable", timetableId],
    queryFn: () => fetchTimetable(timetableId),
  });

const fetchUserDetails = async () => {
  const response =
    await axios.get<z.infer<typeof userWithTimetablesType>>("/api/user");
  return response.data;
};

const userQueryOptions = queryOptions({
  queryKey: ["user"],
  queryFn: () => fetchUserDetails(),
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

const editTimetableRoute = new Route({
  getParentRoute: () => authenticatedRoute,
  path: "edit/$timetableId",
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
  component: EditTimetable,
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

function EditTimetable() {
  const [isVertical, setIsVertical] = useState(false);
  const { timetableId } = editTimetableRoute.useParams();
  const timetableQueryResult = useQuery(timetableQueryOptions(timetableId));
  const courseQueryResult = useQuery(courseQueryOptions());
  const userQueryResult = useQuery(userQueryOptions);
  const queryClient = useQueryClient();

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
    onSuccess: (_response) => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      router.navigate({
        to: "/edit/$timetableId",
        params: { timetableId: _response.data.id },
      });
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
                variant="ghost"
                className="rounded-full p-3"
                onClick={() => setIsVertical(!isVertical)}
              >
                {isVertical ? <GripVertical /> : <GripHorizontal />}
              </Button>
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
              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      className="text-green-200 w-fit text-xl p-4 ml-4 bg-green-900 hover:bg-green-800"
                      onClick={() =>
                        router.navigate({
                          to: "/finalize/$timetableId",
                          params: { timetableId: timetable.id },
                        })
                      }
                    >
                      <div className="hidden md:flex">Publish</div>
                      <div className="flex md:hidden">
                        <Send className="h-6 w-6" />
                      </div>
                    </Button>
                  </span>
                </TooltipTrigger>
              </Tooltip>
            </span>
          </div>
          <TimetableGrid
            isVertical={isVertical}
            timetableDetailsSections={timetableDetailsSections}
            handleUnitClick={(e) => console.log(e)}
            handleUnitDelete={(e) => console.log("DELETING", e)}
          />
        </TooltipProvider>
      </div>
    </>
  );
}

export default editTimetableRoute;
