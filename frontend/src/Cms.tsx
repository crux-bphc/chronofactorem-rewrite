import { queryOptions, useQueries, useQuery } from "@tanstack/react-query";
import { ErrorComponent, Route } from "@tanstack/react-router";
import axios, { AxiosError } from "axios";
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
import { useRef, useState } from "react";
import { z } from "zod";
import {
  courseType,
  courseWithSectionsType,
  sectionType,
  timetableWithSectionsType,
  userWithTimetablesType,
} from "../../lib/src";
import authenticatedRoute from "./AuthenticatedRoute";
import Spinner from "./components/spinner";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { ToastAction } from "./components/ui/toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./components/ui/tooltip";
import { toast, useToast } from "./components/ui/use-toast";
import { router } from "./main";

const fetchUserDetails = async (): Promise<
  z.infer<typeof userWithTimetablesType>
> => {
  const response = await axios.get<z.infer<typeof userWithTimetablesType>>(
    "/api/user",
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
};

const userQueryOptions = queryOptions({
  queryKey: ["user"],
  queryFn: () => fetchUserDetails(),
});

const fetchAllCoursesQueryOptions = () =>
  queryOptions({
    queryKey: ["courses"],
    queryFn: async () => {
      const res = await axios.get<z.infer<typeof courseType>[]>(
        "/api/course?archived=true",
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      return res.data;
    },
  });

const fetchTimetableDetailsQueryOptions = (timetableId: string) =>
  queryOptions({
    queryKey: ["timetable", timetableId],
    queryFn: async () => {
      const res = await axios.get<z.infer<typeof timetableWithSectionsType>>(
        `/api/timetable/${timetableId}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (!res.data.draft) {
        return res.data;
      }
      toast({
        title: "Error",
        description: "CMS Auto-Enroll cannot be used with draft timetables.",
        variant: "destructive",
      });
      router.navigate({
        to: "/edit/$timetableId",
        params: { timetableId: timetableId },
      });
    },
  });

const cmsRoute = new Route({
  getParentRoute: () => authenticatedRoute,
  path: "cms/$timetableId",
  loader: ({ context: { queryClient }, params }) => {
    queryClient
      .ensureQueryData(userQueryOptions)
      .then(() => {
        queryClient.ensureQueryData(fetchAllCoursesQueryOptions());
        queryClient.ensureQueryData(
          fetchTimetableDetailsQueryOptions(params.timetableId)
        );
      })
      .catch((error) => {
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
      });
  },
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
  const defaultExtensionId = "ebjldebpahljhpakgngnandakdbajdnj";
  //you'll need to change the default extension id when you load the unpacked extension
  //loading unpacked extension is necessary to include localhost to externally_connectable matches
  const { timetableId } = cmsRoute.useParams();
  const { toast } = useToast();
  const tokenRef = useRef<HTMLInputElement>(null);
  const cookieRef = useRef<HTMLInputElement>(null);
  const sesskeyRef = useRef<HTMLInputElement>(null);
  const tokenFetchRef = useRef<string | null>(null);
  const cookieFetchRef = useRef<string | null>(null);
  const sesskeyFetchRef = useRef<string | null>(null);
  const [allowEdit, setAllowEdit] = useState(true);
  const [isExtensionInstalled, setIsExtensionInstalled] = useState(
    chrome.runtime !== undefined && chrome.runtime !== null
  );
  const extensionIdRef = useRef<HTMLInputElement | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [enrollingInProgress, setEnrollingInProgress] = useState(false);
  const [enrolledLoaded, setEnrolledLoaded] = useState(true);
  const [enrolledCourses, setEnrolledCourses] = useState(
    [] as {
      id: number;
      displayname: string;
    }[]
  );
  const getCmsDetails = async (extensionID: string) => {
    try {
      if (typeof chrome !== "undefined" && chrome.runtime) {
        setIsExtensionInstalled(true);

        const port = chrome.runtime.connect(extensionID, {
          name: "chronofactorem",
        });
        port.onMessage.addListener((res) => {
          const { webServiceToken, sesskey, cookie } = res;
          if (webServiceToken && sesskey && cookie) {
            tokenFetchRef.current = webServiceToken;
            cookieFetchRef.current = cookie;
            sesskeyFetchRef.current = sesskey;
            console.log(tokenFetchRef.current);
            toast({
              title: "Success",
              description: "Successfully loaded CMS details",
              variant: "default",
            });
          } else {
            toast({
              title: "Error",
              description:
                "Error fetching CMS details. Check if the extension is installed and running.",
              variant: "destructive",
            });
          }
          // enrol with this data
        });
        port.postMessage({ getCMSDetails: true });
        // port.disconnect(); is called by the extension
      } else {
        setIsExtensionInstalled(false);
        toast({
          title: "Error",
          description: "Install the Chrome Extension to use this feature.",
          variant: "destructive",
        });
      }
    } catch (e) {
      toast({
        title: "Error",
        description: "Invalid Extension ID",
        variant: "destructive",
      });
    }
  };
  const fetchCourseDetailsQueryOptions = (
    section: z.infer<typeof sectionType>,
    course: z.infer<typeof courseType>
  ) =>
    queryOptions({
      queryKey: ["course", course.id, "section", section.id],
      queryFn: async () => {
        const res = await axios.get<z.infer<typeof courseWithSectionsType>>(
          `/api/course/${course.id}`,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        const count = (res.data.sections as { type: string }[]).filter(
          (e) => e.type === section.type
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
      },
    });

  const courseDetails = useQuery(fetchAllCoursesQueryOptions());
  const sectionsInTimetable = useQuery(
    fetchTimetableDetailsQueryOptions(timetableId)
  );
  const userQueryResult = useQuery(userQueryOptions);

  const sectionNameList = useQueries({
    queries: (sectionsInTimetable.data?.sections ?? []).map((section) => {
      const course = (courseDetails.data ?? []).filter(
        (course) => course.id === section.courseId
      )[0];
      return fetchCourseDetailsQueryOptions(section, course);
    }),
    combine: (results) => {
      return {
        data: results.map((result) => result.data),
        pending: results.some((result) => result.isPending),
      };
    },
  });

  if (
    userQueryResult.data?.id !== undefined &&
    sectionsInTimetable.data?.authorId !== undefined &&
    userQueryResult.data?.id !== sectionsInTimetable.data?.authorId
  ) {
    toast({
      title: "Error",
      description:
        "CMS Auto-Enroll can only be used with your own timetables. Please make a copy of this timetable if you wish to do so.",
      variant: "destructive",
    });
    router.navigate({
      to: "/view/$timetableId",
      params: { timetableId: timetableId },
    });
  }

  const fetchEnrolledSections = async () => {
    setEnrolledLoaded(false);
    const { data: userData, status: userStatus } = await axios.get(
      `https://cms.bits-hyderabad.ac.in/webservice/rest/server.php?wsfunction=core_webservice_get_site_info&moodlewsrestformat=json&wstoken=${tokenFetchRef.current}`
    );
    if (
      userStatus !== 200 ||
      !("userid" in userData) ||
      typeof userData.userid !== "number"
    ) {
      // console.log(userData);
      toast({
        title: "Warning!",
        description: "Web Service Token is likely incorrect",
        variant: "default",
      });
      setEnrolledLoaded(true);
      return;
    }
    const { data } = await axios.get(
      `https://cms.bits-hyderabad.ac.in/webservice/rest/server.php?wsfunction=core_enrol_get_users_courses&moodlewsrestformat=json&wstoken=${tokenFetchRef.current}&userid=${userData.userid}`
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
            }[]
          );
        } else {
          toast({
            title: "Error",
            description:
              "Error fetching courses from CMS! Check your credentials.",
            variant: "destructive",
          });
        }
      } else {
        setEnrolledCourses([]);
      }
    } else {
      toast({
        title: "Error",
        description: "Error fetching courses from CMS! Check your credentials.",
        variant: "destructive",
      });
    }
    setEnrolledLoaded(true);
  };

  const enrollAllSections = async () => {
    setEnrolledLoaded(false);
    setEnrollingInProgress(true);
    const errors: string[] = [];
    for (let i = 0; i < sectionNameList.data.flat().length; i++) {
      const ele = sectionNameList.data.flat()[i];
      if (ele === undefined) continue;
      const { data: courseData } = await axios.get(
        `https://cms.bits-hyderabad.ac.in/webservice/rest/server.php?wsfunction=core_course_search_courses&moodlewsrestformat=json&wstoken=${
          tokenRef.current?.value
        }&criterianame=search&criteriavalue=${encodeURIComponent(ele)}`
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
        const sectionNameSplit = ele.split(" ");
        if (
          split[split.length - 1] ===
          sectionNameSplit[sectionNameSplit.length - 1]
        ) {
          const { status, data } = await axios.get(
            `https://cms.bits-hyderabad.ac.in/webservice/rest/server.php?wsfunction=enrol_self_enrol_user&moodlewsrestformat=json&wstoken=${tokenRef.current?.value}&courseid=${courseData.courses[0].id}`
          );
          if (status !== 200 || !data.status) {
            errors.push(ele);
            setErrors(errors);
          }
        } else {
          errors.push(ele);
          setErrors(errors);
        }
      } else {
        errors.push(ele);
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
        `https://cms.bits-hyderabad.ac.in/webservice/rest/server.php?wsfunction=core_enrol_get_course_enrolment_methods&moodlewsrestformat=json&wstoken=${tokenRef.current?.value}&courseid=${enrolledCourses[i].id}`
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
        }
      );
      if (status !== 200) {
        toast({
          title: "Error",
          description: `Error when unenrolling from courses: ${JSON.stringify(
            data
          )}`,
          variant: "destructive",
        });
      }
    }
    await fetchEnrolledSections();
  };

  return (
    <>
      <TooltipProvider>
        {sectionsInTimetable.isSuccess && courseDetails.isSuccess ? (
          isExtensionInstalled ? (
            <div className="flex flex-col w-full text-foreground pl-12 sm:pl-24 pt-12 gap-2">
              <div className="flex gap-2 items-center">
                <span className="text-3xl sm:text-5xl font-bold">
                  Load your CMS Details
                </span>
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <Button
                      className="bg-transparent py-3 rounded-full hover:bg-muted text-foreground text-lg font-bold"
                      onClick={() => {
                        if (allowEdit) fetchEnrolledSections();
                        setAllowEdit(!allowEdit);
                      }}
                    >
                      {allowEdit ? <Save /> : <Pencil />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-muted text-foreground border-muted text-md">
                    {allowEdit ? "Save CMS Details" : "Edit CMS Details"}
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex flex-col sm:flex-row w-full gap-6 mt-4">
                <div className="flex flex-col w-fit">
                  <Label htmlFor="webservicetoken" className="mb-1 text-lg">
                    Custom Extension ID
                  </Label>
                  <Input
                    ref={extensionIdRef}
                    id="extensionid"
                    placeholder="leave blank for default"
                    className="text-xl bg-muted ring-muted ring-offset-muted border-muted"
                    disabled={!allowEdit}
                  />
                  <Button
                    className="mt-4 py-4 px-4 hover:bg-muted text-md"
                    onClick={async () => {
                      await getCmsDetails(
                        extensionIdRef.current?.value !== undefined &&
                          extensionIdRef.current?.value !== ""
                          ? extensionIdRef.current?.value
                          : defaultExtensionId
                      );
                    }}
                  >
                    Load
                  </Button>
                </div>

                <div className="flex flex-col sm:flex-row relative h-fit">
                  {allowEdit && (
                    <div className="flex flex-col justify-center items-center absolute bg-background/60 w-full sm:w-3/4 h-full">
                      <span className="text-3xl z-10 font-bold text-foreground/85">
                        Load your CMS details, and hit save to continue
                      </span>{" "}
                    </div>
                  )}
                  <div
                    className={`w-full flex sm:flex-row flex-col gap-0 sm:gap-24 ${
                      allowEdit ? "blur-sm pointer-events-none" : ""
                    }`}
                  >
                    {enrolledLoaded ? (
                      <div className="flex flex-col items-stretch pl-2 text-md py-8 w-full sm:w-1/4">
                        <div className="flex pb-4">
                          <span className="text-3xl font-bold">
                            Enrolled Sections
                          </span>
                          <Tooltip delayDuration={100}>
                            <TooltipTrigger asChild>
                              <Button
                                className="ml-4 bg-transparent py-4 px-4 hover:bg-muted rounded-full w-fit text-blue-50 text-md"
                                onClick={() => fetchEnrolledSections()}
                              >
                                <RotateCw className="w-5 h-5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="bg-muted text-foreground border-muted text-md">
                              Refetch enrolled sections
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip delayDuration={100}>
                            <TooltipTrigger asChild>
                              <Button
                                className="ml-4 bg-transparent py-4 px-4 hover:bg-red-800 rounded-full w-fit text-foreground hover:text-red-50 text-md"
                                onClick={() => unenrollAllSections()}
                              >
                                <Trash className="w-5 h-5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="bg-muted text-foreground border-muted text-md">
                              Unenroll from these sections
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        {enrolledCourses
                          .sort((a, b) =>
                            a.displayname.localeCompare(b.displayname)
                          )
                          .map((section, i) => (
                            <span key={2 * i} className="py-1">
                              {section.displayname
                                .replace(/&lt;/g, "<")
                                .replace(/&gt;/g, ">")
                                .replace(/&quot;/g, '"')
                                .replace(/&#39;/g, "'")
                                .replace(/&amp;/g, "&")}
                            </span>
                          ))}
                        {enrolledCourses.length === 0 && (
                          <>
                            <div className="flex flex-col items-center">
                              <Bird className="text-muted-foreground w-36 h-36 mb-4" />
                              <span className="text-xl text-muted-foreground">
                                Either CMS is empty, or your CMS credentials are
                                wrong, or... CMS is being slow. Try again in a
                                few seconds or check on CMS directly.
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
                    {!sectionNameList.pending ? (
                      <div className="relative flex flex-col ml-8 text-md py-8 h-fit w-full sm:w-1/4">
                        {enrollingInProgress && (
                          <div className="absolute bg-background/80 flex items-center justify-center w-full h-full">
                            <div className="flex flex-col items-center justify-center">
                              <Spinner />
                              <span className="text-muted-foreground pt-4 text-xl">
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
                            <TooltipContent className="bg-muted text-foreground border-muted text-md">
                              Enroll in these sections
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        {sectionNameList.data
                          .flat()
                          .sort()
                          .map((section, i) => (
                            <span className="py-1" key={2 * i}>
                              {section
                                ?.replace(/&lt;/g, "<")
                                .replace(/&gt;/g, ">")
                                .replace(/&quot;/g, '"')
                                .replace(/&#39;/g, "'")
                                .replace(/&amp;/g, "&")}
                            </span>
                          ))}
                        {sectionNameList.data.length === 0 && (
                          <>
                            <div className="flex flex-col items-center">
                              <Bird className="text-muted-foreground w-36 h-36 mb-4" />
                              <span className="text-xl text-muted-foreground">
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
                              <div className="bg-transparent rounded-full hover:bg-muted text-foreground px-4 py-3 ml-2 text-lg font-bold">
                                <HelpCircle />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="w-96 bg-muted text-foreground border-muted text-md">
                              ChronoFactorem wasn't able to enroll in these
                              sections. Either these sections don't exist, or
                              something else wen't wrong. You should try
                              manually enrolling in these sections.
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        {errors.sort().map((section, i) => (
                          <span key={2 * i} className="py-1">
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
            <div className="flex flex-col w-full text-foreground pl-12 sm:pl-24 pt-12 gap-2">
              <div className="flex gap-2 items-center">
                <span className="text-3xl sm:text-5xl font-bold">
                  Enter your CMS Details
                </span>

                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <div className="bg-transparent rounded-full hover:bg-muted text-foreground px-4 py-3 text-lg font-bold">
                      <HelpCircle />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="lg:w-[48rem] md:w-[36rem] w-[24rem] flex space-y-2 flex-col bg-muted text-foreground border-muted text-md">
                    <span>
                      To find these details, follow the instructions in{" "}
                      <a
                        href="https://youtu.be/ls1VsCPRH0I"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 ml-1 inline items-center"
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
                      className="bg-transparent py-3 rounded-full hover:bg-muted text-foreground text-lg font-bold"
                      onClick={() => {
                        if (allowEdit) fetchEnrolledSections();
                        setAllowEdit(!allowEdit);
                      }}
                    >
                      {allowEdit ? <Save /> : <Pencil />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-muted text-foreground border-muted text-md">
                    {allowEdit ? "Save CMS Details" : "Edit CMS Details"}
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex flex-col sm:flex-row w-full gap-6 mt-4">
                <div className="flex flex-col w-fit">
                  <Label htmlFor="webservicetoken" className="mb-1 text-lg">
                    Web Service Token
                  </Label>
                  <Input
                    ref={tokenRef}
                    id="webservicetoken"
                    placeholder="Web Service Token"
                    className="text-xl bg-muted ring-muted ring-offset-muted border-muted"
                    disabled={!allowEdit}
                  />
                </div>
                <div className="flex flex-col w-fit">
                  <Label htmlFor="sessionkey" className="mb-1 text-lg">
                    Session Cookie
                  </Label>
                  <Input
                    ref={cookieRef}
                    id="sessioncookie"
                    placeholder="Session Cookie"
                    className="text-xl bg-muted ring-muted ring-offset-muted border-muted"
                    disabled={!allowEdit}
                  />
                </div>
                <div className="flex flex-col w-fit">
                  <Label htmlFor="sessionkey" className="mb-1 text-lg">
                    Session Key
                  </Label>
                  <Input
                    ref={sesskeyRef}
                    id="sesskey"
                    placeholder="Session Key"
                    className="text-xl bg-muted ring-muted ring-offset-muted border-muted"
                    disabled={!allowEdit}
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row relative h-fit">
                {allowEdit && (
                  <div className="flex flex-col justify-center items-center absolute bg-background/60 w-full sm:w-3/4 h-full">
                    <span className="text-3xl z-10 font-bold text-foreground/85">
                      Enter your CMS details, and hit save to continue
                    </span>{" "}
                    <span>
                      To find these details, follow the instructions in{" "}
                      <a
                        href="https://youtu.be/ls1VsCPRH0I"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 ml-1 inline items-center"
                      >
                        this quick, 1-minute-long video.
                        <ArrowUpRightFromCircle className="inline w-4 h-4 ml-1 mr-1" />
                      </a>
                    </span>
                  </div>
                )}
                <div
                  className={`w-full flex sm:flex-row flex-col gap-0 sm:gap-24 ${
                    allowEdit ? "blur-sm pointer-events-none" : ""
                  }`}
                >
                  {enrolledLoaded ? (
                    <div className="flex flex-col items-stretch pl-2 text-md py-8 w-full sm:w-1/4">
                      <div className="flex pb-4">
                        <span className="text-3xl font-bold">
                          Enrolled Sections
                        </span>
                        <Tooltip delayDuration={100}>
                          <TooltipTrigger asChild>
                            <Button
                              className="ml-4 bg-transparent py-4 px-4 hover:bg-muted rounded-full w-fit text-blue-50 text-md"
                              onClick={() => fetchEnrolledSections()}
                            >
                              <RotateCw className="w-5 h-5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="bg-muted text-foreground border-muted text-md">
                            Refetch enrolled sections
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip delayDuration={100}>
                          <TooltipTrigger asChild>
                            <Button
                              className="ml-4 bg-transparent py-4 px-4 hover:bg-red-800 rounded-full w-fit text-foreground hover:text-red-50 text-md"
                              onClick={() => unenrollAllSections()}
                            >
                              <Trash className="w-5 h-5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="bg-muted text-foreground border-muted text-md">
                            Unenroll from these sections
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      {enrolledCourses
                        .sort((a, b) =>
                          a.displayname.localeCompare(b.displayname)
                        )
                        .map((section, i) => (
                          <span key={2 * i} className="py-1">
                            {section.displayname
                              .replace(/&lt;/g, "<")
                              .replace(/&gt;/g, ">")
                              .replace(/&quot;/g, '"')
                              .replace(/&#39;/g, "'")
                              .replace(/&amp;/g, "&")}
                          </span>
                        ))}
                      {enrolledCourses.length === 0 && (
                        <>
                          <div className="flex flex-col items-center">
                            <Bird className="text-muted-foreground w-36 h-36 mb-4" />
                            <span className="text-xl text-muted-foreground">
                              Either CMS is empty, or your CMS credentials are
                              wrong, or... CMS is being slow. Try again in a few
                              seconds or check on CMS directly.
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
                  {!sectionNameList.pending ? (
                    <div className="relative flex flex-col ml-8 text-md py-8 h-fit w-full sm:w-1/4">
                      {enrollingInProgress && (
                        <div className="absolute bg-background/80 flex items-center justify-center w-full h-full">
                          <div className="flex flex-col items-center justify-center">
                            <Spinner />
                            <span className="text-muted-foreground pt-4 text-xl">
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
                          <TooltipContent className="bg-muted text-foreground border-muted text-md">
                            Enroll in these sections
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      {sectionNameList.data
                        .flat()
                        .sort()
                        .map((section, i) => (
                          <span className="py-1" key={2 * i}>
                            {section
                              ?.replace(/&lt;/g, "<")
                              .replace(/&gt;/g, ">")
                              .replace(/&quot;/g, '"')
                              .replace(/&#39;/g, "'")
                              .replace(/&amp;/g, "&")}
                          </span>
                        ))}
                      {sectionNameList.data.length === 0 && (
                        <>
                          <div className="flex flex-col items-center">
                            <Bird className="text-muted-foreground w-36 h-36 mb-4" />
                            <span className="text-xl text-muted-foreground">
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
                            <div className="bg-transparent rounded-full hover:bg-muted text-foreground px-4 py-3 ml-2 text-lg font-bold">
                              <HelpCircle />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="w-96 bg-muted text-foreground border-muted text-md">
                            ChronoFactorem wasn't able to enroll in these
                            sections. Either these sections don't exist, or
                            something else wen't wrong. You should try manually
                            enrolling in these sections.
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      {errors.sort().map((section, i) => (
                        <span key={2 * i} className="py-1">
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
          )
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
