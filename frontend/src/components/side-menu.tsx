import { rootRoute } from "@/main";
import { useQuery } from "@tanstack/react-query";
import { Route } from "@tanstack/react-router";
import axios from "axios";
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
                    return (
                      <div className="flex flex-col" key={section.number}>
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

  if (isOnEditPage) {
    return <></>;
  }

  // Default case: user is on view page, and not in course details
  return (
    <div className="bg-secondary w-96">
      <Tabs value={currentTab}>
        <TabsList>
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
          isOnEditPage={false}
          courseDetails={courseDetails.data}
        />
        <div />
      </div>
    );
  },
});
