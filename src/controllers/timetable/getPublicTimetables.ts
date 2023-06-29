import { Request, Response } from "express";
import { Timetable } from "../../entity/Timetable";
import { timetableRepository } from "../../repositories/timetableRepository";
import { User } from "../../entity/User";
import { userRepository } from "../../repositories/userRepository";
import { z } from "zod";
import { validate } from "../../utils/zodValidateRequest";

import {
    DegreeList,
    DegreeZodList,
    isAValidDegreeCombination,
  } from "../../types/degrees";

const dataSchema = z.object({
    query : z.object({
        year: z.coerce
            .number({
                invalid_type_error : "year is not a number"
            })
            .positive({
                message : "invalid year"
            })
            .int({
                message : "invalid year"
            }),
        sem: z.coerce
            .number({
                invalid_type_error : "sem is not a number"
            })
            .gte(1 , {
                message : "invalid sem number (can only be 1 or 2)"
            })
            .lte(2 , {
                message : "invalid sem number (can only be 1 or 2)"
            }),
        branch: z.array(z.string())
            .min(1 , {
                message : "needs atleast one branch code"
            })
            .max(2 , {
                message : "cannot have more that two branch codes"
            })

    })
})

export const getPublicTimetablesValidator = validate(dataSchema)

export const getPublicTimetables = async (req : Request , res : Response) => {
    try{
        let branch: string[] = req.query.branch as string[];
        if (branch.length === 2 && !isAValidDegreeCombination(branch)) {
            return res.status(400).json({
            message: "Branch may only have one valid BE degree and one valid MSc degee",
            });
        }
    }
    catch(err : any){
        return err
    }
    res.json({message : "ok"})
}