import { Request, Response } from "express";
import { timetableRepository } from "../../repositories/timetableRepository";
import { Timetable } from "../../entity/Timetable";
import { z } from "zod";
import { validate } from "../../utils/zodValidateBody";
import { DegreeEnum } from "../../types/degrees";
import { Section } from "../../entity/Section";
import { User } from "../../entity/User";
import { userRepository } from "../../repositories/userRepository";

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
      author = await userRepository.findOne({
        where: { email: req.body.email },
      });
    } catch (err: any) {
      // will replace the console.log with a logger when we have one
      console.log("Error while querying for user: ", err.message);

      res.status(500).json({ message: "Internal Server Error" });
    }

    if (!author) {
      return res.status(404).json({ message: "User not found" });
    }

    let timetablesWhereDraftInName: Timetable[] = [];

    try {
      timetablesWhereDraftInName = await timetableRepository
        .createQueryBuilder("timetable")
        .where("timetable.authorId = :author", { author: author.id })
        .andWhere("timetable.name like :name", { name: "Draft %" })
        .getMany();
    } catch (err: any) {
      // will replace the console.log with a logger when we have one
      console.log("Error while querying for draft timetables: ", err.message);

      res.status(500).json({ message: "Internal Server Error" });
    }

    let draftNames = timetablesWhereDraftInName.map(
      (timetable) => timetable.name
    );

    draftNames = draftNames.filter((draftName) => {
      const secondWord = draftName.split(" ")[1];
      return !isNaN(parseInt(secondWord));
    });

    draftNames = draftNames.sort((a, b) => {
      const aDraftName = parseInt(a.split(" ")[1]);
      const bDraftName = parseInt(b.split(" ")[1]);
      return aDraftName - bDraftName;
    });

    if (draftNames.length === 0) {
      console.log("No draft timetable found");
      draftNames.push("Draft 0");
    }

    const latestDraftName = parseInt(
      draftNames[draftNames.length - 1].split(" ")[1]
    );

    // new timetable default properties
    const name: string = `Draft ${latestDraftName + 1}`;
    const degrees: DegreeEnum[] = author.degrees;
    const isPrivate: boolean = true;
    const isDraft: boolean = true;
    const sections: Section[] = [];
    const timings: string[] = [];
    const midsemTimes: Date[] = [];
    const compreTimes: Date[] = [];
    const warnings: string[] = [];
    const createdAt: Date = new Date();
    const lastUpdated: Date = new Date();

    try {
      const timetable: Timetable = await timetableRepository.create({
        author,
        name,
        degrees,
        private: isPrivate,
        draft: isDraft,
        sections,
        timings,
        midsemTimes,
        compreTimes,
        warnings,
        createdAt,
        lastUpdated,
      });

      await timetableRepository.save(timetable);

      return res.json(timetable);
    } catch (err: any) {
      // will replace the console.log with a logger when we have one
      console.log("Error while creating timetable: ", err.message);

      res.status(500).json({ message: "Internal Server Error" });
    }
  } catch (err: any) {
    throw err;
  }
};
