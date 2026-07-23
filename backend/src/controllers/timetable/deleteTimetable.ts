import type { Request, Response } from "express";
import { timetableIDType } from "lib";
import { z } from "zod";
import { validate } from "../../middleware/zodValidateRequest.js";
import { timetableRepository } from "../../repositories/index.js";
import {
  decodeTimetableSqidOr404,
  fetchAuthorOrError,
  fetchTimetableOrError,
  queryOr500,
} from "./helpers.js";

const dataSchema = z.object({
  params: z.object({
    id: timetableIDType,
  }),
});

export const deleteTimeTableValidator = validate(dataSchema);

export const deleteTimetable = async (req: Request, res: Response) => {
  const logger = req.log;
  const author = await fetchAuthorOrError(
    req,
    res,
    logger,
    "Error while querying user: ",
  );
  if (!author) {
    return;
  }

  const dbID = decodeTimetableSqidOr404(req, res);
  if (dbID === null) {
    return;
  }

  const timetable = await fetchTimetableOrError(res, logger, dbID, {
    authorId: author.id,
    queryErrorLogMessage: "Error while querying timetable: ",
  });
  if (!timetable) {
    return;
  }

  const deleted = await queryOr500(
    res,
    logger,
    "Error while deleting timetable: ",
    () =>
      timetableRepository
        .createQueryBuilder("timetable")
        .delete()
        .where("timetable.id = :id", { id: timetable.id })
        .execute(),
  );
  if (deleted === undefined) {
    return;
  }
  return res.json({ message: "timetable deleted" });
};
