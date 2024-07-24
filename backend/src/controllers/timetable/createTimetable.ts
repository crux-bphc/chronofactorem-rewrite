import { Request, Response } from "express";
import { degreeEnum } from "../../../../lib/src/index.js";
import { Section, Timetable, User } from "../../entity/entities.js";
import { timetableRepository } from "../../repositories/timetableRepository.js";
import { userRepository } from "../../repositories/userRepository.js";
import timetableJSON from "../../timetable.json" with { type: "json" };
import sqids from "../../utils/sqids.js";

export const createTimetable = async (req: Request, res: Response) => {
  const logger = req.log;
  let author: User | null = null;

  try {
    author = await userRepository
      .createQueryBuilder("user")
      .where("user.id = :id", { id: req.session?.id })
      .getOne();
  } catch (err: any) {
    logger.error("Error while querying for user: ", err.message);

    return res.status(500).json({ message: "Internal Server Error" });
  }

  if (!author) {
    return res.status(401).json({ message: "unregistered user" });
  }

  // new timetable default properties
  const name = "Untitled Timetable";
  const degrees: degreeEnum[] = author.degrees;
  const isPrivate = true;
  const isDraft = true;
  const isArchived = false;
  const acadYear = timetableJSON.metadata.acadYear;
  const year: number = acadYear - author.batch + 1;
  const semester = timetableJSON.metadata.semester;
  const sections: Section[] = [];
  const timings: string[] = [];
  const examTimes: string[] = [];
  const warnings: string[] = [];
  const createdAt: Date = new Date();
  const lastUpdated: Date = new Date();
  const authorId: string = author.id;

  try {
    const createdTimetable = await timetableRepository
      .createQueryBuilder()
      .insert()
      .into(Timetable)
      .values({
        authorId,
        name,
        degrees,
        private: isPrivate,
        draft: isDraft,
        archived: isArchived,
        acadYear,
        semester,
        year,
        sections,
        timings,
        examTimes,
        warnings,
        createdAt,
        lastUpdated,
      })
      .execute();

    const timetableID = sqids.encode([createdTimetable.identifiers[0].id]);
    return res.status(201).json({
      message: "Timetable created successfully",
      id: timetableID,
    });
  } catch (err: any) {
    logger.error("Error while creating timetable: ", err.message);

    return res.status(500).json({ message: "Internal Server Error" });
  }
};
