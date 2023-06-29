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
  editTimeTableValidator,
  editTimetable,
} from "../controllers/timetable/editTimetable";

const timetableRouter = express.Router();

timetableRouter.post("/create", createTimeTableValidator, createTimetable);
timetableRouter.post("/delete/:id", deleteTimeTableValidator, deleteTimetable);
timetableRouter.post("/:id/edit", editTimeTableValidator, editTimetable);

export default timetableRouter;
