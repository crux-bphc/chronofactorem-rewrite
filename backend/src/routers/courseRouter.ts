import * as express from "express";
import {
  getAllCourses,
  getAllCoursesValidator,
} from "../controllers/course/getAllCourses";
import { getCourseById } from "../controllers/course/getCourseById";
import { getCourseByIdValidator } from "../controllers/course/getCourseById";

const courseRouter = express.Router();

courseRouter.get("/", getAllCoursesValidator, getAllCourses);
courseRouter.get("/:id", getCourseByIdValidator, getCourseById);

export default courseRouter;
