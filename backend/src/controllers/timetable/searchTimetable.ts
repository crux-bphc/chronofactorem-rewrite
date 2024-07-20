import { Request, Response } from "express";
import { z } from "zod";
import { namedNonEmptyStringType } from "../../../../lib/src/zodFieldTypes.js";
import { env } from "../../config/server.js";
import { validate } from "../../middleware/zodValidateRequest.js";

const searchTimetableSchema = z.object({
  query: z.object({
    query: namedNonEmptyStringType("query"),
  }),
});

export const searchTimetableValidator = validate(searchTimetableSchema);

export const searchTimetable = async (req: Request, res: Response) => {
  try {
    const { query } = req.query;

    const searchServiceURL = `${env.SEARCH_SERVICE_URL}/timetable/search?query=${query}`;

    const response = await fetch(searchServiceURL, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const timetables = await response.json();

    if (!timetables.ok) {
      console.log("Error while searching timetable: ", timetables.error);
      return res.status(500).json({ message: "Internal Server Error" });
    }

    return res.json(timetables);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
