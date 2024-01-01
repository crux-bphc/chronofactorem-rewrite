import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/server.js";
import { createHash } from "crypto";
import { ZodFinishedUserSession } from "../types/auth.js";

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (
      req.cookies.session === undefined ||
      req.cookies.fingerprint === undefined
    ) {
      return res.status(401).json({
        message: "unauthorized",
        error: "user session expired",
      });
    }

    const sessionCookie = req.cookies.session;
    const fingerprintCookie = req.cookies.fingerprint;

    const sessionData = jwt.verify(
      sessionCookie,
      Buffer.from(env.JWT_PUBLIC_KEY, "base64"),
      {
        algorithms: ["RS256"],
      },
    );

    if (typeof sessionData === "string") {
      return res.status(401).json({
        message: "user session malformed",
        error: "user session malformed",
      });
    }

    if (
      sessionData.fingerprintHash !==
      createHash("sha256").update(fingerprintCookie).digest("base64url")
    ) {
      return res.status(401).json({
        message: "user session malformed",
        error: "user fingerprint malformed",
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
  } catch (error) {
    return res.status(500).json(JSON.stringify(error));
  }
};
