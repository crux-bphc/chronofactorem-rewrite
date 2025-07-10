import * as client from "openid-client";
import { env } from "./server.js";

let config: client.Configuration | null = null;

// initializes and returns the google oauth client
export async function getConfig() {
  if (!config) {
    config = await client.discovery(
      new URL("https://accounts.google.com"),
      env.GOOGLE_CLIENT_ID,
      env.GOOGLE_CLIENT_SECRET,
    );
  }

  return config;
}
