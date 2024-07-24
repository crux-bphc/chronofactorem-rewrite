import { Request, Response } from "express";
import { z } from "zod";
import { namedNonEmptyStringType } from "../../../../lib/src/zodFieldTypes.js";
import { env } from "../../config/server.js";
import { Timetable } from "../../entity/entities.js";
import { validate } from "../../middleware/zodValidateRequest.js";

const searchTimetableSchema = z.object({
  query: z.object({
    query: namedNonEmptyStringType("query"),
  }),
});

export const searchTimetableValidator = validate(searchTimetableSchema);

export const searchTimetable = async (req: Request, res: Response) => {
  const logger = req.log;
  try {
    const { query } = req.query;

    const searchServiceURL = `${env.SEARCH_SERVICE_URL}/timetable/search?query=${query}`;

    const response = await fetch(searchServiceURL, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const searchResults = await response.json();

    if (!response.ok) {
      logger.error("Error while searching timetable: ", searchResults.error);
      return res.status(500).json({ message: "Internal Server Error" });
    }

    const timetables = searchResults.map(
      (el: { timetable: Timetable; score: string }) => el.timetable,
    );

    return res.json(timetables);
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
