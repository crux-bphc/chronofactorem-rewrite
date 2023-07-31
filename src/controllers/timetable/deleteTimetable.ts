import { Request, Response } from "express";
import { timetableRepository } from "../../repositories/timetableRepository";
import { Timetable } from "../../entity/Timetable";
import { z } from "zod";
import { validate } from "../../middleware/zodValidateRequest";
import { User } from "../../entity/User";
import { userRepository } from "../../repositories/userRepository";
import { timetableIDType } from "../../types/zodFieldTypes";

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
