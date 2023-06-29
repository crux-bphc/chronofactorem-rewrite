import * as express from "express";
import { getAllUsers } from "../controllers/user/getAll";
import { editUser, editUserValidator } from "../controllers/user/editUser";
import {
  getUserDetails,
  getUserDetailsValidator,
} from "../controllers/user/getUserDetails";

const userRouter = express.Router();

userRouter.get("/:id", getUserDetailsValidator, getUserDetails);
userRouter.get("/", getAllUsers);
userRouter.post("/edit", editUserValidator, editUser);

export default userRouter;
