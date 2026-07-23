import type { NextFunction, Request, Response } from "express";
import { ZodError, type ZodType } from "zod";

export const validate =
  (schema: ZodType<any>) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: error.issues[0].message });
      }
      return next(error);
    }
  };
