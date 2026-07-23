# Auth review notes (pre-migration)

Findings from a July 2026 codebase audit. Auth is being migrated, so none of
this is fixed in code yet. Revisit once the migration lands: most of these
either become obsolete or need to be carried over deliberately.

## Things the migration should fix or carry over

- PKCE state lives at module scope. `code_verifier` and `pkceState` are
  created once when `backend/src/controllers/user/auth.ts` loads (lines 37-38)
  and are shared across all users and concurrent login attempts.
- `signJWT` (`backend/src/utils/authUtils.ts:51-56`) passes `maxAge` in
  milliseconds to `expiresIn`, which `jsonwebtoken` reads as seconds. JWTs
  outlive the session cookie by roughly 1000x; the cookie is the only real
  expiry.
- Session verification (read cookies, verify JWT, compare fingerprint hash) is
  implemented four times: `backend/src/middleware/auth.ts:13-58` and
  `auth.ts:67-82`, `auth.ts:210-243`, `auth.ts:325-347`. The middleware also
  inlines `createHash(...)` instead of using `hashFingerprint` from
  `utils/authUtils.ts`.
- There is no logout route; `clearAuthCookies` is only used internally.
- `authRouter` still has placeholder routes: `GET /auth/` returns plain text
  and `GET /auth/login` returns an HTML anchor (`authRouter.ts:12-18`).
- `auth.ts:185` does `res.status(401).redirect(...)`, which browsers ignore.

## Inconsistencies in admin-style endpoints

- `updateChangedTimetable` (mounted at `POST /course/update`,
  `courseRouter.ts:19-23`) authenticates with only `CHRONO_SECRET`, while
  `createAnnouncement` (`userRouter.ts:19`) requires a logged-in session plus
  the secret in the request body. Pick one model for machine-to-machine calls.
- `POST /course/update` is a timetable operation living under `/course`.
  Confusing placement regardless of the auth model.
