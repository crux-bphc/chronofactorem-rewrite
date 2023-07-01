import { Request, Response } from "express";
import { Timetable } from "../../entity/Timetable";
import { timetableRepository } from "../../repositories/timetableRepository";
import { User } from "../../entity/User";
import { userRepository } from "../../repositories/userRepository";
import { z } from "zod";
import { validate } from "../../utils/zodValidateRequest";
import { DegreeList, DegreeZodList } from "../../types/degrees";

import {
    isAValidDegreeCombination,
  } from "../../types/degrees";

const dataSchema = z.object({

    query : z.object({
        // temp auth replacement
        email: z.string({
            invalid_type_error: "email not a string",
            required_error: "email is a required path parameter",
        }),
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
        branch: DegreeZodList.min(1, {
            message: "degrees must be a non-empty array of valid degree strings",
            }).max(2, {
            message: "degrees may not contain more than two elements",
            }),

    })
})

export const getPublicTimetablesValidator = validate(dataSchema)

export const getPublicTimetables = async (req : Request , res : Response) => {
    try{
        let user: User | null = null;
        try {
            // get user email from the cookie later, for now it's passed as a query param
            user = await userRepository
              .createQueryBuilder("user")
              .where("user.email = :email", { email: req.query.email })
              .getOne();
          } catch (err: any) {
            // will replace the console.log with a logger when we have one
            console.log("Error while querying for user: ", err.message);
      
            res.status(500).json({ message: "Internal Server Error" });
          }
      
          if (!user) {
            return res.status(404).json({ message: "User not found" });
          }

        let branch: DegreeList = req.query.branch as DegreeList;
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
            // will replace the console.log with a logger when we have one
            console.log("Error while querying timetable: ", err.message);
            res.status(500).json({ message: "Internal Server Error" });
        }
    }
    catch(err : any){    
        return err
    }
}