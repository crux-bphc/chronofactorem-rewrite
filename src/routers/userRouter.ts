import * as express from "express";
import { editUser, editUserValidator } from "../controllers/user/editUser";
import {
  getUserDetails,
  getUserDetailsValidator,
} from "../controllers/user/getUserDetails";

const userRouter = express.Router();

userRouter.get("/:id", getUserDetailsValidator, getUserDetails);
userRouter.post("/edit", editUserValidator, editUser);

export default userRouter;
