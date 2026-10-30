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

type TabType = "cdcs" | "search" | "courses" | "exams";

export type TimetableUIState = {
  isVertical: boolean;
  isCopyingTimetable: boolean;
  screenIsLarge: boolean;
};

export type TimetableStateType = TimetableUIState & {
  currentCourseID: string | null;
  currentSectionType: sectionTypeEnum | null;
  currentTab: TabType;
  searchTerm: string;
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
  ToggleVertical = 0,
  SetIsCopyingTimetable = 1,
  UpdateScreenIsLarge = 5,
}

export type Action =
  | {
      type: TimetableActionType.ToggleVertical;
    }
  | {
      type: TimetableActionType.SetIsCopyingTimetable;
      isCopyingTimetable: boolean;
    }
  | {
      type: TimetableActionType.UpdateScreenIsLarge;
      screenIsLarge: boolean;
    };
