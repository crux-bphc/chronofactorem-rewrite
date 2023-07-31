import { Request, Response } from "express";
import { userRepository } from "../../repositories/userRepository";
import { validate } from "../../middleware/zodValidateRequest";
import { z } from "zod";
import { User } from "../../entity/User";
import { namedEmailType, namedUUIDType } from "../../types/zodFieldTypes";

const dataSchema = z.object({
  params: z.object({
    id: namedUUIDType("user"),
  }),
  // auth temp replacement
  query: z.object({
    authEmail: namedEmailType("user"),
  }),
});

export const getUserDetailsValidator = validate(dataSchema);

export const getUserDetails = async (req: Request, res: Response) => {
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
        "timetable.acadYear",
        "timetable.semester",
        "timetable.createdAt",
        "timetable.lastUpdated",
      ])
      .where("user.id = :id", { id })
      .getOne();
  } catch (err: any) {
    // will replace the console.log with a logger when we have one
    console.log("Error while querying for user: ", err.message);
    res.status(500).json({ message: "Internal Server Error" });
  }

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  return res.json(user);
};
