import { Request, Response } from "express";
import { timetableRepository } from "../../repositories/timetableRepository";
import { z } from "zod";
import { validate } from "../../utils/zodValidateRequest";
import { timetableIDType } from "../../types/zodFieldTypes";

const dataSchema = z.object({
  params: z.object({
    id: timetableIDType,
  }),
});

export const getTimetableByIdValidator = validate(dataSchema);

export const getTimetableById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const timetable = await timetableRepository
      .createQueryBuilder("timetable")
      .leftJoinAndSelect("timetable.sections", "section")
      .where("timetable.id = :id", { id })
      .getOne();

    if (!timetable) {
      return res.status(404).json({ message: "Timetable does not exist" });
    }

    return res.json(timetable);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
