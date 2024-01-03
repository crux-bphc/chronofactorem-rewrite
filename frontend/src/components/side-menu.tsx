import CDCList from "@/../CDCs.json";
import { rootRoute } from "@/main";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Route } from "@tanstack/react-router";
import axios, { AxiosError } from "axios";
import { ArrowLeft, Bird, ChevronRight, HelpCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useDebounce } from "usehooks-ts";
import { z } from "zod";
import {
  courseType,
  courseWithSectionsType,
  sectionTypeZodEnum,
  timetableWithSectionsType,
} from "../../../lib/src";
import { NavBar } from "./navbar";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Input } from "./ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

// TEMP, MAKE THIS THE EXPORT FOR THE FINAL VERSION
function SideMenu({
  timetable,
  isOnEditPage,
  allCoursesDetails,
}: {
  timetable: z.infer<typeof timetableWithSectionsType>;
  isOnEditPage: boolean;
  allCoursesDetails: z.infer<typeof courseType>[];
}) {
  const queryClient = useQueryClient();

  // STATE MANAGEMENT SECTION
  // Some of these may have to be moved up to the parent later
  const [currentTab, setCurrentTab] = useState(() => {
    return isOnEditPage ? "CDCs" : "currentCourses";
  });

  const coursesInTimetable = useMemo(
    () =>
      Array.from(
        new Set(
          timetable.sections.map((section) =>
            allCoursesDetails.find((course) => course.id === section.courseId),
          ),
        ),
      ).sort(),
    [allCoursesDetails, timetable.sections],
  );

  const [currentCourseID, setCurrentCourse] = useState<string | null>(null);
  const isOnCourseDetails = useMemo(
    () => currentCourseID !== null,
    [currentCourseID],
  );

  const cdcs = useMemo(() => {
    let cdcs: string[];
    const courses: any[] = [];

    const degree = (
      timetable.degrees.length === 1
        ? timetable.degrees[0]
        : timetable.degrees.sort((a, b) => (b as any) - (a as any)).join("")
    ) as keyof typeof CDCList;
    const cdcListKey =
      `${timetable.year}-${timetable.semester}` as keyof (typeof CDCList)[typeof degree];

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
        const matchedCourses = allCoursesDetails.filter((e) =>
          options.includes(e.code),
        );
        if (matchedCourses.length < options.length) {
          courses.push({
            id: null,
            type: "warning" as "warning" | "optional",
            warning: `One CDC of ${options.join(", ")} not found`,
          });
        } else {
          courses.push({
            id: null,
            type: "optional" as "warning" | "optional",
            options: matchedCourses,
          });
        }
      } else {
        const matchedCourses = allCoursesDetails.filter(
          (e) => e.code === cdcs[i],
        );
        if (matchedCourses.length === 1) {
          courses.push(matchedCourses[0]);
        } else {
          courses.push({
            id: null,
            type: "warning" as "warning" | "optional",
            warning: `CDC ${cdcs[i]} not found`,
          });
        }
      }
    }

    return courses;
  }, [timetable, allCoursesDetails]);

  const currentCourseDetails = useQuery({
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
      currentCourseDetails.data === undefined ||
      currentCourseDetails.data === null
    )
      return [];

    return Array.from(
      new Set(
        currentCourseDetails.data.sections.map((section) => section.type),
      ),
    ).sort();
  }, [currentCourseDetails.data]);

  const [currentSectionType, setCurrentSectionType] =
    useState<z.infer<typeof sectionTypeZodEnum>>("L");

  // To make sure currentSectionType's value matches with what section types exist on the current course
  useEffect(() => {
    setCurrentSectionType(
      uniqueSectionTypes.length ? uniqueSectionTypes[0] : "L",
    );
  }, [uniqueSectionTypes]);

  const timings = useMemo(() => {
    const m = new Map<string, string>();
    for (const section of timetable.sections) {
      for (const roomTime of section.roomTime) {
        m.set(
          roomTime.charAt(roomTime.lastIndexOf(":") - 1) +
            roomTime.substring(roomTime.lastIndexOf(":") + 1),
          `${section.roomTime[0].substring(
            0,
            section.roomTime[0].indexOf(":"),
          )} ${section.type}${section.number}`,
        );
      }
    }
    return m;
  }, [timetable]);

  // might need to be extracted to parent
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
      // TODO - update grid
      console.log("poggers");
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
      // TODO - update grid
      console.log("poggers");
      queryClient.invalidateQueries({ queryKey: ["timetable"] });
    },
    onError: (error) => {
      if (error instanceof AxiosError && error.response) {
        console.log(error.response.data.message);
      }
    },
  });

  const swapCourseMutation = useMutation({
    mutationFn: async ({
      removeId,
      addId,
    }: { removeId: string; addId: string }) => {
      await axios.post(
        `/api/timetable/${timetable.id}/remove`,
        { sectionId: removeId },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      const result2 = await axios.post(
        `/api/timetable/${timetable.id}/add`,
        { sectionId: addId },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      return result2.data;
    },
    onSuccess: () => {
      // TODO - update grid
      console.log("poggers");
      queryClient.invalidateQueries({ queryKey: ["timetable"] });
    },
    onError: (error) => {
      if (error instanceof AxiosError && error.response) {
        console.log(error.response.data.message);
      }
    },
  });

  const handleSectionClick = (section: (typeof timetable.sections)[number]) => {
    if (timetable.sections.find((e) => e.id === section.id)) {
      removeSectionMutation.mutate({ sectionId: section.id });
    } else {
      const other = timetable.sections.find(
        (e) => e.type === section.type && e.courseId === section.courseId,
      );
      if (other !== undefined) {
        swapCourseMutation.mutate({
          removeId: other.id,
          addId: section.id,
        });
      } else {
        addSectionMutation.mutate({ sectionId: section.id });
        if (
          uniqueSectionTypes.indexOf(currentSectionType) <
          uniqueSectionTypes.length - 1
        ) {
          setCurrentSectionType(
            uniqueSectionTypes[
              uniqueSectionTypes.indexOf(currentSectionType) + 1
            ],
          );
        }
      }
    }
    console.log(timetable.sections);
  };

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce<string>(searchTerm, 500);
  const courseSearchResults = useMemo(
    () =>
      (debouncedSearchTerm === ""
        ? allCoursesDetails
        : allCoursesDetails.filter((e) =>
            `${e.code}: ${e.name}`
              .toLowerCase()
              .includes(debouncedSearchTerm.toLowerCase()),
          )
      ).map((e) => {
        const withClash = e as unknown as {
          id: string;
          code: string;
          name: string;
          midsemStartTime: string | null;
          midsemEndTime: string | null;
          compreStartTime: string | null;
          compreEndTime: string | null;
          clashing: null | string[];
        };
        if (e.midsemStartTime === null && e.compreStartTime === null) {
          withClash.clashing = null;
          return withClash;
        }
        if (e.midsemStartTime === null && e.compreStartTime !== null) {
          const clashes = timetable.examTimes.filter((x) => {
            if (x.split("|")[0] === e.code) return false;
            return x.includes(
              `${withClash.compreStartTime}|${withClash.compreEndTime}`,
            );
          });
          withClash.clashing = clashes.length === 0 ? null : clashes;
          return withClash;
        }
        if (e.midsemStartTime !== null && e.compreStartTime === null) {
          const clashes = timetable.examTimes.filter((x) => {
            if (x.split("|")[0] === e.code) return false;
            return x.includes(
              `${withClash.midsemStartTime}|${withClash.midsemStartTime}`,
            );
          });
          withClash.clashing = clashes.length === 0 ? null : clashes;
          return withClash;
        }
        const clashes = timetable.examTimes.filter((x) => {
          if (x.split("|")[0] === e.code) return false;
          return (
            x.includes(
              `${withClash.midsemStartTime}|${withClash.midsemEndTime}`,
            ) ||
            x.includes(
              `${withClash.compreStartTime}|${withClash.compreEndTime}`,
            )
          );
        });
        withClash.clashing = clashes.length === 0 ? null : clashes;
        return withClash;
      }),
    [allCoursesDetails, debouncedSearchTerm, timetable.examTimes],
  );

  // JSX SECTION
  if (isOnCourseDetails) {
    return (
      <div className="bg-secondary w-96">
        <Button
          className="rounded-full flex ml-2 px-2 mb-2 mr-2 items-center"
          onClick={() => {
            setCurrentCourse(null);
          }}
        >
          <ArrowLeft />
        </Button>
        <Tabs value={currentSectionType}>
          <TabsList>
            {uniqueSectionTypes.map((sectionType) => {
              return (
                <TabsTrigger
                  value={sectionType}
                  onClick={() => setCurrentSectionType(sectionType)}
                  key={sectionType}
                >
                  {sectionType}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {uniqueSectionTypes.map((sectionType) => {
            return (
              <TabsContent
                value={sectionType}
                className="flex flex-col gap-4"
                key={sectionType}
              >
                {currentCourseDetails.data?.sections
                  .filter((section) => section.type === sectionType)
                  .map((section) => {
                    const tm = section.roomTime
                      .map(
                        (e) =>
                          e.charAt(e.lastIndexOf(":") - 1) +
                          e.substring(e.lastIndexOf(":") + 1),
                      )
                      .find((e) => timings.has(e));

                    return {
                      ...section,
                      clashing: timings.get(tm ?? ""),
                    };
                  })
                  .map((section) => {
                    return (
                      <Button
                        className={`flex flex-col h-fit hover:brightness-150 ${
                          timetable.sections.find((e) => e.id === section.id)
                            ? "bg-primary"
                            : "bg-primary brightness-75"
                        }`}
                        onClick={() => handleSectionClick(section)}
                        key={section.number}
                        disabled={
                          !isOnEditPage ||
                          (section.clashing !== undefined &&
                            !timetable.sections.find(
                              (e) => e.id === section.id,
                            ))
                        }
                      >
                        <span>
                          {currentCourseDetails.data?.code} {section.type}
                          {section.number}
                        </span>
                        <span>{section.instructors}</span>
                        <span>
                          {Array.from(
                            new Set(
                              section.roomTime.map((e) => e.split(":")[1]),
                            ),
                          )}
                        </span>
                        {section.clashing &&
                          !timetable.sections.find(
                            (e) => e.id === section.id,
                          ) && (
                            <span className="text-red-500">
                              Clashing with {section.clashing}
                            </span>
                          )}
                      </Button>
                    );
                  })}
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    );
  }

  // user is not in course details
  return (
    <div className="bg-secondary min-w-96">
      <Tabs value={currentTab} className="py-2">
        <TabsList>
          {isOnEditPage && (
            <TabsTrigger
              className="text-xl font-bold"
              value="CDCs"
              onClick={() => setCurrentTab("CDCs")}
            >
              CDCs
            </TabsTrigger>
          )}
          {isOnEditPage && (
            <TabsTrigger
              className="text-xl font-bold"
              value="search"
              onClick={() => setCurrentTab("search")}
            >
              Search
            </TabsTrigger>
          )}

          <TabsTrigger
            className="text-xl font-bold"
            value="currentCourses"
            onClick={() => setCurrentTab("currentCourses")}
          >
            Courses
          </TabsTrigger>
          <TabsTrigger
            className="text-xl font-bold"
            value="exams"
            onClick={() => setCurrentTab("exams")}
          >
            Exams
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="CDCs"
          className="border-muted-foreground/80 flex flex-col"
        >
          {cdcs
            .filter((course) => course.id !== null)
            .map((nonOptionalCourses) => {
              const course = nonOptionalCourses as {
                id: string;
                code: string;
                name: string;
              };
              return (
                <Button
                  variant={"secondary"}
                  onClick={() => {
                    setCurrentCourse(course.id);
                  }}
                  key={course.id}
                  className="rounded-none text-left py-8 bg-secondary dark:hover:bg-slate-700 hover:bg-slate-200"
                >
                  <div className="flex justify-between w-full items-center">
                    <span>{`${course.code}: ${course.name}`}</span>
                    <ChevronRight />
                  </div>
                </Button>
              );
            })}
          {cdcs
            .filter(
              (course) => course.id === null && course.type === "optional",
            )
            .map((optionalCourses) => {
              const courseOptions = optionalCourses as {
                id: null;
                options: {
                  id: string;
                  code: string;
                  name: string;
                }[];
              };

              return courseOptions.options.map((course) => {
                return (
                  <Button
                    onClick={() => {
                      setCurrentCourse(course.id);
                    }}
                    key={course.id}
                  >
                    <div className="flex">
                      <span>{`${course.code}: ${course.name}`}</span>
                      <ChevronRight />
                    </div>
                  </Button>
                );
              });
            })}
        </TabsContent>

        <TabsContent value="currentCourses" className="flex flex-col">
          {coursesInTimetable.map((course) => {
            if (course === undefined) return <></>;
            if (!isOnEditPage) {
              return (
                <>
                  <div className="flex flex-col border-muted-foreground/70 rounded-md pl-3 py-2 border">
                    <div className="flex">
                      <span className="font-bold">{`${course.code}`}</span>
                      <span>{`: ${course.name}`}</span>
                    </div>
                    <span className="text-muted-foreground">{`${timetable.sections
                      .filter((section) => section.courseId === course.id)
                      .map((section) => `${section.type}${section.number}`)
                      .sort()
                      .join(", ")}`}</span>
                  </div>
                </>
              );
            }
            return (
              <Button
                variant={"secondary"}
                onClick={() => {
                  setCurrentCourse(course.id);
                }}
                key={course.id}
                className="rounded-none text-left py-8 bg-secondary dark:hover:bg-slate-700 hover:bg-slate-200"
              >
                <div className="flex justify-between w-full items-center">
                  <span>{`${course.code}: ${course.name}`}</span>
                  <ChevronRight />
                </div>
              </Button>
            );
          })}
        </TabsContent>

        <TabsContent value="exams" className="flex flex-col">
          <span className="text-xl font-bold pl-4 flex mb-2">Midsems</span>
          {timetable.examTimes
            .filter((e) => e.includes("|MIDSEM|"))
            .map((e) => {
              return {
                code: e.split("|")[0],
                midsemStartTime: e.split("|")[2],
                midsemEndTime: e.split("|")[3],
              };
            })
            .sort(
              (a, b) =>
                Date.parse(a.midsemStartTime) - Date.parse(b.midsemStartTime),
            )
            .map((course) => (
              <div
                className="px-4 ease-in-out py-2 items-center flex"
                key={course.code}
              >
                <span className="w-fit text-sm font-bold pr-4">
                  {course.code}
                </span>
                <span className="text-sm">
                  {`${new Date(course.midsemStartTime).toLocaleDateString(
                    "en-US",
                    {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "numeric",
                      hour12: true,
                    },
                  )} — ${new Date(course.midsemEndTime).toLocaleDateString(
                    "en-US",
                    {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "numeric",
                      hour12: true,
                    },
                  )}`}
                </span>
              </div>
            ))}
          <span className="text-xl font-bold pl-4 flex mb-2 pt-4 mt-4 border-t-2">
            Compres
          </span>
          {timetable.examTimes
            .filter((e) => e.includes("|COMPRE|"))
            .map((e) => {
              return {
                code: e.split("|")[0],
                compreStartTime: e.split("|")[2],
                compreEndTime: e.split("|")[3],
              };
            })
            .sort(
              (a, b) =>
                Date.parse(a.compreStartTime) - Date.parse(b.compreEndTime),
            )
            .map((course) => (
              <div
                className="px-4 ease-in-out py-2 items-center flex"
                key={course.code}
              >
                <span className="w-fit text-sm font-bold pr-4">
                  {course.code}
                </span>
                <span className="text-sm">
                  {`${new Date(course.compreStartTime).toLocaleDateString(
                    "en-US",
                    {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "numeric",
                      hour12: true,
                    },
                  )} — ${new Date(course.compreEndTime).toLocaleDateString(
                    "en-US",
                    {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "numeric",
                      hour12: true,
                    },
                  )}`}
                </span>
              </div>
            ))}
        </TabsContent>

        <TabsContent value="search">
          <div className="px-4">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Courses"
              className="text-md p-2"
            />
          </div>

          <div className="">
            {courseSearchResults.map((course) => (
              // TODO - deal with this biome rule
              // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
              <div
                onClick={() => {
                  if (!course.clashing) {
                    setCurrentCourse(course.id);
                  }
                }}
                key={course.id}
                className={`relative px-4 transition flex-col pt-4 flex duration-200 ease-in-out border-t-2 border-slate-700/60 ${
                  course.clashing
                    ? "text-slate-400"
                    : "cursor-pointer hover:bg-slate-700 text-slate-50"
                }`}
              >
                {course.clashing && (
                  <div className="absolute left-0 top-8 py-1 bg-slate-900/80 text-center w-full">
                    <span className="text-slate-200 font-medium text-md">
                      Clashing with{" "}
                      {course.clashing
                        .map((x) => {
                          const [code, exam] = x.split("|");
                          return `${code}'s ${exam.toLowerCase()}`;
                        })
                        .join(", ")}
                    </span>
                  </div>
                )}

                <div className="w-full flex justify-between items-center">
                  <span className="w-fit text-sm">
                    {course.code}: {course.name}
                  </span>
                  <ChevronRight className="w-6 h-6" />
                </div>

                <div>
                  <span className="pl-4 py-1 text-sm font-bold">Midsem</span>
                  <span className="pl-4 py-1 text-sm">
                    {`${
                      course.midsemStartTime
                        ? new Date(course.midsemStartTime).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "numeric",
                              hour12: true,
                            },
                          )
                        : "N/A"
                    } — ${
                      course.midsemEndTime
                        ? new Date(course.midsemEndTime).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "numeric",
                              hour12: true,
                            },
                          )
                        : "N/A"
                    }`}
                    {course.midsemStartTime === null && (
                      <Tooltip delayDuration={100}>
                        <TooltipTrigger asChild>
                          <div className="inline bg-transparent w-fit rounded-full hover:bg-slate-800/80 text-slate-100 p-1 transition duration-200 ease-in-out ml-2 text-sm font-bold">
                            <HelpCircle className="inline h-4 w-4" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="w-96 bg-slate-700 text-slate-50 border-slate-600 text-md">
                          Timetable Division hasn't published the midsem dates
                          for this course. Either there is no midsem exam, or
                          they haven't decided it yet. We recommend checking
                          with your professor.
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </span>
                </div>
                <div className="pb-4">
                  <span className="pl-4 py-1 text-sm font-bold">Compre</span>
                  <span className="pl-4 py-1 text-sm">
                    {`${
                      course.compreStartTime
                        ? new Date(course.compreStartTime).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "numeric",
                              hour12: true,
                            },
                          )
                        : "N/A"
                    } — ${
                      course.compreEndTime
                        ? new Date(course.compreEndTime).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "numeric",
                              hour12: true,
                            },
                          )
                        : "N/A"
                    }`}
                    {course.compreStartTime === null && (
                      <Tooltip delayDuration={100}>
                        <TooltipTrigger asChild>
                          <div className="inline bg-transparent w-fit rounded-full hover:bg-slate-800/80 text-slate-100 p-1 transition duration-200 ease-in-out ml-2 text-sm font-bold">
                            <HelpCircle className="inline h-4 w-4" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="w-96 bg-slate-700 text-slate-50 border-slate-600 text-md">
                          Timetable Division hasn't published the compre dates
                          for this course. Either there is no compre exam, or
                          they haven't decided it yet. We recommend checking
                          with your professor.
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </span>
                </div>
              </div>
            ))}
            {courseSearchResults.length === 0 && (
              <div className="flex flex-col justify-center items-center bg-slate-800/40 h-full rounded-xl">
                <Bird className="text-slate-300 w-36 h-36 mb-4" />
                <span className="text-slate-300 text-2xl">No results</span>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// TEMP FOR TESTING, REMOVE FOR FINAL VERSION
export const sideMenuTestingRoute = new Route({
  getParentRoute: () => rootRoute,
  path: "/testSideMenu",
  component: () => {
    const timetable = useQuery({
      queryKey: ["timetable"],
      queryFn: async () => {
        const result = await axios.get<
          z.infer<typeof timetableWithSectionsType>
          // Replace with your own tt id
        >("/api/timetable/ecKL", {
          headers: {
            "Content-Type": "application/json",
          },
        });

        return result.data;
      },
    });

    const allCoursesDetails = useQuery({
      queryKey: ["courses"],
      queryFn: async () => {
        const result = await axios.get<z.infer<typeof courseType>[]>(
          "/api/course",
          {
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        return result.data;
      },
    });

    if (timetable.data === undefined || allCoursesDetails.data === undefined) {
      return <></>;
    }

    return (
      <TooltipProvider>
        <NavBar />
        <div className="flex w-full">
          <SideMenu
            timetable={timetable.data}
            isOnEditPage={true}
            allCoursesDetails={allCoursesDetails.data}
          />
          <div />
        </div>
      </TooltipProvider>
    );
  },
});
