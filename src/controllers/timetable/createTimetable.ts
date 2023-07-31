import { Request, Response } from "express";
import { timetableRepository } from "../../repositories/timetableRepository";
import { Timetable } from "../../entity/Timetable";
import { z } from "zod";
import { validate } from "../../utils/zodValidateRequest";
import { degreeEnum } from "../../types/degrees";
import { Section } from "../../entity/Section";
import { User } from "../../entity/User";
import { userRepository } from "../../repositories/userRepository";
import timetableJSON from "../../timetable.json";
import { namedEmailType } from "../../types/zodFieldTypes";

// auth temp replacement
const dataSchema = z.object({
  body: z.object({
    email: namedEmailType("user"),
  }),
});

export const createTimeTableValidator = validate(dataSchema);

export const createTimetable = async (req: Request, res: Response) => {
  let author: User | null = null;

  try {
    author = await userRepository
      .createQueryBuilder("user")
      .where("user.email = :email", { email: req.body.email })
      .getOne();
  } catch (err: any) {
    // will replace the console.log with a logger when we have one
    console.log("Error while querying for user: ", err.message);

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

    return res.status(201).json({
      message: "Timetable created successfully",
      id: createdTimetable.identifiers[0].id,
    });
  } catch (err: any) {
    // will replace the console.log with a logger when we have one
    console.log("Error while creating timetable: ", err.message);

    return res.status(500).json({ message: "Internal Server Error" });
  }
};
