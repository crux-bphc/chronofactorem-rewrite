import {
  UseMutationResult,
  UseQueryResult,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { ArrowLeft, Bird, ChevronRight, HelpCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { useDebounce } from "usehooks-ts";
import { z } from "zod";
import {
  courseType,
  courseWithSectionsType,
  sectionTypeList,
  sectionTypeZodEnum,
  timetableWithSectionsType,
} from "../../../lib/src";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export function SideMenu({
  timetable,
  isOnEditPage,
  allCoursesDetails,
  cdcs,
  setCurrentCourseID,
  currentCourseDetails,
  uniqueSectionTypes,
  currentSectionType,
  setCurrentSectionType,
  addSectionMutation,
  removeSectionMutation,
  coursesInTimetable,
  currentTab,
  setCurrentTab,
  isOnCourseDetails,
  setSectionTypeChangeRequest,
  isScreenshotMode,
}: {
  timetable: z.infer<typeof timetableWithSectionsType>;
  isOnEditPage: boolean;
  allCoursesDetails: z.infer<typeof courseType>[];
  cdcs: any[];
  setCurrentCourseID: React.Dispatch<React.SetStateAction<string | null>>;
  currentCourseDetails: UseQueryResult<
    z.infer<typeof courseWithSectionsType> | null | undefined
  >;
  uniqueSectionTypes: sectionTypeList;
  currentSectionType: z.infer<typeof sectionTypeZodEnum>;
  setCurrentSectionType: React.Dispatch<
    React.SetStateAction<z.infer<typeof sectionTypeZodEnum>>
  >;
  addSectionMutation: UseMutationResult<
    any,
    Error,
    {
      sectionId: string;
    },
    unknown
  >;
  removeSectionMutation: UseMutationResult<
    any,
    Error,
    {
      sectionId: string;
    },
    unknown
  >;
  coursesInTimetable: z.infer<typeof courseType>[];
  currentTab: string;
  setCurrentTab: React.Dispatch<React.SetStateAction<string>>;
  isOnCourseDetails: boolean;
  setSectionTypeChangeRequest: React.Dispatch<
    React.SetStateAction<"" | "L" | "P" | "T">
  >;
  isScreenshotMode: boolean;
}) {
  const queryClient = useQueryClient();

  // STATE MANAGEMENT SECTION
  // Some of these may have to be moved up to the parent later
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
      <div className="bg-secondary w-[26rem] h-[calc(100vh-13rem)]">
        <div className="flex items-center py-2 w-full">
          <Button
            variant={"ghost"}
            className="rounded-full flex ml-2 px-2 mr-2 items-center hover:bg-secondary-foreground/10"
            onClick={() => {
              setCurrentCourseID(null);
            }}
          >
            <ArrowLeft />
          </Button>
          <span className="font-semibold text-md h-full">
            {currentCourseDetails.data?.code}:{" "}
            {` ${currentCourseDetails.data?.name}`}
          </span>
        </div>
        <Tabs value={currentSectionType} className=" h-[calc(100vh-20rem)]">
          <TabsList className="w-full mb-2">
            {uniqueSectionTypes.map((sectionType) => {
              return (
                <TabsTrigger
                  value={sectionType}
                  onClick={() => {
                    setCurrentSectionType(sectionType);
                    setSectionTypeChangeRequest("");
                  }}
                  key={sectionType}
                  className="text-xl font-bold w-full"
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
                className="h-[calc(100vh-20rem)]"
                key={sectionType}
              >
                <div className="flex flex-col gap-2 p-0 m-0 px-2 overflow-y-scroll w-[26rem] h-[calc(100vh-20rem)]">
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
                    .map((section, i) => {
                      return (
                        <span
                          className="w-full relative flex flex-col"
                          key={2 * i}
                        >
                          <Button
                            variant={"secondary"}
                            className={`flex flex-col w-full h-fit border-slate-300 border-2 dark:border-slate-600/60 ${
                              timetable.sections.find(
                                (e) => e.id === section.id,
                              )
                                ? "dark:bg-slate-700 bg-slate-300 hover:dark:bg-slate-700 hover:bg-slate-300"
                                : "bg-transparent"
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
                            <div className="flex items-center h-full w-full gap-4">
                              <span className="">
                                {section.type}
                                {section.number}
                              </span>
                              <div className="flex flex-col h-full min-h-16 justify-between text-left py-2">
                                <span className="font-semibold whitespace-pre-wrap text-md">
                                  {section.instructors.join(", ")}
                                </span>
                                <span className="font-normal whitespace-pre-wrap">
                                  {section.roomTime
                                    .map((e) =>
                                      e.split(":").splice(1).join(" "),
                                    )
                                    .join(", ")}
                                </span>
                              </div>
                            </div>
                          </Button>
                          {section.clashing &&
                            !timetable.sections.find(
                              (e) => e.id === section.id,
                            ) && (
                              <div className="absolute left-0 top-8 bg-slate-700/80 text-center w-full">
                                <span className="text-slate-100 font-bold text-md">
                                  Clashing with {section.clashing}
                                </span>
                              </div>
                            )}
                        </span>
                      );
                    })}
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    );
  }

  // user is not in course details
  return (
    <div className="bg-secondary w-[26rem]">
      <Tabs
        value={isScreenshotMode ? "exams" : currentTab}
        className="py-2 h-[calc(100vh-16rem)]"
      >
        <TabsList>
          {isOnEditPage && (
            <TabsTrigger
              className="text-lg font-bold"
              value="CDCs"
              onClick={() => setCurrentTab("CDCs")}
            >
              CDCs
            </TabsTrigger>
          )}
          {isOnEditPage && (
            <TabsTrigger
              className="text-lg font-bold"
              value="search"
              onClick={() => setCurrentTab("search")}
            >
              Search
            </TabsTrigger>
          )}

          <TabsTrigger
            className="text-lg font-bold"
            value="currentCourses"
            onClick={() => setCurrentTab("currentCourses")}
          >
            Courses
          </TabsTrigger>
          <TabsTrigger
            className="text-lg font-bold"
            value="exams"
            onClick={() => setCurrentTab("exams")}
          >
            Exams
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="CDCs"
          className="border-muted-foreground/80 w-[26rem] data-[state=inactive]:h-0 flex flex-col h-full overflow-y-scroll"
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
                    setCurrentCourseID(course.id);
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
                      setCurrentCourseID(course.id);
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

        <TabsContent
          value="currentCourses"
          className="flex h-full data-[state=inactive]:h-0 w-[26rem] overflow-y-scroll flex-col px-2 gap-2"
        >
          {coursesInTimetable.map((course) => {
            if (course === undefined) return <></>;
            if (!isOnEditPage) {
              return (
                <>
                  <div className="flex flex-col border-muted-foreground/30 rounded-md pl-3 py-2 border">
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
                  setCurrentCourseID(course.id);
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

        <TabsContent
          value="exams"
          className="flex data-[state=inactive]:h-0 w-[26rem] flex-col h-full overflow-y-scroll"
        >
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

        <TabsContent
          value="search"
          className="data-[state=inactive]:h-0 w-[26rem] h-full"
        >
          <div className="px-4 pb-4">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Courses"
              className="text-md p-2"
            />
          </div>

          <div className="h-[calc(100%-3rem)] overflow-y-scroll">
            {courseSearchResults.map((course) => (
              // TODO - deal with this biome rule
              // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
              <div
                onClick={() => {
                  if (!course.clashing) {
                    setCurrentCourseID(course.id);
                  }
                }}
                key={course.id}
                className={`relative px-4 transition flex-col pt-4 flex duration-200 ease-in-out border-t-2 border-muted-foreground/20 ${
                  course.clashing
                    ? "text-muted-foreground"
                    : "cursor-pointer bg-secondary dark:hover:bg-slate-700 hover:bg-slate-200"
                }`}
              >
                {course.clashing && (
                  <div className="absolute left-0 top-8 py-1 dark:bg-slate-700/80 bg-slate-300/80 text-secondary-foreground text-center w-full">
                    <span className="font-medium text-md">
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
                          <div className="inline bg-transparent w-fit rounded-full dark:hover:bg-slate-800/80 text-secondary-foreground hover:bg-slate-300/80 p-1 transition duration-200 ease-in-out ml-2 text-sm font-bold">
                            <HelpCircle className="inline h-4 w-4" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="w-96 bg-secondary text-secondary-foreground border-slate-300 dark:border-slate-600 text-md">
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
                          <div className="inline bg-transparent w-fit rounded-full dark:hover:bg-slate-800/80 text-secondary-foreground hover:bg-slate-300/80 p-1 transition duration-200 ease-in-out ml-2 text-sm font-bold">
                            <HelpCircle className="inline h-4 w-4" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="w-96 bg-secondary text-secondary-foreground border-slate-300 dark:border-slate-600 text-md">
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
              <div className="flex flex-col justify-center pt-4 items-center bg-secondary h-full rounded-xl">
                <Bird className="text-muted-foreground w-36 h-36 mb-4" />
                <span className="text-muted-foreground text-2xl">
                  No results
                </span>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
