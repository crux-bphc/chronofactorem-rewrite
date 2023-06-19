import * as express from "express";
import * as bodyParser from "body-parser";
import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "./db";
import userRouter from "./routers/userRouter";
import "dotenv/config";
import { env } from "./config/server";
import { userRepository } from "./repositories/userRepository";

AppDataSource.initialize()
  .then(async () => {
    // create express app
    const app = express();
    app.use(bodyParser.json());

    // register express routers from defined application routers
    app.use("/user", userRouter);

    // Add sample users
    userRepository.insert({
      batch: 21,
      name: "Soumitra",
      degrees: ["B3", "A7"],
      email: "f20210781@hyderabad.bits-pilani.ac.in",
      timetables: [],
    });

    userRepository.insert({
      batch: 21,
      name: "Arunachala",
      degrees: ["A7"],
      email: "f20210205@hyderabad.bits-pilani.ac.in",
      timetables: [],
    });

    // setup express app here
    // ...

    // Disable Express header for security
    app.disable("x-powered-by");

    // start express server
    app.listen(env.PORT);

    // Error handling
    app.use((err, req: Request, res: Response, next: NextFunction) => {
      console.log(err);
      res.status(err.status || 500).send(err.stack);
    });

    console.log(
      `Express server has started on port ${env.PORT}. Open http://localhost:${env.PORT}/ to see results`
    );
  })
  .catch((error) => console.log(error));
