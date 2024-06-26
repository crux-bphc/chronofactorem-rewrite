import { Logger } from "pino";
import { FinishedUserSession } from "../auth.js";

declare global {
  namespace Express {
    export interface Request {
      session?: FinishedUserSession;
    }

    export interface Response {
      body?: {
        message?: string;
      };
    }
  }
}

/*
Keeping the logger in Express's open Request interface like `session` gives this error on prod:

```
node_modules/.pnpm/@types+express-serve-static-core@4.19.3/node_modules/@types/express-serve-static-core/index.d.ts(398,18): error TS2320: Interface 'Request<P, ResBody, ReqBody, ReqQuery, LocalsObj>' cannot simultaneously extend types 'IncomingMessage' and 'Request'.
Named property 'log' of types 'IncomingMessage' and 'Request' are not identical.
```

This probably happens because the open interface gets merged with the plain Request interface, which is then extended along with the `IncomingMessage` interface into a `Request<P, ResBody, ReqBody, ReqQuery, LocalsObj>` interface and that gets passed around through Express.

I'm not sure why the `IncomingMessage` interface conflicts since I couldn't find a `log` property, but anyway the fix is just moving the logger to the core definition (https://stackoverflow.com/a/44384082/23034618).
*/
declare module "express-serve-static-core" {
  export interface Request {
    log?: Logger;
  }
}
