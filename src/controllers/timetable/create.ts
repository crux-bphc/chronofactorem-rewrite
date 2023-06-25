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
  const numberOfDraftTimeTables: number = await timetableRepository.count({
    where: { draft: true, author: { email: req.body.email } },
  });

  const name: string = `Draft ${numberOfDraftTimeTables + 1}`;
  const author: User | null = await await userRepository.findOne({
    where: { email: req.body.email },
  });
  if (!author) {
    return res.json({ message: "unregistered user" });
  }

  // new timetable default properties
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
};
