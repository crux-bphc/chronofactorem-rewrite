import * as express from "express";
import {
  createTimeTableValidator,
  createTimetable,
} from "../controllers/timetable/createTimetable";
import {
  deleteTimeTableValidator,
  deleteTimetable,
} from "../controllers/timetable/delete";

const timetableRouter = express.Router();

timetableRouter.post("/create", createTimeTableValidator, createTimetable);
timetableRouter.post("/delete/:id", deleteTimeTableValidator, deleteTimetable);

export default timetableRouter;
