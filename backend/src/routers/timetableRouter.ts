import * as express from "express";
import { createTimetable } from "../controllers/timetable/createTimetable";
import {
  deleteTimeTableValidator,
  deleteTimetable,
} from "../controllers/timetable/deleteTimetable";
import {
  getTimetableById,
  getTimetableByIdValidator,
} from "../controllers/timetable/getTimetableById";

import {
  addSection,
  addSectionValidator,
} from "../controllers/timetable/addSection";
import {
  editTimetableMetadata,
  editTimetableMetadataValidator,
} from "../controllers/timetable/editTimetableMetadata";

import {
  getPublicTimetables,
  getPublicTimetablesValidator,
} from "../controllers/timetable/getPublicTimetables";
import {
  removeSection,
  removeSectionValidator,
} from "../controllers/timetable/removeSection";
import { authenticate } from "../middleware/auth";

const timetableRouter = express.Router();

timetableRouter.post("/create", authenticate, createTimetable);
timetableRouter.get(
  "/getPublic",
  authenticate,
  getPublicTimetablesValidator,
  getPublicTimetables,
);
timetableRouter.get("/:id", getTimetableByIdValidator, getTimetableById);
timetableRouter.post(
  "/:id/delete",
  authenticate,
  deleteTimeTableValidator,
  deleteTimetable,
);
timetableRouter.post("/:id/add", authenticate, addSectionValidator, addSection);
timetableRouter.post(
  "/:id/remove",
  authenticate,
  removeSectionValidator,
  removeSection,
);
timetableRouter.post(
  "/:id/edit",
  authenticate,
  editTimetableMetadataValidator,
  editTimetableMetadata,
);

export default timetableRouter;
