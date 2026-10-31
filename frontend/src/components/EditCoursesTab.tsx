import { ChevronRight } from "lucide-react";
import { useTimetableState } from "@/context";
import { useTimetableNav } from "@/lib/useTimetableNav";
import { Button } from "./ui/button";
import { TabsContent } from "./ui/tabs";

const EditCoursesTab = () => {
  const {
    state: { coursesInTimetable },
  } = useTimetableState();
  const { openCourse } = useTimetableNav();
  return (
    <TabsContent
      value="courses"
      className="flex min-h-0 flex-1 data-[state=inactive]:hidden overflow-y-auto flex-col px-2 gap-2"
    >
      {coursesInTimetable.map((course) => {
        return (
          <Button
            variant={"secondary"}
            onClick={() => {
              openCourse(course.id);
            }}
            key={course.id}
            className="h-auto min-h-16 shrink-0 whitespace-normal py-2 rounded-none text-left bg-secondary dark:hover:bg-slate-700 hover:bg-slate-200"
          >
            <div className="flex justify-between w-full items-center">
              <span>{`${course.code}: ${course.name}`}</span>
              <ChevronRight />
            </div>
          </Button>
        );
      })}
    </TabsContent>
  );
};

export default EditCoursesTab;
