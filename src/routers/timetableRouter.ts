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
  addSection,
  addSectionValidator,
} from "../controllers/timetable/addSection";

const timetableRouter = express.Router();

timetableRouter.post("/create", createTimeTableValidator, createTimetable);
timetableRouter.post("/:id/delete", deleteTimeTableValidator, deleteTimetable);
timetableRouter.post("/:id/add", addSectionValidator, addSection);

export default timetableRouter;
