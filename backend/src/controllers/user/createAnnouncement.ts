import { Request, Response } from "express";
import { z } from "zod";
import { namedNonEmptyStringType } from "../../../../lib/src/zodFieldTypes.js";
import { env } from "../../config/server.js";
import { Announcement } from "../../entity/entities.js";
import { validate } from "../../middleware/zodValidateRequest.js";
import { announcementRepository } from "../../repositories/anouncementRepository.js";

const announcementSchema = z.object({
  body: z.object({
    chronoSecret: namedNonEmptyStringType("chrono secret"),
    message: namedNonEmptyStringType("message"),
  }),
});

export const announcementValidator = validate(announcementSchema);

export const createAnnoucement = async (req: Request, res: Response) => {
  try {
    const { chronoSecret, message } = req.body;

    if (env.CHRONO_SECRET !== chronoSecret) {
      return res.status(401).json({ message: "Chrono Secret is incorrect" });
    }

    await announcementRepository
      .createQueryBuilder()
      .insert()
      .into(Announcement)
      .values({
        message,
      })
      .execute();

    return res
      .status(201)
      .json({ message: "Announcement Created Successfully" });
  } catch (err) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
