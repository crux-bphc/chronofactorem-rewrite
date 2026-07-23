import { useState } from "react";
import { useDebounceValue } from "usehooks-ts";
import { useTimetableState } from "@/context";
import CDCList from "./CDCList";
import CourseSearchResults from "./CourseSearchResults";
import EditCoursesTab from "./EditCoursesTab";
import ExamTab from "./ExamTab";
import SideMenuTabs from "./SideMenuTabs";
import { Input } from "./ui/input";
import { Tabs, TabsContent } from "./ui/tabs";
import ViewCoursesTab from "./ViewCoursesTab";

export function SideMenu({
  isOnEditPage,
  isScreenshotMode,
}: {
  isOnEditPage: boolean;
  isScreenshotMode: boolean;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const {
    state: { timetable, currentTab },
  } = useTimetableState();
  const [debouncedSearchTerm, _] = useDebounceValue<string>(searchTerm, 500);

  if (timetable === undefined) return;

  // user is not in course details
  return (
    <div className="bg-secondary w-[26rem]">
      <Tabs
        value={isScreenshotMode ? "exams" : currentTab}
        className="py-2 h-[calc(100vh-16rem)]"
      >
        <SideMenuTabs isOnEditPage={isOnEditPage} />
        <TabsContent
          value="CDCs"
          className="border-muted-foreground/80 w-[26rem] data-[state=inactive]:h-0 flex flex-col h-full overflow-y-scroll"
        >
          <CDCList />
        </TabsContent>

        {isOnEditPage ? <EditCoursesTab /> : <ViewCoursesTab />}
        <ExamTab />

        <TabsContent
          value="search"
          className="data-[state=inactive]:h-0 w-[26rem] h-full"
        >
          <div className="px-4 pb-4">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Courses"
              className="text-md p-2"
            />
          </div>

          <CourseSearchResults debouncedSearchTerm={debouncedSearchTerm} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
