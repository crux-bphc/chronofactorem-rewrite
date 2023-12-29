import * as express from "express";
import { unenroll, unenrollValidator } from "../controllers/user/cmsFunctions";
import { editUser, editUserValidator } from "../controllers/user/editUser";
import {
  getUserDetails,
  getUserDetailsValidator,
} from "../controllers/user/getUserDetails";
import { authenticate } from "../middleware/auth";

const userRouter = express.Router();

userRouter.get("/:id?", authenticate, getUserDetailsValidator, getUserDetails);
userRouter.post("/edit", authenticate, editUserValidator, editUser);
userRouter.post("/unenroll", authenticate, unenrollValidator, unenroll);

export default userRouter;
