import { Request, Response } from "express";
import { z } from "zod";
import { namedUUIDType } from "../../../../lib/src/index.js";
import { User } from "../../entity/entities.js";
import { validate } from "../../middleware/zodValidateRequest.js";
import { userRepository } from "../../repositories/userRepository.js";
import sqids from "../../utils/sqids.js";

const dataSchema = z.object({
  params: z.object({
    id: namedUUIDType("user").optional(),
  }),
});

export const getUserDetailsValidator = validate(dataSchema);

export const getUserDetails = async (req: Request, res: Response) => {
  const logger = req.log;
  const id = req.params.id ?? req.session?.id;
  let user: User | null = null;

  try {
    user = await userRepository
      .createQueryBuilder("user")
      .leftJoin(
        "user.timetables",
        "timetable",
        "(user.id <> :id and timetable.private = :private and timetable.draft = :draft) or (user.id = :id)",
        {
          id: req.session?.id,
          draft: false,
          private: false,
        },
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

  return res.json({
    ...user,
    timetables: user.timetables.map((t) => {
      return { ...t, id: sqids.encode([t.id]) };
    }),
  });
};
