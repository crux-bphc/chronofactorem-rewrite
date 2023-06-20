import { Request, Response } from "express";
import { z } from "zod";
import { validate } from "../../utils/zodValidateBody.";
import { timetableRepository } from "../../repositories/timetableRepository";

const dataSchema = z.object({
  body: z.object({
    email: z
      .string({
        invalid_type_error: "email not a string",
        required_error: "email is a required path parameter",
      })
      .min(0, {
        message: "email must be a non-empty string",
      })
      .email({
        message: "email provided is not a valid email",
      }),
  }),
  // similarly, you can also verify query params using `query`
  params: z.object({
    id: z.coerce
      .number({
        invalid_type_error: "id not a number",
        required_error: "id is a required path parameter",
      })
      .positive({
        message: "invalid id",
      })
      .int({
        message: "invalid id",
      }),
  }),
});

export const deleteTimeTableValidator = validate(dataSchema);

export const deleteTimeTable = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  // email extracted from body will be replaced with auth function later
  const email: string = req.body.email;

  const timetable = await timetableRepository.findOne({ where: { id } });
  if (!timetable) {
    return res
      .status(404)
      .json({ result: "error", message: "timetable not found" });
  }

  if (timetable.author.email !== email) {
    return res.status(403).json({
      result: "error",
      message: "you are not the author of this timetable",
    });
  }

  const deleted = timetableRepository.remove(timetable);

  return res.status(200).json(deleted);
};
