import * as express from "express";
import {
  createTimeTableValidator,
  createTimetable,
} from "../controllers/timetable/create";

const timetableRouter = express.Router();

timetableRouter.post("/create", createTimeTableValidator, createTimetable);

export default timetableRouter;
