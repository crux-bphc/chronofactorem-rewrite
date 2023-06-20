import * as express from "express";
import { getUserByName } from "../controllers/user/get";
import { getAllUsers } from "../controllers/user/getAll";

const userRouter = express.Router();

userRouter.get("/:name", getUserByName);
userRouter.get("/", getAllUsers);

export default userRouter;
