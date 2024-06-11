import * as express from "express";
import {
  unenroll,
  unenrollValidator,
} from "../controllers/user/cmsFunctions.js";
import {
  announcementValidator,
  createAnnoucement,
} from "../controllers/user/createAnnouncement.js";
import { editUser, editUserValidator } from "../controllers/user/editUser.js";
import {
  getUserDetails,
  getUserDetailsValidator,
} from "../controllers/user/getUserDetails.js";
import { authenticate } from "../middleware/auth.js";
import {
  getAllAnnouncements,
  getAnnouncementValidator,
} from "../controllers/user/retrieveAnnouncements.js";

const userRouter = express.Router();

userRouter.get("/:id?", authenticate, getUserDetailsValidator, getUserDetails);
userRouter.post("/edit", authenticate, editUserValidator, editUser);
userRouter.post("/unenroll", authenticate, unenrollValidator, unenroll);
userRouter.post(
  "/announcement",
  authenticate,
  announcementValidator,
  createAnnoucement,
);
userRouter.get(
  "/getannouncements",
  authenticate,
  getAnnouncementValidator,
  getAllAnnouncements,
);

export default userRouter;
