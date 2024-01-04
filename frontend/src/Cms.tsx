import axios, { AxiosError } from "axios";
import { z } from "zod";
import { userWithTimetablesType } from "../../lib/src";
import { queryOptions } from "@tanstack/react-query";
import { ErrorComponent, Route } from "@tanstack/react-router";
import { ToastAction } from "./components/ui/toast";
import { router } from "./main";
import authenticatedRoute from "./AuthenticatedRoute";
import { useToast } from "./components/ui/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./components/ui/tooltip";
import {
  ArrowUpRightFromCircle,
  Bird,
  HelpCircle,
  Pencil,
  Plus,
  RotateCw,
  Save,
  Trash,
} from "lucide-react";
import { Button } from "./components/ui/button";
import { Label } from "./components/ui/label";
import { Input } from "./components/ui/input";
import { useEffect, useRef, useState } from "react";
import Spinner from "./components/spinner";

const fetchUserDetails = async (): Promise<
  z.infer<typeof userWithTimetablesType>
> => {
  const response = await axios.get<z.infer<typeof userWithTimetablesType>>(
    "/api/user",
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
  return response.data;
};

const userQueryOptions = queryOptions({
  queryKey: ["user"],
  queryFn: () => fetchUserDetails(),
});

const cmsRoute = new Route({
  getParentRoute: () => authenticatedRoute,
  path: "cms/$timetableId",
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(userQueryOptions).catch((error) => {
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
  component: Cms,
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

function Cms() {
  const { timetableId } = cmsRoute.useParams();
  const tokenRef = useRef<HTMLInputElement>(null);
  const cookieRef = useRef<HTMLInputElement>(null);
  const sesskeyRef = useRef<HTMLInputElement>(null);
  const [allowEdit, setAllowEdit] = useState(true);
  const [coursesLoaded, setCoursesLoaded] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [sectionNameListLoaded, setSectionNameListLoaded] = useState(false);
  const [sectionNameList, setSectionNameList] = useState<string[]>([]);
  const [enrollingInProgress, setEnrollingInProgress] = useState(false);
  const [enrolledLoaded, setEnrolledLoaded] = useState(true);
  const [enrolledCourses, setEnrolledCourses] = useState(
    [] as {
      id: number;
      displayname: string;
    }[],
  );
  const [sectionsInTimetable, setSectionsInTimetable] = useState<
    {
      courseId: string;
      type: string;
      roomTime: string[];
      number: number;
    }[]
  >([]);
  const [courseDetails, setCourseDetails] = useState<
    {
      id: string;
      code: string;
      name: string;
      midsemStartTime: string | null;
      midsemEndTime: string | null;
      compreStartTime: string | null;
      compreEndTime: string | null;
    }[]
  >([]);

  useEffect(() => {
    const computeFinalSectionNames = async () => {
      const sectionNames = (
        await Promise.all(
          sectionsInTimetable.map(async (section) => {
            const course = courseDetails.filter(
              (course) => course.id === section.courseId,
            )[0];
            const { data, status } = await axios.get(
              `/api/course/${course.id}`,
              {
                headers: {
                  "Content-Type": "application/json",
                },
              },
            );
            if (status === 200) {
              const count = (data.sections as { type: string }[]).filter(
                (e) => e.type === section.type,
              ).length;
              return count > 1
                ? [
                    `${section.roomTime[0].split(":")[0]} ${course.name} ${
                      section.type
                    }`,
                    `${section.roomTime[0].split(":")[0]} ${course.name} ${
                      section.type
                    }${section.number}`,
                  ]
                : `${section.roomTime[0].split(":")[0]} ${course.name} ${
                    section.type
                  }${section.number}`;
            }
            if (status === 404) {
              alert(`Error: ${data.message}`);
              return [];
            }
            if (status === 500) {
              alert(`Server error: ${data.message}`);
              return [];
            }
            alert(`Server error: ${data}`);
            return [];
          }),
        )
      ).flat();
      setSectionNameList(sectionNames);
      setSectionNameListLoaded(true);
    };
    computeFinalSectionNames();
  }, [courseDetails, sectionsInTimetable]);

  useEffect(() => {
    const fetchCourseDetails = async () => {
      const { data, status } = await axios.get("/api/course", {
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (status === 200) {
        setCoursesLoaded(true);
        setCourseDetails(data);
      } else if (status === 404) {
        alert(`Error: ${data.message}`);
      } else if (status === 500) {
        alert(`Server error: ${data.message}`);
      } else {
        alert(`Server error: ${data}`);
      }
    };
    const fetchTimetableDetails = async () => {
      const { data, status } = await axios.get(
        `/api/timetable/${timetableId}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      if (status === 200) {
        if (!data.draft && !data.archived) {
          setIsLoaded(true);
          setSectionsInTimetable(data.sections);
        } else {
          alert(
            "CMS Auto-Enroll cannot be used with draft or archived timetables.",
          );
          router.navigate({ to: "/" });
        }
      } else if (status === 404) {
        alert(`Error: ${data.message}`);
      } else if (status === 500) {
        alert(`Server error: ${data.message}`);
      } else {
        alert(`Server error: ${data}`);
      }
    };
    fetchCourseDetails();
    fetchTimetableDetails();
  }, [timetableId]);

  const fetchEnrolledSections = async () => {
    setEnrolledLoaded(false);
    const { data: userData, status: userStatus } = await axios.get(
      `https://cms.bits-hyderabad.ac.in/webservice/rest/server.php?wsfunction=core_webservice_get_site_info&moodlewsrestformat=json&wstoken=${tokenRef.current?.value}`,
    );
    if (
      userStatus !== 200 ||
      !("userid" in userData) ||
      typeof userData.userid !== "number"
    ) {
      console.log(userData);
      alert("Web Service Token is likely incorrect");
      setEnrolledLoaded(true);
      return;
    }
    const { data } = await axios.get(
      `https://cms.bits-hyderabad.ac.in/webservice/rest/server.php?wsfunction=core_enrol_get_users_courses&moodlewsrestformat=json&wstoken=${tokenRef.current?.value}&userid=${userData.userid}`,
    );
    if (Array.isArray(data)) {
      if (data.length > 0) {
        if (
          "id" in data[0] &&
          typeof data[0].id === "number" &&
          "displayname" in data[0] &&
          typeof data[0].displayname === "string"
        ) {
          setEnrolledCourses(
            data as {
              id: number;
              displayname: string;
            }[],
          );
        } else {
          alert("Error fetching courses from CMS! Check your credentials.");
        }
      } else {
        setEnrolledCourses([]);
      }
    } else {
      alert("Error fetching courses from CMS! Check your credentials.");
    }
    setEnrolledLoaded(true);
  };

  const enrollAllSections = async () => {
    setEnrolledLoaded(false);
    setEnrollingInProgress(true);
    const errors: string[] = [];
    for (let i = 0; i < sectionNameList.length; i++) {
      const { data: courseData } = await axios.get(
        `https://cms.bits-hyderabad.ac.in/webservice/rest/server.php?wsfunction=core_course_search_courses&moodlewsrestformat=json&wstoken=${
          tokenRef.current?.value
        }&criterianame=search&criteriavalue=${encodeURIComponent(
          sectionNameList[i],
        )}`,
      );
      if (
        "courses" in courseData &&
        Array.isArray(courseData.courses) &&
        courseData.courses.length > 0 &&
        "displayname" in courseData.courses[0] &&
        typeof courseData.courses[0].displayname === "string" &&
        "id" in courseData.courses[0] &&
        typeof courseData.courses[0].id === "number"
      ) {
        const split = courseData.courses[0].displayname.split(" ");
        const sectionNameSplit = sectionNameList[i].split(" ");
        if (
          split[split.length - 1] ===
          sectionNameSplit[sectionNameSplit.length - 1]
        ) {
          const { status, data } = await axios.get(
            `https://cms.bits-hyderabad.ac.in/webservice/rest/server.php?wsfunction=enrol_self_enrol_user&moodlewsrestformat=json&wstoken=${tokenRef.current?.value}&courseid=${courseData.courses[0].id}`,
          );
          if (status !== 200 || !data.status) {
            errors.push(sectionNameList[i]);
            setErrors(errors);
          }
        } else {
          errors.push(sectionNameList[i]);
          setErrors(errors);
        }
      } else {
        errors.push(sectionNameList[i]);
        setErrors(errors);
      }
    }
    setEnrollingInProgress(false);
    await fetchEnrolledSections();
  };

  const unenrollAllSections = async () => {
    setEnrolledLoaded(false);
    for (let i = 0; i < enrolledCourses.length; i++) {
      const res = await axios.get(
        `https://cms.bits-hyderabad.ac.in/webservice/rest/server.php?wsfunction=core_enrol_get_course_enrolment_methods&moodlewsrestformat=json&wstoken=${tokenRef.current?.value}&courseid=${enrolledCourses[i].id}`,
      );
      const enrollmentInstance = res.data;
      const { data, status } = await axios.post(
        "/api/user/unenroll",
        {
          enrollID: enrollmentInstance[0].id,
          sesskey: sesskeyRef.current?.value,
          cookie: cookieRef.current?.value,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      if (status !== 200) {
        alert(`Error when unenrolling from courses: ${JSON.stringify(data)}`);
      }
    }
    await fetchEnrolledSections();
  };

  return (
    <>
      <TooltipProvider>
        {isLoaded && coursesLoaded ? (
          <div className="flex pl-24 text-slate-50 pt-12 w-full">
            <div className="flex flex-col w-full">
              <div className="flex items-center">
                <span className="text-5xl font-bold">
                  Enter your CMS Details
                </span>
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <div className="bg-transparent rounded-full hover:bg-slate-800 text-slate-100 px-4 py-3 ml-2 text-lg font-bold">
                      <HelpCircle />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="w-96 flex space-y-2 flex-col bg-slate-800 text-slate-50 border-slate-700 text-md">
                    <span>
                      To find these details, follow the instructions in{" "}
                      <a
                        href="https://youtu.be/ls1VsCPRH0I"
                        className="text-blue-400 ml-1 inline items-center"
                      >
                        this quick, 1-minute-long video.
                        <ArrowUpRightFromCircle className="inline w-4 h-4 ml-1 mr-1" />
                      </a>
                    </span>
                    <span>
                      To automate enrolling and unenrolling, ChronoFactorem
                      needs these details to perform these actions on your
                      behalf.
                    </span>
                    <span>
                      ChronoFactorem does not collect, transmit, retain, or
                      store any of these details. These details do not leave
                      this webpage. All of ChronoFactorem's code is written, and
                      deployed publicly, and can be viewed and verified by
                      anyone that wishes to.
                    </span>
                  </TooltipContent>
                </Tooltip>
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <Button
                      className="bg-transparent py-6 rounded-full hover:bg-slate-800 text-slate-100 mx-2 text-lg font-bold"
                      onClick={() => {
                        // if (allowEdit) fetchEnrolledSections();
                        setAllowEdit(!allowEdit);
                      }}
                    >
                      {allowEdit ? <Save /> : <Pencil />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-slate-800 text-slate-50 border-slate-700 text-md">
                    {allowEdit ? "Save CMS Details" : "Edit CMS Details"}
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex w-full space-x-4">
                <div className="flex flex-col w-1/5">
                  <Label
                    htmlFor="webservicetoken"
                    className="mt-4 mb-1 text-lg"
                  >
                    Web Service Token
                  </Label>
                  <Input
                    ref={tokenRef}
                    id="webservicetoken"
                    placeholder="Web Service Token"
                    className="text-xl bg-slate-800 ring-slate-700 ring-offset-slate-700 border-slate-700"
                    disabled={!allowEdit}
                  />
                </div>
                <div className="flex flex-col w-1/5">
                  <Label htmlFor="sessionkey" className="mt-4 mb-1 text-lg">
                    Session Cookie
                  </Label>
                  <Input
                    ref={cookieRef}
                    id="sessioncookie"
                    placeholder="Session Cookie"
                    className="text-xl bg-slate-800 ring-slate-700 ring-offset-slate-700 border-slate-700"
                    disabled={!allowEdit}
                  />
                </div>
                <div className="flex flex-col w-1/5">
                  <Label htmlFor="sessionkey" className="mt-4 mb-1 text-lg">
                    Session Key
                  </Label>
                  <Input
                    ref={sesskeyRef}
                    id="sesskey"
                    placeholder="Session Key"
                    className="text-xl bg-slate-800 ring-slate-700 ring-offset-slate-700 border-slate-700"
                    disabled={!allowEdit}
                  />
                </div>
              </div>
              <div className="flex relative h-fit">
                {allowEdit && (
                  <div className="flex justify-center items-center absolute bg-slate-950/60 w-3/4 h-full">
                    <span className="text-3xl z-10 font-bold">
                      Enter your CMS details, and hit save to continue
                    </span>
                  </div>
                )}
                <div
                  className={`w-full flex ${
                    allowEdit ? "blur-sm pointer-events-none" : ""
                  }`}
                >
                  {enrolledLoaded ? (
                    <div className="flex flex-col pl-2 text-md py-8 w-1/4">
                      <div className="flex pb-4">
                        <span className="text-3xl font-bold">
                          Enrolled Sections
                        </span>
                        <Tooltip delayDuration={100}>
                          <TooltipTrigger asChild>
                            <Button
                              className="ml-4 bg-transparent py-4 px-4 hover:bg-slate-800 rounded-full w-fit text-blue-50 text-md"
                              onClick={() => fetchEnrolledSections()}
                            >
                              <RotateCw className="w-5 h-5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="bg-slate-800 text-slate-50 border-slate-700 text-md">
                            Refetch Enrolled Sections
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip delayDuration={100}>
                          <TooltipTrigger asChild>
                            <Button
                              className="ml-4 bg-transparent py-4 px-4 hover:bg-red-800 rounded-full w-fit text-slate-50 hover:text-red-50 text-md"
                              onClick={() => unenrollAllSections()}
                            >
                              <Trash className="w-5 h-5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="bg-slate-800 text-slate-50 border-slate-700 text-md">
                            Unenrol from these Sections
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      {enrolledCourses
                        .sort((a, b) =>
                          a.displayname.localeCompare(b.displayname),
                        )
                        .map((section) => (
                          <>
                            <span className="py-1">
                              {section.displayname
                                .replace(/&lt;/g, "<")
                                .replace(/&gt;/g, ">")
                                .replace(/&quot;/g, '"')
                                .replace(/&#39;/g, "'")
                                .replace(/&amp;/g, "&")}
                            </span>
                          </>
                        ))}
                      {enrolledCourses.length === 0 && (
                        <>
                          <div className="flex flex-col items-center">
                            <Bird className="text-slate-300 w-36 h-36 mb-4" />
                            <span className="text-xl text-slate-200">
                              CMS is empty, or your CMS credentials are wrong,
                              or... CMS is being slow. Try again in a few
                              seconds, or check on CMS directly.
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center w-1/4 pt-48">
                      <Spinner />
                    </div>
                  )}
                  {sectionNameListLoaded ? (
                    <div className="relative flex flex-col ml-8 text-md py-8 h-fit w-1/4">
                      {enrollingInProgress && (
                        <div className="absolute bg-slate-950/80 flex items-center justify-center w-full h-full">
                          <div className="flex flex-col items-center justify-center">
                            <Spinner />
                            <span className="text-slate-300 pt-4 text-xl">
                              Enrolling in sections...
                            </span>
                          </div>
                        </div>
                      )}
                      <div className="flex pb-4">
                        <span className="text-3xl font-bold">
                          Sections to enroll in
                        </span>
                        <Tooltip delayDuration={100}>
                          <TooltipTrigger asChild>
                            <Button
                              className="ml-4 bg-transparent py-4 px-4 hover:bg-green-800 rounded-full w-fit text-green-50 text-md"
                              onClick={() => enrollAllSections()}
                            >
                              <Plus className="w-5 h-5" strokeWidth={2.5} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="bg-slate-800 text-slate-50 border-slate-700 text-md">
                            Enroll in these sections
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      {sectionNameList.sort().map((section) => (
                        <span className="py-1">
                          {section
                            .replace(/&lt;/g, "<")
                            .replace(/&gt;/g, ">")
                            .replace(/&quot;/g, '"')
                            .replace(/&#39;/g, "'")
                            .replace(/&amp;/g, "&")}
                        </span>
                      ))}
                      {sectionNameList.length === 0 && (
                        <>
                          <div className="flex flex-col items-center">
                            <Bird className="text-slate-300 w-36 h-36 mb-4" />
                            <span className="text-xl text-slate-200">
                              No sections to enroll in
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center w-1/4 pt-48">
                      <Spinner />
                    </div>
                  )}

                  {errors.length > 0 && (
                    <div className="flex flex-col ml-8 text-md py-8 w-1/4">
                      <div className="flex pb-4 items-center">
                        <span className="text-3xl font-bold">Errors</span>
                        <Tooltip delayDuration={100}>
                          <TooltipTrigger asChild>
                            <div className="bg-transparent rounded-full hover:bg-slate-800 text-slate-100 px-4 py-3 ml-2 text-lg font-bold">
                              <HelpCircle />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="w-96 bg-slate-800 text-slate-50 border-slate-700 text-md">
                            ChronoFactorem wasn't able to enroll in these
                            sections. Either these sections don't exist, or
                            something else wen't wrong. You should try manually
                            enrolling in these sections.
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      {errors.sort().map((section) => (
                        <span className="py-1">
                          {section
                            .replace(/&lt;/g, "<")
                            .replace(/&gt;/g, ">")
                            .replace(/&quot;/g, '"')
                            .replace(/&#39;/g, "'")
                            .replace(/&amp;/g, "&")}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex justify-center items-center">
            <Spinner />
          </div>
        )}
      </TooltipProvider>
    </>
  );
}

export default cmsRoute;
