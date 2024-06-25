import { NextFunction, Request, Response } from "express";

export const logRequest = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { log, ...rest } = req;
  log.debug(rest);
  log.info(`${rest.method} ${req.url}`);
  next();
};
