import { NextFunction, Request, Response } from "express";
import { ZodFinishedUserSession } from "../types/auth";
import { env } from "../config/server";
import jwt from "jsonwebtoken";
import { createHash } from "crypto";

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (
      req.cookies["__secure-fingerprint"] === undefined ||
      req.headers.authorization === undefined
    ) {
      return res.status(401).json({
        message: "unauthorized",
        error: "user session expired",
      });
    }
    const token = ZodFinishedUserSession.safeParse(
      jwt.verify(
        req.headers.authorization.replace("Bearer ", ""),
        Buffer.from(env.JWT_PUBLIC_KEY, "base64")
      )
    );
    if (typeof token === "string" || !token.success) {
      return res.status(401).json({
        message: "unauthorized",
        error: "user session malformed",
      });
    }
    const payload = token.data;
    const fingerprint = req.cookies["__secure-fingerprint"];
    if (
      createHash("sha256").update(fingerprint).digest("base64url") !==
      payload.fingerprint
    ) {
      return res.status(401).json({
        message: "unauthorized",
        error: "user session malformed",
      });
    }
    req.session = payload;
    return next();
  } catch (error) {
    return res.status(500).json(error);
  }
};
