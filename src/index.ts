import express from "express";
import bodyParser from "body-parser";
import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "./db";
import userRouter from "./routers/userRouter";
import timetableRouter from "./routers/timetableRouter";
import "dotenv/config";
import { env } from "./config/server";

AppDataSource.initialize()
  .then(async () => {
    // create express app
    const app = express();
    app.use(bodyParser.json());

    // register express routers from defined application routers
    app.use("/user", userRouter);
    app.use("/timetable", timetableRouter);

    // setup express app here
    // ...

    // Disable Express header for security
    app.disable("x-powered-by");

    // start express server
    app.listen(env.PORT);

    // Error handling
    app.use((err: any, req: Request, res: Response, next: NextFunction) => {
      console.log(err);
      res.status(err.status || 500).send(err.stack);
    });

    console.log(
      `Express server has started on port ${env.PORT}. Open http://localhost:${env.PORT}/ to see results`
    );
  })
  .catch((error) => console.log(error));
