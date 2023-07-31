import * as express from "express";
import { editUser, editUserValidator } from "../controllers/user/editUser";
import {
  getUserDetails,
  getUserDetailsValidator,
} from "../controllers/user/getUserDetails";
import { authenticate } from "../middleware/auth";

const userRouter = express.Router();

userRouter.get("/:id", authenticate, getUserDetailsValidator, getUserDetails);
userRouter.post("/edit", authenticate, editUserValidator, editUser);

export default userRouter;
