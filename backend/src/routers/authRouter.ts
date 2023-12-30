import * as express from "express";
import { Request, Response } from "express";
import {
  authCallback,
  getDegrees,
  logout,
  manageAuthRedirect,
  checkAuthStatus,
} from "../controllers/user/auth";

const authRouter = express.Router();

authRouter.get("/", (req: Request, res: Response) => {
  res.send("The routes for authentication");
});

authRouter.get("/login", (req: Request, res: Response) => {
  res.send('<a href="/auth/google">Authenticate with google</a>');
});

// redirects you to google sign in page
authRouter.get("/google", manageAuthRedirect);

// starts a session
authRouter.get("/callback", authCallback);

// The user is redirected to a page on the client side upon authentication, where
// they have to send a post request containing their branch, this route handles that
authRouter.post("/submit", getDegrees);

authRouter.get("/logout", logout);

authRouter.get("/check", checkAuthStatus);

export default authRouter;
