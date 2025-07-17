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

export type TimetableStateType = {
  isVertical: boolean;
  isLoading: boolean;
  user: z.infer<typeof userWithTimetablesType> | undefined;
  courses: z.infer<typeof courseType>[] | undefined;
  timetable: z.infer<typeof timetableWithSectionsType> | undefined;
  coursesInTimetable: z.infer<typeof courseType>[];
  cdcs: CDCType[];
  currentCourseID: string | null;
  course: z.infer<typeof courseWithSectionsType> | undefined;
  uniqueSectionTypes: sectionTypeList;
  currentSectionType: sectionTypeEnum | null;
  currentTab: TabType;
  screenIsLarge: boolean;
  timetableDetailsSections: TimetableSectionType[];
};

export enum TimetableActionType {
  ToggleVertical = 0,
  SetLoading = 1,
  SetSelectedCourseAndSection = 2,
  SetSelectedSectionType = 3,
  SetMenuTab = 4,
  UpdateScreenIsLarge = 5,
  UpdateCoursesAndTimetable = 6,
  UpdateUser = 7,
  UpdateCourse = 8,
}

export type Action =
  | {
      type: TimetableActionType.ToggleVertical;
    }
  | {
      type: TimetableActionType.SetLoading;
      loading: boolean;
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
      type: TimetableActionType.UpdateCoursesAndTimetable;
      courses: z.infer<typeof courseType>[];
      timetable: z.infer<typeof timetableWithSectionsType>;
    }
  | {
      type: TimetableActionType.UpdateUser;
      user: z.infer<typeof userWithTimetablesType>;
    }
  | {
      type: TimetableActionType.UpdateCourse;
      course: z.infer<typeof courseWithSectionsType>;
    };
