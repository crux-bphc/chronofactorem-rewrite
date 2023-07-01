import { Request, Response } from "express";
import { Timetable } from "../../entity/Timetable";
import { timetableRepository } from "../../repositories/timetableRepository";
import { z } from "zod";
import { validate } from "../../utils/zodValidateRequest";

import {
    isAValidDegreeCombination,
  } from "../../types/degrees";

const dataSchema = z.object({
      // auth temp replacement
    body: z.object({
        email: z
        .string({
            invalid_type_error: "email not a string",
            required_error: "email is a required body parameter",
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
    }),

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
            })
            .optional(),
        sem: z.coerce
            .number({
                invalid_type_error : "sem is not a number"
            })
            .gte(1 , {
                message : "invalid sem number (can only be 1 or 2)"
            })
            .lte(2 , {
                message : "invalid sem number (can only be 1 or 2)"
            })
            .optional(),
        branch: z.array(z.string())
            .min(1 , {
                message : "needs atleast one branch code"
            })
            .max(2 , {
                message : "cannot have more that two branch codes"
            })
            .optional()

    })
})

export const getPublicTimetablesValidator = validate(dataSchema)

export const getPublicTimetables = async (req : Request , res : Response) => {
    try{
        let branch: string[] = req.query.branch as string[];
        let year: number = parseInt(req.query.year as string);
        let sem: number = parseInt(req.query.sem as string);
        let isPrivate: boolean = false

        const queryBuilder = timetableRepository
            .createQueryBuilder("timetable")
            .select(["timetable.id", "timetable.name", "timetable.lastUpdated", "timetable.createdAt", "timetable.degrees"])
            .where("timetable.private = :isPrivate" , { isPrivate })

        if(branch){
            if (branch.length === 2 && !isAValidDegreeCombination(branch)) {
                return res.status(400).json({
                message: "Branch may only have one valid BE degree and one valid MSc degee",
                });
            }
            queryBuilder.andWhere("timetable.degrees = :branch", { branch })
            
        }

        if(year)
            queryBuilder.andWhere("timetable.year = :year" , { year })

        if(sem)     
            queryBuilder.andWhere("timetable.semester = :sem" , { sem })

        try { 
            let timetables: Timetable[] | null = null;
            timetables = await queryBuilder.getMany();

            return res.json(timetables)
        } catch (err: any) {
            console.log("Error while querying timetable: ", err.message);
            res.status(500).json({ message: "Internal Server Error" });
        }
    }
    catch(err : any){    
        return err
    }
}