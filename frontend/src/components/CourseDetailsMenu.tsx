import { useIsMutating } from "@tanstack/react-query";
import type { sectionType } from "lib";
import { ArrowLeft, Check, LoaderCircle } from "lucide-react";
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
            if (next)
              dispatch({
                type: TimetableActionType.SetSelectedSectionType,
                sectionType: next,
              });
          },
        },
      );
  };
  return (
    <div className="flex h-full min-h-0 w-full flex-col p-2">
      <div className="mb-3 flex shrink-0 items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Back to courses"
          disabled={pending}
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
        <div className="min-w-0">
          <p className="text-sm font-semibold">
            {course?.code ?? "Loading course"}
          </p>
          <p className="text-xs text-muted-foreground">{course?.name}</p>
        </div>
        {pending && (
          <LoaderCircle
            className="size-4 shrink-0 animate-spin"
            aria-label="Saving section"
          />
        )}
      </div>
      {!course ? (
        <div
          role="status"
          className="flex flex-1 items-center justify-center text-sm text-muted-foreground"
        >
          Loading sections...
        </div>
      ) : (
        <Tabs
          value={currentSectionType ?? undefined}
          onValueChange={(type) =>
            dispatch({
              type: TimetableActionType.SetSelectedSectionType,
              sectionType: type as "L" | "P" | "T",
            })
          }
          className="flex min-h-0 flex-1 flex-col"
        >
          <TabsList className="w-full shrink-0">
            {uniqueSectionTypes.map((type) => (
              <TabsTrigger
                key={type}
                value={type}
                disabled={pending}
                className="flex-1"
              >
                {type === "L"
                  ? "Lectures"
                  : type === "T"
                    ? "Tutorials"
                    : "Practicals"}
              </TabsTrigger>
            ))}
          </TabsList>
          {uniqueSectionTypes.map((type) => (
            <TabsContent
              key={type}
              value={type}
              className="min-h-0 flex-1 overflow-y-auto data-[state=inactive]:hidden"
            >
              <div className="flex flex-col gap-2 pb-2">
                {course.sections
                  .filter((section) => section.type === type)
                  .map((section) => {
                    const selected = timetable?.sections.some(
                      (item) => item.id === section.id,
                    );
                    const occupied = timetable?.sections.filter(
                      (item) =>
                        !(
                          item.courseId === section.courseId &&
                          item.type === section.type
                        ),
                    );
                    const clashes = occupied?.filter((item) =>
                      item.roomTime.some((existing) =>
                        section.roomTime.some(
                          (incoming) =>
                            existing.split(":").slice(2).join(":") ===
                            incoming.split(":").slice(2).join(":"),
                        ),
                      ),
                    );
                    return (
                      <div key={section.id} className="rounded-lg border">
                        <Button
                          variant="ghost"
                          disabled={pending || !!clashes?.length}
                          aria-pressed={selected}
                          onClick={() => handleSectionClick(section)}
                          className="h-auto min-h-20 w-full flex-col items-start gap-2 whitespace-normal p-3 text-left aria-pressed:bg-primary/10"
                        >
                          <span className="flex w-full items-center justify-between font-semibold">
                            {section.type}
                            {section.number}
                            {selected && <Check className="size-4" />}
                          </span>
                          <span className="text-sm">
                            {section.instructors.join(", ")}
                          </span>
                          <span className="text-xs font-normal text-muted-foreground">
                            {section.roomTime
                              .map((time) => {
                                const [, room, day, hour] = time.split(":");
                                return `${day} ${Number(hour) + 7}:00, ${room}`;
                              })
                              .join(" · ")}
                          </span>
                        </Button>
                        {!!clashes?.length && (
                          <p className="px-3 pb-3 text-xs text-destructive">
                            Clashes with{" "}
                            {clashes
                              .map(
                                (item) =>
                                  `${item.roomTime[0].split(":")[0]} ${item.type}${item.number}`,
                              )
                              .join(", ")}
                          </p>
                        )}
                      </div>
                    );
                  })}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
};
export default CourseDetailsMenu;
