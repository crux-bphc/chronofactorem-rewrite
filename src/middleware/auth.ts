import { NextFunction, Request, Response } from "express";
import { FinishedUserSession, ZodFinishedUserSession } from "../types/auth";

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.cookies["session"] === undefined) {
      return res.status(401).json({
        message: "unauthorized",
        error: "user session expired",
      });
    } else if (
      !ZodFinishedUserSession.safeParse(req.cookies["session"]).success
    ) {
      return res.status(401).json({
        message: "unauthorized",
        error: "user session malformed",
      });
    }
    const session: FinishedUserSession = req.cookies["session"];
    req.session = session;
    return next();
  } catch (error) {
    return res.status(400).json(error);
  }
};
