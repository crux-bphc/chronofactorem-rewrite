import type { Reducer } from "react";
import {
  filterCoursesInTimetable,
  formatCDCWarningsAndOptions,
  getFilledTimetableSections,
} from "@/utils/timetable";
import {
  type Action,
  TimetableActionType,
  type TimetableStateType,
} from "./types";

const reducer: Reducer<TimetableStateType, Action> = (
  state: TimetableStateType,
  action: Action,
) => {
  switch (action.type) {
    case TimetableActionType.ToggleVertical:
      return { ...state, isVertical: !state.isVertical };
    case TimetableActionType.SetLoading:
      return { ...state, isLoading: action.loading };
    case TimetableActionType.SetSelectedCourseAndSection:
      return {
        ...state,
        currentCourseID: action.courseID,
        currentSectionType: action.sectionType,
      };
    case TimetableActionType.SetSelectedSectionType:
      return { ...state, currentSectionType: action.sectionType };
    case TimetableActionType.SetMenuTab:
      return { ...state, currentTab: action.tab };
    case TimetableActionType.UpdateScreenIsLarge:
      return { ...state, screenIsLarge: action.screenIsLarge };
    case TimetableActionType.UpdateCoursesAndTimetable: {
      const { timetable, courses } = action;

      return {
        ...state,
        courses,
        timetable,
        coursesInTimetable: filterCoursesInTimetable(courses, timetable).sort(),
        timetableDetailsSections: getFilledTimetableSections(
          courses,
          timetable,
        ),
        cdcs: formatCDCWarningsAndOptions(courses, timetable),
        currentTab: timetable.draft ? "CDCs" : "currentCourses",
      };
    }
    case TimetableActionType.UpdateUser:
      return { ...state, user: action.user };
    case TimetableActionType.UpdateCourse: {
      const uniqueSectionTypes = Array.from(
        new Set(action.course.sections.map((section) => section.type)),
      ).sort();
      return {
        ...state,
        course: action.course,
        uniqueSectionTypes,
        currentSectionType: state.currentSectionType ?? uniqueSectionTypes[0],
      };
    }
    default:
      return state;
  }
};

export default reducer;
