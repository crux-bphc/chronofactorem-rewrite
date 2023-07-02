import { Request, Response } from "express";
import { Timetable } from "../../entity/Timetable";
import { timetableRepository } from "../../repositories/timetableRepository";
import { User } from "../../entity/User";
import { userRepository } from "../../repositories/userRepository";
import { z } from "zod";
import { validate } from "../../utils/zodValidateRequest";

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
        /^([A-Z0-9_+-]+\.?)*[A-Z0-9_+-]@([A-Z0-9][A-Z0-9-]*\.)+[A-Z]{2,}$/i,
        {
          message: "email must be a valid email",
        }
      ),
    name: z
      .string({
        invalid_type_error: "name not a string",
        required_error: "name is a required body parameter",
      })
      .min(0, { message: "name must be a non-empty string" }),
    isPrivate: z.boolean({
      invalid_type_error: "isPrivate not a boolean",
      required_error: "isPrivate is a required body parameter",
    }),
    isDraft: z.boolean({
      invalid_type_error: "isDraft not a boolean",
      required_error: "isDraft is a required body parameter",
    }),
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

export const editTimetableMetadataValidator = validate(dataSchema);

export const editTimetableMetadata = async (req: Request, res: Response) => {
  let author: User | null = null;

  try {
    author = await userRepository
      .createQueryBuilder("user")
      .where("user.email = :email", { email: req.body.email })
      .getOne();
  } catch (err: any) {
    // will replace the console.log with a logger when we have one
    console.log("Error while querying user: ", err.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }

  if (!author) {
    return res.status(401).json({ message: "unregistered user" });
  }

  const id: number = parseInt(req.params.id);

  let timetable: Timetable | null = null;

  try {
    timetable = await timetableRepository
      .createQueryBuilder("timetable")
      .where("timetable.id = :id", { id })
      .getOne();
  } catch (err: any) {
    // will replace the console.log with a logger when we have one
    console.log("Error while querying timetable: ", err.message);

    return res.status(500).json({ message: "Internal Server Error" });
  }

  if (!timetable) {
    return res.status(404).json({ message: "timetable not found" });
  }

  let owns = false;

  try {
    owns =
      (await timetableRepository
        .createQueryBuilder("timetable")
        .where("timetable.id = :id", { id: timetable.id })
        .andWhere("timetable.author = :author", { author: author.id })
        .getCount()) > 0;
  } catch (err: any) {
    // will replace the console.log with a logger when we have one
    console.log("Error while checking user owns timetable: ", err.message);

    return res.status(500).json({ message: "Internal Server Error" });
  }

  if (!owns) {
    return res.status(403).json({ message: "user does not own timetable" });
  }

  try {
    await timetableRepository
      .createQueryBuilder("timetable")
      .update()
      .set({ name: name, private: isPrivate, draft: isDraft })
      .where("timetable.id = :id", { id: timetable.id })
      .execute();
  } catch (err: any) {
    // will replace the console.log with a logger when we have one
    console.log("Error while editing timetable: ", err.message);

    res.status(500).json({ message: "Internal Server Error" });
  }

  return res.json({ message: "timetable edited" });
};
