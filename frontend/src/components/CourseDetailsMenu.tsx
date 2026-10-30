import { useIsMutating } from "@tanstack/react-query";
import type { sectionType } from "lib";
import { ArrowLeft, ExternalLink } from "lucide-react";
import type z from "zod";
import { useTimetableState } from "@/context";
import {
  useAddRemoveTimetableSection,
  useSwapTimetableSections,
} from "@/data-access/hooks/useTimetableSectionAction";
import { titleCase } from "@/lib/titleCase";
import { useTimetableNav } from "@/lib/useTimetableNav";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

const CourseDetailsMenu = () => {
  const {
    state: { timetable, course, uniqueSectionTypes, currentSectionType },
  } = useTimetableState();
  const { openCourse, closeCourse, setType } = useTimetableNav();
  const { mutate: sectionAction } = useAddRemoveTimetableSection(timetable?.id);
  const { mutate: swapSections } = useSwapTimetableSections(timetable?.id);

  const pending =
    useIsMutating({ mutationKey: ["sections", timetable?.id] }) > 0;
  const handleSectionClick = (section: z.infer<typeof sectionType>) => {
    if (!timetable || pending) return;
    if (timetable.sections.some((item) => item.id === section.id)) {
      sectionAction({ sectionId: section.id, action: "remove" });
      return;
    }
    const other = timetable.sections.find(
      (item) =>
        item.type === section.type && item.courseId === section.courseId,
    );
    if (other) swapSections({ sectionId: other.id, newSectionId: section.id });
    else
      sectionAction(
        { sectionId: section.id, action: "add" },
        {
          onSuccess: () => {
            const next =
              uniqueSectionTypes[uniqueSectionTypes.indexOf(section.type) + 1];
            if (next) setType(next);
          },
        },
      );
  };
  // a section's day and hour, without the course code and room
  const slot = (roomTime: string) => roomTime.split(":").slice(2).join(":");

  if (timetable === undefined) return;

  return (
    <div className="bg-secondary flex h-full min-h-0 w-full flex-col">
      <div className="flex shrink-0 items-center py-2 w-full">
        <Button
          variant={"ghost"}
          className="rounded-full flex ml-2 px-2 mr-2 items-center hover:bg-secondary-foreground/10"
          onClick={() => closeCourse()}
        >
          <ArrowLeft />
        </Button>
        <span className="font-semibold text-md">
          {course?.code}: {` ${course?.name ? titleCase(course.name) : ""}`}
        </span>
      </div>
      <Tabs
        value={currentSectionType ?? undefined}
        className="flex min-h-0 flex-1 flex-col"
      >
        <TabsList className="w-full mb-2 shrink-0">
          {uniqueSectionTypes.map((sectionType) => {
            return (
              <TabsTrigger
                value={sectionType}
                onClick={() => {
                  setType(sectionType);
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
              className="min-h-0 flex-1"
              key={sectionType}
            >
              <div className="flex flex-col gap-2 p-0 m-0 px-2 overflow-y-auto h-full">
                {course?.sections
                  .filter((section) => section.type === sectionType)
                  .map((section) => ({
                    ...section,
                    // picking another section of the same course and type swaps it, so those don't clash
                    clashing: timetable.sections.filter(
                      (item) =>
                        !(
                          item.courseId === section.courseId &&
                          item.type === section.type
                        ) &&
                        item.roomTime.some((existing) =>
                          section.roomTime.some(
                            (incoming) => slot(existing) === slot(incoming),
                          ),
                        ),
                    ),
                  }))
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
                              ? "dark:bg-slate-700 bg-slate-300 hover:dark:bg-slate-600 hover:bg-slate-400/70"
                              : "bg-transparent hover:dark:bg-slate-800 hover:bg-slate-200"
                          }`}
                          onClick={() => handleSectionClick(section)}
                          key={section.number}
                          disabled={section.clashing.length > 0}
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
                        {section.clashing.length > 0 ? (
                          <div className="absolute left-0 top-8 bg-slate-700/80 text-center w-full">
                            <span className="text-slate-100 font-bold text-md">
                              Clashing with{" "}
                              {section.clashing.map((item, i) => (
                                <span key={item.id}>
                                  {i > 0 && ", "}
                                  <button
                                    type="button"
                                    className="text-blue-300 dark:text-blue-400 cursor-pointer inline-flex items-baseline gap-1"
                                    onClick={() =>
                                      openCourse(item.courseId, item.type)
                                    }
                                  >
                                    {`${item.roomTime[0].split(":")[0]} ${item.type}${item.number}`}
                                    <ExternalLink size={16} />
                                  </button>
                                </span>
                              ))}
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
