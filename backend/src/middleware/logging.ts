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
  reqLogger?.debug(rest);
  reqLogger?.info(`${rest.method} ${req.url}`);

  const originalSend = res.json;
  res.json = (body) => {
    res.body = body;
    res.json = originalSend;
    return res.json(body);
  };

  onFinished(res, (err, res) => {
    const { log: resLogger, ...rest } = res;
    resLogger.debug(rest);
    if (err || rest.statusCode >= 500) {
      resLogger.error(`${rest.statusCode} ${JSON.stringify(err)}`);
    } else {
      resLogger.info(
        `${rest.statusCode} ${
          isZodError(rest.body)
            ? JSON.stringify(rest.body).replace(/\\n/g, " ")
            : rest.body?.message ?? rest.statusMessage
        }`,
      );
    }
  });
  next();
};
