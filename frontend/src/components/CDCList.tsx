import { ChevronRight, ExternalLink } from "lucide-react";
import { TimetableActionType, useTimetableState } from "@/context";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

type ClashableCourse = {
  code: string;
  midsemStartTime: string | null;
  midsemEndTime: string | null;
  compreStartTime: string | null;
  compreEndTime: string | null;
};

const getClashingExams = (
  course: ClashableCourse,
  examTimes: string[],
): string[] | null => {
  const {
    code,
    midsemStartTime,
    midsemEndTime,
    compreStartTime,
    compreEndTime,
  } = course;

  if (midsemStartTime === null && compreStartTime === null) return null;

  const clashes = examTimes.filter((x) => {
    if (x.split("|")[0] === code) return false;
    return (
      (midsemStartTime !== null &&
        midsemEndTime !== null &&
        x.includes(`${midsemStartTime}|${midsemEndTime}`)) ||
      (compreStartTime !== null &&
        compreEndTime !== null &&
        x.includes(`${compreStartTime}|${compreEndTime}`))
    );
  });

  return clashes.length === 0 ? null : clashes;
};

export const CDCList = () => {
  const {
    state: { cdcs, timetable },
    dispatch,
  } = useTimetableState();

  return (
    <>
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
              onClick={() =>
                dispatch({
                  type: TimetableActionType.SetSelectedCourseAndSection,
                  courseID: course.id,
                  sectionType: null,
                })
              }
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
        .filter((course) => course.id === null && course.type === "optional")
        .map((optionalCourses) => {
          const courseOptions = optionalCourses as {
            id: null;
            options: {
              id: string;
              code: string;
              name: string;
              midsemStartTime: string | null;
              midsemEndTime: string | null;
              compreStartTime: string | null;
              compreEndTime: string | null;
              archived: boolean;
              acadYear: number;
              semester: number;
              createdAt: string;
            }[];
          };
          return (
            <>
              <div className="border-slate-300 dark:border-slate-600 border-t-2 w-full h-fit" />
              {courseOptions.options
                .map((course) => {
                  const clashing = timetable
                    ? getClashingExams(course, timetable.examTimes)
                    : null;
                  return (
                    // biome-ignore lint/a11y/noStaticElementInteractions: need to check if button works styling wise
                    // biome-ignore lint/a11y/useKeyWithClickEvents: need to check if button works styling wise
                    <div
                      key={course.id}
                      onClick={() => {
                        if (clashing) return;
                        dispatch({
                          type: TimetableActionType.SetSelectedCourseAndSection,
                          courseID: course.id,
                          sectionType: null,
                        });
                      }}
                      className={`relative px-4 transition duration-200 ease-in-out cursor-pointer h-14 border-slate-300 dark:border-slate-600 items-center flex justify-between ${
                        clashing
                          ? "text-muted-foreground"
                          : "dark:hover:bg-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {clashing && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 py-1 dark:bg-slate-700/80 bg-slate-300/80 text-secondary-foreground text-center w-full text-sm">
                          <span className="font-medium">
                            Clashing with{" "}
                            {clashing
                              .map((x) => {
                                const [code, exam] = x.split("|");
                                const clashCourse = courseOptions.options.find(
                                  (c) => c.code === code,
                                );
                                return (
                                  <Button
                                    key={x}
                                    type="button"
                                    variant="link"
                                    className="h-auto p-0 has-[>svg]:p-0 font-medium text-blue-700 dark:text-blue-400 [&_svg]:size-3"
                                    onClick={() =>
                                      dispatch({
                                        type: TimetableActionType.SetSelectedCourseAndSection,
                                        courseID: clashCourse?.id ?? "",
                                        sectionType: null,
                                      })
                                    }
                                  >
                                    {`${code}'s ${exam.toLowerCase()}`}
                                    <ExternalLink />
                                  </Button>
                                );
                              })
                              .reduce((prev, curr) => (
                                <span key={curr.props.children}>
                                  {prev}
                                  {", "}
                                  {curr}
                                </span>
                              ))}
                          </span>
                        </div>
                      )}
                      <span className="w-fit text-sm">
                        {course.code}: {course.name}
                      </span>
                      <ChevronRight className="w-6 h-6" />
                    </div>
                  );
                })
                .reduce((prev, curr) => (
                  <>
                    <div className="flex flex-col">
                      {prev}
                      <div className="w-full flex justify-center font-bold text-lg">
                        <Tooltip delayDuration={100}>
                          <TooltipTrigger asChild>
                            <div className="border-2 flex justify-center items-center border-slate-300 dark:border-slate-600 text-secondary-foreground p-1 w-12 h-8 rounded-full z-20 text-center">
                              OR
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="bg-secondary text-secondary-foreground border-slate-300 dark:border-slate-600 text-sm">
                            You have to pick only one of these options
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      {curr}
                    </div>
                  </>
                ))}
              <div className="border-slate-300 dark:border-slate-600 border-t-2 w-full h-fit" />
            </>
          );
        })}
    </>
  );
};

export default CDCList;
