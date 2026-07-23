/*
These are the types that facilitate authentication
*/

import {
  namedDegreeZodList,
  namedEmailType,
  namedIntegerType,
  namedNonEmptyStringType,
  namedUUIDType,
} from "lib";
import { z } from "zod";

// interface for userdata to be stored in the session cookie and for validating the type of session cookie
export const ZodUnfinishedUserSession = z.object({
  name: namedNonEmptyStringType("name"),
  email: namedEmailType(),
  maxAge: namedIntegerType("maxAge"),
  fingerprintHash: namedNonEmptyStringType("fingerprintHash"),
});

export type UnfinishedUserSession = z.infer<typeof ZodUnfinishedUserSession>;

export const ZodFinishedUserSession = z.object({
  name: namedNonEmptyStringType("name"),
  email: namedEmailType(),
  id: namedUUIDType("user id"),
  fingerprintHash: namedNonEmptyStringType("fingerprintHash"),
});
export type FinishedUserSession = z.infer<typeof ZodFinishedUserSession>;

export const ZodSignUpUserData = z.object({
  name: namedNonEmptyStringType("name"),
  email: namedEmailType(),
  degrees: namedDegreeZodList("user"),
});
export type SignUpUserData = z.infer<typeof ZodSignUpUserData>;
