import { NextFunction, Request, Response } from "express";
import { default as onFinished } from "on-finished";
import { ZodError } from "zod";

function isZodError(err: unknown): err is ZodError {
  return Boolean(
    err && (err instanceof ZodError || (err as ZodError).name === "ZodError"),
  );
}

export const logger = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { log: reqLogger, ...rest } = req;
  // debug entire request object
  reqLogger.debug(rest);
  // log request method and URL (along with the default pino-http `req` object)
  reqLogger.info(`${rest.method} ${req.url}`);

  // monkey-patch res.json to make response body available for logging
  const originalSend = res.json;
  res.json = (body) => {
    res.body = body;
    res.json = originalSend;
    return res.json(body);
  };

  onFinished(res, (err, res) => {
    const { log: resLogger, ...rest } = res;
    // debug entire response object
    resLogger.debug(rest);
    if (err || rest.statusCode >= 500) {
      resLogger.error(`${rest.statusCode} ${JSON.stringify(err)}`);
    } else {
      // since ZodErrors have a different format from our errors, we handle them separately
      resLogger.info(
        `${rest.statusCode} ${
          isZodError(rest.body)
            ? JSON.stringify(rest.body)
            : rest.body?.message ?? rest.statusMessage
        }`,
      );
    }
  });
  next();
};
