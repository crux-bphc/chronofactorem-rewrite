import * as express from "express";
import {
  unenroll,
  unenrollValidator,
} from "../controllers/user/cmsFunctions.js";
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

export default userRouter;
