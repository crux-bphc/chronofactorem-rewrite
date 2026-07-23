import type { NextFunction, Request, Response } from "express";
import { ZodFinishedUserSession } from "../types/auth.js";
import { getSessionFromCookies } from "../utils/authUtils.js";

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const sessionData = getSessionFromCookies(req);
  if (sessionData === null) {
    return res.status(401).json({
      message: "unauthorized",
      error: "invalid user session",
    });
  }

  const parsedSession = ZodFinishedUserSession.safeParse(sessionData);
  if (!parsedSession.success) {
    return res.status(401).json({
      message: "unauthorized",
      error: "user session malformed",
    });
  }
  req.session = parsedSession.data;
  return next();
};
