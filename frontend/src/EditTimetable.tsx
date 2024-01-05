import CDCList from "@/../CDCs.json";
import { ToastAction } from "@/components/ui/toast";
import {
  Tooltip,
  TooltipContent,
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
import {
  AlertOctagon,
  AlertTriangle,
  ArrowUpRightFromCircle,
  Copy,
  GripHorizontal,
  GripVertical,
  Send,
  Trash,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import {
  courseType,
  courseWithSectionsType,
  sectionTypeZodEnum,
  timetableWithSectionsType,
} from "../../lib/src";
import { userWithTimetablesType } from "../../lib/src/index";
import authenticatedRoute from "./AuthenticatedRoute";
import { TimetableGrid } from "./components/TimetableGrid";
import { SideMenu } from "./components/side-menu";
import Spinner from "./components/spinner";
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
  const [isSpinner, setIsSpinner] = useState(false);

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
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      router.navigate({
        to: "/edit/$timetableId",
        params: { timetableId: response.data.id },
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

  const addSectionMutation = useMutation({
    mutationFn: async (body: { sectionId: string }) => {
      const result = await axios.post(
        `/api/timetable/${timetable.id}/add`,
        body,
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timetable"] });
    },
    onError: (error) => {
      if (error instanceof AxiosError && error.response) {
        console.log(error.response.data.message);
      }
    },
  });

  const removeSectionMutation = useMutation({
    mutationFn: async (body: { sectionId: string }) => {
      const result = await axios.post(
        `/api/timetable/${timetable.id}/remove`,
        body,
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timetable"] });
    },
    onError: (error) => {
      if (error instanceof AxiosError && error.response) {
        console.log(error.response.data.message);
      }
    },
  });

  const coursesInTimetable = useMemo(() => {
    if (
      courseQueryResult.data === undefined ||
      timetableQueryResult.data === undefined
    )
      return [];

    return courseQueryResult.data
      .filter((e) =>
        timetableQueryResult.data.sections
          .map((x) => x.courseId)
          .includes(e.id),
      )
      .sort();
  }, [courseQueryResult.data, timetableQueryResult.data]);

  const cdcs = useMemo(() => {
    let cdcs: string[];
    const coursesList = [];

    if (
      timetableQueryResult.data === undefined ||
      courseQueryResult.data === undefined
    )
      return [];

    const degree = (
      timetableQueryResult.data.degrees.length === 1
        ? timetableQueryResult.data.degrees[0]
        : timetableQueryResult.data.degrees
            .sort((a, b) => (b as any) - (a as any))
            .join("")
    ) as keyof typeof CDCList;
    const cdcListKey =
      `${timetableQueryResult.data.year}-${timetableQueryResult.data.semester}` as keyof (typeof CDCList)[typeof degree];

    if (degree in CDCList && cdcListKey in CDCList[degree]) {
      cdcs = CDCList[degree][cdcListKey];
    } else {
      return [];
    }

    // Code based on temp frontend
    for (let i = 0; i < cdcs.length; i++) {
      if (cdcs[i].includes("/")) {
        const [depts, codes] = cdcs[i].split(" ");
        const options: string[] = [];
        for (let j = 0; j < depts.split("/").length; j++) {
          options.push(`${depts.split("/")[j]} ${codes.split("/")[j]}`);
        }
        const matchedCourses = courseQueryResult.data.filter((e) =>
          options.includes(e.code),
        );
        if (matchedCourses.length < options.length) {
          coursesList.push({
            id: null,
            type: "warning" as "warning" | "optional",
            warning: `One CDC of ${options.join(", ")} not found`,
          });
        } else {
          coursesList.push({
            id: null,
            type: "optional" as "warning" | "optional",
            options: matchedCourses,
          });
        }
      } else {
        const matchedCourses = courseQueryResult.data.filter(
          (e) => e.code === cdcs[i],
        );
        if (matchedCourses.length === 1) {
          coursesList.push(matchedCourses[0]);
        } else {
          coursesList.push({
            id: null,
            type: "warning" as "warning" | "optional",
            warning: `CDC ${cdcs[i]} not found`,
          });
        }
      }
    }

    return coursesList;
  }, [timetableQueryResult, courseQueryResult]);

  const cdcNotFoundWarning = useMemo(
    () =>
      cdcs.filter((e) => e.id === null && e.type === "warning") as {
        id: null;
        type: "warning";
        warning: string;
      }[],
    [cdcs],
  );

  const missingCDCs = useMemo(() => {
    const missing: {
      id: string;
      code: string;
      name: string;
    }[] = [];
    for (let i = 0; i < cdcs.length; i++) {
      if (cdcs[i].id === null) {
        const option = cdcs[i] as
          | {
              id: null;
              type: "warning";
              warning: string;
            }
          | {
              id: null;
              type: "optional";
              options: {
                id: string;
                code: string;
                name: string;
              }[];
            };
        if (
          option.type === "optional" &&
          !option.options.some((e) =>
            coursesInTimetable
              .map((added) => added.id)
              .includes(e.id as string),
          )
        ) {
          const splitCodes = option.options.map((e) => e.code).join(" (or) ");
          missing.push({
            id: "",
            code: splitCodes,
            name: "",
          });
        }
      } else {
        if (
          !coursesInTimetable.map((e) => e.id).includes(cdcs[i].id as string)
        ) {
          missing.push(
            cdcs[i] as {
              id: string;
              code: string;
              name: string;
            },
          );
        }
      }
    }
    return missing;
  }, [coursesInTimetable, cdcs]);

  const [currentCourseID, setCurrentCourseID] = useState<string | null>(null);
  const currentCourseQueryResult = useQuery({
    queryKey: [currentCourseID],
    queryFn: async () => {
      if (currentCourseID === null) return null;

      const result = await axios.get<z.infer<typeof courseWithSectionsType>>(
        `/api/course/${currentCourseID}`,
      );

      return result.data;
    },
  });

  const uniqueSectionTypes = useMemo(() => {
    if (
      currentCourseQueryResult.data === undefined ||
      currentCourseQueryResult.data === null
    )
      return [];

    return Array.from(
      new Set(
        currentCourseQueryResult.data.sections.map((section) => section.type),
      ),
    ).sort();
  }, [currentCourseQueryResult.data]);

  const [currentSectionType, setCurrentSectionType] =
    useState<z.infer<typeof sectionTypeZodEnum>>("L");

  const [sectionTypeChangeRequest, setSectionTypeChangeRequest] = useState<
    z.infer<typeof sectionTypeZodEnum> | ""
  >("");

  // To make sure currentSectionType's value matches with what section types exist on the current course
  // Also allows section type to be updated after current course is updated, if user wanted to go to a specific section type of a course
  useEffect(() => {
    let newSectionType: z.infer<typeof sectionTypeZodEnum> = "L";

    if (
      sectionTypeChangeRequest !== "" &&
      uniqueSectionTypes.indexOf(sectionTypeChangeRequest) !== -1
    ) {
      newSectionType = sectionTypeChangeRequest;
      setSectionTypeChangeRequest("");
    } else if (uniqueSectionTypes.length > 0) {
      newSectionType =
        uniqueSectionTypes.indexOf(currentSectionType) !== -1
          ? currentSectionType
          : uniqueSectionTypes[0];
    }

    setCurrentSectionType(newSectionType);
  }, [uniqueSectionTypes, sectionTypeChangeRequest, currentSectionType]);

  const [currentTab, setCurrentTab] = useState("CDCs");

  const isOnCourseDetails = useMemo(
    () => currentCourseID !== null,
    [currentCourseID],
  );

  const handleMissingCDCClick = (courseId: string) => {
    setCurrentTab("CDCs");
    if (courseId === "") {
      setCurrentCourseID(null);
    } else {
      setCurrentCourseID(courseId);
    }
  };

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

  if (timetableQueryResult.isFetching && timetableQueryResult.isPending) {
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
      {!isSpinner ? (
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
                {(missingCDCs.length > 0 || cdcNotFoundWarning.length > 0) && (
                  <Tooltip delayDuration={100}>
                    <TooltipTrigger
                      asChild
                      className="hover:bg-slate-700 transition duration-200 ease-in-out"
                    >
                      <div className="p-2 rounded-full">
                        <AlertOctagon className="w-6 h-6 m-1" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="bg-muted text-foreground border-muted-foreground text-md">
                      {missingCDCs.length > 0 && (
                        <div className="flex flex-col">
                          <span>
                            You haven't added all CDCs for this semester to your
                            timetable.
                          </span>
                          <span className="font-bold pt-2">CDCs missing:</span>
                          {missingCDCs.map((e) => (
                            <div className="flex items-center" key={e.id}>
                              <span className="ml-2">{e.code}</span>
                              <Button
                                onClick={() => {
                                  handleMissingCDCClick(e.id);
                                }}
                                className="p-2 w-fit h-fit ml-2 mb-1 bg-transparent hover:bg-slate-700 rounded-full"
                              >
                                <ArrowUpRightFromCircle className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      {cdcNotFoundWarning.length > 0 && (
                        <div className="flex flex-col">
                          <span className="font-bold">
                            Chrono could not find some of your CDCs in the list
                            of courses.
                          </span>
                          <span className="flex">
                            Please report this issue
                            <a
                              href="https://github.com/crux-bphc/chronofactorem-rewrite/issues"
                              className="text-blue-300 flex pl-1"
                            >
                              here
                              <ArrowUpRightFromCircle className="w-4 h-4 ml-1" />
                            </a>
                          </span>
                          <span className="font-bold pt-2">Error List:</span>

                          {cdcNotFoundWarning.map((e) => (
                            <span className="ml-2" key={e.id}>
                              {e.warning}
                            </span>
                          ))}
                        </div>
                      )}
                    </TooltipContent>
                  </Tooltip>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      className="rounded-full p-3"
                      onClick={() => setIsVertical(!isVertical)}
                    >
                      {isVertical ? <GripVertical /> : <GripHorizontal />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Make timetable {isVertical ? "horizontal" : "vertical"}
                    </p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      className="rounded-full p-3"
                      onClick={() => {
                        setIsSpinner(true);
                        setTimeout(() => {
                          copyMutation.mutate();
                          setTimeout(() => {
                            setIsSpinner(false);
                          }, 1000);
                        }, 1000);
                      }}
                    >
                      <Copy />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Copy Timetable</p>
                  </TooltipContent>
                </Tooltip>
                {userQueryResult.data.id ===
                  timetableQueryResult.data.authorId && (
                  <AlertDialog>
                    <Tooltip>
                      <AlertDialogTrigger asChild>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            className="rounded-full p-3 hover:bg-destructive/90 hover:text-destructive-foreground"
                          >
                            <Trash />
                          </Button>
                        </TooltipTrigger>
                      </AlertDialogTrigger>
                      <TooltipContent>
                        <p>Delete Timetable</p>
                      </TooltipContent>
                    </Tooltip>
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

                {timetable.warnings.length !== 0 && (
                  <Tooltip delayDuration={100}>
                    <TooltipTrigger
                      asChild
                      className="duration-200 mr-4 text-md p-2 h-fit hover:bg-orange-800/40 rounded-lg px-4"
                    >
                      <div className="flex items-center">
                        <span className="text-orange-400 pr-4">
                          {timetable.warnings
                            .slice(0, 2)
                            .map((x) => x.replace(":", " "))
                            .map((x, i) => (
                              <div key={x}>
                                <span className="font-bold">{x}</span>
                                {i >= 0 &&
                                  i < timetable.warnings.length - 1 && (
                                    <span>, </span>
                                  )}
                              </div>
                            ))}
                          {timetable.warnings.length > 2 &&
                            ` and ${
                              timetable.warnings.length - 2
                            } other warning${
                              timetable.warnings.length > 3 ? "s" : ""
                            }`}
                        </span>
                        <AlertTriangle className="w-6 h-6 m-1 text-orange-400" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="bg-muted text-foreground border-muted-foreground text-md">
                      {timetable.warnings.map((warning) => (
                        <div className="pb-2" key={warning}>
                          <span className="font-bold">
                            {warning.split(":")[0]} is
                          </span>
                          <div className="flex flex-col pl-4">
                            {warning
                              .split(":")[1]
                              .split("")
                              .map((x) => (
                                <div className="flex items-center" key={x}>
                                  <span>missing a {x} section</span>
                                  <Button
                                    onClick={() => {
                                      setCurrentCourseID(
                                        courses.filter(
                                          (x) =>
                                            x.code === warning.split(":")[0],
                                        )[0].id,
                                      );
                                      setSectionTypeChangeRequest(
                                        uniqueSectionTypes.filter(
                                          (sectionType) => sectionType === x,
                                        )[0],
                                      );
                                    }}
                                    className="p-2 w-fit h-fit ml-2 mb-1 bg-transparent hover:bg-slate-700 rounded-full"
                                  >
                                    <ArrowUpRightFromCircle className="w-4 h-4" />
                                  </Button>
                                </div>
                              ))}
                          </div>
                        </div>
                      ))}
                    </TooltipContent>
                  </Tooltip>
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
            <div className="flex flex-row gap-4">
              <SideMenu
                timetable={timetable}
                isOnEditPage={true}
                allCoursesDetails={courses}
                cdcs={cdcs}
                setCurrentCourseID={setCurrentCourseID}
                currentCourseDetails={currentCourseQueryResult}
                uniqueSectionTypes={uniqueSectionTypes}
                currentSectionType={currentSectionType}
                setCurrentSectionType={setCurrentSectionType}
                addSectionMutation={addSectionMutation}
                removeSectionMutation={removeSectionMutation}
                coursesInTimetable={coursesInTimetable}
                currentTab={currentTab}
                setCurrentTab={setCurrentTab}
                isOnCourseDetails={isOnCourseDetails}
                setSectionTypeChangeRequest={setSectionTypeChangeRequest}
                isScreenshotMode={false}
              />
              <TimetableGrid
                isVertical={isVertical}
                timetableDetailsSections={timetableDetailsSections}
                handleUnitClick={(e) => console.log(e)}
                handleUnitDelete={(e) => {
                  e?.id
                    ? removeSectionMutation.mutate({ sectionId: e?.id })
                    : console.log("error:", e);
                }}
                isOnEditPage={true}
              />
            </div>
          </TooltipProvider>
        </div>
      ) : (
        <div className="flex bg-background h-screen w-full justify-center items-center">
          <Spinner />
        </div>
      )}
    </>
  );
}

export default editTimetableRoute;
