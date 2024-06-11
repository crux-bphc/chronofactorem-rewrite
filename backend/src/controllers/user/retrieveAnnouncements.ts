import { Request, Response } from "express";
import { announcementRepository } from "../../repositories/anouncementRepository.js";
import { namedNonEmptyStringType } from "../../../../lib/src/zodFieldTypes.js";
import { validate } from "../../middleware/zodValidateRequest.js";
import { z } from "zod";
const announcementSchema = z.object({
  body: z.object({
    title: namedNonEmptyStringType("title"),
    message: namedNonEmptyStringType("message"),
  }),
});
export const getAnnouncementValidator = validate(announcementSchema);
export const getAllAnnouncements = async (req: Request, res: Response) => {
  try {
    const announcements = await announcementRepository
      .createQueryBuilder("announcement")
      .getMany();

    return res.status(200).json(announcements);
  } catch (err) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
