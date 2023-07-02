import { Issuer, BaseClient } from "openid-client";
import { env } from "./server";

let client: BaseClient | null = null;

// initializes and returns the google oauth client
export async function getClient() {
  if (!client) {
    const googleIssuer = await Issuer.discover("https://accounts.google.com");

    client = new googleIssuer.Client({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uris: [`${env.PROD_URL}/auth/callback`],
      response_types: ["code"],
    });
  }

  return client;
}
