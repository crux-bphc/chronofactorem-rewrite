/*
These are the types that facilitate authentication
*/
import { DegreeEnum } from "./degrees";

// interface for userdata to be stored in the session cookie and for validating the type of session cookie
export interface UnfinishedUserSession {
  name: string | undefined;
  email: string | undefined;
  maxAge: number;
}

export interface FinishedUserSession {
  name: string | undefined;
  email: string | undefined;
  id: string;
}

export interface UserData {
  name: string | undefined;
  email: string | undefined;
  degrees: DegreeEnum[];
}
