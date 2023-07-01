import { Request, Response } from "express";
import { userRepository } from "../../repositories/userRepository";
import { validate } from "../../utils/zodValidateRequest";
import { z } from "zod";
import { User } from "../../entity/User";

const dataSchema = z.object({
  params: z.object({
    id: z
      .string({
        invalid_type_error: "id not a string",
        required_error: "id is a required path parameter",
      })
      .min(0, {
        message: "id must be a non-empty string",
      })
      .uuid({ message: "id must be a valid uuid" }),
  }),
  // auth temp replacement
  query: z.object({
    authEmail: z
      .string({
        invalid_type_error: "authEmail not a string",
        required_error: "authEmail is a required path parameter",
      })
      .min(0, {
        message: "authEmail must be a non-empty string",
      })
      .regex(
        /^([A-Z0-9_+-]+\.?)*[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i,
        {
          message: "authEmail must be a valid email",
        }
      ),
  }),
});

export const getUserDetailsValidator = validate(dataSchema);

export const getUserDetails = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const email = req.query.authEmail;
    let user: User | null = null;

    try {
      user = await userRepository
        .createQueryBuilder("user")
        .leftJoin(
          "user.timetables",
          "timetable",
          "(user.email <> :email and timetable.private = :private and timetable.draft = :draft) or (user.email = :email)",
          {
            email: email,
            draft: false,
            private: false,
          }
        )
        .select([
          "user",
          "timetable.id",
          "timetable.name",
          "timetable.degrees",
          "timetable.private",
          "timetable.draft",
          "timetable.archived",
          "timetable.year",
          "timetable.acad_year",
          "timetable.semester",
          "timetable.created_at",
          "timetable.last_updated",
        ])
        .where("user.id = :id", { id })
        .getOne();
    } catch (err: any) {
      // will replace the console.log with a logger when we have one
      console.log("Error while querying for user: ", err.message);
      return res.status(500).json({ message: "Internal Server Error" });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.json(user);
  } catch (err: any) {
    throw err;
  }
};
