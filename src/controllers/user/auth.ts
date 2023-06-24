import { TokenSet } from "openid-client";
import { generators } from "openid-client";
import { Request, Response } from "express";
import { getClient } from "../../config/authClient";

// openid code_verifier
const code_verifier = generators.codeVerifier();

// redirects to the redirect URL for signing in
export async function manageAuthRedirect(req: Request, res: Response) {
  try {
    if (req.cookies["session"]) {
      res.json({
        authenticated: true,
        message: "user is logged in",
      });
      console.log(req.cookies["session"]);
    } else {
      const client = await getClient();
      const code_challenge = generators.codeChallenge(code_verifier);

      const auth_redirect = client.authorizationUrl({
        scope: "openid email profile",
        code_challenge,
        code_challenge_method: "S256",
      });

      res.redirect(auth_redirect);
    }
  } catch (err: any) {
    res.status(500).json({
      message: "authentication failure",
    });
  }
}

// starts a session after validating access_token
export async function authCallback(req: Request, res: Response) {
  try {
    //sets session cookie

    const client = await getClient();
    const params = client.callbackParams(req);

    //tokenSet contains the refresh_token and access_token codes
    const tokenSet = await client.callback(
      "http://localhost:3000/auth/callback",
      params,
      { code_verifier }
    );

    //obtaining the acces_token from tokenSet
    const access_token = tokenSet.access_token;

    //obtaining userinfo from the access_token code
    const userinfo = await client.userinfo(access_token as string | TokenSet);

    const userData: session = {
      name: userinfo.name,
      email: userinfo.email,
    };

    // tokenSet.claims() returns validated information contained upon accessing the token
    const tokenExpiryTime = tokenSet.claims().exp;

    //defines maxAge to be the time when the session cookie expires
    const maxAge = tokenExpiryTime * 1000 - Date.now(); //converts into milliseconds

    //setting the cookie
    res.cookie("session", userData, { maxAge: maxAge, httpOnly: true });

    res.status(200).json({
      success: true,
      message: "user session has started",
    });
  } catch (err: any) {
    /*
  If user exists on database, redirect them to frontpage, if not
  redirect them to a /profile route where they fill their degrees
  on the frontend
  */
    // res.redirect("http://localhost:3000");
    res.status(500).json({
      success: false,
      message: "The server has encountered an error",
    });
  }
}

export async function getDegrees(req: Request, res: Response) {
  try {
    /* for user to enter their degrees */
    /* the session cookie is parsed here, and then the information about the user,
  name, email and degrees is stored on the database */

    //gets userinfo as part of session
    const session: session = req.cookies["session"];

    const degrees: degrees = req.body.degrees;

    const userData: userData = {
      name: session.name,
      email: session.email,
      degrees: degrees,
    };

    console.log(userData);

    res.json({
      success: true,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
    });
  }
}
