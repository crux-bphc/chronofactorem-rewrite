import * as express from "express";
import { getCourseById } from "../controllers/course/getCourseById";
import { getAllCourses} from "../controllers/course/getAllCourses"

const courseRouter = express.Router();

courseRouter.get("/:id", getCourseById);
courseRouter.get("/", getAllCourses)

export default courseRouter;
