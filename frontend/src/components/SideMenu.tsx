import { useDebounceValue } from "usehooks-ts";
import { useTimetableState } from "@/context";
import { useTimetableNav } from "@/lib/useTimetableNav";
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
  const {
    state: { timetable, currentTab, searchTerm },
  } = useTimetableState();
  const { setTab, setQuery } = useTimetableNav();
  const [debouncedSearchTerm] = useDebounceValue(searchTerm, 500);

  if (timetable === undefined) return;

  // user is not in course details
  return (
    <div className="bg-secondary h-full min-h-0 w-full">
      <Tabs
        value={isScreenshotMode ? "exams" : currentTab}
        onValueChange={(tab) => setTab(tab as typeof currentTab)}
        className="flex h-full min-h-0 flex-col py-2"
      >
        {!isScreenshotMode && <SideMenuTabs isOnEditPage={isOnEditPage} />}
        <TabsContent
          value="cdcs"
          className="min-h-0 flex-1 overflow-y-auto data-[state=inactive]:hidden"
        >
          <CDCList />
        </TabsContent>

        {isOnEditPage ? <EditCoursesTab /> : <ViewCoursesTab />}
        <ExamTab />

        <TabsContent
          value="search"
          className="min-h-0 flex-1 data-[state=inactive]:hidden"
        >
          <div className="px-4 pb-4">
            <Input
              value={searchTerm}
              onChange={(e) => setQuery(e.target.value)}
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
