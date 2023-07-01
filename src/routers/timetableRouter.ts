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

const timetableRouter = express.Router();

timetableRouter.post("/create", createTimeTableValidator, createTimetable);
timetableRouter.get(
  "/getPublic",
  getPublicTimetablesValidator,
  getPublicTimetables
);
timetableRouter.post("/:id/delete", deleteTimeTableValidator, deleteTimetable);
timetableRouter.post("/:id/add", addSectionValidator, addSection);
timetableRouter.post(
  "/:id/edit",
  editTimetableMetadataValidator,
  editTimetableMetadata
);

export default timetableRouter;
