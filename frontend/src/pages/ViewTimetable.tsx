import { useQuery } from "@tanstack/react-query";
import { Route } from "@tanstack/react-router";
import axios from "axios";
import { toPng } from "html-to-image";
import type { courseWithSectionsType, sectionTypeZodEnum } from "lib";
import { Menu } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { z } from "zod";
import CDCList from "@/../CDCs.json";
import ReportIssue from "@/components/ReportIssue";
import ReportIssueToastAction from "@/components/ReportIssueToastAction";
import TimetableHeader from "@/components/TimetableHeader";
import handleNotFound from "@/data-access/errors/handleNotFound";
import handleLoginRedirect from "@/data-access/errors/redirectToLogin";
import toastHandler from "@/data-access/errors/toastHandler";
import useCourses, { courseQueryOptions } from "@/data-access/useCourses";
import useTimetable, {
  timetableQueryOptions,
} from "@/data-access/useTimetable";
import useUser from "@/data-access/useUser";
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
import { TooltipProvider } from "../components/ui/tooltip";
import { toast, useToast } from "../components/ui/use-toast";

const viewTimetableRoute = new Route({
  getParentRoute: () => authenticatedRoute,
  path: "view/$timetableId",
  beforeLoad: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(courseQueryOptions).catch((error: Error) => {
      handleLoginRedirect(error);
      throw error;
    }),
  loader: ({ context: { queryClient }, params: { timetableId } }) =>
    queryClient
      .ensureQueryData(timetableQueryOptions(timetableId))
      .catch((error: Error) => {
        handleLoginRedirect(error);
        handleNotFound(error);
        throw error;
      }),
  component: ViewTimetable,
  notFoundComponent: NotFound,
  errorComponent: ({ error }) => {
    const { toast } = useToast();
    toastHandler(error, toast);
  },
});

function ViewTimetable() {
  const [isVertical, setIsVertical] = useState(false);
  const [isSpinner, setIsSpinner] = useState(false);

  const { timetableId } = viewTimetableRoute.useParams();

  const {
    data: timetable,
    isLoading: isTimetableLoading,
    isError: isTimetableError,
    error: timetableError,
  } = useTimetable(timetableId);
  const {
    data: courses,
    isError: isCoursesError,
    isLoading: isCoursesLoading,
    error: coursesError,
  } = useCourses();
  const {
    data: user,
    isLoading: isUserLoading,
    isError: isUserError,
    error: userError,
  } = useUser();
  const screenshotContentRef = useRef<HTMLDivElement>(null);
  const [isScreenshotMode, setIsScreenshotMode] = useState(false);
  const [screenIsLarge, setScreenIsLarge] = useState(
    window.matchMedia("(min-width: 1024px)").matches,
  );

  useEffect(() => {
    window
      .matchMedia("(min-width: 1024px)")
      .addEventListener("change", (e) => setScreenIsLarge(e.matches));
  }, []);

  const generateScreenshot = useCallback(() => {
    const screenShotContent = screenshotContentRef.current;
    setIsScreenshotMode(true);
    const isLarge = screenIsLarge;
    setScreenIsLarge(true);

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
        setScreenIsLarge(isLarge);
      })
      .catch((err: Error) => {
        setIsScreenshotMode(false);
        setScreenIsLarge(isLarge);

        console.error("something went wrong with image generation", err);
        toast({
          title: "Error",
          description: err.message,
          variant: "destructive",
          action: <ReportIssueToastAction />,
        });
      });
  }, [isVertical, screenIsLarge]);

  const coursesInTimetable = useMemo(() => {
    if (courses === undefined || timetable === undefined) return [];

    return courses
      .filter((e) => timetable?.sections.map((x) => x.courseId).includes(e.id))
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

  const [currentTab, setCurrentTab] = useState("currentCourses");

  if (isCoursesLoading || isUserLoading) {
    return <span>Loading...</span>;
  }

  if (isCoursesError || courses === undefined) {
    return (
      <ReportIssue
        error={JSON.stringify(
          coursesError
            ? coursesError.message
            : "course query result is undefined",
        )}
      />
    );
  }

  if (isTimetableLoading) {
    return <span>Loading...</span>;
  }

  if (isTimetableError || timetable === undefined) {
    return (
      <ReportIssue
        error={JSON.stringify(
          timetableError
            ? timetableError.message
            : "timetable query result is undefined",
        )}
      />
    );
  }

  if (isUserError || user === undefined) {
    return (
      <ReportIssue
        error={JSON.stringify(
          userError ? userError.message : "user query result is undefined",
        )}
      />
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

  const SideBar = (
    <SideMenu
      timetable={timetable}
      isOnEditPage={false}
      allCoursesDetails={courses}
      cdcs={cdcs}
      setCurrentCourseID={setCurrentCourseID}
      coursesInTimetable={coursesInTimetable}
      currentTab={currentTab}
      setCurrentTab={setCurrentTab}
      isScreenshotMode={isScreenshotMode}
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
              isOnEditPage={false}
              screenIsLarge={screenIsLarge}
              isVertical={isVertical}
              generateScreenshot={generateScreenshot}
              setIsVertical={setIsVertical}
              setIsSpinner={setIsSpinner}
              cdcs={cdcs}
              setCurrentCourseID={setCurrentCourseID}
              coursesInTimetable={coursesInTimetable}
              setCurrentTab={setCurrentTab}
              setSectionTypeChangeRequest={setCurrentSectionType}
            />
            {/* the bg-background here is necessary so the generated image has the background in it */}
            <div
              className="flex flex-row gap-4 bg-background h-full relative"
              ref={screenshotContentRef}
            >
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
                handleUnitClick={(e) => console.log(e)}
                handleUnitDelete={(e) => console.log("DELETING", e)}
                isOnEditPage={false}
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

export default viewTimetableRoute;
