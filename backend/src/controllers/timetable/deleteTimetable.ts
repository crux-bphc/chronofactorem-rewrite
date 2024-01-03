import { Request, Response } from "express";
import { z } from "zod";
import { timetableIDType } from "../../../../lib/src/index.js";
import { Timetable, User } from "../../entity/entities.js";
import { validate } from "../../middleware/zodValidateRequest.js";
import { timetableRepository } from "../../repositories/timetableRepository.js";
import { userRepository } from "../../repositories/userRepository.js";
import sqids, { validSqid } from "../../sqids.js";

const dataSchema = z.object({
  params: z.object({
    id: timetableIDType,
  }),
});

export const deleteTimeTableValidator = validate(dataSchema);

export const deleteTimetable = async (req: Request, res: Response) => {
  let author: User | null = null;

  try {
    author = await userRepository
      .createQueryBuilder("user")
      .where("user.id = :id", { id: req.session?.id })
      .getOne();
  } catch (err: any) {
    // will replace the console.log with a logger when we have one
    console.log("Error while querying user: ", err.message);

    return res.status(500).json({ message: "Internal Server Error" });
  }

  if (!author) {
    return res.status(401).json({ message: "unregistered user" });
  }

  const dbID = sqids.decode(req.params.id);
  if (!validSqid(dbID)) {
    return res.status(404).json({ message: "Timetable does not exist" });
  }

  let timetable: Timetable | null = null;

  try {
    timetable = await timetableRepository
      .createQueryBuilder("timetable")
      .where("timetable.id = :id", { id: dbID[0] })
      .getOne();
  } catch (err: any) {
    // will replace the console.log with a logger when we have one
    console.log("Error while querying timetable: ", err.message);

    return res.status(500).json({ message: "Internal Server Error" });
  }

  if (!timetable) {
    return res.status(404).json({ message: "timetable not found" });
  }

  if (timetable.authorId !== author.id) {
    return res.status(403).json({ message: "user does not own timetable" });
  }

  try {
    await timetableRepository
      .createQueryBuilder("timetable")
      .delete()
      .where("timetable.id = :id", { id: timetable.id })
      .execute();
  } catch (err: any) {
    // will replace the console.log with a logger when we have one
    console.log("Error while deleting timetable: ", err.message);

    res.status(500).json({ message: "Internal Server Error" });
  }

  return res.json({ message: "timetable deleted" });
};
