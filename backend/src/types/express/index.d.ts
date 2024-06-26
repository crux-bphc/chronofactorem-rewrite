import { Logger } from "pino";
import { FinishedUserSession } from "../auth.js";

declare global {
  namespace Express {
    export interface Request {
      session?: FinishedUserSession;
      log?: Logger;
    }

    export interface Response {
      body?: {
        message?: string;
      };
    }
  }
}
