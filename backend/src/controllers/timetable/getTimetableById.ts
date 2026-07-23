import type { Request, Response } from "express";
import { timetableIDType } from "lib";
import { z } from "zod";
import { validate } from "../../middleware/zodValidateRequest.js";
import { timetableRepository } from "../../repositories/index.js";
import { decodeTimetableSqidOr404 } from "./helpers.js";

const dataSchema = z.object({
  params: z.object({
    id: timetableIDType,
  }),
});

export const getTimetableByIdValidator = validate(dataSchema);

export const getTimetableById = async (req: Request, res: Response) => {
  const logger = req.log;
  try {
    const id = req.params.id as string;
    const dbID = decodeTimetableSqidOr404(req, res);
    if (dbID === null) {
      return;
    }

    const timetable = await timetableRepository
      .createQueryBuilder("timetable")
      .leftJoinAndSelect("timetable.sections", "section")
      .where("timetable.id = :id", { id: dbID[0] })
      .getOne();

    if (!timetable) {
      return res.status(404).json({ message: "Timetable does not exist" });
    }

    return res.json({ ...timetable, id: id });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
