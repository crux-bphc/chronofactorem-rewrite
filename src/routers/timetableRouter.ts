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

const timetableRouter = express.Router();

timetableRouter.post("/create", createTimeTableValidator, createTimetable);
timetableRouter.post("/delete/:id", deleteTimeTableValidator, deleteTimetable);
timetableRouter.post("/:id/edit", editTimetableMetadataValidator, editTimetableMetadata);

export default timetableRouter;
