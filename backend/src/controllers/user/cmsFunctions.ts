import fetch from "cross-fetch";
import { Request, Response } from "express";
import { z } from "zod";
import {
  namedIntegerType,
  namedNonEmptyStringType,
} from "../../../../lib/src/index.js";
import { validate } from "../../middleware/zodValidateRequest.js";

const unenrollDataSchema = z.object({
  body: z.object({
    enrollID: namedIntegerType("enrollID"),
    sesskey: namedNonEmptyStringType("sesskey"),
    cookie: namedNonEmptyStringType("cookie"),
  }),
});

export const unenrollValidator = validate(unenrollDataSchema);

export const unenroll = async (req: Request, res: Response) => {
  const enrollID: number = req.body.enrollID;
  const sesskey: string = req.body.sesskey;
  const cookie: string = req.body.cookie;

  try {
    const unenrolResponse = await fetch(
      `https://cms.bits-hyderabad.ac.in/enrol/self/unenrolself.php?confirm=1&enrolid=${enrollID}&sesskey=${sesskey}`,
      {
        method: "GET",
        headers: {
          cookie: `MoodleSession=${cookie};`,
        },
      },
    );
    return res.status(unenrolResponse.status).end();
  } catch (err: any) {
    // will replace the console.log with a logger when we have one
    console.log("Error unenrolling from course: ", err.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
