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

const timetableRouter = express.Router();

timetableRouter.post("/create", createTimeTableValidator, createTimetable);
timetableRouter.post("/delete/:id", deleteTimeTableValidator, deleteTimetable);
timetableRouter.get("/:id", getTimetableByIdValidator, getTimetableById);

export default timetableRouter;
