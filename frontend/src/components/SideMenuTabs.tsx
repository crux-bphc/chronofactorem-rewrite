import { TabsList, TabsTrigger } from "./ui/tabs";

const SideMenuTabs = ({ isOnEditPage }: { isOnEditPage: boolean }) => (
  <TabsList
    className="shrink-0 self-start max-lg:grid max-lg:w-full max-lg:auto-cols-fr max-lg:grid-flow-col max-lg:self-stretch"
    aria-label="Timetable details"
  >
    {isOnEditPage && (
      <TabsTrigger className="text-lg font-bold max-lg:text-base" value="cdcs">
        CDCs
      </TabsTrigger>
    )}
    {isOnEditPage && (
      <TabsTrigger
        className="text-lg font-bold max-lg:text-base"
        value="search"
      >
        Search
      </TabsTrigger>
    )}
    <TabsTrigger className="text-lg font-bold max-lg:text-base" value="courses">
      Courses
    </TabsTrigger>
    <TabsTrigger className="text-lg font-bold max-lg:text-base" value="exams">
      Exams
    </TabsTrigger>
  </TabsList>
);
export default SideMenuTabs;
