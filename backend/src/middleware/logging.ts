import { NextFunction, Request, Response } from "express";
import { default as onFinished } from "on-finished";
import { Logger } from "pino";

interface ExtendedResponse extends Response {
  body?: any;
}

// funny how request needs this but not response
interface ExtendedRequest extends Request {
  log: Logger;
}

export const logger = async (
  req: ExtendedRequest,
  res: ExtendedResponse,
  next: NextFunction,
) => {
  const { log: reqLogger, ...rest } = req;
  reqLogger.debug(rest);
  reqLogger.info(`${rest.method} ${req.url}`);

  const originalSend = res.json;
  res.json = (body) => {
    res.body = body;
    res.json = originalSend;
    return res.json(body);
  };

  onFinished(res, (err, res) => {
    const { log: resLogger, ...rest } = res;
    resLogger.debug(rest);
    if (err) {
      resLogger.error(`${rest.statusCode} ${err}`);
    } else {
      resLogger.info(
        `${rest.statusCode} ${rest.body?.message ?? res.statusMessage}`,
      );
    }
  });
  next();
};
