import * as express from "express";
import {
  deleteTimeTableValidator,
  deleteTimeTable,
} from "../controllers/timetable/deleteTimetable";

const timetableRouter = express.Router();

// Call the route-wise validation middleware, and then forward request to the handler on validation success
timetableRouter.get("/:id/delete", deleteTimeTableValidator, deleteTimeTable);

export default timetableRouter;
