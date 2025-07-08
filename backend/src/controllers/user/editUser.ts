import type { Request, Response } from "express";
import { z } from "zod";
import {
  type degreeList,
  isAValidDegreeCombination,
  namedDegreeZodList,
} from "../../../../lib/src/index.js";
import { validate } from "../../middleware/zodValidateRequest.js";
import { userRepository } from "../../repositories/userRepository.js";

const dataSchema = z.object({
  body: z.object({
    degrees: namedDegreeZodList("user")
      .min(1, {
        message:
          "user degrees must be a non-empty array of valid degree strings",
      })
      .max(2, {
        message: "user degrees may not contain more than two elements",
      }),
  }),
});

export const editUserValidator = validate(dataSchema);

export const editUser = async (req: Request, res: Response) => {
  const logger = req.log;
  const degrees: degreeList = req.body.degrees;

  if (degrees.length === 2 && !isAValidDegreeCombination(degrees)) {
    return res.status(400).json({
      message: "Dualites may only have one BE degree and one MSc degee",
    });
  }

  try {
    await userRepository
      .createQueryBuilder()
      .update("user")
      .set({ degrees })
      .where("id = :id", { id: req.session?.id })
      .returning("*")
      .execute()
      .then((response) => {
        return response.raw[0].id;
      });
  } catch (err: any) {
    logger.error("Error editing degrees: ", err.message);

    return res.status(500).json({ message: "Internal Server Error" });
  }

  return res.json({ message: "User details updated successfully" });
};
