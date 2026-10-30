import type {
  courseType,
  courseWithSectionsType,
  sectionTypeEnum,
  sectionTypeList,
  timetableWithSectionsType,
  userWithTimetablesType,
} from "lib";
import type z from "zod";
import type { TimetableSectionType } from "@/utils/timetable";

type SpecialCDCType =
  | {
      id: null;
      type: "optional";
      options: z.infer<typeof courseType>[];
    }
  | {
      id: null;
      type: "warning";
      warning: string;
    };

type CDCType = z.infer<typeof courseType> | SpecialCDCType;

type TabType = "CDCs" | "search" | "currentCourses" | "exams";

export type TimetableUIState = {
  isVertical: boolean;
  sidebarOpen: boolean;
  currentCourseID: string | null;
  currentSectionType: sectionTypeEnum | null;
  currentTab: TabType;
  screenIsLarge: boolean;
  searchTerm: string;
};

export type TimetableStateType = TimetableUIState & {
  user: z.infer<typeof userWithTimetablesType> | undefined;
  courses: z.infer<typeof courseType>[] | undefined;
  timetable: z.infer<typeof timetableWithSectionsType> | undefined;
  coursesInTimetable: z.infer<typeof courseType>[];
  cdcs: CDCType[];
  course: z.infer<typeof courseWithSectionsType> | undefined;
  uniqueSectionTypes: sectionTypeList;
  timetableDetailsSections: TimetableSectionType[];
};

export enum TimetableActionType {
  SetSidebarOpen = 10,
  ToggleVertical = 0,
  SetSelectedCourseAndSection = 2,
  SetSelectedSectionType = 3,
  SetMenuTab = 4,
  UpdateScreenIsLarge = 5,
  SetSearchTerm = 9,
}

export type Action =
  | { type: TimetableActionType.SetSidebarOpen; open: boolean }
  | {
      type: TimetableActionType.ToggleVertical;
    }
  | {
      type: TimetableActionType.SetSelectedCourseAndSection;
      courseID: string | null;
      sectionType: sectionTypeEnum | null;
    }
  | {
      type: TimetableActionType.SetSelectedSectionType;
      sectionType: sectionTypeEnum;
    }
  | {
      type: TimetableActionType.SetMenuTab;
      tab: TabType;
    }
  | {
      type: TimetableActionType.UpdateScreenIsLarge;
      screenIsLarge: boolean;
    }
  | {
      type: TimetableActionType.SetSearchTerm;
      searchTerm: string;
    };
