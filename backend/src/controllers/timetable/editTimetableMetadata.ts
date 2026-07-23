import type { Request, Response } from "express";
import {
  namedBooleanType,
  namedNonEmptyStringType,
  timetableIDType,
} from "lib";
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
  body: z.object({
    name: namedNonEmptyStringType("timetable name"),
    isPrivate: namedBooleanType("timetable isPrivate"),
    isDraft: namedBooleanType("timetable isDraft"),
  }),
  params: z.object({
    id: timetableIDType,
  }),
});

export const editTimetableMetadataValidator = validate(dataSchema);

export const editTimetableMetadata = async (req: Request, res: Response) => {
  const logger = req.log;
  const name: string = req.body.name;
  const isPrivate: boolean = req.body.isPrivate;
  const isDraft: boolean = req.body.isDraft;

  const author = await fetchAuthorOrError(
    req,
    res,
    logger,
    "Error while querying user: ",
  );
  if (!author) {
    return;
  }

  if (isDraft && !isPrivate) {
    return res
      .status(400)
      .json({ message: "draft timetable can not be public" });
  }

  const dbID = decodeTimetableSqidOr404(req, res);
  if (dbID === null) {
    return;
  }

  const timetable = await fetchTimetableOrError(res, logger, dbID, {
    authorId: author.id,
    joinSections: true,
    queryErrorLogMessage: "Error while querying timetable: ",
  });
  if (!timetable) {
    return;
  }

  if (timetable.archived && isDraft) {
    return res
      .status(418)
      .json({ message: "archived timetable can not be a draft" });
  }

  if (
    timetable.draft &&
    timetable.sections.length === 0 &&
    (isDraft === false || isPrivate === false)
  ) {
    return res.status(400).json({
      message: "cannot publish empty timetable",
    });
  }

  if (
    timetable.warnings.length > 0 &&
    (isDraft === false || isPrivate === false)
  ) {
    return res.status(400).json({
      message: "cannot publish timetable with warnings",
    });
  }

  const saved = await queryOr500(
    res,
    logger,
    "Error while editing timetable: ",
    () =>
      timetableRepository.save({
        ...timetable,
        name: name,
        private: isPrivate,
        draft: isDraft,
      }),
  );
  if (saved === undefined) {
    return;
  }

  return res.json({ message: "timetable edited" });
};
