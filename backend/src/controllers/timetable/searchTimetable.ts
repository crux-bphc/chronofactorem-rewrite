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
    query: namedNonEmptyStringType("search query").optional(),
    // note that this implies a limit of 500 on the number of search results
    page: namedIntegerType("search results page")
      .gte(0, {
        message: "invalid search results page",
      })
      .lte(50, {
        message: "invalid search results page",
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
      page,
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
      query,
      from: parseInt((page as string | undefined) ?? "0") * 12,
      year,
      name,
      authorId,
      acadYear,
      semester,
      degree: degrees,
      course: courseQuery,
      instructor: instructorQuery,
    };

    let searchServiceURL = `${env.SEARCH_SERVICE_URL}/timetable/search?`;

    for (const [key, value] of Object.entries(usefulQueryParams)) {
      if (value === undefined) continue;
      if (Array.isArray(value)) {
        for (const v of value) {
          searchServiceURL += `${key}=${v}&`;
        }
      } else {
        searchServiceURL += `${key}=${value}&`;
      }
    }

    if (searchServiceURL.endsWith("&")) {
      searchServiceURL = searchServiceURL.substring(
        0,
        searchServiceURL.length - 1,
      );
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
