import { TokenSet } from "openid-client";
import { generators } from "openid-client";
import { Request, Response } from "express";
import { getClient } from "../../config/authClient";
import { userRepository } from "../../repositories/userRepository";
import { DegreeEnum } from "../../types/degrees";
import { Session, UserData } from "../../types/auth";

// openid code_verifier
const code_verifier = generators.codeVerifier();

// redirects to the redirect URL for signing in
export async function manageAuthRedirect(req: Request, res: Response) {
  try {
    if (req.cookies["session"]) {
      res.redirect("http://localhost:3000/auth/callback");
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
    if (req.cookies["session"]) {
      res.json({
        authenticated: true,
        message: "user is logged in",
      });
    } else {
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

      const userData: Session = {
        name: userinfo.name,
        email: userinfo.email,
      };

      console.log(userData);

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
    }
  } catch (err: any) {
    /*
  If user exists on database, redirect them to frontpage, if not
  redirect them to a /profile route where they fill their degrees
  on the frontend
  */
    // res.redirect("http://localhost:3000");
    res.status(401).redirect("http://localhost:3000/auth/login");
  }
}

export async function getDegrees(req: Request, res: Response) {
  /*this function is declared outside teh try
   to make the capitalised name into title case
 */

  function toTitleCase(str: string | undefined) {
    if (str === undefined) {
      return null;
    }
    return str.replace(/\w\S*/g, function (txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  }

  try {
    /* for user to enter their degrees */
    /* the session cookie is parsed here, and then the information about the user,
  name, email and degrees is stored on the database */

    //gets userinfo as part of session
    const session: Session = req.cookies["session"];
    console.log(session);

    const degrees: DegreeEnum[] = req.body.degrees;

    const userData: UserData = {
      name: session.name,
      email: session.email,
      degrees: degrees,
    };

    // console.log(userData);

    //slices mail to obtain batch
    const batch = userData.email?.slice(3, 5)!;

    //converts name to title case
    const name = toTitleCase(userData.name);

    /*
    this can be better handled by first accessing the find user endpoint,
    if user exists, then send a response and return. For now, this can just insert.
    Errors are not handled here, as of yet.
    */
    userRepository.insert({
      batch: parseInt(batch),
      name: name!,
      degrees: userData.degrees,
      email: userData.email,
      timetables: [],
    });

    res.json({
      success: true,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "failed to register",
    });
  }
}
