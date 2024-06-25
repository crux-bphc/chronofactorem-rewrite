import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import "dotenv/config";
import express, { NextFunction } from "express";
import { Request, Response } from "express";
import { env } from "./config/server.js";
import authRouter from "./routers/authRouter.js";
import courseRouter from "./routers/courseRouter.js";
import timetableRouter from "./routers/timetableRouter.js";
import userRouter from "./routers/userRouter.js";
import { logger } from "./utils/logger.js";

// create express app
const app = express();
app.use(logger);

// to parse cookies
app.use(cookieParser());
const frontendIsHTTPS = env.FRONTEND_URL.includes("https://");
app.use(
  cors({
    credentials: true,
    origin: [
      env.FRONTEND_URL,
      env.FRONTEND_URL.replace(
        frontendIsHTTPS ? "https://" : "http://",
        frontendIsHTTPS ? "https://www." : "http://www.",
      ),
    ],
  }),
);
app.use(bodyParser.json());

// register express routers from defined application routers
app.use("/user", userRouter);
app.use("/course", courseRouter);
app.use("/auth", authRouter);
app.use("/timetable", timetableRouter);

// setup express app here
// ...

// Disable Express header for security
app.disable("x-powered-by");

// Error handling
app.use((err: any, req: Request, res: Response, _: NextFunction) => {
  console.log(err);
  res.status(err.status || 500).send(err.stack);
});

export default app;
