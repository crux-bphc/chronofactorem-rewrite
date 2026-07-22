import type { Request, Response } from "express";
import {
  type degreeList,
  getBatchFromEmail,
  isAValidDegreeCombination,
  namedDegreeZodList,
} from "lib";
import * as client from "openid-client";
import { getConfig } from "../../config/authClient.js";
import { env } from "../../config/server.js";
import { User } from "../../entity/entities.js";
import { userRepository } from "../../repositories/index.js";
import timetableJSON from "../../timetable.json" with { type: "json" };
import {
  type FinishedUserSession,
  type SignUpUserData,
  type UnfinishedUserSession,
  ZodFinishedUserSession,
  ZodUnfinishedUserSession,
} from "../../types/auth.js";
import {
  clearAuthCookies,
  clearPkceCookies,
  hashFingerprint,
  setAuthCookies,
  setPkceCookies,
  signJWT,
  verifyJWT,
} from "../../utils/authUtils.js";

// On any route, when checking if a user is logged in, check for the cookie
// in cookiestorage on the server, using -
// const session = req.cookies['session'];
// now, the session object can be used to see if the user is logged in or not

// on the frontend, for accessing routes, send requests with credentials:true

// redirects to the logto sign in page
export async function manageAuthRedirect(req: Request, res: Response) {
  const logger = req.log;
  try {
    const config = await getConfig();
    // pkce verifier and state are generated per request, and stashed in
    // short-lived cookies so the callback can verify the token exchange
    const code_verifier = client.randomPKCECodeVerifier();
    const code_challenge =
      await client.calculatePKCECodeChallenge(code_verifier);
    const state = client.randomState();

    const parameters: Record<string, string> = {
      redirect_uri: `${env.BACKEND_URL}/auth/callback`,
      scope: "openid email profile",
      code_challenge,
      code_challenge_method: "S256",
      state,
    };

    const authRedirect = client.buildAuthorizationUrl(config, parameters);

    if (req.cookies.session && req.cookies.fingerprint) {
      const sessionCookie = req.cookies.session;
      const fingerprintCookie = req.cookies.fingerprint;

      const sessionData = verifyJWT(sessionCookie);

      if (
        typeof sessionData === "string" ||
        sessionData.fingerprintHash !== hashFingerprint(fingerprintCookie)
      ) {
        clearAuthCookies(res);
        setPkceCookies(res, code_verifier, state);
        return res.redirect(authRedirect.href);
      }

      return res.redirect(`${env.BACKEND_URL}/auth/callback`);
    }
    setPkceCookies(res, code_verifier, state);
    return res.redirect(authRedirect.href);
  } catch (err: any) {
    logger.error("Authentication failure: ", err);
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

      const pkceVerifier = req.cookies.pkce_verifier;
      const pkceState = req.cookies.pkce_state;
      if (pkceVerifier === undefined || pkceState === undefined) {
        return res.status(401).redirect(`${env.BACKEND_URL}/auth/login`);
      }

      const config = await getConfig();
      const tokenSet = await client.authorizationCodeGrant(
        config,
        new URL(`${env.BACKEND_URL}${req.originalUrl}`),
        {
          pkceCodeVerifier: pkceVerifier,
          idTokenExpected: true,
          expectedState: pkceState,
        },
      );
      clearPkceCookies(res);

      // obtaining the access_token from tokenSet
      const access_token = tokenSet.access_token;

      // obtaining userInfo from the access_token code
      const userInfo = await client.fetchUserInfo(
        config,
        access_token,
        tokenSet.claims()?.sub || "",
      );

      // tokenSet.claims() returns validated information contained upon accessing the token
      const _tokenExpiryTime = tokenSet.claims()?.exp;

      // defines maxAge according to env vars
      const maxAge = env.SESSION_MAX_AGE_MS; // converts into milliseconds

      // fall back to the id token's claims if userinfo doesn't return them
      const idTokenClaims = tokenSet.claims();
      const name =
        userInfo.name ??
        (typeof idTokenClaims?.name === "string"
          ? idTokenClaims.name
          : undefined);
      const email =
        userInfo.email ??
        (typeof idTokenClaims?.email === "string"
          ? idTokenClaims.email
          : undefined);

      if (name === undefined || email === undefined) {
        return res.status(500).json({
          message: "error while authenticating",
          error: "incomplete information returned by OAuth provider",
        });
      }
      const fingerprint = Math.random().toString(36).substring(2);

      const userData: UnfinishedUserSession = {
        name: name,
        email: email,
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

        const batch = getBatchFromEmail(userData.email);
        // batch is set to 0000 if it's a non-student email, like hpc@hyderabad.bits-hyderabad.ac.in
        // or undefined

        res.redirect(
          `${env.FRONTEND_URL}/getDegrees?year=${
            timetableJSON.metadata.acadYear - Number.parseInt(batch, 10) + 1
          }`,
        );
      }
    }
  } catch (_err: any) {
    // If user exists on database, redirect them to frontpage, if not
    // redirect them to a /profile route where they fill their degrees
    // on the frontend

    return res.status(401).redirect(`${env.BACKEND_URL}/auth/login`);
  }
}

export async function getDegrees(req: Request, res: Response) {
  const logger = req.log;
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
    const batch = getBatchFromEmail(userData.email);

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
        batch: Number.parseInt(batch, 10),
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
    logger.error("Failed to register: ", error);
    return res.status(500).json({
      success: false,
      message: "failed to register",
      error: JSON.stringify(error),
    });
  }
}

// clears the auth cookies and redirects to logto's end session endpoint,
// which ends the sso session and sends the user back to the login page
export async function logout(_req: Request, res: Response) {
  clearAuthCookies(res);
  const endSessionUrl = new URL(`${env.LOGTO_ENDPOINT}/oidc/session/end`);
  endSessionUrl.searchParams.set("client_id", env.LOGTO_APP_ID);
  endSessionUrl.searchParams.set(
    "post_logout_redirect_uri",
    `${env.FRONTEND_URL}/login`,
  );
  return res.redirect(endSessionUrl.href);
}

// checks whether user is not logged in, logged in but hasn't finished selecting degrees, or properly logged in
export async function checkAuthStatus(req: Request, res: Response) {
  const logger = req.log;
  try {
    if (
      req.cookies.session === undefined ||
      req.cookies.fingerprint === undefined
    ) {
      return res.status(401).json({
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
      return res.status(401).json({
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
        return res.status(401).json({
          message: "user not logged in",
        });
      }

      const batch = getBatchFromEmail(sessionData.email);

      return res.json({
        message: "user needs to get degrees",
        redirect: `/getDegrees?year=${
          timetableJSON.metadata.acadYear - Number.parseInt(batch, 10) + 1
        }`,
      });
    }

    if (ZodFinishedUserSession.safeParse(sessionData).success) {
      return res.json({ message: "user is logged in", redirect: "/" });
    }

    return res.status(401).json({
      message: "cannot verify auth status",
      error: "user session malformed",
    });
  } catch (error: any) {
    logger.error("Error while checking auth status: ", error);
    return res.status(500).json({
      message: "Internal Server Error",
      error: JSON.stringify(error),
    });
  }
}
