/*
These are the types that facilitate authentication
*/

//interface for userdata to be stored in the session cookie and for validating the type of session cookie
interface Session {
  name: string | undefined;
  email: string | undefined;
}

interface UserData {
  name: string | undefined;
  email: string | undefined;
  degrees: Degrees;
}

//interface for degrees to be given while user creation
interface Degrees {
  degrees: string[];
}
