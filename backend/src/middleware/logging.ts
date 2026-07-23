import type { NextFunction, Request, Response } from "express";
import { default as onFinished } from "on-finished";

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
      resLogger.info(
        `${rest.statusCode} ${rest.body?.message ?? rest.statusMessage}`,
      );
    }
  });
  next();
};
