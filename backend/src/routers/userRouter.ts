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

export default userRouter;
