/*
These are the types that facilitate authentication
*/
import { degreeEnum } from "./degrees";

// interface for userdata to be stored in the session cookie and for validating the type of session cookie
export interface Session {
  name: string | undefined;
  email: string | undefined;
}

export interface UserData {
  name: string | undefined;
  email: string | undefined;
  degrees: degreeEnum[];
}
