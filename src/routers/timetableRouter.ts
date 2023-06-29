import * as express from "express";
import {
  createTimeTableValidator,
  createTimetable,
} from "../controllers/timetable/createTimetable";
import {
  deleteTimeTableValidator,
  deleteTimetable,
} from "../controllers/timetable/deleteTimetable";
import { getPublicTimetables, getPublicTimetablesValidator } from "../controllers/timetable/getPublicTimetables";

const timetableRouter = express.Router();

timetableRouter.post("/create", createTimeTableValidator, createTimetable);
timetableRouter.post("/delete/:id", deleteTimeTableValidator, deleteTimetable);
timetableRouter.get("/getPublic" , getPublicTimetablesValidator ,getPublicTimetables);

export default timetableRouter;
