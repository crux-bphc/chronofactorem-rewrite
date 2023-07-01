import express from "express";
import bodyParser from "body-parser";
import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "./db";
import userRouter from "./routers/userRouter";
import timetableRouter from "./routers/timetableRouter";
import "dotenv/config";
import { env } from "./config/server";
import { timetableRepository } from "./repositories/timetableRepository";
import { userRepository } from "./repositories/userRepository";

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

    await userRepository.insert({
      batch: 21,
      name: "Arunachala",
      degrees: ["A7"],
      email: "f20210205@hyderabad.bits-pilani.ac.in",
      timetables: [],
    });
    const author = await userRepository.findOne({
      where: { email: "f20210205@hyderabad.bits-pilani.ac.in" },
    });

    if (!author) {
      return;
    }

    await timetableRepository.insert({
      name: "Draft Timetable",
      author: author,
      degrees: ["A7"],
      private: true,
      draft: true,
      archived: false,
      year: 1,
      acadYear: 2021,
      semester: 1,
      sections: [],
      timings: [],
      examTimes: [],
      warnings: [],
    });

    const timetable = await timetableRepository.findOne({
      where: { name: "Draft Timetable" },
    });

    if (!timetable) {
      return;
    }

    console.log(timetable);
    console.log(author);

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
