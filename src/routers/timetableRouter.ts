import * as express from "express";
import {
  createTimeTableValidator,
  createTimetable,
} from "../controllers/timetable/createTimetable";

const timetableRouter = express.Router();

timetableRouter.post("/create", createTimeTableValidator, createTimetable);

export default timetableRouter;
