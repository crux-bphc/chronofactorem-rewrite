import * as express from "express";
import { getCourseByCode } from "../controllers/course/getCourseByCode";
import { getAllCourses} from "../controllers/course/getAllCourses"

const courseRouter = express.Router();

courseRouter.get("/:code", getCourseByCode);
courseRouter.get("/", getAllCourses)

export default courseRouter;
