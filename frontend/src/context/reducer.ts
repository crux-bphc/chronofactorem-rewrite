import type { Reducer } from "react";
import {
  type Action,
  TimetableActionType,
  type TimetableUIState,
} from "./types";

const reducer: Reducer<TimetableUIState, Action> = (state, action) => {
  switch (action.type) {
    case TimetableActionType.ToggleVertical:
      return { ...state, isVertical: !state.isVertical };
    case TimetableActionType.SetIsCopyingTimetable:
      return { ...state, isCopyingTimetable: action.isCopyingTimetable };
    case TimetableActionType.UpdateScreenIsLarge:
      return { ...state, screenIsLarge: action.screenIsLarge };
    default:
      return state;
  }
};

export default reducer;
