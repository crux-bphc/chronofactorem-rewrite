import { Request, Response } from "express";
import { z } from "zod";
import {
  namedCollegeYearType,
  namedIntegerType,
  namedNonEmptyStringType,
  namedSemesterType,
  namedShortBITSIDType,
  namedYearType,
} from "../../../../lib/src/index.js";
import { namedDegreeZodList } from "../../../../lib/src/index.js";
import { env } from "../../config/server.js";
import { Timetable } from "../../entity/entities.js";
import { validate } from "../../middleware/zodValidateRequest.js";

const searchTimetableSchema = z.object({
  query: z.object({
    query: namedNonEmptyStringType("search query"),
    // note that this implies a limit of 500 on the number of search results
    from: namedIntegerType("search results start index")
      .gte(0, {
        message: "invalid search results start index",
      })
      .lte(500, {
        message: "invalid search results start index",
      })
      .optional(),
    year: namedCollegeYearType("search filter").optional(),
    name: namedNonEmptyStringType("search filter timetable name").optional(),
    authorId: namedShortBITSIDType("search filter").optional(),
    acadYear: namedYearType("search filter acad").optional(),
    semester: namedSemesterType("search filter").optional(),
    degrees: namedDegreeZodList("search filter")
      .min(1, {
        message: "degrees must be a non-empty array of valid degree strings",
      })
      .max(2, {
        message: "degrees may not contain more than two elements",
      })
      .optional(),
    courseQuery: namedNonEmptyStringType("search filter course query")
      .array()
      .optional(),
    instructorQuery: namedNonEmptyStringType("search filter instructor query")
      .array()
      .optional(),
  }),
});

export const searchTimetableValidator = validate(searchTimetableSchema);

export const searchTimetable = async (req: Request, res: Response) => {
  const logger = req.log;
  try {
    const {
      query,
      from,
      year,
      name,
      authorId,
      acadYear,
      semester,
      degrees,
      courseQuery,
      instructorQuery,
    } = req.query;

    const usefulQueryParams = {
      from,
      year,
      name,
      authorId,
      acadYear,
      semester,
      degree: degrees,
      course: courseQuery,
      instructor: instructorQuery,
    };

    let searchServiceURL = `${env.SEARCH_SERVICE_URL}/timetable/search?query=${query}`;

    for (const [key, value] of Object.entries(usefulQueryParams)) {
      if (value === undefined) continue;
      if (Array.isArray(value)) {
        for (const v of value) {
          searchServiceURL += `&${key}=${v}`;
        }
      } else {
        searchServiceURL += `&${key}=${value}`;
      }
    }

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
