import * as express from "express";
import { createTimetable } from "../controllers/timetable/createTimetable.js";
import {
  deleteTimeTableValidator,
  deleteTimetable,
} from "../controllers/timetable/deleteTimetable.js";
import {
  getTimetableById,
  getTimetableByIdValidator,
} from "../controllers/timetable/getTimetableById.js";

import {
  addSection,
  addSectionValidator,
} from "../controllers/timetable/addSection.js";
import {
  editTimetableMetadata,
  editTimetableMetadataValidator,
} from "../controllers/timetable/editTimetableMetadata.js";

import {
  copyTimetable,
  copyTimetableValidator,
} from "../controllers/timetable/copyTimetable.js";
import {
  getPublicTimetables,
  getPublicTimetablesValidator,
} from "../controllers/timetable/getPublicTimetables.js";
import {
  removeSection,
  removeSectionValidator,
} from "../controllers/timetable/removeSection.js";
import {
  searchTimetable,
  searchTimetableValidator,
} from "../controllers/timetable/searchTimetable.js";
import { authenticate } from "../middleware/auth.js";

const timetableRouter = express.Router();

timetableRouter.post("/create", authenticate, createTimetable);
timetableRouter.get(
  "/getPublic",
  authenticate,
  getPublicTimetablesValidator,
  getPublicTimetables,
);
timetableRouter.get(
  "/search",
  authenticate,
  searchTimetableValidator,
  searchTimetable,
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
timetableRouter.post(
  "/:id/copy",
  authenticate,
  copyTimetableValidator,
  copyTimetable,
);

export default timetableRouter;
