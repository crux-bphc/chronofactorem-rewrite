import type { Request, Response } from "express";
import * as express from "express";
import {
  authCallback,
  checkAuthStatus,
  getDegrees,
  logout,
  manageAuthRedirect,
} from "../controllers/user/auth.js";

const authRouter = express.Router();

authRouter.get("/", (_req: Request, res: Response) => {
  res.send("The routes for authentication");
});

authRouter.get("/login", (_req: Request, res: Response) => {
  res.send('<a href="/api/auth/logto">Authenticate with Logto</a>');
});

// redirects you to the logto sign in page
authRouter.get("/logto", manageAuthRedirect);

// starts a session
authRouter.get("/callback", authCallback);

// clears the chrono session and ends the logto sso session
authRouter.get("/logout", logout);

// The user is redirected to a page on the client side upon authentication, where
// they have to send a post request containing their branch, this route handles that
authRouter.post("/submit", getDegrees);

authRouter.get("/check", checkAuthStatus);

export default authRouter;
