import * as express from "express";
import { getCourseByCode } from "../controllers/course/get";


const courseRouter = express.Router();

courseRouter.get("/:code", getCourseByCode);
courseRouter.get("/course")

export default courseRouter;
