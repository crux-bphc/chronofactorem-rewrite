import { Request, Response } from "express";
import { TokenSet, generators } from "openid-client";
import {
  degreeList,
  isAValidDegreeCombination,
  namedDegreeZodList,
} from "../../../../lib";
import { getClient } from "../../config/authClient";
import { env } from "../../config/server";
import { User } from "../../entity/User";
import { userRepository } from "../../repositories/userRepository";
import timetableJSON from "../../timetable.json";
import {
  FinishedUserSession,
  SignUpUserData,
  UnfinishedUserSession,
  ZodFinishedUserSession,
  ZodUnfinishedUserSession,
} from "../../types/auth";
import {
  clearAuthCookies,
  hashFingerprint,
  setAuthCookies,
  signJWT,
  verifyJWT,
} from "../../utils/authUtils";

// TODO: fix this to use JWTs

// On any route, when checking if a user is logged in, check for the cookie
// in cookiestorage on the server, using -
// const session = req.cookies['session'];
// now, the session object can be used to see if the user is logged in or not

// on the frontend, for accessing routes, send requests with credentials:true

// openid code_verifier
const code_verifier = generators.codeVerifier();

// redirects to the redirect URL for signing in
export async function manageAuthRedirect(req: Request, res: Response) {
  try {
    const client = await getClient();
    const code_challenge = generators.codeChallenge(code_verifier);

    const authRedirect = client.authorizationUrl({
      scope: "openid email profile",
      code_challenge,
      code_challenge_method: "S256",
    });

    if (req.cookies.session && req.cookies.fingerprint) {
      const sessionCookie = req.cookies.session;
      const fingerprintCookie = req.cookies.fingerprint;

      const sessionData = verifyJWT(sessionCookie);

      if (
        typeof sessionData === "string" ||
        sessionData.fingerprintHash !== hashFingerprint(fingerprintCookie)
      ) {
        clearAuthCookies(res);
        return res.redirect(authRedirect);
      }

      return res.redirect(`${env.BACKEND_URL}/auth/callback`);
    }

    return res.redirect(authRedirect);
  } catch (err: any) {
    return res.status(500).json({
      message: "authentication failure",
    });
  }
}

// starts a session after validating access_token
export async function authCallback(req: Request, res: Response) {
  try {
    if (req.cookies.session && req.cookies.fingerprint) {
      res.redirect(env.FRONTEND_URL);
    } else {
      // sets session cookie

      const client = await getClient();
      const params = client.callbackParams(req);

      // tokenSet contains the refresh_token and access_token codes
      const tokenSet = await client.callback(
        `${env.BACKEND_URL}/auth/callback`,
        params,
        { code_verifier },
      );

      // obtaining the access_token from tokenSet
      const access_token = tokenSet.access_token;

      // obtaining userInfo from the access_token code
      const userInfo = await client.userinfo(access_token as string | TokenSet);

      // tokenSet.claims() returns validated information contained upon accessing the token
      const tokenExpiryTime = tokenSet.claims().exp;

      // TODO: define maxAge independent from the google cookie

      // defines maxAge to be the time when the session cookie expires
      const maxAge = tokenExpiryTime * 1000 - Date.now(); // converts into milliseconds

      if (userInfo.name === undefined || userInfo.email === undefined) {
        return res.status(500).json({
          message: "error while authenticating",
          error: "incomplete information returned by OAuth provider",
        });
      }
      const fingerprint = Math.random().toString(36).substring(2);

      const userData: UnfinishedUserSession = {
        name: userInfo.name,
        email: userInfo.email,
        maxAge: maxAge,
        fingerprintHash: hashFingerprint(fingerprint),
      };

      const existingUser = await userRepository
        .createQueryBuilder()
        .select()
        .where("email = :email", {
          email: userData.email,
        })
        .getOne();

      if (existingUser) {
        const finishedUserData: FinishedUserSession = {
          name: existingUser.name,
          email: existingUser.email,
          id: existingUser.id,
          fingerprintHash: hashFingerprint(fingerprint),
        };

        // reset session and set ID as well
        const token = signJWT(finishedUserData, maxAge);
        clearAuthCookies(res);
        setAuthCookies(res, token, fingerprint, maxAge);
        res.redirect(env.FRONTEND_URL);
      } else {
        // reset session and set ID as well
        const token = signJWT(userData, maxAge);
        clearAuthCookies(res);
        setAuthCookies(res, token, fingerprint, maxAge);

        // slices mail to obtain batch
        let batch;
        if (userData.email !== undefined) {
          batch = userData.email.match(
            /^f\d{8}@hyderabad\.bits-pilani\.ac\.in$/,
          )
            ? userData.email.slice(1, 5)
            : "0000";
        } else {
          batch = "0000";
        }
        // batch is set to 0000 if it's a non-student email, like hpc@hyderabad.bits-hyderabad.ac.in
        // or undefined

        res.redirect(
          `${env.FRONTEND_URL}/getDegrees?year=${
            timetableJSON.metadata.acadYear - parseInt(batch) + 1
          }`,
        );
      }
    }
  } catch (err: any) {
    // If user exists on database, redirect them to frontpage, if not
    // redirect them to a /profile route where they fill their degrees
    // on the frontend

    return res.status(401).redirect(`${env.BACKEND_URL}/auth/login`);
  }
}

export async function getDegrees(req: Request, res: Response) {
  // this function is declared outside the try catch block
  // to make the capitalised name into title case

  function toTitleCase(str: string | undefined) {
    if (str === undefined) {
      return "";
    }
    return str
      .split(" ")
      .map((s) => s[0].toUpperCase() + s.substring(1).toLowerCase())
      .join(" ");
  }

  try {
    // for user to enter their degrees
    // the session cookie is parsed here, and then the info about
    // the user: name, email and degrees is stored on the database

    // gets userInfo as part of session
    if (
      req.cookies.session === undefined ||
      req.cookies.fingerprint === undefined
    ) {
      return res.status(401).json({
        message: "cannot set degrees",
        error: "user session expired",
      });
    }

    const sessionCookie = req.cookies.session;
    const fingerprintCookie = req.cookies.fingerprint;

    const sessionData = verifyJWT(sessionCookie);
    if (typeof sessionData === "string") {
      return res.status(401).json({
        message: "cannot set degrees",
        error: "user session malformed",
      });
    }

    if (!ZodUnfinishedUserSession.safeParse(sessionData).success) {
      return res.status(401).json({
        message: "cannot set degrees",
        error: "user session malformed",
      });
    }
    const session = ZodUnfinishedUserSession.parse(sessionData);
    if (session.fingerprintHash !== hashFingerprint(fingerprintCookie)) {
      return res.status(401).json({
        message: "cannot set degrees",
        error: "user fingerprint malformed",
      });
    }

    if (
      !namedDegreeZodList("user").min(1).safeParse(req.body.degrees).success ||
      (req.body.degrees.length === 2 &&
        !isAValidDegreeCombination(req.body.degrees))
    ) {
      return res.status(400).json({
        message: "cannot set degrees",
        error: "invalid set of degrees passed",
      });
    }

    const degrees: degreeList = req.body.degrees;

    const userData: SignUpUserData = {
      name: session.name,
      email: session.email,
      degrees: degrees,
    };

    // slices mail to obtain batch
    let batch;
    if (userData.email !== undefined) {
      batch = userData.email.match(/^f\d{8}@hyderabad\.bits-pilani\.ac\.in$/)
        ? userData.email.slice(1, 5)
        : "0000";
    } else {
      batch = "0000";
    }
    // batch is set to 0000 if it's a non-student email, like hpc@hyderabad.bits-hyderabad.ac.in
    // or undefined

    // converts name to title case
    const name = toTitleCase(userData.name);

    // checks if user exists by email
    const email = userData.email;
    const user = await userRepository.findOne({
      where: { email },
    });

    if (user) {
      return res.status(400).json({
        message: "user already exists",
      });
    }

    const createdUser = await userRepository
      .createQueryBuilder()
      .insert()
      .into(User)
      .values({
        batch: parseInt(batch),
        name: name,
        degrees: userData.degrees,
        email: userData.email,
        timetables: [],
      })
      .execute();

    const fingerprint = Math.random().toString(36).substring(2);
    const finishedUserData: FinishedUserSession = {
      name: session.name,
      email: session.email,
      id: createdUser.identifiers[0].id,
      fingerprintHash: hashFingerprint(fingerprint),
    };

    const token = signJWT(finishedUserData, session.maxAge);
    clearAuthCookies(res);
    setAuthCookies(res, token, fingerprint, session.maxAge);

    // reset session and set ID as well
    res.json({
      success: true,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "failed to register",
      error: JSON.stringify(error),
    });
  }
}

// checks whether user is not logged in, logged in but hasn't finished selecting degrees, or properly logged in
export async function checkAuthStatus(req: Request, res: Response) {
  try {
    if (
      req.cookies.session === undefined ||
      req.cookies.fingerprint === undefined
    ) {
      return res.json({
        message: "user not logged in",
      });
    }

    const sessionCookie = req.cookies.session;
    const fingerprintCookie = req.cookies.fingerprint;

    const sessionData = verifyJWT(sessionCookie);

    if (
      typeof sessionData === "string" ||
      sessionData.fingerprintHash !== hashFingerprint(fingerprintCookie)
    ) {
      return res.json({
        message: "user session malformed",
        error: "user session malformed",
      });
    }

    if (ZodUnfinishedUserSession.safeParse(sessionData).success) {
      const session = ZodUnfinishedUserSession.parse(sessionData);
      const user = await userRepository
        .createQueryBuilder()
        .select()
        .where("email = :email", {
          email: session.email,
        })
        .getOne();

      if (user) {
        // reset session
        clearAuthCookies(res);

        return res.json({
          message: "user not logged in",
        });
      }

      const batch = sessionData.email.match(
        /^f\d{8}@hyderabad\.bits-pilani\.ac\.in$/,
      )
        ? sessionData.email.slice(1, 5)
        : "0000";

      return res.status(400).json({
        message: "user needs to get degrees",
        redirect: `/getDegrees?year=${
          timetableJSON.metadata.acadYear - parseInt(batch) + 1
        }`,
      });
    }

    if (ZodFinishedUserSession.safeParse(sessionData).success) {
      return res
        .status(400)
        .json({ message: "user is logged in", redirect: "/" });
    }

    return res.status(401).json({
      message: "cannot verify auth status",
      error: "user session malformed",
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: JSON.stringify(error),
    });
  }
}
