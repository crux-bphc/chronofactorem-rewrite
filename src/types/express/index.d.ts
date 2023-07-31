import { FinishedUserSession } from "../auth";

declare global {
  namespace Express {
    export interface Request {
      session?: FinishedUserSession;
    }
  }
}
