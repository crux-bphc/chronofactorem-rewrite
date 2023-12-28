import * as express from "express";
import { getAllCourses } from "../controllers/course/getAllCourses";
import { getCourseById } from "../controllers/course/getCourseById";
import { getCourseByIdValidator } from "../controllers/course/getCourseById";

const courseRouter = express.Router();

courseRouter.get("/", getAllCourses);
courseRouter.get("/:id", getCourseByIdValidator, getCourseById);

export default courseRouter;
