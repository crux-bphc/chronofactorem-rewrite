import { Request, Response } from "express";
import { timetableRepository } from "../../repositories/timetableRepository";
import { Timetable } from "../../entity/Timetable";
import { z } from "zod";
import { validate } from "../../utils/zodValidateRequest";
import { DegreeEnum } from "../../types/degrees";
import { Section } from "../../entity/Section";
import { User } from "../../entity/User";
import { userRepository } from "../../repositories/userRepository";
import timetableJSON from "../../timetable.json";

// auth temp replacement
const dataSchema = z.object({
  body: z.object({
    email: z
      .string({
        invalid_type_error: "email not a string",
        required_error: "email is a required path parameter",
      })
      .min(0, {
        message: "email must be a non-empty string",
      })
      .regex(
        /^([A-Z0-9_+-]+\.?)*[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i,
        {
          message: "email must be a valid email",
        }
      ),
  }),
});

export const createTimeTableValidator = validate(dataSchema);

export const createTimetable = async (req: Request, res: Response) => {
  try {
    let author: User | null = null;

    try {
      author = await userRepository
        .createQueryBuilder("user")
        .where("user.email = :email", { email: req.body.email })
        .getOne();
    } catch (err: any) {
      // will replace the console.log with a logger when we have one
      console.log("Error while querying for user: ", err.message);

      res.status(500).json({ message: "Internal Server Error" });
    }

    if (!author) {
      return res.status(404).json({ message: "User not found" });
    }

    // new timetable default properties
    const name: string = "Untitled Timetable";
    const degrees: DegreeEnum[] = author.degrees;
    const isPrivate: boolean = false;
    const isDraft: boolean = false;
    const isArchived: boolean = false;
    const acadYear = timetableJSON.metadata.acadYear;
    const year: number = acadYear - author.batch + 1;
    const semester = timetableJSON.metadata.semester;
    const sections: Section[] = [];
    const timings: string[] = [];
    const examStartTimes: string[] = [];
    const examEndTimes: string[] = [];
    const warnings: string[] = [];
    const createdAt: Date = new Date();
    const lastUpdated: Date = new Date();

    try {
      await timetableRepository
        .createQueryBuilder()
        .insert()
        .into(Timetable)
        .values({
          author,
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
          examStartTimes,
          examEndTimes,
          warnings,
          createdAt,
          lastUpdated,
        })
        .execute();

      return res.json({ message: "Timetable created successfully" });
    } catch (err: any) {
      // will replace the console.log with a logger when we have one
      console.log("Error while creating timetable: ", err.message);

      res.status(500).json({ message: "Internal Server Error" });
    }
  } catch (err: any) {
    throw err;
  }
};
