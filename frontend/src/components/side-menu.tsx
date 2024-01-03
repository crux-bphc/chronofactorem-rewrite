import CDCList from "@/../CDCs.json";
import { rootRoute } from "@/main";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Route } from "@tanstack/react-router";
import axios, { AxiosError } from "axios";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import {
  courseType,
  courseWithSectionsType,
  sectionTypeZodEnum,
  timetableWithSectionsType,
} from "../../../lib/src";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

// TEMP, MAKE THIS THE EXPORT FOR THE FINAL VERSION
function SideMenu({
  timetable,
  isOnEditPage,
  courseDetails,
}: {
  timetable: z.infer<typeof timetableWithSectionsType>;
  isOnEditPage: boolean;
  courseDetails: z.infer<typeof courseType>[];
}) {
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
            courseDetails.find((course) => course.id === section.courseId),
          ),
        ),
      ).sort(),
    [courseDetails, timetable.sections],
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
        const matchedCourses = courseDetails.filter((e) =>
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
        const matchedCourses = courseDetails.filter((e) => e.code === cdcs[i]);
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
  }, [timetable, courseDetails]);

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
    },
    onError: (error) => {
      if (error instanceof AxiosError && error.response) {
        console.log(error.response.data.message);
      }
    },
  });

  const sectionClickHandler = (
    section: (typeof timetable.sections)[number],
  ) => {
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
      }
    }
    console.log(timetable.sections);
  };

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
                className="flex flex-col"
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
                      // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
                      <div
                        className={"flex flex-col hover:bg-slate-900"}
                        onClick={() => sectionClickHandler(section)}
                        key={section.number}
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
                      </div>
                    );
                  })}
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    );
  }

  // Default case: user is on view page, and not in course details
  return (
    <div className="bg-secondary w-96">
      <Tabs value={currentTab}>
        <TabsList>
          {isOnEditPage && (
            <TabsTrigger value="CDCs" onClick={() => setCurrentTab("CDCs")}>
              CDCs
            </TabsTrigger>
          )}
          {isOnEditPage && (
            <TabsTrigger value="search" onClick={() => setCurrentTab("search")}>
              Search
            </TabsTrigger>
          )}

          <TabsTrigger
            value="currentCourses"
            onClick={() => setCurrentTab("currentCourses")}
          >
            Courses
          </TabsTrigger>
          <TabsTrigger value="exams" onClick={() => setCurrentTab("exams")}>
            Exams
          </TabsTrigger>
        </TabsList>

        <TabsContent value="CDCs">
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

        <TabsContent value="currentCourses">
          {coursesInTimetable.map((course) => {
            if (course === undefined) return <></>;

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
          })}
        </TabsContent>
        <TabsContent value="exams">
          <span className="text-xl font-bold pl-4 flex mb-2 mt-2">Midsems</span>
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
        >("/api/timetable/1", {
          headers: {
            "Content-Type": "application/json",
          },
        });

        return result.data;
      },
    });

    const courseDetails = useQuery({
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

    if (timetable.data === undefined || courseDetails.data === undefined) {
      return <></>;
    }

    return (
      <div className="flex w-full">
        <SideMenu
          timetable={timetable.data}
          isOnEditPage={true}
          courseDetails={courseDetails.data}
        />
        <div />
      </div>
    );
  },
});
