import { TabsList, TabsTrigger } from "./ui/tabs";

const SideMenuTabs = ({ isOnEditPage }: { isOnEditPage: boolean }) => (
  <TabsList
    className="grid w-full shrink-0 grid-flow-col auto-cols-fr"
    aria-label="Timetable details"
  >
    {isOnEditPage && (
      <TabsTrigger className="px-2 text-sm font-medium" value="CDCs">
        CDCs
      </TabsTrigger>
    )}
    {isOnEditPage && (
      <TabsTrigger className="px-2 text-sm font-medium" value="search">
        Search
      </TabsTrigger>
    )}
    <TabsTrigger className="px-2 text-sm font-medium" value="currentCourses">
      Courses
    </TabsTrigger>
    <TabsTrigger className="px-2 text-sm font-medium" value="exams">
      Exams
    </TabsTrigger>
  </TabsList>
);
export default SideMenuTabs;
