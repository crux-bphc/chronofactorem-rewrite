import { Response } from "express";
import jwt from "jsonwebtoken";
import { createHash } from "crypto";
import { env } from "../config/server";

export const clearAuthCookies = (res: Response) => {
  res.clearCookie("fingerprint", {
    httpOnly: true,
    domain: env.FRONTEND_URL.replace("https://", "")
      .replace("http://", "")
      .split(":")[0],
    secure: true,
    sameSite: "lax",
  });
  res.clearCookie("session", {
    httpOnly: false,
    domain: env.FRONTEND_URL.replace("https://", "")
      .replace("http://", "")
      .split(":")[0],
    secure: true,
    sameSite: "lax",
  });
};

export const setAuthCookies = (
  res: Response,
  token: string,
  fingerprint: string,
  maxAge: number,
) => {
  res.cookie("session", token, {
    maxAge: maxAge,
    httpOnly: false,
    domain: env.FRONTEND_URL.replace("https://", "")
      .replace("http://", "")
      .split(":")[0],
    secure: true,
    sameSite: "lax",
  });
  res.cookie("fingerprint", fingerprint, {
    maxAge: maxAge,
    httpOnly: true,
    domain: env.FRONTEND_URL.replace("https://", "")
      .replace("http://", "")
      .split(":")[0],
    secure: true,
    sameSite: "lax",
  });
};

export const signJWT = (data: object, maxAge: number) => {
  return jwt.sign(data, Buffer.from(env.JWT_PRIVATE_KEY, "base64"), {
    algorithm: "RS256",
    expiresIn: maxAge,
  });
};

export const verifyJWT = (token: string) => {
  return jwt.verify(token, Buffer.from(env.JWT_PUBLIC_KEY, "base64"), {
    algorithms: ["RS256"],
  });
};

export const hashFingerprint = (fingerprintCookie: string) =>
  createHash("sha256").update(fingerprintCookie).digest("base64url");
