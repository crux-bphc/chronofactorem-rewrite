import { Request, Response } from "express";
import { z } from "zod";
import { validate } from "../../middleware/zodValidateRequest";
import { userRepository } from "../../repositories/userRepository";
import {
  degreeList,
  isAValidDegreeCombination,
  namedDegreeZodList,
} from "../../../../lib";

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
  const degrees: degreeList = req.body.degrees;

  if (degrees.length === 2 && !isAValidDegreeCombination(degrees)) {
    return res.status(400).json({
      message: "Dualites may only have one BE degree and one MSc degee",
    });
  }

  try {
    await userRepository.manager.transaction(
      async (transactionalEntityManager) => {
        // Update degrees for user
        const authorId = await transactionalEntityManager
          .createQueryBuilder()
          .update("user")
          .set({ degrees })
          .where("id = :id", { email: req.session?.id })
          .returning("*")
          .execute()
          .then((response) => {
            return response.raw[0].id;
          });

        // Update degrees for user's timetables
        await transactionalEntityManager
          .createQueryBuilder()
          .update("timetable")
          .set({ degrees })
          .where("authorId = :author", { author: authorId })
          .execute();
      },
    );
  } catch (err: any) {
    // will replace the console.log with a logger when we have one
    console.log("Error editing degrees: ", err.message);

    return res.status(500).json({ message: "Internal Server Error" });
  }

  return res.json({ message: "User details updated successfully" });
};
