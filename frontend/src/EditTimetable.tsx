import { ToastAction } from "@/components/ui/toast";
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { ErrorComponent, Route } from "@tanstack/react-router";
import axios, { AxiosError } from "axios";
import { useState } from "react";
import { z } from "zod";
import { courseType, timetableWithSectionsType } from "../../lib/src";
import authenticatedRoute from "./AuthenticatedRoute";
import { TimetableGrid } from "./components/TimetableGrid";
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
  const { timetableId } = editTimetableRoute.useParams();
  const timetableQueryResult = useQuery(timetableQueryOptions(timetableId));
  const courseQueryResult = useQuery(courseQueryOptions());
  const [isVertical, setIsVertical] = useState(false);
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
  const sections = timetableQueryResult.data.sections;

  for (let i = 0; i < sections.length; i++) {
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
          <div>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
            >
              Delete
            </Button>
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
