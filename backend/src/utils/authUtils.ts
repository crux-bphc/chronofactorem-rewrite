import { createHash } from "node:crypto";
import type { Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/server.js";

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
    // maxAge is in milliseconds, but jsonwebtoken reads expiresIn as seconds
    expiresIn: Math.floor(maxAge / 1000),
  });
};

export const verifyJWT = (token: string) => {
  return jwt.verify(token, Buffer.from(env.JWT_PUBLIC_KEY, "base64"), {
    algorithms: ["RS256"],
  });
};

export const hashFingerprint = (fingerprintCookie: string) =>
  createHash("sha256").update(fingerprintCookie).digest("base64url");

const PKCE_COOKIE_MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes

// stores the per-request pkce verifier and state so the auth callback can
// verify the token exchange belongs to this login attempt
export const setPkceCookies = (
  res: Response,
  verifier: string,
  state: string,
) => {
  res.cookie("pkce_verifier", verifier, {
    maxAge: PKCE_COOKIE_MAX_AGE_MS,
    httpOnly: true,
    domain: env.FRONTEND_URL.replace("https://", "")
      .replace("http://", "")
      .split(":")[0],
    secure: true,
    sameSite: "lax",
  });
  res.cookie("pkce_state", state, {
    maxAge: PKCE_COOKIE_MAX_AGE_MS,
    httpOnly: true,
    domain: env.FRONTEND_URL.replace("https://", "")
      .replace("http://", "")
      .split(":")[0],
    secure: true,
    sameSite: "lax",
  });
};

export const clearPkceCookies = (res: Response) => {
  res.clearCookie("pkce_verifier", {
    httpOnly: true,
    domain: env.FRONTEND_URL.replace("https://", "")
      .replace("http://", "")
      .split(":")[0],
    secure: true,
    sameSite: "lax",
  });
  res.clearCookie("pkce_state", {
    httpOnly: true,
    domain: env.FRONTEND_URL.replace("https://", "")
      .replace("http://", "")
      .split(":")[0],
    secure: true,
    sameSite: "lax",
  });
};
