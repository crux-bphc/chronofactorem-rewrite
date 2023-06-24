/*
These are the types that facilitate authentication
*/

//interface for userdata to be stored in the session cookie and for validating the type of session cookie
interface session {
  name: string | undefined;
  email: string | undefined;
}

interface userData {
  name: string | undefined;
  email: string | undefined;
  degrees: degrees;
}

//interface for degrees to be given while user creation
interface degrees {
  degrees: string[];
}
