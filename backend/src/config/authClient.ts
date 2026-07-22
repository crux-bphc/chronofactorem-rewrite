import * as client from "openid-client";
import { env } from "./server.js";

let config: client.Configuration | null = null;

// initializes and returns the logto oidc client
export async function getConfig() {
  if (!config) {
    // logto's issuer is the endpoint base + /oidc
    config = await client.discovery(
      new URL(`${env.LOGTO_ENDPOINT}/oidc`),
      env.LOGTO_APP_ID,
      env.LOGTO_APP_SECRET,
    );
  }

  return config;
}
