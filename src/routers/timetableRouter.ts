import * as express from "express";
import {
  createTimeTableValidator,
  createTimetable,
} from "../controllers/timetable/createTimetable";
import {
  deleteTimeTableValidator,
  deleteTimetable,
} from "../controllers/timetable/deleteTimetable";
import {
  getTimetableByIdValidator,
  getTimetableById,
} from "../controllers/timetable/getTimetableById";

import {
  editTimetableMetadataValidator,
  editTimetableMetadata,
} from "../controllers/timetable/editTimetableMetadata";
import {
  addSection,
  addSectionValidator,
} from "../controllers/timetable/addSection";

import {
  getPublicTimetables,
  getPublicTimetablesValidator,
} from "../controllers/timetable/getPublicTimetables";
import {
  removeSection,
  removeSectionValidator,
} from "../controllers/timetable/removeSection";

const timetableRouter = express.Router();

timetableRouter.post("/create", createTimeTableValidator, createTimetable);
timetableRouter.get(
  "/getPublic",
  getPublicTimetablesValidator,
  getPublicTimetables
);
timetableRouter.get("/:id", getTimetableByIdValidator, getTimetableById);
timetableRouter.post("/:id/delete", deleteTimeTableValidator, deleteTimetable);
timetableRouter.post("/:id/add", addSectionValidator, addSection);
timetableRouter.post("/:id/remove", removeSectionValidator, removeSection);
timetableRouter.post(
  "/:id/edit",
  editTimetableMetadataValidator,
  editTimetableMetadata
);

export default timetableRouter;
