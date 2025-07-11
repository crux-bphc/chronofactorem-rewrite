import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Route } from "@tanstack/react-router";
import axios from "axios";
import type { sectionTypeZodEnum } from "lib";
import { Menu } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { z } from "zod";
import CDCList from "@/../CDCs.json";
import CourseDetailsMenu from "@/components/CourseDetailsMenu";
import ReportIssue from "@/components/ReportIssue";
import TimetableHeader from "@/components/TimetableHeader";
import { TooltipProvider } from "@/components/ui/tooltip";
import handleNotFound from "@/data-access/errors/handleNotFound";
import handleLoginRedirect from "@/data-access/errors/redirectToLogin";
import toastHandler from "@/data-access/errors/toastHandler";
import useCourse from "@/data-access/useCourse";
import useCourses, { courseQueryOptions } from "@/data-access/useCourses";
import useTimetable, {
  timetableQueryOptions,
} from "@/data-access/useTimetable";
import useUser, { userQueryOptions } from "@/data-access/useUser";
import authenticatedRoute from "../AuthenticatedRoute";
import NotFound from "../components/NotFound";
import { SideMenu } from "../components/SideMenu";
import Spinner from "../components/Spinner";
import { TimetableGrid } from "../components/TimetableGrid";
import { Button } from "../components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import { toast, useToast } from "../components/ui/use-toast";
import { router } from "../main";

const editTimetableRoute = new Route({
  getParentRoute: () => authenticatedRoute,
  path: "edit/$timetableId",
  loader: ({ context: { queryClient }, params: { timetableId } }) => {
    queryClient.ensureQueryData(userQueryOptions);
    queryClient.ensureQueryData(courseQueryOptions);
    queryClient.ensureQueryData(timetableQueryOptions(timetableId));
  },
  component: EditTimetable,
  notFoundComponent: NotFound,
  errorComponent: ({ error }) => {
    const { toast } = useToast();
    handleLoginRedirect(error);
    handleNotFound(error);
    toastHandler(error, toast);
  },
});

function EditTimetable() {
  const [isVertical, setIsVertical] = useState(false);
  const [isSpinner, setIsSpinner] = useState(false);

  const { timetableId } = editTimetableRoute.useParams();

  const { data: user, isLoading: isUserLoading } = useUser();
  const { data: courses, isLoading: isCoursesLoading } = useCourses();
  const { data: timetable, isLoading: isTimetableLoading } =
    useTimetable(timetableId);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isTimetableLoading) return;
    if (timetable?.draft) return;
    toast({
      title: "Error",
      description: "Non-draft timetables cannot be edited",
      variant: "destructive",
    });
    router.navigate({
      to: "/view/$timetableId",
      params: { timetableId: timetableId },
    });
  }, [timetable?.draft, timetableId, isTimetableLoading]);

  useEffect(() => {
    if (isTimetableLoading || isUserLoading) return;
    if (user?.id === timetable?.authorId) return;
    toast({
      title: "Error",
      description: "You are not authorized to edit this timetable",
      variant: "destructive",
    });
    router.navigate({
      to: "/",
    });
  }, [isTimetableLoading, isUserLoading, timetable?.authorId, user?.id]);

  const addSectionMutation = useMutation({
    mutationFn: async (body: { sectionId: string }) => {
      const result = await axios.post(
        `/api/timetable/${timetable?.id}/add`,
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
      queryClient.invalidateQueries({ queryKey: ["timetable", timetable?.id] });
    },
    onError: (error) => toastHandler(error, toast),
  });

  const removeSectionMutation = useMutation({
    mutationFn: async (body: { sectionId: string }) => {
      const result = await axios.post(
        `/api/timetable/${timetable?.id}/remove`,
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
      queryClient.invalidateQueries({ queryKey: ["timetable", timetable?.id] });
    },
    onError: (error) => toastHandler(error, toast),
  });

  const coursesInTimetable = useMemo(() => {
    if (courses === undefined || timetable === undefined) return [];

    return courses
      .filter((e) => timetable.sections.map((x) => x.courseId).includes(e.id))
      .sort();
  }, [courses, timetable]);

  const cdcs = useMemo(() => {
    let cdcs: string[];
    const coursesList = [];

    if (timetable === undefined || courses === undefined) return [];

    const degree = (
      timetable.degrees.length === 1
        ? timetable.degrees[0]
        : timetable.degrees.sort().reverse().join("")
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
        const matchedCourses = courses.filter((e) => options.includes(e.code));
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
        const matchedCourses = courses.filter((e) => e.code === cdcs[i]);
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
  }, [timetable, courses]);

  const [currentCourseID, setCurrentCourseID] = useState<string | null>(null);
  const { data: currentCourse } = useCourse(currentCourseID);

  const uniqueSectionTypes = useMemo(() => {
    if (currentCourse === undefined || currentCourse === null) return [];

    return Array.from(
      new Set(currentCourse.sections.map((section) => section.type)),
    ).sort();
  }, [currentCourse]);

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

  const [screenIsLarge, setScreenIsLarge] = useState(
    window.matchMedia("(min-width: 1024px)").matches,
  );

  useEffect(() => {
    window
      .matchMedia("(min-width: 1024px)")
      .addEventListener("change", (e) => setScreenIsLarge(e.matches));
  }, []);

  if (isCoursesLoading || isUserLoading || isTimetableLoading) {
    return <span>Loading...</span>;
  }
  if (timetable === undefined || courses === undefined || user === undefined) {
    return <ReportIssue error={"Error fetching queries"} />;
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

  const SideBar = isOnCourseDetails ? (
    <CourseDetailsMenu
      timetable={timetable}
      setCurrentCourseID={setCurrentCourseID}
      currentCourse={currentCourse}
      uniqueSectionTypes={uniqueSectionTypes}
      currentSectionType={currentSectionType}
      setCurrentSectionType={setCurrentSectionType}
      addSectionMutation={addSectionMutation}
      removeSectionMutation={removeSectionMutation}
      setSectionTypeChangeRequest={setSectionTypeChangeRequest}
    />
  ) : (
    <SideMenu
      timetable={timetable}
      isOnEditPage={true}
      allCoursesDetails={courses}
      cdcs={cdcs}
      setCurrentCourseID={setCurrentCourseID}
      coursesInTimetable={coursesInTimetable}
      currentTab={currentTab}
      setCurrentTab={setCurrentTab}
      isScreenshotMode={false}
    />
  );

  return (
    <>
      {!isSpinner ? (
        <div className="grow h-[calc(100vh-12rem)]">
          <TooltipProvider>
            <TimetableHeader
              user={user}
              courses={courses}
              timetable={timetable}
              isOnEditPage={true}
              screenIsLarge={screenIsLarge}
              isVertical={isVertical}
              generateScreenshot={() => null}
              setIsVertical={setIsVertical}
              setIsSpinner={setIsSpinner}
              cdcs={cdcs}
              setCurrentCourseID={setCurrentCourseID}
              coursesInTimetable={coursesInTimetable}
              setCurrentTab={setCurrentTab}
              setSectionTypeChangeRequest={setCurrentSectionType}
            />
            <div className="flex flex-row gap-4 sm:h-full relative">
              {screenIsLarge ? (
                SideBar
              ) : (
                <Popover>
                  <PopoverTrigger className="absolute left-2 top-[-1rem]">
                    <Button variant={"default"} className="rounded-full">
                      <Menu />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent>{SideBar}</PopoverContent>
                </Popover>
              )}
              <TimetableGrid
                isVertical={screenIsLarge ? isVertical : true}
                timetableDetailsSections={timetableDetailsSections}
                handleUnitClick={(e, event) => {
                  if (e?.courseId && e?.type) {
                    if (event.detail === 1) {
                      setCurrentCourseID(
                        courses.filter((x) => x.code === e?.courseId)[0].id,
                      );
                      setSectionTypeChangeRequest(e?.type as "L" | "P" | "T");
                    } else if (event.detail >= 2) {
                      e?.id
                        ? removeSectionMutation.mutate({ sectionId: e?.id })
                        : console.log("error:", e);
                    }
                  } else {
                    console.log("error:", e);
                  }
                }}
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
        <div className="flex flex-col text-muted-foreground gap-8 xl:text-xl lg:text-lg md:text-md text-sm bg-background h-[calc(100dvh-5rem)] justify-center w-full items-center">
          <Spinner />
          <span>Please wait while we copy over your timetable...</span>
        </div>
      )}
    </>
  );
}

export default editTimetableRoute;
