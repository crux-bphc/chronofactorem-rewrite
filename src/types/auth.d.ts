/*
These are the types that facilitate authentication
*/
import { DegreeEnum } from "./degrees";

//interface for userdata to be stored in the session cookie and for validating the type of session cookie
interface Session {
  name: string | undefined;
  email: string | undefined;
}

interface UserData {
  name: string | undefined;
  email: string | undefined;
  degrees: DegreeEnum[];
}

