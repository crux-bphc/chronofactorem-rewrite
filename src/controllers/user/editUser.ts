import { Request, Response } from "express";
import { userRepository } from "../../repositories/userRepository";
import { validate } from "../../utils/zodValidateRequest";
import { z } from "zod";
import { User } from "../../entity/User";
import {
  DegreeList,
  DegreeZodList,
  isAValidDegreeCombination,
} from "../../types/degrees";

// auth temp replacement
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
      .regex(
        /^([A-Z0-9_+-]+\.?)*[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i,
        {
          message: "email must be a valid email",
        }
      ),
    degrees: DegreeZodList.min(1, {
      message: "degrees must be a non-empty array of valid degree strings",
    }).max(2, {
      message: "degrees may not contain more than two elements",
    }),
  }),
});

export const editUserValidator = validate(dataSchema);

export const editUser = async (req: Request, res: Response) => {
  try {
    let author: User | null = null;

    // this try-catch block will be removed when auth is added
    try {
      author = await userRepository
        .createQueryBuilder("user")
        .where("user.email = :email", { email: req.body.email })
        .getOne();
    } catch (err: any) {
      // will replace the console.log with a logger when we have one
      console.log("Error while querying for user: ", err.message);

      res.status(500).json({ message: "Internal Server Error" });
    }

    if (!author) {
      return res.status(404).json({ message: "User not found" });
    }

    const degrees: DegreeList = req.body.degrees;

    if (degrees.length === 2 && !isAValidDegreeCombination(degrees)) {
      return res.status(400).json({
        message: "Dualites may only have one BE degree and one MSc degee",
      });
    }

    try {
      await userRepository.manager.transaction(
        async (transactionalEntityManager) => {
          // Update degrees for user
          await transactionalEntityManager
            .createQueryBuilder()
            .update("user")
            .set({ degrees })
            .where("email = :email", { email: req.body.email })
            .execute();

          // Update degrees for user's timetables
          await transactionalEntityManager
            .createQueryBuilder()
            .update("timetable")
            .set({ degrees })
            .where("author = :author", { author: author?.id })
            .execute();
        }
      );
    } catch (err: any) {
      // will replace the console.log with a logger when we have one
      console.log("Error editing degrees: ", err.message);

      return res.status(500).json({ message: "Internal Server Error" });
    }

    return res.json({ message: "User details updated successfully" });
  } catch (err: any) {
    throw err;
  }
};
