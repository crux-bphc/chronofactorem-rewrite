import * as express from "express";
import {
  getAllCourses,
  getAllCoursesValidator,
} from "../controllers/course/getAllCourses.js";
import {
  getCourseById,
  getCourseByIdValidator,
} from "../controllers/course/getCourseById.js";
import {
  updateChangedTimetable,
  updateChangedTimetableValidator,
} from "../controllers/timetable/updateChangedTimetable.js";

const courseRouter = express.Router();

courseRouter.get("/", getAllCoursesValidator, getAllCourses);
courseRouter.get("/:id", getCourseByIdValidator, getCourseById);
courseRouter.post(
  "/update",
  updateChangedTimetableValidator,
  updateChangedTimetable,
);

export default courseRouter;
