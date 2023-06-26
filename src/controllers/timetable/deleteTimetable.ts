import { Request, Response } from "express";
import { timetableRepository } from "../../repositories/timetableRepository";
import { Timetable } from "../../entity/Timetable";
import { z } from "zod";
import { validate } from "../../utils/zodValidateBody";
import { User } from "../../entity/User";
import { userRepository } from "../../repositories/userRepository";

const dataSchema = z.object({
  // auth temp replacement
  body: z.object({
    email: z
      .string({
        invalid_type_error: "email not a string",
        required_error: "email is a required body parameter",
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
  params: z.object({
    id: z.coerce
      .number({
        invalid_type_error: "id not a number",
        required_error: "id is a required path parameter",
      })
      .positive({
        message: "invalid id",
      })
      .int({
        message: "invalid id",
      }),
  }),
});

export const deleteTimeTableValidator = validate(dataSchema);

export const deleteTimetable = async (req: Request, res: Response) => {
  try {
    const author: User | null = await userRepository.findOne({
      where: { email: req.body.email },
    });
    if (!author) {
      return res.json({ message: "unregistered user" });
    }
    const id: number = parseInt(req.params.id);
    const timetable: Timetable | null = await timetableRepository.findOne({
      where: { id },
    });
    if (!timetable) {
      return res.status(404).json({ message: "timetable not found" });
    }
    const owns: boolean =
      (await timetableRepository
        .createQueryBuilder("timetable")
        .where("timetable.id = :id", { id: timetable.id })
        .andWhere("timetable.author = :author", { author: author.id })
        .getCount()) > 0;
    if (!owns) {
      return res.status(403).json({ message: "user does not own timetable" });
    }
    await timetableRepository.delete({ id });
    return res.json({ message: "timetable deleted" });
  } catch (err: any) {
    // will replace the console.log with a logger when we have one
    console.log(err.message);

    return res.status(500).json({ message: "Internal Server Error" });
  }
};