import { pino } from "pino";
import { pinoHttp } from "pino-http";
import { env } from "../config/server.js";

const devOptions = {
  transport: {
    target: "pino-pretty",
    options: {
      translateTime: "SYS:standard",
      destination: "logs/app.log",
      // append: false,
    },
  },
};

const prodOptions = {
  transport: {
    target: "pino-pretty",
    options: {
      colorize: false,
      colorizeObjects: false,
      singleLine: true,
      translateTime: "SYS:standard",
      destination: "logs/app.log",
    },
  },
};

const base = pino(env.NODE_ENV === "development" ? devOptions : prodOptions);

export const logger = pinoHttp({
  logger: base,
  level: "debug",
  autoLogging: false,
});
