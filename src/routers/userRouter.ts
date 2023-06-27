import * as express from "express";
import { getUserByName } from "../controllers/user/get";
import { getAllUsers } from "../controllers/user/getAll";
import { editUser, editUserValidator } from "../controllers/user/editUser";

const userRouter = express.Router();

userRouter.get("/:name", getUserByName);
userRouter.get("/", getAllUsers);
userRouter.post("/edit", editUserValidator, editUser);

export default userRouter;
