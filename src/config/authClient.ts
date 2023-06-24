import { Issuer, BaseClient } from "openid-client";
import { env } from "./server";

let client: BaseClient | null = null;

//initializes and returns the google oauth client
export async function getClient() {
  if (!client) {
    const googleIssuer = await Issuer.discover("https://accounts.google.com");

    client = new googleIssuer.Client({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uris: ["http://localhost:3000/auth/callback"],
      response_types: ["code"],

      // id_token_signed_response_alg (default "RS256")
      // token_endpoint_auth_method (default "client_secret_basic")
    });

    console.log(
      "Discovered issuer %s %O",
      googleIssuer.issuer,
      googleIssuer.metadata
    );

    console.log("Set up issuer %s", googleIssuer);
  }

  return client;
}
