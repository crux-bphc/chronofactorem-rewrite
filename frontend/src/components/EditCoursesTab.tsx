import type { courseType } from "lib";
import { ChevronRight } from "lucide-react";
import type z from "zod";
import { Button } from "./ui/button";
import { TabsContent } from "./ui/tabs";

const EditCoursesTab = ({
  setCurrentCourseID,
  coursesInTimetable,
}: {
  setCurrentCourseID: React.Dispatch<React.SetStateAction<string | null>>;
  coursesInTimetable: z.infer<typeof courseType>[];
}) => (
  <TabsContent
    value="currentCourses"
    className="flex h-full data-[state=inactive]:h-0 w-[26rem] overflow-y-scroll flex-col px-2 gap-2"
  >
    {coursesInTimetable.map((course) => {
      return (
        <Button
          variant={"secondary"}
          onClick={() => {
            setCurrentCourseID(course.id);
          }}
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
  </TabsContent>
);

export default EditCoursesTab;
