import type { sectionType, sectionTypeEnum } from "lib";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { useMemo } from "react";
import type z from "zod";
import { TimetableActionType, useTimetableState } from "@/context";
import {
  useAddRemoveTimetableSection,
  useSwapTimetableSections,
} from "@/data-access/hooks/useTimetableSectionAction";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

const CourseDetailsMenu = () => {
  const {
    state: { timetable, course, uniqueSectionTypes, currentSectionType },
    dispatch,
  } = useTimetableState();
  const { mutate: sectionAction } = useAddRemoveTimetableSection(timetable?.id);
  const { mutate: swapSections } = useSwapTimetableSections(timetable?.id);

  const handleSectionClick = (section: z.infer<typeof sectionType>) => {
    if (timetable === undefined || currentSectionType === null) return;
    if (timetable.sections.find((e) => e.id === section.id)) {
      sectionAction({ sectionId: section.id, action: "remove" });
      return;
    }
    const other = timetable.sections.find(
      (e) => e.type === section.type && e.courseId === section.courseId,
    );
    if (other !== undefined) {
      swapSections({ sectionId: other.id, newSectionId: section.id });
    } else {
      sectionAction({ sectionId: section.id, action: "add" });
      if (
        uniqueSectionTypes.indexOf(currentSectionType) <
        uniqueSectionTypes.length - 1
      ) {
        dispatch({
          type: TimetableActionType.SetSelectedSectionType,
          sectionType:
            uniqueSectionTypes[
              uniqueSectionTypes.indexOf(currentSectionType) + 1
            ],
        });
      }
    }
  };

  interface ClashingSection {
    tm: string;
    courseId: string;
    sectionType: sectionTypeEnum;
  }
  const timings: Map<string, ClashingSection> = useMemo(() => {
    if (timetable === undefined) return new Map();
    const m = new Map<string, ClashingSection>();
    for (const section of timetable.sections) {
      for (const roomTime of section.roomTime) {
        m.set(
          roomTime.charAt(roomTime.lastIndexOf(":") - 1) +
            roomTime.substring(roomTime.lastIndexOf(":") + 1),
          {
            tm: `${section.roomTime[0].substring(
              0,
              section.roomTime[0].indexOf(":"),
            )} ${section.type}${section.number}`,
            courseId: section.courseId,
            sectionType: section.type,
          },
        );
      }
    }
    return m;
  }, [timetable]);

  if (timetable === undefined) return;

  return (
    <div className="bg-secondary w-[26rem] h-[calc(100vh-13rem)]">
      <div className="flex items-center py-2 w-full">
        <Button
          variant={"ghost"}
          className="rounded-full flex ml-2 px-2 mr-2 items-center hover:bg-secondary-foreground/10"
          onClick={() =>
            dispatch({
              type: TimetableActionType.SetSelectedCourseAndSection,
              courseID: null,
              sectionType: null,
            })
          }
        >
          <ArrowLeft />
        </Button>
        <span className="font-semibold text-md h-full">
          {course?.code}: {` ${course?.name}`}
        </span>
      </div>
      <Tabs
        value={currentSectionType ?? undefined}
        className=" h-[calc(100vh-20rem)]"
      >
        <TabsList className="w-full mb-2">
          {uniqueSectionTypes.map((sectionType) => {
            return (
              <TabsTrigger
                value={sectionType}
                onClick={() => {
                  dispatch({
                    type: TimetableActionType.SetSelectedSectionType,
                    sectionType: sectionType,
                  });
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
                {course?.sections
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
                  .map((section, _i) => {
                    return (
                      <span
                        className="w-full relative flex flex-col"
                        key={section.id}
                      >
                        <Button
                          variant={"secondary"}
                          className={`flex flex-col w-full h-fit border-slate-300 border-2 dark:border-slate-600/60 ${
                            timetable.sections.find((e) => e.id === section.id)
                              ? "dark:bg-slate-700 bg-slate-300 hover:dark:bg-slate-700 hover:bg-slate-300"
                              : "bg-transparent"
                          }`}
                          onClick={() => handleSectionClick(section)}
                          key={section.number}
                          disabled={
                            section.clashing &&
                            !(
                              section.clashing.courseId === section.courseId &&
                              section.clashing.sectionType === section.type
                            )
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
                                  .map((e) => e.split(":").splice(1).join(" "))
                                  .join(", ")}
                              </span>
                            </div>
                          </div>
                        </Button>
                        {section.clashing &&
                        !(
                          section.clashing.courseId === section.courseId &&
                          section.clashing.sectionType === section.type
                        ) ? (
                          <div className="absolute left-0 top-8 bg-slate-700/80 text-center w-full">
                            <span className="text-slate-100 font-bold text-md">
                              Clashing with{" "}
                              <button
                                type="button"
                                className="text-blue-700 dark:text-blue-400 cursor-pointer inline-flex items-baseline gap-1"
                                onClick={() =>
                                  dispatch({
                                    type: TimetableActionType.SetSelectedCourseAndSection,
                                    courseID: section.clashing?.courseId ?? "",
                                    sectionType:
                                      section.clashing?.sectionType ?? "L",
                                  })
                                }
                              >
                                {section.clashing.tm}
                                <ExternalLink size={16} />
                              </button>
                            </span>
                          </div>
                        ) : null}
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
};

export default CourseDetailsMenu;
