import * as express from "express";
import {
  unenroll,
  unenrollValidator,
} from "../controllers/user/cmsFunctions.js";
import {
  announcementValidator,
  createAnnouncement,
} from "../controllers/user/createAnnouncement.js";
import { editUser, editUserValidator } from "../controllers/user/editUser.js";
import {
  getUserDetails,
  getUserDetailsValidator,
} from "../controllers/user/getUserDetails.js";
import { getAllAnnouncements } from "../controllers/user/retrieveAnnouncements.js";
import { authenticate } from "../middleware/auth.js";

const userRouter = express.Router();

userRouter.post("/edit", authenticate, editUserValidator, editUser);
userRouter.post("/unenroll", authenticate, unenrollValidator, unenroll);
userRouter.post(
  "/announcements/create",
  authenticate,
  announcementValidator,
  createAnnouncement,
);
userRouter.get("/announcements", authenticate, getAllAnnouncements);
userRouter.get("/:id?", authenticate, getUserDetailsValidator, getUserDetails);

export default userRouter;
