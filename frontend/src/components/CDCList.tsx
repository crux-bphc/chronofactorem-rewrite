import { ChevronRight } from "lucide-react";
import { TimetableActionType, useTimetableState } from "@/context";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export const CDCList = () => {
  const {
    state: { cdcs },
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
            }[];
          };
          return (
            <>
              <div className="border-slate-300 dark:border-slate-600 border-t-2 w-full h-fit" />
              {courseOptions.options
                .map((course) => (
                  // biome-ignore lint/a11y/noStaticElementInteractions: need to check if button works styling wise
                  // biome-ignore lint/a11y/useKeyWithClickEvents: need to check if button works styling wise
                  <div
                    key={course.id}
                    onClick={() =>
                      dispatch({
                        type: TimetableActionType.SetSelectedCourseAndSection,
                        courseID: course.id,
                        sectionType: null,
                      })
                    }
                    className="px-4 dark:hover:bg-slate-700 hover:bg-slate-200 transition duration-200 ease-in-out cursor-pointer h-14 border-slate-300 dark:border-slate-600 items-center flex justify-between"
                  >
                    <span className="w-fit text-sm">
                      {course.code}: {course.name}
                    </span>
                    <ChevronRight className="w-6 h-6" />
                  </div>
                ))
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
