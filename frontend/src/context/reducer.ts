import type { Reducer } from "react";
import {
  type Action,
  TimetableActionType,
  type TimetableUIState,
} from "./types";

const reducer: Reducer<TimetableUIState, Action> = (state, action) => {
  switch (action.type) {
    case TimetableActionType.SetSidebarOpen:
      return { ...state, sidebarOpen: action.open };
    case TimetableActionType.ToggleVertical:
      return { ...state, isVertical: !state.isVertical };
    case TimetableActionType.SetIsCopyingTimetable:
      return { ...state, isCopyingTimetable: action.isCopyingTimetable };
    case TimetableActionType.SetSelectedCourseAndSection:
      return {
        ...state,
        currentCourseID: action.courseID,
        sidebarOpen: action.courseID !== null || state.sidebarOpen,
        currentSectionType: action.sectionType,
      };
    case TimetableActionType.SetSelectedSectionType:
      return { ...state, currentSectionType: action.sectionType };
    case TimetableActionType.SetMenuTab:
      return { ...state, currentTab: action.tab };
    case TimetableActionType.UpdateScreenIsLarge:
      return { ...state, screenIsLarge: action.screenIsLarge };
    case TimetableActionType.SetSearchTerm:
      return { ...state, searchTerm: action.searchTerm };
    default:
      return state;
  }
};

export default reducer;
